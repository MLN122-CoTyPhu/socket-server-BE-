import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types/game";
import { GameEngine } from "./game/GameEngine";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS — cho phép Vercel frontend gọi vào
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  process.env.FRONTEND_URL || "https://co-ty-phu.vercel.app",
];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Health check endpoint (Railway dùng để ping)
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: new Date() }));
app.get("/", (_, res) => res.json({ service: "Cờ Tỷ Phú Socket Server", version: "1.0.0" }));

// ============================================
// SOCKET.IO SERVER
// ============================================
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const engine = new GameEngine();

// Map socketId → roomCode (để xử lý disconnect nhanh)
const socketRoomMap = new Map<string, string>();

// Map roomCode → timeout handle của câu hỏi thâu tóm đang chờ (15s)
const quizTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function clearQuizTimeout(roomCode: string) {
  const t = quizTimeouts.get(roomCode);
  if (t) {
    clearTimeout(t);
    quizTimeouts.delete(roomCode);
  }
}

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // ---------- TẠO PHÒNG ----------
  socket.on("create_room", ({ playerName, role }) => {
    try {
      const room = engine.createRoom(playerName, role, socket.id);
      socket.join(room.roomCode);
      socketRoomMap.set(socket.id, room.roomCode);
      socket.emit("room_state", room);
      console.log(`🏠 Room created: ${room.roomCode} by ${playerName}`);
    } catch (err) {
      socket.emit("error", "Không thể tạo phòng.");
    }
  });

  // ---------- VÀO PHÒNG ----------
  socket.on("join_room", ({ roomCode, playerName, role }) => {
    try {
      const room = engine.joinRoom(roomCode, playerName, role, socket.id);
      if (!room) {
        socket.emit("error", "Phòng không tồn tại hoặc đã đầy.");
        return;
      }
      socket.join(roomCode);
      socketRoomMap.set(socket.id, roomCode);

      // Thông báo tất cả trong phòng
      io.to(roomCode).emit("player_joined", room.players[room.players.length - 1]);
      io.to(roomCode).emit("game_update", room);
      console.log(`👤 ${playerName} joined room ${roomCode}`);
    } catch (err) {
      socket.emit("error", "Không thể vào phòng.");
    }
  });

  // ---------- RECONNECT ----------
  socket.on("reconnect_room", ({ roomCode, playerName }) => {
    const room = engine.reconnect(roomCode, playerName, socket.id);
    if (!room) {
      socket.emit("reconnect_failed");
      return;
    }
    socket.join(roomCode);
    socketRoomMap.set(socket.id, roomCode);
    socket.emit("room_state", room);
    console.log(`🔄 ${playerName} reconnected to ${roomCode}`);
  });

  // ---------- BẮT ĐẦU GAME ----------
  socket.on("start_game", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = engine.startGame(roomCode, socket.id);
    if (!room) {
      socket.emit("error", "Không thể bắt đầu. Cần ít nhất 3 người chơi và bạn phải là chủ phòng.");
      return;
    }
    io.to(roomCode).emit("game_update", room);
    console.log(`🚀 Game started in room ${roomCode} by host`);
  });

  // ---------- TUNG XÚC XẮC ----------
  socket.on("roll_dice", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const result = engine.rollDice(roomCode, socket.id);
    if (!result) {
      socket.emit("error", "Không phải lượt của bạn.");
      return;
    }

    const { room, diceValue, drawnCard, triggerVote } = result;

    // Broadcast dice roll ngay (cho optimistic UI)
    const currentPlayer = room.players.find(p => p.socketId === socket.id);
    if (currentPlayer) {
      io.to(roomCode).emit("dice_rolled", currentPlayer.id, diceValue);
    }

    // Broadcast game state
    io.to(roomCode).emit("game_update", room);

    // Nếu rút thẻ → broadcast thẻ
    if (drawnCard && currentPlayer) {
      io.to(roomCode).emit("card_drawn", drawnCard, currentPlayer.id);
    }

    // Nếu vote → broadcast vote session
    if (triggerVote && room.voteSession) {
      io.to(roomCode).emit("vote_started", room.voteSession);
    }

    // Nếu quiz → broadcast quiz session (không chứa đáp án đúng) + hẹn giờ 15s
    if (result.triggerQuiz && room.quizSession) {
      io.to(roomCode).emit("quiz_started", room.quizSession);

      const { cellId, playerId } = room.quizSession;
      clearQuizTimeout(roomCode);
      const handle = setTimeout(() => {
        quizTimeouts.delete(roomCode);
        const outcome = engine.timeoutQuiz(roomCode, cellId, playerId);
        if (!outcome) return;
        io.to(roomCode).emit("quiz_result", outcome.result);
        io.to(roomCode).emit("game_update", outcome.room);
      }, 15000);
      quizTimeouts.set(roomCode, handle);
    }
  });

  // ---------- TRẢ LỜI QUIZ (mua ô / thâu tóm) ----------
  socket.on("answer_quiz", ({ optionIndex }) => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const outcome = engine.answerQuiz(roomCode, socket.id, optionIndex);
    if (!outcome) return;

    clearQuizTimeout(roomCode);

    const { room, result } = outcome;
    io.to(roomCode).emit("quiz_result", result);
    io.to(roomCode).emit("game_update", room);
  });

  // ---------- BIỂU QUYẾT ----------
  socket.on("cast_vote", ({ optionIndex }) => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = engine.castVote(roomCode, socket.id, optionIndex);
    if (!room) return;

    io.to(roomCode).emit("game_update", room);

    // Nếu vote xong → thông báo kết quả
    if (!room.voteSession) {
      // vote đã được resolve
      const votes = {}; // đã clear trong engine
      io.to(roomCode).emit("vote_result", { winner: room.log[room.log.length - 2], votes });
    }
  });

  // ---------- KẾT THÚC LƯỢT ----------
  socket.on("end_turn", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = engine.endTurn(roomCode, socket.id);
    if (!room) return;

    io.to(roomCode).emit("game_update", room);
  });

  // ---------- THOÁT PHÒNG CHỦ ĐỘNG ----------
  socket.on("leave_room", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const result = engine.leaveRoom(socket.id);
    if (result) {
      io.to(roomCode).emit("player_left", result.player.id);
      io.to(roomCode).emit("game_update", result.room);
      console.log(`🚪 ${result.player.name} left room ${roomCode}`);
    }
    // Xóa khỏi map trước khi disconnect để disconnect handler không xử lý 2 lần
    socketRoomMap.delete(socket.id);
    socket.disconnect(true);
  });

  // ---------- DISCONNECT ----------
  socket.on("disconnect", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      const result = engine.markPlayerInactive(socket.id);
      if (result) {
        io.to(roomCode).emit("player_left", result.player.id);
        io.to(roomCode).emit("game_update", result.room);
      }
      socketRoomMap.delete(socket.id);
    }
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});

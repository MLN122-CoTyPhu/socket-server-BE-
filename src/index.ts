import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  GameRoom,
  QuizResult,
} from "./types/game";
import { GameEngine } from "./game/GameEngine";
import { db } from "./db/supabase";
import { createAdminRouter } from "./admin/routes";

// Project dùng .env.local (README: `cp env.example .env.local`) thay vì .env mặc định của dotenv
dotenv.config({ path: ".env.local" });

const app = express();
const httpServer = createServer(app);

// CORS — cho phép Vercel frontend gọi vào (credentials: true để cookie admin hoạt động)
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://10.10.99.160:3000",
  process.env.FRONTEND_URL || "https://co-ty-phu.vercel.app",
];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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

app.use("/admin", createAdminRouter(engine));

// Map socketId → roomCode (để xử lý disconnect nhanh)
const socketRoomMap = new Map<string, string>();

// Đảm bảo chỉ persist kết quả cuối ván 1 lần / phòng (nhiều handler có thể
// khiến room.phase chuyển "finished": roll_dice, answer_quiz, timeout, leave_room...)
const finishedPersisted = new Set<string>();

// Kết quả quiz (đúng/sai + đáp án đúng) chỉ gửi riêng cho người đã trả lời —
// broadcast cho cả phòng sẽ lộ đáp án cho những người chưa gặp câu hỏi đó.
function emitQuizResultToAnswerer(room: GameRoom, result: QuizResult) {
  const player = room.players.find(p => p.id === result.playerId);
  if (player) io.to(player.socketId).emit("quiz_result", result);
}

function persistIfFinished(room: GameRoom): void {
  if (room.phase !== "finished" || finishedPersisted.has(room.roomCode)) return;
  finishedPersisted.add(room.roomCode);

  const ranking = engine.computeFinalRanking(room);
  db.finishRoom(room.id, ranking).catch(err =>
    console.error(`❌ Lỗi lưu kết quả ván ${room.roomCode}:`, err)
  );
}

// Map roomCode → timeout handle của câu hỏi thâu tóm đang chờ (15s hoặc lưới an toàn)
const quizTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
// Lưới an toàn phòng khi client không gửi "quiz_ready" (mất kết nối...) — tránh treo ván
const QUIZ_SAFETY_NET_MS = 90000;

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

      db.createRoom(room.id, room.roomCode, playerName)
        .then(() => db.addPlayerRecord(room.id, playerName, role))
        .catch(err => console.error(`❌ Lỗi lưu phòng ${room.roomCode}:`, err));
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

      db.addPlayerRecord(room.id, playerName, role).catch(err =>
        console.error(`❌ Lỗi lưu người chơi ${playerName} vào phòng ${roomCode}:`, err)
      );
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

    db.setRoomStatus(room.id, "playing").catch(err =>
      console.error(`❌ Lỗi cập nhật trạng thái phòng ${roomCode}:`, err)
    );
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

    // Nếu rút thẻ → chỉ gửi riêng cho người rút (người khác không cần xem nội
    // dung thẻ, chỉ cần chờ hết lượt — trạng thái tiền/tự chủ đã cập nhật qua game_update ở trên).
    if (drawnCard && currentPlayer) {
      socket.emit("card_drawn", drawnCard, currentPlayer.id);
    }

    // Nếu vote → broadcast vote session
    if (triggerVote && room.voteSession) {
      io.to(roomCode).emit("vote_started", room.voteSession);
    }

    // Nếu quiz → chỉ gửi riêng cho người phải trả lời (không broadcast cả phòng —
    // người khác không cần thấy câu hỏi, chỉ cần chờ hết lượt như bình thường).
    // Đồng hồ 15s CHƯA bắt đầu ở đây — client sẽ báo "quiz_ready" khi thật sự
    // hiển thị câu hỏi cho người chơi (sau khi đóng modal thông tin ô), lúc đó
    // đồng hồ mới chạy. Ở đây chỉ đặt một lưới an toàn 90s phòng khi client
    // không bao giờ gửi "quiz_ready" (mất kết nối, lỗi...), tránh treo ván.
    if (result.triggerQuiz && room.quizSession) {
      socket.emit("quiz_started", room.quizSession);

      const { cellId, playerId } = room.quizSession;
      clearQuizTimeout(roomCode);
      const safetyHandle = setTimeout(() => {
        quizTimeouts.delete(roomCode);
        const outcome = engine.timeoutQuiz(roomCode, cellId, playerId);
        if (!outcome) return;
        emitQuizResultToAnswerer(outcome.room, outcome.result);
        io.to(roomCode).emit("game_update", outcome.room);
        persistIfFinished(outcome.room);
      }, QUIZ_SAFETY_NET_MS);
      quizTimeouts.set(roomCode, safetyHandle);
    }

    persistIfFinished(room);
  });

  // ---------- SẴN SÀNG XEM CÂU HỎI — bắt đầu đếm 15s thật sự ----------
  socket.on("quiz_ready", () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const updatedSession = engine.startQuizClock(roomCode, socket.id);
    if (!updatedSession) return;

    // Hủy lưới an toàn cũ, bắt đầu đồng hồ 15s thật sự từ đây
    clearQuizTimeout(roomCode);
    socket.emit("quiz_started", updatedSession);

    const { cellId, playerId } = updatedSession;
    const handle = setTimeout(() => {
      quizTimeouts.delete(roomCode);
      const outcome = engine.timeoutQuiz(roomCode, cellId, playerId);
      if (!outcome) return;
      emitQuizResultToAnswerer(outcome.room, outcome.result);
      io.to(roomCode).emit("game_update", outcome.room);
      persistIfFinished(outcome.room);
    }, 15000);
    quizTimeouts.set(roomCode, handle);
  });

  // ---------- TRẢ LỜI QUIZ (mua ô / thâu tóm) ----------
  socket.on("answer_quiz", ({ optionIndex }) => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const outcome = engine.answerQuiz(roomCode, socket.id, optionIndex);
    if (!outcome) return;

    clearQuizTimeout(roomCode);

    const { room, result } = outcome;
    socket.emit("quiz_result", result);
    io.to(roomCode).emit("game_update", room);
    persistIfFinished(room);
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
      db.markPlayerLeft(result.room.id, result.player.name).catch(err =>
        console.error(`❌ Lỗi cập nhật người chơi rời phòng ${roomCode}:`, err)
      );
      persistIfFinished(result.room);
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
        persistIfFinished(result.room);
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

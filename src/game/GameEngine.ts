import { v4 as uuidv4 } from "uuid";
import {
  GameRoom, Player, PlayerRole,
  EventCard, CellEffect, CellType, BoardCell,
  QuizSession, QuizResult,
} from "../types/game";
import { BOARD_CELLS, EVENT_CARDS } from "../data/boardData";

const BOARD_SIZE   = 40;
const QUIZ_TIME_MS  = 30000; // thời gian trả lời mỗi câu hỏi thâu tóm
const MIN_SOFTPOWER_TO_BUY = 50; // Sức mạnh tối thiểu để thâu tóm ô sở hữu được (financial_capital / conglomerate / tnc)

// ============================================
// ĐIỀU KIỆN XUẤT PHÁT THEO VAI — Chương 4 Mác-Lênin
// ============================================
// Nước đang phát triển: ít vốn (2000$), tự chủ cao (85) — chưa bị thâu tóm nhiều
// Việt Nam: vốn trung bình (2400$), tự chủ khá (80) — có nhà nước điều tiết,
//           Quyền lực mềm cao (65) — chính sách ngoại giao đa phương
// Tư bản tài chính: nhiều vốn (3400$) — tích lũy tư bản lớn,
//                   tự chủ thấp (45) — phụ thuộc thị trường toàn cầu, không có nhà nước bảo hộ
//
// Vốn khởi điểm được nâng lên (trước đây 1200/1500/2500) vì ô đắt nhất trên
// bàn giá $780 — với mức cũ, một người chơi "Nước đang phát triển" mua đúng 1
// ô là gần như sạch túi ngay từ đầu game. Mức mới đảm bảo mua 1 ô bất kỳ vẫn
// còn dư ít nhất ~1200$ để tiếp tục xoay sở.
const ROLE_START_STATS: Record<PlayerRole, { money: number; autonomy: number; softPower: number }> = {
  developing_country: { money: 2000, autonomy: 85, softPower: 45 },
  vietnam:            { money: 2400, autonomy: 80, softPower: 65 },
  financial_capital:  { money: 3400, autonomy: 45, softPower: 60 },
};

// ============================================
// GAME ENGINE
// ============================================
export class GameEngine {
  private rooms: Map<string, GameRoom> = new Map();
  // roomCode → đáp án đúng ĐÃ TRỘN cho phiên quiz đang mở (không gửi cho client).
  // Dữ liệu gốc trong boardData.ts luôn đặt đáp án đúng ở vị trí A (index 0),
  // nên phải xáo vị trí mỗi lần mở câu hỏi để không lộ đáp án.
  private quizCorrectIndex: Map<string, number> = new Map();

  // ---------- TẠO PHÒNG ----------
  createRoom(playerName: string, role: PlayerRole, socketId: string): GameRoom {
    const roomCode = this.generateRoomCode();
    const player = this.createPlayer(playerName, role, socketId);
    const room: GameRoom = {
      id: uuidv4(),
      roomCode,
      phase: "waiting",
      players: [player],
      hostId: player.id,
      currentTurnIndex: 0,
      turnNumber: 1,
      hasRolled: false,
      lastEvent: null,
      voteSession: null,
      quizSession: null,
      cellOwners: {},
      log: [`🎮 Phòng ${roomCode} được tạo. ${playerName} tham gia với vai ${this.roleLabel(role)}.`],
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  // ---------- VÀO PHÒNG ----------
  joinRoom(roomCode: string, playerName: string, role: PlayerRole, socketId: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Nếu player đã tồn tại (người tạo phòng navigate sang trang room), coi như reconnect
    const existing = room.players.find(p => p.name === playerName);
    if (existing) {
      existing.socketId = socketId;
      existing.isActive = true;
      return room;
    }

    if (room.phase !== "waiting") return null;
    if (room.players.length >= 6) return null;

    const player = this.createPlayer(playerName, role, socketId);
    room.players.push(player);
    room.log.push(`👤 ${playerName} tham gia với vai ${this.roleLabel(role)}.`);
    return room;
  }

  // ---------- BẮT ĐẦU GAME (host) ----------
  startGame(roomCode: string, socketId: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const host = room.players.find(p => p.socketId === socketId);
    if (!host || host.id !== room.hostId) return null;
    if (room.phase !== "waiting") return null;
    if (room.players.length < 3) return null;
    if (room.players.length > 6) return null;

    room.phase = "playing";
    const startingIndex = Math.floor(Math.random() * room.players.length);
    room.currentTurnIndex = startingIndex;
    room.log.push(`🚀 Trò chơi bắt đầu với ${room.players.length} người! Lượt 1 — ${room.players[startingIndex].name} đi trước.`);
    return room;
  }

  // ---------- TUNG XÚC XẮC ----------
  rollDice(roomCode: string, socketId: string): {
    room: GameRoom;
    diceValue: number;
    drawnCard?: EventCard;
    triggerVote?: boolean;
    triggerQuiz?: boolean;
  } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "playing") return null;

    const player = room.players[room.currentTurnIndex];
    if (player.socketId !== socketId) return null;
    if (room.hasRolled) return null;

    room.hasRolled = true;

    // ── Đình trệ sản xuất (ô 30) ────────────────────────────────────────────
    // Khác với trước (mất lượt hoàn toàn): người chơi vẫn tung xúc xắc và di
    // chuyển bình thường, chỉ mất quyền thu phí thuê (khi là chủ sở hữu) và
    // thâu tóm ô mới trong các lượt còn bị ảnh hưởng. Vẫn có quyền biểu quyết.
    const wasStalled = player.skipTurns > 0;
    if (wasStalled) {
      player.skipTurns--;
      room.log.push(
        `🚧 ${player.name} đang đình trệ sản xuất — vẫn di chuyển nhưng không thể thu phí thuê hay thâu tóm ô mới lượt này.` +
        (player.skipTurns > 0 ? ` Còn ${player.skipTurns} lượt bị ảnh hưởng tiếp.` : " Đây là lượt cuối bị ảnh hưởng!")
      );
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const newPosition = (player.position + diceValue) % BOARD_SIZE;

    player.position = newPosition;
    const cell = BOARD_CELLS[newPosition];

    room.log.push(`🎲 ${player.name} tung ${diceValue}, đến ô [${cell.name}].`);

    let drawnCard: EventCard | undefined;
    let triggerVote = false;
    let triggerQuiz = false;

    if (cell.ownable) {
      // ── Ô sở hữu được (financial_capital / conglomerate / tnc) ────────────
      // Chưa có chủ → mở quiz để "thâu tóm" (cần đủ Tiền + Sức mạnh tối thiểu +
      // trả lời đúng). Đã có chủ khác → trả phí thuê (rent), mô phỏng việc
      // chiếm đoạt giá trị thặng dư qua xuất khẩu tư bản.
      const ownerId = room.cellOwners[cell.id];
      if (!ownerId) {
        if (wasStalled) {
          room.log.push(`🚧 ${player.name} đang đình trệ — không thể thâu tóm ô mới tại [${cell.name}] lượt này.`);
        } else {
          // Câu hỏi luôn mở ra để trả lời (học là chính) — điều kiện Tiền + Sức
          // mạnh tối thiểu chỉ được kiểm tra ở bước MUA sau khi trả lời đúng
          // (xem answerQuiz), tương tự cách xử lý thiếu tiền. Không chặn câu
          // hỏi ngay từ đầu chỉ vì thiếu Sức mạnh.
          triggerQuiz = true;
          this.startQuiz(room, player, cell);
        }
      } else if (ownerId === player.id) {
        room.log.push(`🏠 ${player.name} đang đứng trên tài sản của chính mình tại [${cell.name}] — miễn phí.`);
      } else {
        const owner = room.players.find(p => p.id === ownerId);
        if (owner && owner.skipTurns > 0) {
          room.log.push(`🚧 ${owner.name} đang đình trệ sản xuất — miễn phí thuê tại [${cell.name}] lần này.`);
        } else {
          this.payRent(room, player, cell, ownerId);
        }
      }
    } else if (cell.effect.drawCard) {
      // ── Rút thẻ có phân loại (drawCardType) hoặc ngẫu nhiên ────────────────
      // Ô Việt Nam (8 ô xanh lá) chỉ rút thẻ cho đúng vai Việt Nam — vai khác
      // dừng tại đây coi như nghỉ ngơi, không có hiệu ứng gì. Ô Cơ hội (free)
      // vẫn rút ngẫu nhiên cho mọi vai như cũ.
      if (cell.type === "vietnam" && player.role !== "vietnam") {
        room.log.push(`💤 ${player.name} dừng tại [${cell.name}] — không có hiệu ứng gì (chính sách chỉ áp dụng cho Việt Nam).`);
      } else {
        drawnCard = this.drawCard(room, player, cell.effect.drawCardType);
      }
    } else if (cell.effect.councilVote) {
      // ── Hội đồng Tư vấn ──────────────────────────────────────────────────
      // Theo Lenin: Tư bản tài chính LÀ chủ nợ/chủ sở hữu của consortium
      // → họ nhận cổ tức thay vì phải biểu quyết "có nên vay không"
      if (player.role === "financial_capital") {
        this.applyEffect(
          room, player,
          { money: 80, softPower: 10 },
          `Cổ tức thành viên Consortium: ${cell.name}`
        );
        room.log.push(
          `💼 ${player.name} (Tư Bản Tài Chính) là chủ nợ của ${cell.name} — nhận cổ tức và tăng ảnh hưởng.`
        );
      } else {
        triggerVote = true;
        this.startVote(room, cell);
      }
    } else {
      // ── Áp dụng hiệu ứng ô trực tiếp với điều chỉnh theo vai ──────────────
      this.applyEffect(room, player, cell.effect, `Ô ${cell.name}`, cell.type);
    }

    this.clampStats(player);
    this.checkGameEnd(room);

    return { room, diceValue, drawnCard, triggerVote, triggerQuiz };
  }

  // ---------- TRẢ LỜI QUIZ (mua ô / thâu tóm) ----------
  answerQuiz(roomCode: string, socketId: string, optionIndex: number): { room: GameRoom; result: QuizResult } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "quiz" || !room.quizSession) return null;

    const session = room.quizSession;
    const player = room.players.find(p => p.id === session.playerId);
    if (!player || player.socketId !== socketId) return null;

    const cell = BOARD_CELLS.find(c => c.id === session.cellId);
    if (!cell || !cell.quiz) return null;

    const correctIndex = this.quizCorrectIndex.get(roomCode) ?? cell.quiz.correctIndex;
    const correct = optionIndex === correctIndex;
    let purchased = false;

    if (correct) {
      const price = cell.price ?? 0;
      const hasEnoughMoney = player.money >= price;
      const hasEnoughPower = player.softPower >= MIN_SOFTPOWER_TO_BUY;

      if (hasEnoughMoney && hasEnoughPower) {
        player.money -= price;
        room.cellOwners[cell.id] = player.id;
        player.ownedCells.push(cell.id);
        purchased = true;
        room.log.push(`✅ ${player.name} trả lời đúng và THÂU TÓM [${cell.name}] với giá $${price}!`);
      } else {
        player.autonomy += 5;
        const reason = !hasEnoughMoney && !hasEnoughPower
          ? `chưa đủ vốn lẫn Sức mạnh (cần ${MIN_SOFTPOWER_TO_BUY})`
          : !hasEnoughMoney
          ? "chưa đủ vốn"
          : `chưa đủ Sức mạnh (cần ${MIN_SOFTPOWER_TO_BUY}, hiện có ${player.softPower})`;
        room.log.push(`✅ ${player.name} trả lời đúng nhưng ${reason} để mua [${cell.name}] — vẫn ghi nhận hiểu biết (+5 Tự chủ).`);
      }
    } else {
      const penalty = 30;
      player.money = Math.max(0, player.money - penalty);
      player.autonomy -= 10;
      room.log.push(`❌ ${player.name} trả lời sai câu hỏi tại [${cell.name}] — mất $${penalty} chi phí cơ hội và -10 Tự chủ.`);
    }

    this.clampStats(player);

    const result: QuizResult = {
      correct,
      correctIndex,
      cellId: cell.id,
      cellName: cell.name,
      playerId: player.id,
      purchased,
    };

    this.quizCorrectIndex.delete(roomCode);
    room.quizSession = null;
    room.phase = "playing";
    this.checkGameEnd(room);

    return { room, result };
  }

  // ---------- BẮT ĐẦU ĐẾM 30s — chỉ khi client thật sự đã hiển thị câu hỏi ----------
  // (sau khi người chơi đã đóng modal thông tin ô / đọc xong giải thích, không tính thời gian đó)
  startQuizClock(roomCode: string, socketId: string): QuizSession | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "quiz" || !room.quizSession) return null;

    const session = room.quizSession;
    const player = room.players.find(p => p.id === session.playerId);
    if (!player || player.socketId !== socketId) return null; // chỉ người phải trả lời mới bắt đầu được đồng hồ

    session.expiresAt = Date.now() + QUIZ_TIME_MS;
    return session;
  }

  // ---------- HẾT GIỜ TRẢ LỜI QUIZ (30s) — server tự xử lý như trả lời sai ----------
  timeoutQuiz(roomCode: string, cellId: number, playerId: string): { room: GameRoom; result: QuizResult } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "quiz" || !room.quizSession) return null;

    const session = room.quizSession;
    // Đảm bảo đây vẫn là đúng phiên quiz đã hẹn giờ (tránh đụng độ nếu đã có quiz mới)
    if (session.cellId !== cellId || session.playerId !== playerId) return null;

    const player = room.players.find(p => p.id === session.playerId);
    const cell = BOARD_CELLS.find(c => c.id === session.cellId);
    if (!player || !cell || !cell.quiz) return null;

    const correctIndex = this.quizCorrectIndex.get(roomCode) ?? cell.quiz.correctIndex;

    const penalty = 30;
    player.money = Math.max(0, player.money - penalty);
    player.autonomy -= 10;
    room.log.push(`⏰ ${player.name} hết thời gian trả lời tại [${cell.name}] — mất $${penalty} chi phí cơ hội và -10 Tự chủ.`);

    this.clampStats(player);

    const result: QuizResult = {
      correct: false,
      correctIndex,
      cellId: cell.id,
      cellName: cell.name,
      playerId: player.id,
      purchased: false,
    };

    this.quizCorrectIndex.delete(roomCode);
    room.quizSession = null;
    room.phase = "playing";
    this.checkGameEnd(room);

    return { room, result };
  }

  // ---------- BIỂU QUYẾT ----------
  castVote(roomCode: string, socketId: string, optionIndex: number): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room || !room.voteSession) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    room.voteSession.votes[player.id] = optionIndex;

    const totalVoters = room.players.filter(p => !p.hasLeft).length;
    const votesCast   = Object.keys(room.voteSession.votes).length;

    if (votesCast >= totalVoters) {
      this.resolveVote(room);
    }

    return room;
  }

  // ---------- KẾT THÚC LƯỢT ----------
  endTurn(roomCode: string, socketId: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "playing") return null;

    const player = room.players[room.currentTurnIndex];
    if (player.socketId !== socketId) return null;
    if (!room.hasRolled) return null;

    room.currentTurnIndex = this.nextActiveIndex(room, room.currentTurnIndex);
    room.hasRolled = false;
    room.turnNumber++;

    const nextPlayer = room.players[room.currentTurnIndex];
    room.log.push(`⏭️ Lượt ${room.turnNumber} — ${nextPlayer.name} đến lượt.`);

    return room;
  }

  // ---------- RECONNECT ----------
  reconnect(roomCode: string, playerName: string, newSocketId: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.name === playerName);
    if (!player) return null;
    if (player.hasLeft) return null;

    player.socketId = newSocketId;
    player.isActive = true;
    room.log.push(`🔄 ${playerName} kết nối lại.`);
    return room;
  }

  // ---------- THOÁT PHÒNG CHỦ ĐỘNG ----------
  leaveRoom(socketId: string): { room: GameRoom; player: Player } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    player.isActive = false;
    player.hasLeft  = true;
    room.log.push(`🚪 ${player.name} đã rời phòng.`);

    if (player.id === room.hostId) {
      const newHost = room.players.find(p => !p.hasLeft);
      if (newHost) {
        room.hostId = newHost.id;
        room.log.push(`👑 ${newHost.name} trở thành chủ phòng mới.`);
      }
    }

    const isCurrent = room.players[room.currentTurnIndex]?.socketId === socketId;
    if (isCurrent && room.phase === "playing") {
      room.currentTurnIndex = this.nextActiveIndex(room, room.currentTurnIndex);
      room.hasRolled = false;
      room.turnNumber++;
      const nextPlayer = room.players[room.currentTurnIndex];
      if (nextPlayer && nextPlayer.id !== player.id) {
        room.log.push(`⏭️ Lượt ${room.turnNumber} — ${nextPlayer.name} đến lượt.`);
      }
    }

    const remaining = room.players.filter(p => !p.hasLeft);
    if (remaining.length < 2 && room.phase === "playing") {
      room.phase = "finished";
      if (remaining.length === 1) {
        room.log.push(`🏁 Trò chơi kết thúc — chỉ còn ${remaining[0].name}.`);
      }
    }

    return { room, player };
  }

  getRoomBySocketId(socketId: string): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.socketId === socketId)) return room;
    }
    return null;
  }

  getRoomByCode(roomCode: string): GameRoom | null {
    return this.rooms.get(roomCode) || null;
  }

  markPlayerInactive(socketId: string): { room: GameRoom; player: Player } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return null;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return null;

    player.isActive = false;
    room.log.push(`⚠️ ${player.name} mất kết nối.`);

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.socketId === socketId) {
      room.currentTurnIndex = this.nextActiveIndex(room, room.currentTurnIndex);
      room.turnNumber++;
    }

    return { room, player };
  }

  // ===== PRIVATE HELPERS =====

  private createPlayer(name: string, role: PlayerRole, socketId: string): Player {
    const stats = ROLE_START_STATS[role];
    return {
      id: uuidv4(),
      name,
      role,
      position: 0,
      money:     stats.money,
      autonomy:  stats.autonomy,
      softPower: stats.softPower,
      skipTurns: 0,
      isActive: true,
      hasLeft:  false,
      socketId,
      ownedCells: [],
    };
  }

  private nextActiveIndex(room: GameRoom, fromIndex: number): number {
    const total = room.players.length;
    for (let i = 1; i < total; i++) {
      const idx = (fromIndex + i) % total;
      if (!room.players[idx].hasLeft) return idx;
    }
    return fromIndex;
  }

  // ── Xáo thứ tự đáp án — dữ liệu gốc luôn để đáp án đúng ở vị trí A ──────────
  private shuffleQuizOptions(options: string[], correctIndex: number): { options: string[]; correctIndex: number } {
    const order = options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      options: order.map(i => options[i]),
      correctIndex: order.indexOf(correctIndex),
    };
  }

  // ── Mở quiz để "thâu tóm" ô sở hữu được ────────────────────────────────────
  private startQuiz(room: GameRoom, player: Player, cell: BoardCell): void {
    if (!cell.quiz) return;
    room.phase = "quiz";

    const shuffled = this.shuffleQuizOptions(cell.quiz.options, cell.quiz.correctIndex);
    this.quizCorrectIndex.set(room.roomCode, shuffled.correctIndex);

    room.quizSession = {
      cellId: cell.id,
      cellName: cell.name,
      playerId: player.id,
      question: cell.quiz.question,
      options: shuffled.options,
      price: cell.price ?? 0,
      expiresAt: Date.now() + QUIZ_TIME_MS,
    };
    room.log.push(`❓ ${player.name} gặp câu hỏi thâu tóm tại [${cell.name}] — trả lời đúng để mua ô này.`);
  }

  // ── Hệ số phí thuê theo vai ───────────────────────────────────────────────
  // Dựa theo lý luận Lênin: ai chịu tác động nặng nhất khi trả giá trị thặng dư
  // cho chủ sở hữu tư bản độc quyền?
  //   - developing_country: chịu đầy đủ 100% (đối tượng bị bóc lột trực tiếp)
  //   - vietnam: nhà nước điều tiết → giảm 40% (còn 60%)
  //   - financial_capital: có kênh vốn thay thế/đàm phán → giảm 50% (còn 50%)
  private rentMultiplier(role: PlayerRole): number {
    if (role === "developing_country") return 1.0;
    if (role === "vietnam") return 0.6;
    return 0.5;
  }

  // ── Trả phí thuê (rent) cho chủ sở hữu ô ────────────────────────────────────
  // Mô phỏng việc chiếm đoạt giá trị thặng dư qua xuất khẩu tư bản: chủ sở hữu
  // (người đã thâu tóm ô) thu lợi từ người khác dẫm vào lãnh địa của mình.
  private payRent(room: GameRoom, payer: Player, cell: BoardCell, ownerId: string): void {
    const owner = room.players.find(p => p.id === ownerId);
    if (!owner || owner.hasLeft) return;

    const baseRent = cell.rent ?? 0;
    const amount = Math.round(baseRent * this.rentMultiplier(payer.role));

    // Chủ sở hữu luôn nhận đủ tiền (hệ thống tín dụng/ngân hàng bù đắp phần
    // thiếu) — người trả không đủ khả năng chi trả bị quy đổi thẳng sang Tự
    // chủ, mô phỏng việc thế chấp chủ quyền quốc gia để vay nợ.
    const shortfall = Math.max(0, amount - payer.money);

    payer.money -= amount;
    owner.money += amount;
    room.log.push(
      `💸 ${payer.name} trả $${amount} phí thuê cho ${owner.name} tại [${cell.name}] ` +
      `(chiếm đoạt giá trị thặng dư qua ô đã bị thâu tóm).`
    );

    // Thuế lệ thuộc — dẫm vào "biên giới kinh tế" của người khác luôn mất Tự chủ
    payer.autonomy -= 5;
    room.log.push(`🏛️ ${payer.name}: -5 Tự chủ (lệ thuộc vào biên giới kinh tế của ${owner.name})`);

    if (cell.rentAutonomy) {
      payer.autonomy += cell.rentAutonomy;
      room.log.push(`🏛️ ${payer.name}: ${cell.rentAutonomy} Tự chủ (xói mòn chủ quyền tại ${cell.name})`);
    }

    if (shortfall > 0) {
      const debtPenalty = Math.ceil(shortfall / 10); // quy đổi: mỗi $10 nợ = -1 Tự chủ
      payer.autonomy -= debtPenalty;
      room.log.push(
        `⚠️ ${payer.name} vỡ nợ $${shortfall} (không đủ tiền trả thuê) — thế chấp chủ quyền: -${debtPenalty} Tự chủ.`
      );
    }

    this.clampStats(payer);
    this.clampStats(owner);
  }

  // ── Tổng giá trị tài sản (các ô đã thâu tóm) — dùng để tính điểm cuối game ──
  private ownedAssetValue(player: Player): number {
    return player.ownedCells.reduce((sum, id) => {
      const cell = BOARD_CELLS.find(c => c.id === id);
      return sum + (cell?.price ?? 0);
    }, 0);
  }

  // ── Rút thẻ ──────────────────────────────────────────────────────────────────
  // Ô Việt Nam chỉ rút đúng loại thẻ của mình:
  //   - Điều tiết Nhà nước / Hàng rào Thuế quan / Cảnh giác Biên giới mềm
  //     / Xây dựng Nội lực / Fintech Nội địa / Tiền tệ & Tín dụng → state_policy
  //   - FDI Công nghệ cao / Liên kết ASEAN-RCEP → globalization
  // Ô Cơ hội (39) không có drawCardType → rút ngẫu nhiên từ tất cả
  private drawCard(room: GameRoom, player: Player, cardType?: string): EventCard {
    const pool = cardType
      ? EVENT_CARDS.filter(c => c.type === cardType)
      : EVENT_CARDS;

    const card = pool[Math.floor(Math.random() * pool.length)];
    // Thẻ sự kiện không áp dụng điều chỉnh theo vai (thẻ có ngữ cảnh độc lập)
    this.applyEffect(room, player, card.effect, card.title);
    room.log.push(`🃏 ${player.name} rút thẻ: "${card.title}"`);
    return card;
  }

  // ── Khởi động biểu quyết ────────────────────────────────────────────────────
  // Mỗi ô Consortium có VoteConfig riêng phản ánh đúng bản chất kinh tế-chính trị
  // của tổ chức đó (Oil Consortium ≠ Banking Syndicate ≠ WTO...)
  private startVote(room: GameRoom, cell: BoardCell): void {
    const config = cell.voteConfig ?? {
      question:     "Có nên chấp nhận điều kiện vay vốn không?",
      acceptLabel:  "✅ Chấp nhận (nhận vốn, giảm tự chủ)",
      refuseLabel:  "❌ Từ chối (giữ tự chủ, mất cơ hội vốn)",
      acceptEffect: { money: 200, autonomy: -20 },
      refuseEffect: { autonomy: 15, softPower: 10 },
    };

    room.phase = "voting";
    room.voteSession = {
      question:        config.question,
      cellName:        cell.name,
      cellDescription: cell.description,
      options:         [config.acceptLabel, config.refuseLabel],
      votes:           {},
      initiatedBy:     room.players[room.currentTurnIndex].id,
      acceptEffect:    config.acceptEffect,
      refuseEffect:    config.refuseEffect,
    };
    room.log.push(`🗳️ Hội đồng Tư vấn họp về: ${cell.name}`);
  }

  // ── Giải quyết biểu quyết ────────────────────────────────────────────────────
  // Trọng số phiếu = Sức mạnh của người bỏ phiếu tại thời điểm biểu quyết —
  // mô phỏng quyền lực của các tập đoàn tài phiệt trong thể chế đa nguyên
  // (Sức mạnh càng cao, phiếu càng có giá trị). Sàn tối thiểu 1 để không ai
  // có phiếu bằng 0 tuyệt đối.
  private resolveVote(room: GameRoom): void {
    if (!room.voteSession) return;

    const tally: Record<number, number> = {};
    Object.entries(room.voteSession.votes).forEach(([playerId, optionIndex]) => {
      const voter = room.players.find(p => p.id === playerId);
      const weight = voter ? Math.max(1, voter.softPower) : 1;
      tally[optionIndex] = (tally[optionIndex] || 0) + weight;
    });

    const winnerIndex = Number(
      Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]
    );

    const currentPlayer = room.players[room.currentTurnIndex];
    const { acceptEffect, refuseEffect } = room.voteSession;

    if (winnerIndex === 0) {
      this.applyEffect(room, currentPlayer, acceptEffect, "Hội đồng Tư vấn (Chấp nhận)");
      room.log.push(
        `🗳️ Hội đồng đồng thuận CHẤP NHẬN — ${currentPlayer.name} nhận hệ quả của lựa chọn chấp nhận.`
      );
    } else {
      this.applyEffect(room, currentPlayer, refuseEffect, "Hội đồng Tư vấn (Từ chối)");
      room.log.push(
        `🗳️ Hội đồng quyết định TỪ CHỐI — ${currentPlayer.name} giữ vững lập trường độc lập.`
      );
    }

    room.voteSession = null;
    room.phase = "playing";
    this.clampStats(currentPlayer);
  }

  // ── Áp dụng hiệu ứng ô với điều chỉnh THEO VAI (role-based modifiers) ────────
  //
  // Dựa theo lý luận Lênin (mln2.docx):
  //
  // [Tư bản tài chính trên ô financial_capital / tnc / conglomerate]
  //   → Đây là TỔ CHỨC CỦA HỌ, họ nhận lợi ích thay vì bị tổn hại.
  //   → "Tư bản tài chính là kết quả hợp nhất của tư bản ngân hàng với tư bản công nghiệp"
  //   → IMF, World Bank, BlackRock là CÔNG CỤ của tư bản tài chính, không phải kẻ thù.
  //
  // [Việt Nam trên ô financial_capital]
  //   → Nhà nước điều tiết (thuế, ngân sách, tiền tệ-tín dụng) làm giảm tác động tiêu cực 50%.
  //   → "Nhà nước phải sử dụng hiệu quả các công cụ điều tiết để bảo vệ nền kinh tế"
  //
  // [Nước đang phát triển trên ô financial_capital]
  //   → Chịu đầy đủ tác động tiêu cực — đây là đối tượng bị bóc lột của tư bản tài chính.
  //   → "Xuất khẩu tư bản nhằm chiếm đoạt giá trị thặng dư tại các nước nhập khẩu"
  //
  // [Khủng hoảng (crisis) — phân biệt theo khả năng chịu đựng]
  //   → Tư bản tài chính mất ít hơn (có vốn dự phòng, mua lại tài sản rẻ khi khủng hoảng)
  //   → Nước đang phát triển mất nhiều hơn (ít vốn dự phòng, dễ bị phá sản)
  //
  private applyRoleModifier(target: Player, effect: CellEffect, cellType: CellType): CellEffect {
    const m = { ...effect };

    if (cellType === "financial_capital") {
      if (target.role === "financial_capital") {
        // Tư bản tài chính NHẬN LỢI từ các thể chế tài chính của họ (đổi dấu âm → dương)
        if (m.money    !== undefined && m.money < 0)    m.money    = Math.abs(m.money);
        if (m.autonomy !== undefined && m.autonomy < 0) m.autonomy = 0;
        if (m.softPower !== undefined && m.softPower < 0) m.softPower = 0;
      } else if (target.role === "vietnam") {
        // Nhà nước Việt Nam điều tiết → giảm 50% tác động tiêu cực
        if (m.money    !== undefined && m.money < 0)    m.money    = Math.ceil(m.money * 0.5);
        if (m.autonomy !== undefined && m.autonomy < 0) m.autonomy = Math.ceil(m.autonomy * 0.5);
        if (m.softPower !== undefined && m.softPower < 0) m.softPower = Math.ceil(m.softPower * 0.5);
      }
      // developing_country: full negative effect (bị bóc lột hoàn toàn)
    }

    if (cellType === "tnc") {
      if (target.role === "financial_capital") {
        // Tư bản tài chính SỞ HỮU TNC — nhận 50% giá trị thay vì mất
        if (m.money    !== undefined && m.money < 0)    m.money    = Math.floor(Math.abs(m.money) * 0.5);
        if (m.autonomy !== undefined && m.autonomy < 0) m.autonomy = 0;
      } else if (target.role === "vietnam") {
        // Nhà nước Việt Nam có chính sách điều tiết TNC → giảm 30% tác động
        if (m.money    !== undefined && m.money < 0)    m.money    = Math.ceil(m.money * 0.7);
        if (m.autonomy !== undefined && m.autonomy < 0) m.autonomy = Math.ceil(m.autonomy * 0.7);
      }
    }

    if (cellType === "conglomerate") {
      if (target.role === "financial_capital") {
        // Tư bản tài chính HÌNH THÀNH conglomerate — nhận cổ tức thay vì mất
        if (m.money    !== undefined && m.money < 0)    m.money    = Math.floor(Math.abs(m.money) * 0.4);
        if (m.autonomy !== undefined && m.autonomy < 0) m.autonomy = 0;
      }
    }

    if (cellType === "crisis") {
      // Khủng hoảng: TẤT CẢ mất 10% vốn hiện có, không phân biệt vai (không còn
      // ưu ái Tư bản tài chính) — Nước đang phát triển chịu thêm cú sốc Tự chủ
      // do hệ thống tài chính nội địa yếu kém, dễ bị tổn thương trước "biên
      // giới mềm" của tư bản nước ngoài.
      m.money = -Math.round(target.money * 0.10);
      if (target.role === "developing_country") {
        m.autonomy = (m.autonomy ?? 0) - 5;
      }
    }

    return m;
  }

  private applyEffect(
    room: GameRoom,
    triggeringPlayer: Player,
    effect: CellEffect,
    source: string,
    cellType?: CellType
  ): void {
    const targets = effect.allPlayers ? room.players : [triggeringPlayer];

    targets.forEach(target => {
      // Khi allPlayers=true, mỗi người chơi được áp dụng modifier theo VAI CỦA CHÍNH HỌ
      const fx = cellType ? this.applyRoleModifier(target, effect, cellType) : effect;

      if (fx.money !== undefined) {
        target.money += fx.money;
        const sign = fx.money > 0 ? "+" : "";
        room.log.push(`💰 ${target.name}: ${sign}$${fx.money} (${source})`);
      }
      if (fx.autonomy !== undefined && fx.autonomy !== 0) {
        target.autonomy += fx.autonomy;
        const sign = fx.autonomy > 0 ? "+" : "";
        room.log.push(`🏛️ ${target.name}: ${sign}${fx.autonomy} Tự chủ (${source})`);
      }
      if (fx.softPower !== undefined && fx.softPower !== 0) {
        target.softPower += fx.softPower;
        const sign = fx.softPower > 0 ? "+" : "";
        room.log.push(`⭐ ${target.name}: ${sign}${fx.softPower} Quyền lực mềm (${source})`);
      }
      if (fx.skipTurns !== undefined && fx.skipTurns > 0) {
        target.skipTurns = (target.skipTurns || 0) + fx.skipTurns;
        room.log.push(`⛓️ ${target.name}: bị chi phối ${fx.skipTurns} lượt (${source})`);
      }
      this.clampStats(target);
    });
  }

  private clampStats(player: Player): void {
    player.money     = Math.max(0, player.money);
    player.autonomy  = Math.max(0, Math.min(100, player.autonomy));
    player.softPower = Math.max(0, Math.min(100, player.softPower));
  }

  // ── Xếp hạng cuối ván — dùng chung bởi checkGameEnd và bởi index.ts khi cần
  // persist kết quả (leaveRoom cũng có thể khiến phase chuyển "finished") ──────
  computeFinalRanking(room: GameRoom): { name: string; role: PlayerRole; money: number; autonomy: number; softPower: number; score: number }[] {
    return room.players.map(p => ({
      name:      p.name,
      role:      p.role,
      money:     p.money,
      autonomy:  p.autonomy,
      softPower: p.softPower,
      score:     p.money + this.ownedAssetValue(p) + p.autonomy * 10 + p.softPower * 5,
    })).sort((a, b) => {
      // Luật đã công bố: "Tự chủ = 0 → thua ngay lập tức, dù nhiều tiền/tài sản nhất" —
      // người mất hoàn toàn tự chủ luôn rớt xuống cuối bảng xếp hạng, bất kể điểm số.
      const aLost = a.autonomy <= 0;
      const bLost = b.autonomy <= 0;
      if (aLost !== bLost) return aLost ? 1 : -1;
      return b.score - a.score;
    });
  }

  private checkGameEnd(room: GameRoom): void {
    // Theo Lenin: mất tự chủ kinh tế hoàn toàn = bị chi phối hoàn toàn về chính trị → thua
    const dominated = room.players.filter(p => p.autonomy <= 0 && !p.hasLeft);
    if (dominated.length === 0) return;

    room.phase = "finished";
    const scores = this.computeFinalRanking(room);

    const winner = scores[0];
    room.log.push(`🏁 Trò chơi kết thúc! 🥇 ${winner.name} thắng với ${winner.score} điểm.`);
    room.log.push(
      `📚 Bài học Lênin: Trong nền kinh tế tư bản tài chính, ` +
      `không chỉ tích lũy tư bản (💰 tiền) mà phải bảo vệ chủ quyền kinh tế (🏛️ tự chủ). ` +
      `Mất tự chủ kinh tế tất yếu dẫn đến mất tự chủ chính trị — đây là bản chất của chủ nghĩa đế quốc!`
    );
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private roleLabel(role: PlayerRole): string {
    const map: Record<PlayerRole, string> = {
      developing_country: "🌏 Nước đang phát triển",
      financial_capital:  "💰 Tư bản tài chính",
      vietnam:            "🇻🇳 Việt Nam",
    };
    return map[role];
  }
}

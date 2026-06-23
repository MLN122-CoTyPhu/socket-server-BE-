import { v4 as uuidv4 } from "uuid";
import {
  GameRoom, Player, PlayerRole,
  EventCard, CellEffect, CellType, BoardCell,
} from "../types/game";
import { BOARD_CELLS, EVENT_CARDS } from "../data/boardData";

const BOARD_SIZE   = 40;
const PASS_GO_BONUS = 200;

// ============================================
// ĐIỀU KIỆN XUẤT PHÁT THEO VAI — Chương 4 Mác-Lênin
// ============================================
// Nước đang phát triển: ít vốn (1200$), tự chủ cao (85) — chưa bị thâu tóm nhiều
// Việt Nam: vốn trung bình (1500$), tự chủ khá (80) — có nhà nước điều tiết,
//           Quyền lực mềm cao (65) — chính sách ngoại giao đa phương
// Tư bản tài chính: nhiều vốn (2500$) — tích lũy tư bản lớn,
//                   tự chủ thấp (45) — phụ thuộc thị trường toàn cầu, không có nhà nước bảo hộ
const ROLE_START_STATS: Record<PlayerRole, { money: number; autonomy: number; softPower: number }> = {
  developing_country: { money: 1200, autonomy: 85, softPower: 45 },
  vietnam:            { money: 1500, autonomy: 80, softPower: 65 },
  financial_capital:  { money: 2500, autonomy: 45, softPower: 60 },
};

// ============================================
// GAME ENGINE
// ============================================
export class GameEngine {
  private rooms: Map<string, GameRoom> = new Map();

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
    room.log.push(`🚀 Trò chơi bắt đầu với ${room.players.length} người! Lượt 1 — ${room.players[0].name} đi trước.`);
    return room;
  }

  // ---------- TUNG XÚC XẮC ----------
  rollDice(roomCode: string, socketId: string): {
    room: GameRoom;
    diceValue: number;
    drawnCard?: EventCard;
    triggerVote?: boolean;
  } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "playing") return null;

    const player = room.players[room.currentTurnIndex];
    if (player.socketId !== socketId) return null;
    if (room.hasRolled) return null;

    room.hasRolled = true;

    // ── Xử lý lượt BỊ CHI PHỐI (ô 30 — "Vào Tù") ──────────────────────────
    // Theo Lenin: chi phối kinh tế dẫn đến chi phối chính trị toàn diện,
    // biểu hiện là mất khả năng hành động tự do trong một số lượt.
    if (player.skipTurns > 0) {
      player.skipTurns--;
      const remaining = player.skipTurns;
      room.log.push(
        `⛓️ ${player.name} đang bị chi phối hoàn toàn — bỏ lượt này.` +
        (remaining > 0 ? ` Còn ${remaining} lượt bị phạt tiếp.` : " Thoát khỏi chi phối sau lượt này!")
      );
      return { room, diceValue: 0 };
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const oldPosition = player.position;
    const newPosition = (player.position + diceValue) % BOARD_SIZE;

    // Đi qua ô xuất phát → nhận thưởng
    if (newPosition < oldPosition) {
      player.money += PASS_GO_BONUS;
      room.log.push(`✅ ${player.name} đi qua ô Xuất phát, nhận +$${PASS_GO_BONUS}.`);
    }

    player.position = newPosition;
    const cell = BOARD_CELLS[newPosition];

    room.log.push(`🎲 ${player.name} tung ${diceValue}, đến ô [${cell.name}].`);

    let drawnCard: EventCard | undefined;
    let triggerVote = false;

    if (cell.effect.drawCard) {
      // ── Rút thẻ có phân loại (drawCardType) hoặc ngẫu nhiên ────────────────
      drawnCard = this.drawCard(room, player, cell.effect.drawCardType);
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

    return { room, diceValue, drawnCard, triggerVote };
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
  private resolveVote(room: GameRoom): void {
    if (!room.voteSession) return;

    const tally: Record<number, number> = {};
    Object.values(room.voteSession.votes).forEach(v => {
      tally[v] = (tally[v] || 0) + 1;
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
      if (target.role === "financial_capital") {
        // Tư bản tài chính có vốn dự phòng lớn — mua lại tài sản rẻ khi khủng hoảng → mất 30%
        if (m.money !== undefined && m.money < 0) m.money = Math.ceil(m.money * 0.3);
      } else if (target.role === "developing_country") {
        // Nước đang phát triển ít vốn dự phòng — chịu khủng hoảng nặng nhất → mất thêm 20%
        if (m.money !== undefined && m.money < 0) m.money = Math.floor(m.money * 1.2);
      }
      // vietnam: full standard effect (nhà nước bù đắp không đáng kể trong khủng hoảng toàn cầu)
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

  private checkGameEnd(room: GameRoom): void {
    // Theo Lenin: mất tự chủ kinh tế hoàn toàn = bị chi phối hoàn toàn về chính trị → thua
    const dominated = room.players.filter(p => p.autonomy <= 0 && !p.hasLeft);
    if (dominated.length === 0) return;

    room.phase = "finished";
    const scores = room.players.map(p => ({
      name:  p.name,
      role:  p.role,
      score: p.money + p.autonomy * 10 + p.softPower * 5,
    })).sort((a, b) => b.score - a.score);

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

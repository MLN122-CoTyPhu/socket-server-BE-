import { Router } from "express";
import { GameEngine } from "../game/GameEngine";
import { db } from "../db/supabase";
import { createSessionToken, requireAdmin, setSessionCookie, clearSessionCookie } from "./auth";

export function createAdminRouter(engine: GameEngine): Router {
  const router = Router();

  // ---------- LOGIN ----------
  router.post("/login", (req, res) => {
    const { password } = req.body ?? {};
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      res.status(500).json({ error: "Server chưa cấu hình ADMIN_PASSWORD." });
      return;
    }
    if (password !== adminPassword) {
      res.status(401).json({ error: "Sai mật khẩu." });
      return;
    }
    setSessionCookie(res, createSessionToken());
    res.json({ ok: true });
  });

  router.post("/logout", (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  router.get("/me", requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });

  // ---------- DANH SÁCH PHÒNG ----------
  router.get("/rooms", requireAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const rows = await db.listRooms({ status, search });

      const merged = rows.map((row: any) => {
        const live = engine.getRoomByCode(row.room_code);
        const players = (row.room_players ?? []).slice().sort((a: any, b: any) => {
          if (a.final_rank == null) return 1;
          if (b.final_rank == null) return -1;
          return a.final_rank - b.final_rank;
        });
        return {
          ...row,
          room_players: undefined,
          players,
          player_count: live ? live.players.filter(p => !p.hasLeft).length : players.length,
          live_phase: live?.phase ?? null,
        };
      });

      res.json({ rooms: merged });
    } catch (err) {
      console.error("GET /admin/rooms error:", err);
      res.status(500).json({ error: "Không tải được danh sách phòng." });
    }
  });

  // ---------- CHI TIẾT PHÒNG ----------
  router.get("/rooms/:roomCode", requireAdmin, async (req, res) => {
    try {
      const { roomCode } = req.params;
      const detail = await db.getRoomDetail(roomCode);
      const live = engine.getRoomByCode(roomCode);

      res.json({
        room: { ...detail.room, live_phase: live?.phase ?? null, live_log: live?.log ?? null },
        players: detail.players,
      });
    } catch (err) {
      console.error("GET /admin/rooms/:roomCode error:", err);
      res.status(404).json({ error: "Không tìm thấy phòng." });
    }
  });

  // ---------- VÁN CHỜ PHÁT THƯỞNG ----------
  router.get("/winners", requireAdmin, async (req, res) => {
    try {
      const rewardGiven =
        req.query.rewardGiven === "true" ? true : req.query.rewardGiven === "false" ? false : undefined;
      const rows = await db.getWinnersPending(rewardGiven);
      res.json({ rooms: rows });
    } catch (err) {
      console.error("GET /admin/winners error:", err);
      res.status(500).json({ error: "Không tải được danh sách chờ phát thưởng." });
    }
  });

  // ---------- ĐÁNH DẤU ĐÃ PHÁT THƯỞNG ----------
  router.post("/rooms/:roomCode/reward", requireAdmin, async (req, res) => {
    try {
      const { roomCode } = req.params;
      const { note } = req.body ?? {};
      const updated = await db.setReward(roomCode, note);
      res.json({ room: updated });
    } catch (err) {
      console.error("POST /admin/rooms/:roomCode/reward error:", err);
      res.status(500).json({ error: "Không đánh dấu được phát thưởng." });
    }
  });

  // ---------- ĐÁNH DẤU ĐÃ PHÁT THƯỞNG CHO 1 NGƯỜI CHƠI (theo hạng bất kỳ) ----------
  router.post("/rooms/:roomCode/players/:playerRowId/reward", requireAdmin, async (req, res) => {
    try {
      const { playerRowId } = req.params;
      const { note } = req.body ?? {};
      const updated = await db.setPlayerReward(playerRowId, note);
      res.json({ player: updated });
    } catch (err) {
      console.error("POST /admin/rooms/:roomCode/players/:playerRowId/reward error:", err);
      res.status(500).json({ error: "Không đánh dấu được phát thưởng." });
    }
  });

  return router;
}

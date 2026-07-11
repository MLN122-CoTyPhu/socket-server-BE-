import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Project dùng .env.local (README: `cp env.example .env.local`) thay vì .env mặc định của dotenv
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
// Ưu tiên service role key (server trusted, bỏ qua RLS) — fallback về anon nếu chưa cấu hình
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface RankedPlayer {
  name: string;
  role: string;
  money: number;
  autonomy: number;
  softPower: number;
  score: number;
}

export interface RoomFilters {
  status?: string;
  search?: string;
  limit?: number;
}

// ============================================
// DATABASE OPERATIONS — dùng cho admin panel (quản lý phòng / xếp hạng / phát thưởng)
// ============================================

export const db = {
  // PHÒNG CHƠI
  async createRoom(id: string, roomCode: string, hostName: string) {
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({ id, room_code: roomCode, status: "waiting", host_name: hostName })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setRoomStatus(roomId: string, status: string) {
    const { error } = await supabase
      .from("game_rooms")
      .update({ status, updated_at: new Date() })
      .eq("id", roomId);
    if (error) throw error;
  },

  // NGƯỜI CHƠI — upsert vì "join_room" cũng được dùng cho reconnect (cùng tên trong phòng)
  async addPlayerRecord(roomId: string, playerName: string, role: string) {
    const { error } = await supabase
      .from("room_players")
      .upsert(
        { room_id: roomId, player_name: playerName, role, is_active: true, has_left: false },
        { onConflict: "room_id,player_name", ignoreDuplicates: false }
      );
    if (error) throw error;
  },

  async markPlayerLeft(roomId: string, playerName: string) {
    const { error } = await supabase
      .from("room_players")
      .update({ is_active: false, has_left: true })
      .eq("room_id", roomId)
      .eq("player_name", playerName);
    if (error) throw error;
  },

  // KẾT THÚC VÁN — ghi nhận người thắng + xếp hạng cuối để phát thưởng minh bạch
  async finishRoom(roomId: string, ranking: RankedPlayer[]) {
    if (ranking.length === 0) return;
    const winner = ranking[0];

    const { error: roomError } = await supabase
      .from("game_rooms")
      .update({
        status: "finished",
        finished_at: new Date(),
        updated_at: new Date(),
        winner_name: winner.name,
        winner_role: winner.role,
        winner_score: winner.score,
      })
      .eq("id", roomId);
    if (roomError) throw roomError;

    await Promise.all(
      ranking.map((p, index) =>
        supabase
          .from("room_players")
          .update({
            final_money: p.money,
            final_autonomy: p.autonomy,
            final_soft_power: p.softPower,
            final_score: p.score,
            final_rank: index + 1,
            is_winner: index === 0,
          })
          .eq("room_id", roomId)
          .eq("player_name", p.name)
      )
    );
  },

  // ADMIN — danh sách & chi tiết phòng (kèm người chơi để hiện "Chi tiết" +
  // lọc theo hạng mà không cần gọi thêm request cho từng phòng)
  async listRooms(filters: RoomFilters = {}) {
    let query = supabase
      .from("game_rooms")
      .select(
        "*, room_players(id, player_name, role, is_active, has_left, final_money, final_autonomy, final_soft_power, final_score, final_rank, is_winner, reward_given, reward_given_at, reward_note)"
      )
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 100);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) query = query.ilike("room_code", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getRoomDetail(roomCode: string) {
    const { data: room, error } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", roomCode)
      .single();
    if (error) throw error;

    const { data: players, error: playersError } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", room.id)
      .order("final_rank", { ascending: true, nullsFirst: false });
    if (playersError) throw playersError;

    return { room, players };
  },

  // ADMIN — phát thưởng cho 1 người chơi cụ thể (theo hạng bất kỳ, không chỉ người thắng)
  async setPlayerReward(playerRowId: string, note?: string) {
    const { data, error } = await supabase
      .from("room_players")
      .update({ reward_given: true, reward_given_at: new Date(), reward_note: note ?? null })
      .eq("id", playerRowId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ADMIN — phát thưởng (giữ cho tương thích với trang /admin/winners cấp phòng)
  async setReward(roomCode: string, note?: string) {
    const { data, error } = await supabase
      .from("game_rooms")
      .update({ reward_given: true, reward_given_at: new Date(), reward_note: note ?? null })
      .eq("room_code", roomCode)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getWinnersPending(rewardGiven?: boolean) {
    let query = supabase
      .from("game_rooms")
      .select("*")
      .eq("status", "finished")
      .order("finished_at", { ascending: false });

    if (rewardGiven !== undefined) query = query.eq("reward_given", rewardGiven);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

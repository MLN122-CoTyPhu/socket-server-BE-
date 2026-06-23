import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// DATABASE OPERATIONS
// ============================================

export const db = {
  // PHÒNG CHƠI
  async createRoom(roomCode: string) {
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({ room_code: roomCode, status: "waiting" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getRoom(roomCode: string) {
    const { data, error } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", roomCode)
      .single();
    if (error) throw error;
    return data;
  },

  async updateRoomStatus(roomId: string, status: string) {
    const { data, error } = await supabase
      .from("game_rooms")
      .update({ status, updated_at: new Date() })
      .eq("id", roomId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // NGƯỜI CHƠI
  async addPlayer(roomId: string, socketId: string, playerName: string, role: string) {
    const { data, error } = await supabase
      .from("room_players")
      .insert({
        room_id: roomId,
        socket_id: socketId,
        player_name: playerName,
        role,
        position: 0,
        money: 5000,
        autonomy: 100,
        soft_power: 100,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPlayers(roomId: string) {
    const { data, error } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async updatePlayer(
    playerId: string,
    updates: {
      position?: number;
      money?: number;
      autonomy?: number;
      soft_power?: number;
      is_active?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from("room_players")
      .update(updates)
      .eq("id", playerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removePlayer(playerId: string) {
    const { error } = await supabase
      .from("room_players")
      .delete()
      .eq("id", playerId);
    if (error) throw error;
  },

  // GAME STATE
  async initGameState(roomId: string) {
    const { data, error } = await supabase
      .from("game_state")
      .insert({
        room_id: roomId,
        turn_number: 1,
        phase: "roll",
        last_event: "Game started",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGameState(
    roomId: string,
    updates: {
      turn_number?: number;
      phase?: string;
      last_event?: string;
    }
  ) {
    const { data, error } = await supabase
      .from("game_state")
      .update({ ...updates, updated_at: new Date() })
      .eq("room_id", roomId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getGameState(roomId: string) {
    const { data, error } = await supabase
      .from("game_state")
      .select("*")
      .eq("room_id", roomId)
      .single();
    if (error) throw error;
    return data;
  },

  // LỊCH SỬ
  async recordTurn(
    roomId: string,
    playerId: string,
    turnNumber: number,
    action: string,
    actionDetails: any,
    result: string
  ) {
    const { data, error } = await supabase
      .from("turn_history")
      .insert({
        room_id: roomId,
        player_id: playerId,
        turn_number: turnNumber,
        action,
        action_details: actionDetails,
        result,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logEvent(
    roomId: string,
    playerId: string,
    eventType: string,
    eventData: any
  ) {
    const { data, error } = await supabase
      .from("game_events")
      .insert({
        room_id: roomId,
        player_id: playerId,
        event_type: eventType,
        event_data: eventData,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

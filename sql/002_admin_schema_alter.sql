-- Bổ sung cột cho admin panel vào 2 bảng game_rooms / room_players ĐÃ TỒN TẠI SẴN
-- (được tạo trước đó theo schema cũ khác — 001_admin_schema.sql không chạy được
-- vì "create table if not exists" bỏ qua khi bảng đã có tên trùng).
-- An toàn để chạy nhiều lần, không xoá/đổi dữ liệu cũ.

-- ── game_rooms ───────────────────────────────────────────────────────────
alter table game_rooms add column if not exists host_name text;
alter table game_rooms add column if not exists finished_at timestamptz;
alter table game_rooms add column if not exists winner_name text;
alter table game_rooms add column if not exists winner_role text;
alter table game_rooms add column if not exists winner_score numeric;
alter table game_rooms add column if not exists reward_given boolean not null default false;
alter table game_rooms add column if not exists reward_given_at timestamptz;
alter table game_rooms add column if not exists reward_note text;

-- Cột cũ current_turn/current_player_index không được code mới điền khi tạo
-- phòng — nới NOT NULL (nếu có) để insert không bị chặn.
alter table game_rooms alter column current_turn drop not null;
alter table game_rooms alter column current_player_index drop not null;
alter table game_rooms alter column status set default 'waiting';

-- ── room_players ─────────────────────────────────────────────────────────
alter table room_players add column if not exists has_left boolean not null default false;
alter table room_players add column if not exists final_money numeric;
alter table room_players add column if not exists final_autonomy numeric;
alter table room_players add column if not exists final_soft_power numeric;
alter table room_players add column if not exists final_score numeric;
alter table room_players add column if not exists final_rank int;
alter table room_players add column if not exists is_winner boolean not null default false;

-- Cột cũ socket_id không được code mới điền khi thêm người chơi qua admin API
alter table room_players alter column socket_id drop not null;
alter table room_players alter column is_active set default true;

-- Tránh ghi trùng khi "join_room" thực chất là reconnect (cùng tên trong 1 phòng)
create unique index if not exists room_players_room_name_uidx on room_players(room_id, player_name);

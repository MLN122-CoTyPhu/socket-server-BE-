-- Admin panel schema: lưu phòng / người chơi / kết quả cuối ván để quản lý và phát thưởng.
-- Chạy file này trong Supabase SQL Editor.

create table if not exists game_rooms (
  id uuid primary key,
  room_code text unique not null,
  status text not null default 'waiting', -- waiting | playing | finished
  host_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  winner_name text,
  winner_role text,
  winner_score numeric,
  reward_given boolean not null default false,
  reward_given_at timestamptz,
  reward_note text
);

create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references game_rooms(id) on delete cascade,
  player_name text not null,
  role text not null,
  is_active boolean not null default true,
  has_left boolean not null default false,
  final_money numeric,
  final_autonomy numeric,
  final_soft_power numeric,
  final_score numeric,
  final_rank int,
  is_winner boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists room_players_room_id_idx on room_players(room_id);
create index if not exists game_rooms_status_idx on game_rooms(status);

-- Tránh ghi trùng khi client "join_room" thực chất là reconnect (cùng tên trong 1 phòng)
create unique index if not exists room_players_room_name_uidx on room_players(room_id, player_name);

-- RLS bật nhưng không có policy public — backend dùng SUPABASE_SERVICE_ROLE_KEY
-- (bypass RLS), nên không cần policy cho anon/authenticated.
alter table game_rooms enable row level security;
alter table room_players enable row level security;

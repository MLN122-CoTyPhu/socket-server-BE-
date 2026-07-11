-- Cho phép đánh dấu "đã phát thưởng" theo TỪNG người chơi/từng hạng trong 1 phòng
-- (trước đây reward chỉ đánh dấu được ở cấp phòng = mặc định cho người thắng hạng 1).
-- Dùng cho tính năng lọc "Hạng 1/2/3..." ở trang admin để phát quà hàng loạt theo hạng.

alter table room_players add column if not exists reward_given boolean not null default false;
alter table room_players add column if not exists reward_given_at timestamptz;
alter table room_players add column if not exists reward_note text;

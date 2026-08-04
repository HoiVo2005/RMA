-- =====================================================
-- Lịch thi đấu Real Madrid mùa 2026-27 — các trận đã được
-- La Liga xác nhận NGÀY thi đấu chính thức (tính đến 27/07/2026).
-- Giờ đá (match_time) hầu hết CHƯA được công bố chính thức —
-- tạm để 21:00 giờ Tây Ban Nha, hãy sửa lại qua trang quản trị
-- (Lịch thi đấu) khi ban tổ chức công bố giờ đá cụ thể.
-- Nguồn: realmadrid.com (công bố lịch La Liga 2026-27, 30/06/2026),
-- Managing Madrid.
-- =====================================================

insert into public.fixtures
  (competition, home_team, away_team, stadium, match_time, status)
values
  ('La Liga', 'Real Madrid', 'Real Sociedad', 'Santiago Bernabéu', '2026-08-15 21:00:00+02', 'scheduled'),
  ('La Liga', 'Atlético Madrid', 'Real Madrid', 'Riyadh Air Metropolitano', '2026-09-20 21:00:00+02', 'scheduled'),
  ('La Liga', 'Barcelona', 'Real Madrid', 'Camp Nou', '2026-10-25 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Atlético Madrid', 'Santiago Bernabéu', '2027-04-04 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Barcelona', 'Santiago Bernabéu', '2027-05-09 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Deportivo La Coruña', 'Santiago Bernabéu', '2027-05-30 21:00:00+02', 'scheduled')
on conflict do nothing;

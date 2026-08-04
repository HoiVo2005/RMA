-- =====================================================
-- Lịch thi đấu Real Madrid — TOÀN BỘ 38 vòng La Liga mùa 2026-27
-- Tính đến 27/07/2026.
--
-- LƯU Ý QUAN TRỌNG:
-- 1) Đây là lịch VÒNG ĐẤU (ngày cuối tuần) do La Liga công bố — GIỜ ĐÁ
--    CHÍNH THỨC CHƯA ĐƯỢC CÔNG BỐ (La Liga chỉ chốt giờ ~2 tuần trước
--    mỗi vòng để phục vụ truyền hình). Giờ 21:00 dưới đây chỉ là TẠM,
--    hãy sửa lại qua trang quản trị khi có giờ chính thức.
-- 2) Vòng 2 và vòng 6 (Espanyol / Elche): các nguồn tổng hợp không
--    thống nhất thứ tự chính xác — kiểm tra lại tại laliga.com hoặc
--    realmadrid.com trước khi công bố lên trang tin nếu cần độ chính xác cao.
-- 3) CHỈ gồm La Liga — chưa gồm Champions League, Copa del Rey, Siêu cúp
--    TBN vì các giải này chưa có lịch/bốc thăm chính thức tại thời điểm này.
-- Nguồn tổng hợp: sportsbrackets.net, soccergraph.com, realmadrid.com,
-- Managing Madrid (tháng 6-7/2026).
-- =====================================================

insert into public.fixtures
  (competition, home_team, away_team, stadium, match_time, status)
values
  ('La Liga', 'Real Madrid', 'Real Sociedad',        'Santiago Bernabéu',        '2026-08-16 21:00:00+02', 'scheduled'),
  ('La Liga', 'Espanyol', 'Real Madrid',              'RCDE Stadium',             '2026-08-23 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Málaga',                'Santiago Bernabéu',        '2026-08-30 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Betis', 'Real Madrid',            'Benito Villamarín',        '2026-09-06 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Rayo Vallecano',        'Santiago Bernabéu',        '2026-09-13 21:00:00+02', 'scheduled'),
  ('La Liga', 'Elche', 'Real Madrid',                 'Martínez Valero',          '2026-09-16 21:00:00+02', 'scheduled'),
  ('La Liga', 'Atlético Madrid', 'Real Madrid',       'Riyadh Air Metropolitano', '2026-09-20 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Villarreal',            'Santiago Bernabéu',        '2026-10-11 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Sevilla',               'Santiago Bernabéu',        '2026-10-18 21:00:00+02', 'scheduled'),
  ('La Liga', 'Barcelona', 'Real Madrid',             'Camp Nou',                 '2026-10-25 21:00:00+01', 'scheduled'),
  ('La Liga', 'Racing Santander', 'Real Madrid',      'El Sardinero',             '2026-11-01 21:00:00+01', 'scheduled'),
  ('La Liga', 'Valencia', 'Real Madrid',              'Mestalla',                 '2026-11-08 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Celta Vigo',            'Santiago Bernabéu',        '2026-11-22 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Alavés',                'Santiago Bernabéu',        '2026-11-29 21:00:00+01', 'scheduled'),
  ('La Liga', 'Athletic Club', 'Real Madrid',         'San Mamés',                '2026-12-06 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Osasuna',               'Santiago Bernabéu',        '2026-12-13 21:00:00+01', 'scheduled'),
  ('La Liga', 'Deportivo La Coruña', 'Real Madrid',   'Riazor',                   '2026-12-20 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Getafe',                'Santiago Bernabéu',        '2027-01-03 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Levante',               'Santiago Bernabéu',        '2027-01-10 21:00:00+01', 'scheduled'),
  ('La Liga', 'Málaga', 'Real Madrid',                'La Rosaleda',              '2027-01-17 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Real Betis',            'Santiago Bernabéu',        '2027-01-24 21:00:00+01', 'scheduled'),
  ('La Liga', 'Rayo Vallecano', 'Real Madrid',        'Vallecas',                 '2027-01-31 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Sociedad', 'Real Madrid',         'Reale Arena',              '2027-02-07 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Athletic Club',         'Santiago Bernabéu',        '2027-02-14 21:00:00+01', 'scheduled'),
  ('La Liga', 'Sevilla', 'Real Madrid',               'Ramón Sánchez-Pizjuán',    '2027-02-21 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Valencia',              'Santiago Bernabéu',        '2027-02-28 21:00:00+01', 'scheduled'),
  ('La Liga', 'Villarreal', 'Real Madrid',            'Estadio de la Cerámica',   '2027-03-07 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Espanyol',              'Santiago Bernabéu',        '2027-03-14 21:00:00+01', 'scheduled'),
  ('La Liga', 'Celta Vigo', 'Real Madrid',            'Balaídos',                 '2027-03-21 21:00:00+01', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Atlético Madrid',       'Santiago Bernabéu',        '2027-04-04 21:00:00+02', 'scheduled'),
  ('La Liga', 'Osasuna', 'Real Madrid',               'El Sadar',                 '2027-04-11 21:00:00+02', 'scheduled'),
  ('La Liga', 'Getafe', 'Real Madrid',                'Coliseum',                 '2027-04-18 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Elche',                 'Santiago Bernabéu',        '2027-04-21 21:00:00+02', 'scheduled'),
  ('La Liga', 'Levante', 'Real Madrid',               'Ciutat de València',       '2027-05-02 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Barcelona',             'Santiago Bernabéu',        '2027-05-09 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Racing Santander',      'Santiago Bernabéu',        '2027-05-16 21:00:00+02', 'scheduled'),
  ('La Liga', 'Alavés', 'Real Madrid',                'Mendizorrotza',            '2027-05-23 21:00:00+02', 'scheduled'),
  ('La Liga', 'Real Madrid', 'Deportivo La Coruña',   'Santiago Bernabéu',        '2027-05-30 21:00:00+02', 'scheduled')
on conflict do nothing;

-- =====================================================
-- INSERT SAMPLE DATA — Real Madrid Logo & Assets
-- Madridista News VN — Cập nhật Logo, Danh Hiệu, Ảnh
-- =====================================================

-- 1️⃣ UPDATE LOGO NGUỒN TIN (News Source Logos)
-- ==============================================
UPDATE public.news_sources SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_Marca.svg/1280px-Logo_Marca.svg.png' WHERE name = 'Marca';
UPDATE public.news_sources SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/L%27Equipe_Logo.svg/1280px-L%27Equipe_Logo.svg.png' WHERE name = 'L''Équipe';
UPDATE public.news_sources SET logo_url = 'https://upload.wikimedia.org/wikipedia/en/f/fd/Kicker_%28magazine%29_logo.png' WHERE name = 'Kicker';

-- Thêm các nguồn tin khác nếu cần
INSERT INTO public.news_sources (name, country, website_url, logo_url, reliability, is_active)
VALUES 
  ('AS', 'Tây Ban Nha', 'https://www.as.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Logo_AS.svg/1280px-Logo_AS.svg.png', 'Uy tín', true),
  ('Sport', 'Tây Ban Nha', 'https://www.sport.es', 'https://www.sport.es/images/1200x630/2020/12/02/sport.jpg', 'Uy tín', true),
  ('Sky Sport', 'Italy', 'https://www.skysport.it', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Sky_sport_logo_transparent.png/1280px-Sky_sport_logo_transparent.png', 'Uy tín', true),
  ('BBC Sport', 'Anh', 'https://www.bbc.com/sport', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/BBC_News_2019.svg/1280px-BBC_News_2019.svg.png', 'Uy tín', true),
  ('ESPN', 'USA', 'https://www.espn.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/ESPN_logo.svg/1280px-ESPN_logo.svg.png', 'Uy tín', true),
  ('Goal.com', 'Quốc tế', 'https://www.goal.com', 'https://platform.sport.com/images/goal.com.svg', 'Uy tín', true),
  ('Transfermarkt', 'Đức', 'https://www.transfermarkt.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Transfermarkt_logo.png/1280px-Transfermarkt_logo.png', 'Uy tín', true),
  ('Bild', 'Đức', 'https://www.bild.de', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Bild-Zeitung-Logo.svg/1280px-Bild-Zeitung-Logo.svg.png', 'Uy tín', true)
ON CONFLICT (name) DO UPDATE SET logo_url = EXCLUDED.logo_url;


-- 2️⃣ UPDATE LOGO ĐỘI BÓNG CHO FIXTURES (Team Logos)
-- ==================================================
-- Real Madrid Logo
UPDATE public.fixtures 
SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' 
WHERE home_team = 'Real Madrid' AND home_logo_url IS NULL;

UPDATE public.fixtures 
SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' 
WHERE away_team = 'Real Madrid' AND away_logo_url IS NULL;

-- Các đội La Liga
UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%282009%E2%80%932011%29.svg' WHERE home_team = 'Barcelona' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%282009%E2%80%932011%29.svg' WHERE away_team = 'Barcelona' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/0/0b/Atl%C3%A9tico_Madrid_2012_logo.svg' WHERE home_team = 'Atlético Madrid' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/0/0b/Atl%C3%A9tico_Madrid_2012_logo.svg' WHERE away_team = 'Atlético Madrid' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC.svg' WHERE home_team = 'Sevilla' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC.svg' WHERE away_team = 'Sevilla' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valencia_CF_2014_logo.svg' WHERE home_team = 'Valencia' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valencia_CF_2014_logo.svg' WHERE away_team = 'Valencia' AND away_logo_url IS NULL;

-- Các đội Champions League
UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' WHERE home_team = 'Manchester City' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' WHERE away_team = 'Manchester City' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_badge.svg' WHERE home_team = 'Manchester United' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_badge.svg' WHERE away_team = 'Manchester United' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' WHERE home_team = 'Liverpool' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' WHERE away_team = 'Liverpool' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/1/1f/FC_Bayern_Munich_logo_%282017%29.svg' WHERE home_team = 'Bayern Munich' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/1/1f/FC_Bayern_Munich_logo_%282017%29.svg' WHERE away_team = 'Bayern Munich' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/6/60/Borussia_Dortmund_logo.svg' WHERE home_team = 'Borussia Dortmund' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/6/60/Borussia_Dortmund_logo.svg' WHERE away_team = 'Borussia Dortmund' AND away_logo_url IS NULL;

UPDATE public.fixtures SET home_logo_url = 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' WHERE home_team = 'Paris Saint-Germain' AND home_logo_url IS NULL;
UPDATE public.fixtures SET away_logo_url = 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' WHERE away_team = 'Paris Saint-Germain' AND away_logo_url IS NULL;


-- 3️⃣ UPDATE HÌNH ẢNH CẦU THỦ (Player Images)
-- ========================================
UPDATE public.players 
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Thibaut_Courtois_2022.jpg/1280px-Thibaut_Courtois_2022.jpg'
WHERE name = 'Thibaut Courtois';

UPDATE public.players 
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Jude_Bellingham_2023.jpg/1280px-Jude_Bellingham_2023.jpg'
WHERE name = 'Jude Bellingham';

UPDATE public.players 
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Kylian_Mbappe_2019.jpg/1280px-Kylian_Mbappe_2019.jpg'
WHERE name = 'Kylian Mbappé';


-- 4️⃣ UPDATE DANH HIỆU CẦU THỦ (Player Honors)
-- ==========================================
UPDATE public.players 
SET honors = 'UEFA Champions League | 2 | 2022, 2024
La Liga | 4 | 2020, 2022, 2024, 2025
Supercopa de España | 4 | 2020, 2021, 2023, 2024
UEFA Super Cup | 2 | 2022, 2024
FIFA Club World Cup | 2 | 2022, 2023
Copa del Rey | 1 | 2024
Zamora Trophy (Best Goalkeeper La Liga) | 1 | 2021-22
UEFA Champions League Team of the Year | 3 | 2021-22, 2023-24, 2024-25'
WHERE name = 'Thibaut Courtois';

UPDATE public.players 
SET honors = 'Ligue 1 | 6 | 2018, 2019, 2020, 2022, 2023, 2024
FIFA World Cup | 1 | 2018
La Liga | 1 | 2024-25
Supercopa de España | 1 | 2024
Pichichi Trophy (La Liga Top Scorer) | 4 | 2018-19, 2019-20, 2021-22, 2022-23
FIFA World Cup Golden Boot | 1 | 2018
Ballon d''Or Top 5 | Multiple appearances 2018-2024'
WHERE name = 'Kylian Mbappé';

UPDATE public.players 
SET honors = 'UEFA Champions League | 1 | 2024
La Liga | 2 | 2024, 2025
Supercopa de España | 2 | 2024, 2025
Copa del Rey | 1 | 2024
Golden Boy Award (Kopa Trophy) | 1 | 2024
La Liga Best Young Player | 1 | 2023-24
UEFA Champions League Best Young Player | 1 | 2023-24'
WHERE name = 'Jude Bellingham';


-- 5️⃣ THÊM CẦU THỦ MỚI NẾU CẦN (Optional - Add More Players)
-- ========================================================
-- Vinícius Júnior
INSERT INTO public.players (name, slug, shirt_number, position, nationality, image_url, date_of_birth, is_active, honors)
VALUES (
  'Vinícius Júnior',
  'vinicius-junior',
  7,
  'Tiền đạo',
  'Brasil',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Vinicius_Junior_2022.jpg/1280px-Vinicius_Junior_2022.jpg',
  '2000-07-12',
  true,
  'UEFA Champions League | 2 | 2022, 2024
La Liga | 3 | 2022, 2024, 2025
Supercopa de España | 4 | 2021, 2023, 2024, 2025
Copa del Rey | 1 | 2024
Ballon d''Or Top 10 | 2024'
)
ON CONFLICT (slug) DO UPDATE SET 
  image_url = EXCLUDED.image_url,
  honors = EXCLUDED.honors;

-- Luka Modrić
INSERT INTO public.players (name, slug, shirt_number, position, nationality, image_url, date_of_birth, is_active, honors)
VALUES (
  'Luka Modrić',
  'luka-modric',
  19,
  'Tiền vệ',
  'Croatia',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Luka_Modric_2022.jpg/1280px-Luka_Modric_2022.jpg',
  '1985-09-09',
  true,
  'UEFA Champions League | 5 | 2014, 2016, 2017, 2018, 2022
La Liga | 6 | 2012, 2017, 2020, 2022, 2024, 2025
Supercopa de España | 5 | 2017, 2021, 2023, 2024, 2025
Copa del Rey | 3 | 2014, 2018, 2024
Ballon d''Or | 1 | 2018
The Best FIFA Player | 1 | 2018
UEFA Best Player | 1 | 2018'
)
ON CONFLICT (slug) DO UPDATE SET 
  image_url = EXCLUDED.image_url,
  honors = EXCLUDED.honors;

-- Federico Valverde
INSERT INTO public.players (name, slug, shirt_number, position, nationality, image_url, date_of_birth, is_active, honors)
VALUES (
  'Federico Valverde',
  'federico-valverde',
  15,
  'Tiền vệ',
  'Uruguay',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Federico_Valverde_2023.jpg/1280px-Federico_Valverde_2023.jpg',
  '1996-04-22',
  true,
  'UEFA Champions League | 3 | 2022, 2024
La Liga | 3 | 2022, 2024, 2025
Supercopa de España | 4 | 2021, 2023, 2024, 2025
Copa del Rey | 1 | 2024'
)
ON CONFLICT (slug) DO UPDATE SET 
  image_url = EXCLUDED.image_url,
  honors = EXCLUDED.honors;

-- Éder Militão
INSERT INTO public.players (name, slug, shirt_number, position, nationality, image_url, date_of_birth, is_active, honors)
VALUES (
  'Éder Militão',
  'eder-militao',
  3,
  'Hậu vệ',
  'Brasil',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Eder_Militao_2023.jpg/1280px-Eder_Militao_2023.jpg',
  '1996-01-18',
  true,
  'UEFA Champions League | 3 | 2022, 2024
La Liga | 3 | 2022, 2024, 2025
Supercopa de España | 4 | 2021, 2023, 2024, 2025
Copa del Rey | 1 | 2024
UEFA Team of the Season | 1 | 2023-24'
)
ON CONFLICT (slug) DO UPDATE SET 
  image_url = EXCLUDED.image_url,
  honors = EXCLUDED.honors;


-- ✅ VERIFY DATA
-- =============
-- Kiểm tra xem dữ liệu đã được cập nhật:

-- Nguồn tin có logo:
-- SELECT name, logo_url FROM public.news_sources WHERE logo_url IS NOT NULL ORDER BY name;

-- Trận đấu có logo đội:
-- SELECT id, home_team, home_logo_url, away_team, away_logo_url FROM public.fixtures WHERE home_logo_url IS NOT NULL OR away_logo_url IS NOT NULL LIMIT 10;

-- Cầu thủ có hình ảnh và danh hiệu:
-- SELECT name, image_url, honors FROM public.players WHERE image_url IS NOT NULL OR honors IS NOT NULL ORDER BY name;

-- =====================================================
-- THÔNG TIN CLB (club_info) — nội dung khung thông tin ở trang Đội hình,
-- chỉnh sửa được tại /admin/thong-tin-clb (tên, biệt danh, sân, HLV, ảnh áo đấu...)
-- Chạy file này 1 lần trên CSDL đang dùng (site_settings đã có sẵn từ schema.sql).
-- =====================================================
insert into public.site_settings (setting_key, setting_value)
values (
  'club_info',
  '{
    "name": "Real Madrid",
    "fullName": "Real Madrid Club de Fútbol",
    "logoUrl": "",
    "nicknames": ["Los Blancos (Màu Trắng)", "Los Merengues", "Los Vikingos (Những người Viking)", "La Casa Blanca (Nhà Trắng)", "Reyes de Europa (Vua châu Âu)"],
    "founded": "1902-03-06",
    "foundedLabel": "6 tháng 3 năm 1902",
    "foundedAs": "Câu lạc bộ bóng đá Madrid",
    "stadium": "Sân vận động Santiago Bernabéu",
    "capacity": 78297,
    "president": "Florentino Pérez",
    "headCoach": "Jose Mourinho",
    "website": "https://www.realmadrid.com",
    "colors": {
      "home": { "label": "Màu áo sân nhà", "primary": "#ffffff", "secondary": "#f2b807", "image_url": "" },
      "away": { "label": "Màu áo sân khách", "primary": "#0d1330", "secondary": "#0d1330", "image_url": "" },
      "third": { "label": "Màu áo thứ ba", "primary": "#3a7bd5", "secondary": "#ffffff", "image_url": "" }
    }
  }'::jsonb
)
on conflict (setting_key) do nothing;

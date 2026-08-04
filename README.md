# Madridista News VN 2.0

Website tin tức Real Madrid bằng tiếng Việt, xây trên Next.js 16 + Supabase.
Tự động lấy bài viết từ các báo quốc tế (kèm ảnh), dịch sang tiếng Việt bằng AI,
và có trang quản trị đầy đủ CRUD.

## Tính năng chính
- Trang chủ, tin mới, chuyển nhượng, đội hình, lịch thi đấu, nguồn tin, tìm kiếm, chi tiết bài viết — giao diện báo điện tử chuyên nghiệp.
- **Lấy tin tự động qua RSS**: quét các nguồn đã bật, lọc bài liên quan Real Madrid, tải toàn bộ nội dung + ảnh từ trang gốc, dịch (paraphrase, không dịch máy nguyên văn) sang tiếng Việt, chống trùng theo `original_url`.
- **Lấy 1 bài viết theo URL** (trong trang quản trị → Bài viết): dán link bất kỳ, hệ thống tự tải nội dung + ảnh + dịch, mở ra bản nháp để duyệt trước khi lưu.
- **Đồng bộ Đội hình & Lịch thi đấu tự động** (trong trang quản trị): nút "Đồng bộ ngay" lấy danh sách cầu thủ (số áo, vị trí, ảnh) và các trận gần nhất/sắp tới — kèm **logo 2 đội, giờ đấu, tỉ số, trạng thái** — từ **TheSportsDB** (cơ sở dữ liệu thể thao mở, miễn phí) — không cần nhập tay. Vẫn có thể sửa/thêm/xoá thủ công sau khi đồng bộ.
- **Lịch thi đấu theo từng giải**: trang Lịch thi đấu có tab lọc riêng cho **La Liga, UEFA Champions League, Copa del Rey, Giao hữu**; khi thêm trận thủ công ở trang quản trị, giải đấu chọn từ danh sách này để hiển thị đúng tab.
- **Đội hình chính (xếp sơ đồ)**: trang quản trị → Đội hình → nút "Xếp đội hình chính" mở modal chọn sơ đồ (4-3-3, 4-4-2, 3-5-2, 4-2-3-1) và xếp cầu thủ vào từng vị trí trên sân; lưu lại để hiển thị công khai ở trang Đội hình, có thể mở lại để đổi sơ đồ/cầu thủ bất cứ lúc nào.
- **Bảng xếp hạng La Liga (BXH)**: lấy trực tiếp từ TheSportsDB, hiển thị ở trang Lịch thi đấu, đội Real Madrid được tô sáng riêng. Đồng bộ thủ công (nút riêng ở trang quản trị) hoặc tự động cùng lúc với đồng bộ lịch thi đấu (mỗi 30 phút).
- **Trang quản trị đầy đủ CRUD** cho Bài viết, Nguồn tin, Lịch thi đấu, Đội hình — có form thật (không còn nhập JSON bằng tay), tìm kiếm, lọc, xác nhận xoá.
- **Tính năng tăng tương tác người đọc**:
  - Đếm ngược thời gian tới trận đấu tiếp theo (cập nhật theo giây).
  - Dự đoán kết quả trận đấu (thắng/hoà/thua) — bình chọn công khai, hiển thị % trực tiếp.
  - Lưu bài viết đọc sau (bookmark, lưu tại trình duyệt) — trang riêng "Đã lưu" (`/da-luu`).
  - Đếm lượt xem mỗi bài + widget "Đọc nhiều nhất" trên trang chủ.
  - Nút chia sẻ Facebook / X / Zalo / sao chép liên kết trên mỗi bài viết.
  - Ước tính thời gian đọc (phút) trên mỗi bài.
  - Chế độ giao diện sáng/tối (dark mode), lưu lựa chọn của người dùng.
- Supabase Auth bảo vệ toàn bộ API quản trị; RLS bật trên mọi bảng.
- Ghi nhật ký mỗi lần lấy tin vào `cron_logs`, chạy định kỳ qua Vercel Cron (`vercel.json`, mặc định 3 lần/ngày).

## Cài đặt

1. **Tạo Supabase project**, vào SQL Editor và chạy toàn bộ nội dung `supabase/schema.sql`.
2. Vào **Authentication → Users**, tạo 1 user (email/mật khẩu) để đăng nhập trang quản trị.
   - Nhờ trigger có sẵn trong schema, user mới sẽ tự động có bản ghi trong `admin_profiles` (role `editor`).
   - Muốn cấp quyền `admin`, chạy:
     ```sql
     update public.admin_profiles set role = 'admin' where email = 'email-cua-ban@example.com';
     ```
3. Tạo file `.env.local` dựa theo `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: lấy trong Supabase → Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY`: cũng ở đó (khoá **service_role**, giữ bí mật, không public).
   - `CRON_SECRET`: chuỗi ngẫu nhiên dài, dùng để bảo vệ endpoint cron.
   - `OPENAI_API_KEY` **hoặc** `GROQ_API_KEY`: bắt buộc nếu muốn bản dịch tiếng Việt chất lượng bằng AI (Groq có gói miễn phí). Nếu để trống, hệ thống vẫn lấy được bài nhưng không dịch (giữ nguyên văn gốc) để bạn tự biên tập.
4. Cài đặt & chạy:
   ```bash
   npm install
   npm run dev
   ```
5. Vào `http://localhost:3000/login`, đăng nhập bằng user đã tạo ở bước 2 để vào `/admin`.
6. Trong trang quản trị → **Nguồn tin**, sửa từng nguồn để điền `Đường dẫn RSS` hợp lệ (mỗi báo có URL RSS khác nhau, tự tìm trên trang báo đó, ví dụ `.../rss.xml`). Nguồn nào không có RSS vẫn dùng được bằng cách dán từng link bài viết ở trang **Bài viết**.
7. Vào **Tổng quan** trong trang quản trị, bấm **"Lấy tin ngay"** để chạy thử lấy tin thủ công.
8. Vào **Đội hình** / **Lịch thi đấu**, bấm **"Đồng bộ ngay"** để tự lấy dữ liệu cầu thủ và trận đấu — không cần nhập tay. Mặc định dùng key test miễn phí "123" của TheSportsDB.
   - ⚠️ **Giới hạn quan trọng của key test "123":** mỗi lần đồng bộ chỉ trả về đúng **1 trận sắp tới + 1 trận gần nhất** (không phải cả lịch mùa giải). Muốn lấy nhiều trận hơn mỗi lần, đăng ký tài khoản free tại thesportsdb.com để có key riêng (giới hạn cao hơn hẳn) rồi điền vào `THESPORTSDB_API_KEY`.
   - Vì giới hạn trên, với **lịch cả mùa giải** (La Liga, Champions League, Cúp Nhà Vua, giao hữu...), cách chắc ăn nhất vẫn là **nhập tay** qua form ở trang quản trị (giải đấu chọn từ danh sách có sẵn) — đồng bộ tự động dùng để cập nhật **giờ đấu, tỉ số, trạng thái** cho các trận sắp/vừa diễn ra là chính.

## Cập nhật cho dự án đã tạo trước đó (migration)
Nếu bạn đã tạo Supabase project từ bản trước (chưa có tính năng đồng bộ lịch thi đấu), hãy chạy thêm đoạn SQL sau trong SQL Editor — an toàn, chạy lại nhiều lần không lỗi:
```sql
alter table public.fixtures add column if not exists external_id text;
create unique index if not exists idx_fixtures_external_id on public.fixtures(external_id) where external_id is not null;
```
Thiếu bước này sẽ khiến nút "Đồng bộ lịch thi đấu ngay" báo *"lấy được N trận, cập nhật 0 bản ghi"* vì thao tác chống trùng (`upsert ... onConflict: external_id`) cần cột này có ràng buộc unique. Cách đơn giản nhất để tránh toàn bộ vấn đề này là luôn chạy lại toàn bộ `supabase/schema.sql` mỗi khi cập nhật code — mọi câu lệnh trong đó đều dùng `if not exists` nên chạy lại không làm mất dữ liệu cũ.

Nếu bạn dùng tính năng **Đội hình chính** (chọn sơ đồ, xếp cầu thủ) mà trang công khai không hiển thị được đội hình đã lưu, cần thêm quyền đọc công khai cho bảng `site_settings` (nơi lưu cấu hình này):
```sql
create policy "public read site_settings" on public.site_settings for select using (true);
create policy "admins manage site_settings" on public.site_settings for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));
```

## Tự động cập nhật lịch thi đấu (giờ đấu, tỉ số, trạng thái)
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/sync-fixtures
```
`vercel.json` đã cấu hình chạy **mỗi 30 phút** — cũng có sẵn workflow `.github/workflows/sync-fixtures.yml` dùng chung 2 secret `APP_URL`/`CRON_SECRET` như trên (xem lưu ý về giới hạn gói Hobby của Vercel ở mục trên).

## Lấy tin qua API (thủ công / cron ngoài)
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/ingest
```
`vercel.json` đã cấu hình chạy **mỗi giờ 1 lần** (`0 * * * *`) để luôn lấy được bài mới nhất từ các nguồn RSS.

⚠️ **Lưu ý về gói Vercel:** Cron của Vercel trên gói **Hobby (miễn phí)** chỉ chạy được **tối đa 1 lần/ngày** — cấu hình mỗi giờ ở trên chỉ chạy đúng như vậy khi deploy trên gói **Pro** trở lên. Nếu đang dùng gói Hobby, hệ thống sẽ tự động giới hạn lại (Vercel sẽ báo trong dashboard), bạn có 2 lựa chọn:
1. Nâng cấp gói Pro để cron mỗi giờ chạy đúng như cấu hình.
2. Dùng dịch vụ cron ngoài miễn phí (ví dụ [cron-job.org](https://cron-job.org) hoặc GitHub Actions `schedule`) gọi mỗi giờ đến:
   `https://your-domain.com/api/cron/ingest` kèm header `Authorization: Bearer YOUR_CRON_SECRET` — cách này chạy độc lập với gói Vercel.

Dự án đã có sẵn workflow `.github/workflows/hourly-ingest.yml` cho lựa chọn (2): chỉ cần vào **Settings → Secrets and variables → Actions** của repo GitHub, thêm 2 secret `APP_URL` (VD: `https://your-domain.vercel.app`) và `CRON_SECRET` (trùng với giá trị trong `.env`), workflow sẽ tự gọi API lấy tin mỗi giờ — hoàn toàn miễn phí, không phụ thuộc gói Vercel.

## Về bản quyền nội dung
Hệ thống **không sao chép nguyên văn** bài báo gốc — kể cả dưới dạng bản dịch. AI được yêu cầu đọc hiểu rồi **viết lại đầy đủ, chi tiết** (không chỉ tóm tắt sơ sài 3-5 câu) theo văn phong tiếng Việt, giữ đúng sự kiện/số liệu/trích dẫn, nhưng không dịch nguyên văn từng câu hay bám sát cấu trúc bài gốc — vì bản dịch sát nguyên văn vẫn được xem là sao chép tác phẩm gốc dưới góc độ bản quyền, dù đổi sang ngôn ngữ khác. Mỗi bài luôn hiển thị link về nguồn gốc ở cuối trang. Vui lòng không chỉnh sửa prompt dịch để ép AI dịch nguyên văn toàn bộ bài báo, tránh vi phạm bản quyền nguồn tin.

## Cấu trúc thư mục
```
app/            các trang (App Router) + API routes
  admin/        trang quản trị (CRUD)
  api/admin/    API CRUD + lấy tin thủ công (yêu cầu đăng nhập admin)
  api/cron/     API lấy tin tự động (bảo vệ bằng CRON_SECRET)
components/     UI dùng chung (Header, Footer, ArticleCard, admin/CrudManager...)
lib/            data access, dịch AI, cào nội dung, xác thực admin
supabase/       schema.sql — chạy 1 lần khi khởi tạo dự án
```

---

## 🆕 Bản 3.0 — Giao diện hiện đại "Aurora Madrid" + tính năng mới

### Giao diện
Toàn bộ bảng màu đã được làm mới: nền xanh indigo đậm, gradient tím–vàng–đỏ, hiệu ứng kính mờ
(glassmorphism) ở thanh điều hướng, glow động khi hover thẻ tin/nút bấm, font tiêu đề Sora hiện đại.
Không cần thao tác gì thêm — chỉ cần `npm install` và chạy lại, giao diện áp dụng ngay.

### Tính năng mới
1. **Live Match Center** — tỉ số trực tiếp trên trang chủ, tự cập nhật mỗi 15 giây, hiệu ứng "nổ số"
   khi có bàn thắng. Hiển thị khi có trận có `status = 'live'` trong bảng `fixtures` (đặt qua trang quản trị
   hoặc tự động khi đồng bộ TheSportsDB).
2. **Bình luận & tương tác** — mỗi bài viết có phần bình luận công khai (không cần đăng nhập) + nút thích.
   **Bắt buộc**: chạy file `supabase/migration-modern-features.sql` trong Supabase → SQL Editor (chạy sau
   `schema.sql` gốc) để tạo bảng `comments`.
3. **Theo dõi cầu thủ yêu thích** — nút "Theo dõi" trên mỗi thẻ cầu thủ ở trang Đội hình (lưu tại trình
   duyệt, giống cơ chế "Đã lưu bài viết"). Trang mới **`/danh-cho-ban`** ("Dành cho bạn") gợi ý tin tức liên
   quan tới các cầu thủ bạn đang theo dõi.
4. **PWA + Thông báo đẩy** — site có thể "Cài đặt" như ứng dụng (banner tự hiện), hoạt động cả khi mất
   mạng (cache trang đã xem), và có thể bật thông báo đẩy khi có tin/bàn thắng mới.
   - Cần chạy `supabase/migration-modern-features.sql` (tạo bảng `push_subscriptions`).
   - Cần tạo cặp khoá VAPID: `npx web-push generate-vapid-keys`, điền vào `.env.local`:
     `NEXT_PUBLIC_VAPID_PUBLIC_KEY` và `VAPID_PRIVATE_KEY`.
   - Gửi thông báo tới toàn bộ người đăng ký bằng cách gọi `POST /api/push/send` với body
     `{ "title": "...", "body": "...", "url": "/bai-viet/..." }` (ví dụ: gọi từ cron sau khi có bài viết mới,
     hoặc thêm nút trong trang quản trị).
   - **Icon ứng dụng**: đã tạo sẵn icon tạm ở `public/icons/icon-192.png` và `icon-512.png` theo màu thương
     hiệu mới — bạn nên thay bằng logo/crest thật của trang trước khi phát hành chính thức.

### Việc cần làm sau khi tải code về
1. `npm install` (đã thêm `web-push` vào `package.json`).
2. Chạy `supabase/migration-modern-features.sql` trong Supabase.
3. (Tuỳ chọn) Tạo khoá VAPID nếu muốn dùng thông báo đẩy.
4. (Tuỳ chọn) Thay icon PWA bằng logo chính thức.

---

## 🆕 Hồ sơ cầu thủ đầy đủ (tiểu sử, CLB đã qua, danh hiệu)

Bấm vào bất kỳ cầu thủ nào ở trang **Đội hình** để xem trang hồ sơ riêng tại `/doi-hinh/[slug]`, gồm:
- Ảnh, số áo, vị trí, quốc tịch, ngày sinh/tuổi, tiểu sử ngắn
- Nút "Theo dõi" (đồng bộ với tính năng "Dành cho bạn")
- **Danh hiệu sự nghiệp** — dạng thẻ số lượng + năm đạt được
- **Các câu lạc bộ đã thi đấu** — dạng dòng thời gian (timeline), Real Madrid được làm nổi bật

### Cách nhập dữ liệu (trang quản trị → Đội hình → sửa cầu thủ)
Hai ô mới **"Các câu lạc bộ đã thi đấu"** và **"Danh hiệu sự nghiệp"** dùng định dạng văn bản đơn giản,
mỗi dòng một mục, các phần cách nhau bởi dấu `|`:

```
Câu lạc bộ | Từ năm | Đến năm        ← để "nay" nếu vẫn đang thi đấu
Borussia Dortmund | 2020 | 2023
Real Madrid | 2023 | nay
```

```
Tên danh hiệu | Số lần | Các năm (cách nhau bởi dấu phẩy)
La Liga | 2 | 2024, 2025
UEFA Champions League | 1 | 2024
```

**Bắt buộc**: chạy (hoặc chạy lại) file `supabase/migration-modern-features.sql` — bản cập nhật này đã
thêm 3 cột mới vào bảng `players`: `bio`, `career_clubs`, `honors`. An toàn khi chạy lại nhiều lần.

---

## 🆕 Hồ sơ cầu thủ dạng "infobox" đầy đủ (kiểu Wikipedia)

Trang hồ sơ cầu thủ (`/doi-hinh/[slug]`) giờ hiển thị đầy đủ như trang Wikipedia cầu thủ bóng đá:

- **Thông tin cá nhân**: tên đầy đủ, ngày sinh (kèm tuổi), nơi sinh, chiều cao, vị trí, quốc tịch.
- **Danh hiệu sự nghiệp**: dạng thẻ số lớn + icon cúp, đẹp và dễ đọc.
- **Sự nghiệp cầu thủ trẻ**: bảng Năm | Đội.
- **Sự nghiệp cầu thủ chuyên nghiệp**: bảng Năm | Đội | Số trận (ST) | Số bàn (BT) — dòng Real Madrid được tô nổi bật.
- **Sự nghiệp đội tuyển quốc gia**: bảng tương tự, theo từng cấp độ (U-19, U-20, đội tuyển chính...).

### Nhập liệu ở trang quản trị — Đội hình → sửa cầu thủ
Không cần gõ định dạng `|` thủ công nữa — mỗi mục (CLB, đội tuyển, danh hiệu) có **các ô nhập riêng** với
nút "Thêm dòng" / nút xoá từng dòng:
- **Sự nghiệp cầu thủ trẻ**: Đội | Từ năm | Đến năm
- **Sự nghiệp cầu thủ chuyên nghiệp** & **Sự nghiệp đội tuyển quốc gia**: Tên | Từ năm | Đến năm | Số trận | Số bàn
- **Danh hiệu sự nghiệp**: Tên danh hiệu | Số lần | Các năm

Ngoài ra đã thêm 2 trường mới ở phần thông tin cơ bản: **Nơi sinh** và **Chiều cao (cm)**.

**Bắt buộc**: chạy lại `supabase/migration-modern-features.sql` — bản này đã thêm các cột mới vào bảng
`players`: `birthplace`, `height_cm`, `youth_clubs`, `national_team` (an toàn khi chạy lại nhiều lần, các
lệnh đều dùng `add column if not exists`).

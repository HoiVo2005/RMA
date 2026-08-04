'use client';
import { useState } from 'react';
import { adminJson } from '@/lib/admin-client';
import { BookOpenText } from 'lucide-react';

type Props = {
  /** Tên cầu thủ hiện tại trong form, dùng làm gợi ý mặc định cho ô tìm kiếm. */
  currentName: string;
  onFill: (patch: Record<string, any>) => void;
};

/**
 * Nút "Điền từ Wikipedia": admin gõ tên cầu thủ, hệ thống tìm bài Wikipedia
 * tương ứng, trích xuất tiểu sử/ngày sinh/sự nghiệp/danh hiệu bằng AI, rồi
 * điền sẵn vào các trường tương ứng trong form. Đây luôn là bản NHÁP —
 * admin cần xem lại các trường đã điền trước khi bấm "Lưu lại".
 */
export default function WikipediaImportButton({ currentName, onFill }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function run() {
    const name = (query || currentName || '').trim();
    if (!name) {
      setMsg({ type: 'err', text: 'Nhập tên cầu thủ trước đã.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await adminJson('/api/admin/players/import-wikipedia', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.error) {
      setMsg({ type: 'err', text: res.error });
      return;
    }
    const d: any = res.data;
    const patch: Record<string, any> = {
      name: d.name,
      bio: d.bio || '',
      birthplace: d.birthplace || '',
      height_cm: d.height_cm ?? null,
      date_of_birth: d.date_of_birth || '',
      nationality: d.nationality || '',
      youth_clubs: d.youth_clubs || '',
      career_clubs: d.career_clubs || '',
      national_team: d.national_team || '',
      honors: d.honors || '',
    };
    // Chỉ điền ảnh nếu form chưa có ảnh, tránh ghi đè ảnh admin đã chọn thủ công.
    if (d.image_url) patch.image_url = d.image_url;
    onFill(patch);
    const imgNote =
      d.image_source === 'realmadrid'
        ? ' Đã lấy ảnh thi đấu mới nhất từ realmadrid.com.'
        : d.image_source === 'wikipedia'
        ? ' Không tìm thấy ảnh trên realmadrid.com, dùng tạm ảnh Wikipedia — nên thay ảnh thủ công.'
        : ' Không tìm thấy ảnh phù hợp, vui lòng tự thêm ảnh.';
    setMsg({
      type: 'ok',
      text: `Đã điền dữ liệu từ Wikipedia (${d.source_lang === 'vi' ? 'bản tiếng Việt' : 'bản tiếng Anh, đã dịch'}).${imgNote} Vui lòng kiểm tra lại trước khi lưu.`,
    });
  }

  return (
    <div className="fetch-url-box" style={{ marginBottom: 16 }}>
      <div className="row" style={{ gap: 8 }}>
        <input
          type="text"
          placeholder={currentName ? `vd: ${currentName}` : 'Tên cầu thủ, vd: Jude Bellingham'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn-gold" onClick={run} disabled={loading} style={{ flex: 'none' }}>
          {loading ? <span className="spinner spinner-dark" /> : <BookOpenText size={15} />}
          {loading ? 'Đang lấy dữ liệu...' : 'Điền từ Wikipedia'}
        </button>
      </div>
      {msg && <div className={msg.type === 'err' ? 'form-error' : 'form-success'}>{msg.text}</div>}
    </div>
  );
}

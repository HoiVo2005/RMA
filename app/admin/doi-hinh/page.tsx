'use client';
import { useRef, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import CrudManager, { CrudManagerHandle, FieldConfig } from '@/components/admin/CrudManager';
import { adminJson } from '@/lib/admin-client';
import { flagUrl } from '@/lib/flags';
import { PLAYER_POSITIONS } from '@/lib/types';
import { slugify } from '@/lib/slug';
import { RefreshCcw, Shirt } from 'lucide-react';
import LineupEditor from '@/components/admin/LineupEditor';
import ClubStintsEditor from '@/components/admin/ClubStintsEditor';
import HonorsEditor from '@/components/admin/HonorsEditor';
import WikipediaImportButton from '@/components/admin/WikipediaImportButton';

const fields: FieldConfig[] = [
  {
    name: '_wikipedia_import',
    label: '',
    type: 'custom',
    render: (_v, _onChange, ctx) => (
      <WikipediaImportButton currentName={ctx.values.name || ''} onFill={ctx.setMany} />
    ),
  },
  { name: 'name', label: 'Họ tên cầu thủ', type: 'text', required: true },
  { name: 'slug', label: 'Slug (tự tạo nếu để trống)', type: 'text', hint: 'ví dụ: jude-bellingham' },
  { name: 'shirt_number', label: 'Số áo', type: 'number', half: true },
  { name: 'position', label: 'Vị trí', type: 'select', options: [...PLAYER_POSITIONS], half: true },
  { name: 'nationality', label: 'Quốc tịch', type: 'text', half: true },
  { name: 'date_of_birth', label: 'Ngày sinh', type: 'text', placeholder: 'YYYY-MM-DD', half: true },
  { name: 'birthplace', label: 'Nơi sinh', type: 'text', half: true },
  { name: 'height_cm', label: 'Chiều cao (cm)', type: 'number', placeholder: 'vd: 194', half: true },
  { name: 'image_url', label: 'Ảnh cầu thủ (URL)', type: 'image' },
  { name: 'is_active', label: 'Đang thi đấu tại đội', type: 'checkbox' },
  { name: 'bio', label: 'Tiểu sử ngắn', type: 'textarea', placeholder: 'Vài câu giới thiệu về cầu thủ...' },
  {
    name: 'youth_clubs',
    label: 'Sự nghiệp cầu thủ trẻ',
    type: 'custom',
    render: (v, onChange) => (
      <ClubStintsEditor value={v || ''} onChange={onChange} withStats={false} addLabel="Thêm đội trẻ" />
    ),
  },
  {
    name: 'career_clubs',
    label: 'Sự nghiệp cầu thủ chuyên nghiệp',
    type: 'custom',
    render: (v, onChange) => <ClubStintsEditor value={v || ''} onChange={onChange} withStats addLabel="Thêm câu lạc bộ" />,
  },
  {
    name: 'national_team',
    label: 'Sự nghiệp đội tuyển quốc gia',
    type: 'custom',
    render: (v, onChange) => (
      <ClubStintsEditor
        value={v || ''}
        onChange={onChange}
        withStats
        nameLabel="Đội tuyển"
        namePlaceholder="vd: U-20 Tây Ban Nha"
        addLabel="Thêm đội tuyển"
      />
    ),
  },
  {
    name: 'honors',
    label: 'Danh hiệu sự nghiệp',
    type: 'custom',
    render: (v, onChange) => <HonorsEditor value={v || ''} onChange={onChange} />,
  },
];

const defaultValues = {
  name: '',
  slug: '',
  shirt_number: null,
  position: 'Tiền vệ',
  nationality: '',
  date_of_birth: '',
  birthplace: '',
  height_cm: null,
  image_url: '',
  is_active: true,
  bio: '',
  youth_clubs: '',
  career_clubs: '',
  national_team: '',
  honors: '',
};

export default function PlayersAdminPage() {
  const crudRef = useRef<CrudManagerHandle>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [showLineup, setShowLineup] = useState(false);

  async function sync() {
    setSyncing(true);
    setMsg('');
    const res = await adminJson('/api/admin/sync-squad', { method: 'POST' });
    setSyncing(false);
    if (res.error) {
      setMsg('Lỗi: ' + res.error);
    } else {
      const d: any = res.data;
      const suffix = d.errors?.length ? ` Lỗi: ${d.errors[0]}` : '';
      setMsg(`Đã lấy ${d.fetched} cầu thủ từ TheSportsDB, cập nhật ${d.upserted} bản ghi.${suffix}`);
      crudRef.current?.reload();
    }
  }

  return (
    <AdminShell title="Đội hình">
      <div className="fetch-url-box">
        <p>
          <b>Đồng bộ đội hình tự động:</b> lấy danh sách cầu thủ hiện tại (số áo, vị trí, quốc tịch, ảnh) từ
          TheSportsDB — cơ sở dữ liệu thể thao mở, miễn phí — và cập nhật vào danh sách dưới đây. Có thể chạy lại bất
          cứ lúc nào để cập nhật đội hình mới.
        </p>
        <div className="row">
          <button className="btn btn-gold" onClick={sync} disabled={syncing} style={{ flex: 'none' }}>
            {syncing ? <span className="spinner spinner-dark" /> : <RefreshCcw size={15} />}
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ đội hình ngay'}
          </button>
        </div>
        {msg && <div className={msg.startsWith('Lỗi') || msg.includes(' Lỗi:') ? 'form-error' : 'form-success'}>{msg}</div>}
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, color: 'var(--navy-900)', marginBottom: 2 }}>Đội hình chính</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
            Chọn sơ đồ (4-3-3, 4-4-2, 3-5-2, 4-2-3-1) và xếp cầu thủ vào từng vị trí trên sân — hiển thị công khai ở
            trang Đội hình. Có thể mở lại để đổi sơ đồ hoặc thay cầu thủ bất cứ lúc nào.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLineup(true)}>
          <Shirt size={15} /> Xếp đội hình chính
        </button>
      </div>

      {showLineup && <LineupEditor onClose={() => setShowLineup(false)} />}

      <CrudManager
        ref={crudRef}
        endpoint="/api/admin/players"
        entityLabel="cầu thủ"
        defaultValues={defaultValues}
        fields={fields}
        onBeforeSave={(v) => ({
          ...v,
          slug: v.slug?.trim() ? slugify(v.slug) : slugify(v.name || ''),
          date_of_birth: v.date_of_birth?.trim() ? v.date_of_birth.trim() : null,
        })}
        searchKeys={['name', 'position', 'nationality']}
        columns={[
          { key: 'shirt_number', header: 'Số', render: (r) => r.shirt_number ?? '—' },
          { key: 'name', header: 'Tên' },
          { key: 'position', header: 'Vị trí' },
          {
            key: 'nationality',
            header: 'Quốc tịch',
            render: (r) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {flagUrl(r.nationality) && (
                  <img src={flagUrl(r.nationality)!} alt="" width={16} height={12} style={{ borderRadius: 2 }} />
                )}
                {r.nationality || '—'}
              </span>
            ),
          },
          {
            key: 'is_active',
            header: 'Trạng thái',
            render: (r) => (
              <span className={`status-tag ${r.is_active ? 'status-tag-published' : 'status-tag-hidden'}`}>
                {r.is_active ? 'Hoạt động' : 'Tắt'}
              </span>
            ),
          },
        ]}
      />
    </AdminShell>
  );
}

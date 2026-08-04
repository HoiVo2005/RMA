'use client';
import AdminShell from '@/components/admin/AdminShell';
import CrudManager, { FieldConfig } from '@/components/admin/CrudManager';
import { RELIABILITY_LEVELS } from '@/lib/types';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Tên nguồn', type: 'text', required: true, half: true },
  { name: 'country', label: 'Quốc gia', type: 'text', required: true, half: true },
  { name: 'website_url', label: 'Website', type: 'url' },
  {
    name: 'rss_url',
    label: 'Đường dẫn RSS',
    type: 'url',
    hint: 'để trống nếu nguồn không có RSS — vẫn có thể lấy bài thủ công theo URL ở trang Bài viết',
  },
  { name: 'logo_url', label: 'Logo (URL ảnh)', type: 'image' },
  { name: 'reliability', label: 'Độ tin cậy', type: 'select', options: [...RELIABILITY_LEVELS], half: true },
  { name: 'is_active', label: 'Đang hoạt động (dùng để lấy tin tự động)', type: 'checkbox' },
];

const defaultValues = {
  name: '',
  country: '',
  website_url: '',
  rss_url: '',
  logo_url: '',
  reliability: 'Uy tín',
  is_active: true,
};

export default function SourcesAdminPage() {
  return (
    <AdminShell title="Nguồn tin">
      <CrudManager
        endpoint="/api/admin/sources"
        entityLabel="nguồn tin"
        defaultValues={defaultValues}
        fields={fields}
        searchKeys={['name', 'country']}
        columns={[
          { key: 'name', header: 'Tên nguồn' },
          { key: 'country', header: 'Quốc gia' },
          { key: 'reliability', header: 'Độ tin cậy' },
          { key: 'rss_url', header: 'RSS', render: (r) => (r.rss_url ? 'Có' : '—') },
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

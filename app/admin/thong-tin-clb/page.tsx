'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { adminJson } from '@/lib/admin-client';
import { DEFAULT_CLUB_INFO, type ClubInfo, type ClubKit } from '@/lib/club-info';
import { Plus, Trash2, Save } from 'lucide-react';

const KIT_KEYS: (keyof ClubInfo['colors'])[] = ['home', 'away', 'third'];

export default function ClubInfoAdminPage() {
  const [info, setInfo] = useState<ClubInfo>(DEFAULT_CLUB_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await adminJson<ClubInfo>('/api/admin/club-info');
      if (res.data) setInfo({ ...DEFAULT_CLUB_INFO, ...res.data });
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof ClubInfo>(key: K, value: ClubInfo[K]) {
    setInfo((v) => ({ ...v, [key]: value }));
  }

  function setKit(kitKey: keyof ClubInfo['colors'], patch: Partial<ClubKit>) {
    setInfo((v) => ({ ...v, colors: { ...v.colors, [kitKey]: { ...v.colors[kitKey], ...patch } } }));
  }

  function setNickname(i: number, value: string) {
    setInfo((v) => ({ ...v, nicknames: v.nicknames.map((n, idx) => (idx === i ? value : n)) }));
  }
  function addNickname() {
    setInfo((v) => ({ ...v, nicknames: [...v.nicknames, ''] }));
  }
  function removeNickname(i: number) {
    setInfo((v) => ({ ...v, nicknames: v.nicknames.filter((_, idx) => idx !== i) }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await adminJson<ClubInfo>('/api/admin/club-info', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(info),
    });
    setSaving(false);
    if (res.error) setMsg({ type: 'err', text: 'Lỗi: ' + res.error });
    else {
      setMsg({ type: 'ok', text: 'Đã lưu thông tin CLB.' });
      if (res.data) setInfo({ ...DEFAULT_CLUB_INFO, ...res.data });
    }
  }

  if (loading) {
    return (
      <AdminShell title="Thông tin CLB">
        <div className="empty-row">Đang tải...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Thông tin CLB">
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--ink-500)' }}>
        Toàn bộ nội dung khung thông tin CLB ở trang <b>Đội hình</b> (tên, biệt danh, sân, HLV, ảnh áo đấu...) được lấy
        từ đây, lưu trong cơ sở dữ liệu — sửa xong bấm <b>Lưu</b> là trang công khai cập nhật ngay.
      </p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Thông tin chung</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field-row" style={{ gridTemplateColumns: '1fr auto' }}>
            <div className="field">
              <label>Link icon / logo CLB</label>
              <input
                value={info.logoUrl || ''}
                onChange={(e) => set('logoUrl', e.target.value)}
                placeholder="https://... (bỏ trống thì dùng huy hiệu minh hoạ mặc định)"
              />
              <span className="hint">Hiển thị ở đầu khung thông tin CLB trên trang Đội hình.</span>
            </div>
            <div style={{ paddingBottom: 2 }}>
              {info.logoUrl ? (
                <img
                  src={info.logoUrl}
                  alt="logo"
                  style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)' }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    border: '1px dashed var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: 'var(--ink-300)',
                    textAlign: 'center',
                  }}
                >
                  Mặc định
                </div>
              )}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Tên CLB (ngắn)</label>
              <input value={info.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="field">
              <label>Tên đầy đủ</label>
              <input value={info.fullName} onChange={(e) => set('fullName', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Biệt danh</label>
            <div className="repeater">
              {info.nicknames.map((n, i) => (
                <div className="repeater-row" key={i}>
                  <div className="repeater-fields">
                    <div className="repeater-field repeater-field-wide">
                      <input value={n} onChange={(e) => setNickname(i, e.target.value)} placeholder="vd: Los Blancos (Màu Trắng)" />
                    </div>
                  </div>
                  <button type="button" className="repeater-remove" onClick={() => removeNickname(i)} title="Xoá">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="repeater-add" onClick={addNickname}>
                <Plus size={14} /> Thêm biệt danh
              </button>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Ngày thành lập</label>
              <input type="date" value={info.founded} onChange={(e) => set('founded', e.target.value)} />
              <span className="hint">Dùng để tự tính số năm "... năm trước"</span>
            </div>
            <div className="field">
              <label>Thành lập (hiển thị)</label>
              <input value={info.foundedLabel} onChange={(e) => set('foundedLabel', e.target.value)} placeholder="vd: 6 tháng 3 năm 1902" />
            </div>
          </div>

          <div className="field">
            <label>Tên khi mới thành lập</label>
            <input value={info.foundedAs} onChange={(e) => set('foundedAs', e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Sân vận động</label>
              <input value={info.stadium} onChange={(e) => set('stadium', e.target.value)} />
            </div>
            <div className="field">
              <label>Sức chứa</label>
              <input type="number" value={info.capacity} onChange={(e) => set('capacity', Number(e.target.value))} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Chủ tịch</label>
              <input value={info.president} onChange={(e) => set('president', e.target.value)} />
            </div>
            <div className="field">
              <label>Huấn luyện viên trưởng</label>
              <input value={info.headCoach} onChange={(e) => set('headCoach', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Website</label>
            <input value={info.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Áo đấu</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--ink-500)' }}>
            Dán link ảnh áo đấu thật (từ trang chủ CLB, cửa hàng chính hãng...) để hiển thị thay cho ô màu minh hoạ.
            Bỏ trống link thì trang sẽ tự vẽ ô màu theo 2 mã màu bên dưới.
          </p>
          {KIT_KEYS.map((key) => {
            const kit = info.colors[key];
            return (
              <div key={key} className="field-row" style={{ alignItems: 'end', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                <div className="field">
                  <label>{kit.label}</label>
                  <input value={kit.label} onChange={(e) => setKit(key, { label: e.target.value })} />
                </div>
                <div className="field">
                  <label>Link ảnh áo đấu</label>
                  <input
                    value={kit.image_url || ''}
                    onChange={(e) => setKit(key, { image_url: e.target.value })}
                    placeholder="https://... (bỏ trống nếu chưa có)"
                  />
                </div>
                <div className="field">
                  <label>Màu chính</label>
                  <input type="color" value={kit.primary} onChange={(e) => setKit(key, { primary: e.target.value })} />
                </div>
                <div className="field">
                  <label>Màu phụ</label>
                  <input type="color" value={kit.secondary} onChange={(e) => setKit(key, { secondary: e.target.value })} />
                </div>
                <div style={{ paddingBottom: 2 }}>
                  {kit.image_url ? (
                    <img src={kit.image_url} alt={kit.label} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--line)' }} />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 36,
                        borderRadius: '6px 6px 10px 10px',
                        background: kit.primary,
                        border: `2px solid ${kit.secondary}`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {msg && <div className={msg.type === 'err' ? 'form-error' : 'form-success'} style={{ marginBottom: 16 }}>{msg.text}</div>}

      <div className="form-actions" style={{ position: 'static' }}>
        <button className="btn btn-gold" onClick={save} disabled={saving}>
          {saving ? <span className="spinner spinner-dark" /> : <Save size={15} />}
          {saving ? 'Đang lưu...' : 'Lưu thông tin CLB'}
        </button>
      </div>
    </AdminShell>
  );
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFormationSlots } from '@/lib/formations';

// API công khai — trả về đội hình ra sân hiện tại (đồng bộ tự động từ Highlightly khi có,
// hoặc do admin xếp tay) kèm thông tin cầu thủ mới nhất (ảnh, số áo...) để hiển thị trên trang Đội hình.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ data: null });

  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: setting } = await db.from('site_settings').select('setting_value').eq('setting_key', 'starting_lineup').maybeSingle();
  if (!setting?.setting_value) return NextResponse.json({ data: null });

  const config = setting.setting_value as {
    formation: string;
    assignments: Record<string, string | null>;
    source?: 'auto' | 'manual';
    syncedAt?: string;
  };
  const slots = getFormationSlots(config.formation);
  if (!slots) return NextResponse.json({ data: null });

  const playerIds = Object.values(config.assignments || {}).filter(Boolean) as string[];
  const { data: players } = playerIds.length
    ? await db.from('players').select('id, name, shirt_number, image_url, position').in('id', playerIds)
    : { data: [] };
  const byId = new Map((players || []).map((p) => [p.id, p]));

  const resolvedSlots = slots.map((slot) => {
    const playerId = config.assignments?.[slot.id] || null;
    return { ...slot, player: playerId ? byId.get(playerId) || null : null };
  });

  return NextResponse.json({
    data: {
      formation: config.formation,
      slots: resolvedSlots,
      source: config.source || 'manual',
      syncedAt: config.syncedAt || null,
    },
  });
}

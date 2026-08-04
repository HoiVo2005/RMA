import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 0;

export default async function MaintenancePage() {
  const settings = await getSiteSettings();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        textAlign: 'center',
        padding: 24,
        background: 'var(--navy-950, #0d1330)',
        color: '#fff',
      }}
    >
      <span style={{ fontSize: 48 }}>♛</span>
      <h1 style={{ fontSize: 22, margin: 0 }}>{settings.siteName}</h1>
      <p style={{ maxWidth: 420, color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: 0 }}>
        {settings.maintenance.message}
      </p>
    </div>
  );
}

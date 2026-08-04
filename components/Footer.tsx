'use client';
import { Facebook, Youtube, Instagram, Mail } from 'lucide-react';
import { useSiteSettings } from './SiteSettingsProvider';

export default function Footer() {
  const settings = useSiteSettings();
  const { socialLinks, footer, contactEmail, siteName } = settings;
  const hasSocial = socialLinks.facebook || socialLinks.x || socialLinks.youtube || socialLinks.tiktok || socialLinks.instagram;
  const copyright = footer.copyrightText || `© ${new Date().getFullYear()} ${siteName}. Mọi quyền được bảo lưu.`;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <b>{siteName}</b>
        <p>{footer.aboutText}</p>
        <div className="foot-links">
          <a href="/nguon-tin">Nguồn tin</a>
          <a href="/tin-moi">Tin mới</a>
          <a href="/chuyen-nhuong">Chuyển nhượng</a>
          <a href="/danh-cho-ban">Dành cho bạn</a>
          <a href="/admin">Quản trị</a>
        </div>

        {(hasSocial || contactEmail) && (
          <div className="foot-social" style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook">
                <Facebook size={17} />
              </a>
            )}
            {socialLinks.x && (
              <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" title="X (Twitter)" aria-label="X (Twitter)" style={{ fontSize: 15, fontWeight: 700 }}>
                𝕏
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" aria-label="YouTube">
                <Youtube size={17} />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
                <Instagram size={17} />
              </a>
            )}
            {socialLinks.tiktok && (
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok" aria-label="TikTok" style={{ fontSize: 13, fontWeight: 700 }}>
                TikTok
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} title="Email liên hệ" aria-label="Email liên hệ" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Mail size={15} /> {contactEmail}
              </a>
            )}
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>{copyright}</p>
      </div>
    </footer>
  );
}

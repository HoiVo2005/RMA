'use client';
import { useState } from 'react';
import { Facebook, Link2, Check } from 'lucide-react';

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // trình duyệt không hỗ trợ clipboard — bỏ qua
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="share-buttons">
      <span className="share-label">Chia sẻ:</span>
      <a
        className="share-btn share-fb"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chia sẻ lên Facebook"
      >
        <Facebook size={15} />
      </a>
      <a
        className="share-btn share-x"
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chia sẻ lên X"
      >
        𝕏
      </a>
      <a
        className="share-btn share-zalo"
        href={`https://zalo.me/share/order?u=${encodedUrl}&d=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chia sẻ lên Zalo"
      >
        Zalo
      </a>
      <button className="share-btn share-copy" onClick={copyLink} title="Sao chép liên kết">
        {copied ? <Check size={15} /> : <Link2 size={15} />}
        {copied ? 'Đã chép' : 'Copy link'}
      </button>
    </div>
  );
}

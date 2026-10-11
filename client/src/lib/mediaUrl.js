/**
 * Turn stored listing media paths into URLs the browser can load.
 * On Vercel, only /api/* is served by the server; /uploads/* needs a rewrite or absolute origin.
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`;
    }
    const apiBase = import.meta.env.VITE_API_URL || '';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return origin ? `${origin}${url}` : url;
  }
  return url;
}

/**
 * Media stored in a listing can be an image, a self-hosted (inline) video file,
 * a link to a video hosted on an external platform (Instagram, TikTok…), or the
 * raw <blockquote> embed code from Instagram/TikTok.
 * These helpers classify a stored value so the gallery/thumbnails render correctly.
 */

/** True when the value is platform embed HTML (Instagram / TikTok blockquote). */
export function isEmbedHtml(value) {
  const s = String(value || '');
  const trimmed = s.trimStart();
  return (
    trimmed.startsWith('<blockquote') ||
    s.includes('instagram-media') ||
    s.includes('tiktok-embed') ||
    s.includes('data-instgrm')
  );
}

export function getEmbedProvider(value) {
  const s = String(value || '').toLowerCase();
  if (s.includes('tiktok-embed')) return 'tiktok';
  if (s.includes('instagram-media') || s.includes('data-instgrm')) return 'instagram';
  return null;
}

export function getVideoProvider(value) {
  if (isEmbedHtml(value)) {
    const p = getEmbedProvider(value);
    return p || 'external';
  }
  const u = String(value || '').toLowerCase();
  if (u.includes('tiktok.com') || u.includes('vm.tiktok')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  return 'external';
}

export function isExternalVideoUrl(value) {
  if (isEmbedHtml(value)) return false;
  const u = String(value || '').toLowerCase();
  return (
    u.includes('instagram.com') || u.includes('instagr.am') ||
    u.includes('tiktok.com') || u.includes('vm.tiktok') ||
    u.includes('youtube.com') || u.includes('youtu.be')
  );
}

export function isInlineVideoUrl(value) {
  if (isEmbedHtml(value)) return false;
  const u = String(value || '').toLowerCase();
  return (
    u.startsWith('data:video/') ||
    u.endsWith('.mp4') || u.endsWith('.webm') ||
    u.endsWith('.mov') || u.endsWith('.m4v') ||
    u.includes('/video/')
  );
}

export function isVideoMedia(value) {
  return isExternalVideoUrl(value) || isInlineVideoUrl(value);
}

export function isImageMedia(value) {
  return !isVideoMedia(value) && !isEmbedHtml(value);
}

/** Provider look-and-feel (gradient + label) used by the gallery/thumbnail tiles. */
export function videoProviderTheme(url) {
  switch (getVideoProvider(url)) {
    case 'tiktok':
      return { label: 'TikTok', badge: 'TikTok', gradient: 'from-[#25F4EE]/70 via-[#010101]/60 to-[#FE2C55]/70', accent: '#FE2C55' };
    case 'youtube':
      return { label: 'YouTube', badge: 'YouTube', gradient: 'from-[#ff0000]/70 via-[#282828]/70 to-[#282828]/80', accent: '#ff0000' };
    case 'instagram':
      return { label: 'Instagram', badge: 'Reel', gradient: 'from-[#833ab4]/60 via-[#fd1d1d]/50 to-[#fcb045]/60', accent: '#E1306C' };
    default:
      return { label: 'Vidéo', badge: 'Vidéo', gradient: 'from-[#1b2622]/70 via-[#1b2622]/60 to-[#bd6b46]/60', accent: '#bd6b46' };
  }
}

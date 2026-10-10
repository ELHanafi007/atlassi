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

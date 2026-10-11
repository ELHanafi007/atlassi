import { useEffect, useRef } from 'react';

const SCRIPT_SRC = {
  instagram: 'https://www.instagram.com/embed.js',
  tiktok: 'https://www.tiktok.com/embed.js'
};

const loadScript = (src) => {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.body.appendChild(s);
};

/**
 * Renders a raw Instagram/TikTok <blockquote> embed snippet by injecting the
 * HTML and loading the platform's embed script (which turns the blockquote into
 * a playable preview). The preview is live — clicking it plays/opens the post.
 */
export function VideoEmbed({ html, provider = 'instagram' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !html) return;

    const snippet = String(html).replace(/<script[\s\S]*?<\/script>/gi, '').trim();
    if (!snippet) return;
    el.innerHTML = snippet;

    const src = SCRIPT_SRC[provider];
    if (!src) return;

    loadScript(src);

    // The script processes blockquotes when it loads; if it is already loaded,
    // ask it explicitly to (re)process the ones we just injected.
    const process = () => {
      if (provider === 'instagram' && window.instgrm) {
        try { window.instgrm.Embeds.process(); } catch { /* noop */ }
      } else if (provider === 'tiktok' && window.tiktokEmbed) {
        try { window.tiktokEmbed.process(); } catch { /* noop */ }
      }
    };

    const tryProcess = () => {
      if ((provider === 'instagram' && window.instgrm) || (provider === 'tiktok' && window.tiktokEmbed)) {
        process();
      } else {
        window.setTimeout(tryProcess, 150);
      }
    };
    tryProcess();

    return () => { el.innerHTML = ''; };
  }, [html, provider]);

  if (!html) return null;

  return (
    <div className="w-full h-full overflow-y-auto flex items-start justify-center p-3 sm:p-5">
      <div ref={ref} className="w-full max-w-[460px]" />
    </div>
  );
}

export default VideoEmbed;
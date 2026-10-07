import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export function LanguageToggle({ className = '', variant = 'pill' }) {
  const { lang, setLang } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className={`relative flex items-center p-0.5 bg-[#ede8df] rounded-full border border-[#ded7cb] ${className}`}>
        <button
          type="button"
          onClick={() => setLang('ar')}
          className={`relative px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
            lang === 'ar' ? 'text-[#1b2622]' : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="التبديل إلى العربية"
          title="العربية"
        >
          {lang === 'ar' && (
            <motion.div
              layoutId="lang-pill-compact"
              className="absolute inset-0 bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10 font-bold">عربية</span>
        </button>

        <button
          type="button"
          onClick={() => setLang('fr')}
          className={`relative px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
            lang === 'fr' ? 'text-[#1b2622]' : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Passer au Français"
          title="Français"
        >
          {lang === 'fr' && (
            <motion.div
              layoutId="lang-pill-compact"
              className="absolute inset-0 bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10 font-bold">FR</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center p-1 bg-[#ede8df] rounded-full border border-[#ded7cb] select-none ${className}`}
      role="group"
      aria-label="Sélection de langue / اختيار اللغة"
    >
      <button
        type="button"
        onClick={() => setLang('ar')}
        className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
          lang === 'ar'
            ? 'text-[#19221f] font-bold'
            : 'text-[#6e7b74] hover:text-[#19221f]'
        }`}
        aria-pressed={lang === 'ar'}
        aria-label="اللغة العربية"
      >
        {lang === 'ar' && (
          <motion.div
            layoutId="lang-pill-desktop"
            className="absolute inset-0 bg-white rounded-full shadow-xs"
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />
        )}
        <span className="relative z-10">العربية</span>
      </button>

      <button
        type="button"
        onClick={() => setLang('fr')}
        className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
          lang === 'fr'
            ? 'text-[#19221f] font-bold'
            : 'text-[#6e7b74] hover:text-[#19221f]'
        }`}
        aria-pressed={lang === 'fr'}
        aria-label="Langue Française"
      >
        {lang === 'fr' && (
          <motion.div
            layoutId="lang-pill-desktop"
            className="absolute inset-0 bg-white rounded-full shadow-xs"
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />
        )}
        <span className="relative z-10">Français</span>
      </button>
    </div>
  );
}

export default LanguageToggle;

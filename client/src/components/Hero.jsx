import { Search, ArrowUpRight, Compass, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../lib/i18n';

export function Hero({ searchQuery, setSearchQuery, onSelectCity, selectedCity, onFeaturedClick }) {
  const { t, translateCity, isRtl } = useLanguage();
  const rawCities = ['All', 'Marrakech', 'Tangier', 'Casablanca', 'Fes', 'Rabat', 'Agadir'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#e7e2d8]">
      {/* Cinematic hero video background */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <video
          ref={(el) => { if (el) el.muted = true; }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/video/hero-poster-1.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/media/video/hero-1.webm" type="video/webm" />
          <source src="/media/video/hero-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#f9f8f5] via-[#f9f8f5]/90 to-[#f9f8f5]/60 lg:to-[#f9f8f5]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f9f8f5]/20 via-transparent to-[#f9f8f5]/40" />
      </div>
      {/* Decorative background geometry */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[#f0ece2]/60 blur-3xl -z-10 opacity-70 pointer-events-none translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#eee7db]/60 blur-3xl -z-10 opacity-50 pointer-events-none -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Editorial Copy Column */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            {/* Kicker badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efebe3] border border-[#ded7ca] text-[#bd6b46] text-xs font-semibold uppercase tracking-wider mb-6 w-max">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bd6b46]" />
              <span>{t('hero.kicker')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold text-[#19221f] leading-[1.08] tracking-tight mb-6">
              {t('hero.headlinePrefix')}{' '}
              <span className="font-serif italic font-normal text-[#bd6b46]">
                {t('hero.headlineHighlight')}
              </span>
            </h1>

            {/* Subcopy */}
            <p className="text-base sm:text-lg text-[#55605b] max-w-xl font-normal leading-relaxed mb-8">
              {t('hero.subcopy')}
            </p>

            {/* Interactive Search Bar */}
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 sm:p-2.5 rounded-2xl border border-[#ded7ca] shadow-md shadow-stone-900/5 max-w-xl flex flex-col sm:flex-row items-stretch gap-2 transition-all focus-within:border-[#bd6b46] focus-within:ring-2 focus-within:ring-[#bd6b46]/15"
            >
              <div className="flex items-center gap-3 px-3.5 py-2 flex-1">
                <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full bg-transparent text-sm text-[#19221f] placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#1b2622] hover:bg-[#283631] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer flex-shrink-0"
              >
                <span>{t('hero.searchButton')}</span>
                <ArrowUpRight className={`w-4 h-4 text-[#bd6b46] transition-transform ${isRtl ? 'rotate-[-90deg]' : ''}`} />
              </button>
            </form>

            {/* Quick City Filters */}
            <div className="mt-6 flex items-center flex-wrap gap-2">
              <span className="text-xs font-medium text-stone-500 me-1">{t('hero.popular')}</span>
              {rawCities.map((c) => {
                const isSelected = (c === 'All' && !selectedCity) || selectedCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onSelectCity(c === 'All' ? '' : c);
                      document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b2622] text-[#f9f8f5] shadow-xs'
                        : 'bg-white/80 border border-[#e5e0d8] text-[#525f59] hover:border-[#1b2622] hover:text-[#1b2622]'
                    }`}
                  >
                    {translateCity(c)}
                  </button>
                );
              })}
            </div>

            {/* Proof Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 mt-8 border-t border-[#ded7ca] text-xs text-[#525f59]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#bd6b46] flex-shrink-0" />
                <span>{t('hero.proofVerified')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#bd6b46] flex-shrink-0" />
                <span>{t('hero.proofCities')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#bd6b46] flex-shrink-0" />
                <span>{t('hero.proofOffers')}</span>
              </div>
            </div>
          </motion.div>

          {/* Architectural Showcase Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div 
              onClick={onFeaturedClick}
              className="group cursor-pointer relative bg-white rounded-3xl p-3 border border-[#ded7ca] shadow-xl shadow-stone-900/10 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-[#bd6b46]/50"
            >
              {/* Photo */}
              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1200"
                  alt="Contemporary villa in Marrakech Palmeraie"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Badges */}
                <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide text-[#1b2622]`}>
                  {t('hero.featuredBadge')}
                </div>
                <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} bg-[#1b2622]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-[#f9f8f5] tracking-wider`}>
                  {t('hero.forSale')}
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent text-white flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-stone-300 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#bd6b46]" />
                    <span>{translateCity('Marrakech')} · {isRtl ? 'النخيل' : 'Palmeraie'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2 leading-snug">
                    {t('hero.featuredTitle')}
                  </h2>
                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    <span className="font-mono text-base font-semibold text-[#f2ddd0]">
                      4,850,000 {isRtl ? 'درهم' : 'MAD'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white group-hover:text-[#bd6b46] transition-colors">
                      {t('hero.viewResidence')} <ArrowUpRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-[-90deg]' : ''}`} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle decorative quote */}
            <div className="mt-4 px-3 flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>{t('hero.featuredRef')}</span>
              <span>{t('hero.featuredMeta')}</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

export default Hero;

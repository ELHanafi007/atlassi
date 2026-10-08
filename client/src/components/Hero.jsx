import { Search, ArrowUpRight, Compass, ShieldCheck, Sparkles, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useLanguage } from '../lib/i18n';

export function Hero({ searchQuery, setSearchQuery, onSelectCity, selectedCity, onFeaturedClick, listings = [] }) {
  const { t, translateCity, isRtl } = useLanguage();

  // Extract distinct neighborhood names dynamically from published listings (entered by Admin)
  const dynamicNeighborhoods = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => {
      if (l.neighborhood && l.neighborhood.trim()) {
        set.add(l.neighborhood.trim());
      }
    });
    return Array.from(set);
  }, [listings]);

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

            {/* Dynamic Admin Neighborhood Filters */}
            {dynamicNeighborhoods.length > 0 && (
              <div className="mt-6 flex items-center flex-wrap gap-2">
                <span className="text-xs font-medium text-stone-500 me-1">{t('hero.popularNeighborhoods')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    !searchQuery
                      ? 'bg-[#1b2622] text-[#f9f8f5] shadow-xs'
                      : 'bg-white/80 border border-[#e5e0d8] text-[#525f59] hover:border-[#1b2622] hover:text-[#1b2622]'
                  }`}
                >
                  {isRtl ? 'الكل' : 'Tous'}
                </button>
                {dynamicNeighborhoods.map((nh) => {
                  const isSelected = searchQuery === nh;
                  return (
                    <button
                      key={nh}
                      type="button"
                      onClick={() => {
                        setSearchQuery(nh);
                        document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1b2622] text-[#f9f8f5] shadow-xs'
                          : 'bg-white/80 border border-[#e5e0d8] text-[#525f59] hover:border-[#1b2622] hover:text-[#1b2622]'
                      }`}
                    >
                      {nh}
                    </button>
                  );
                })}
              </div>
            )}

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

          {/* Atlassi Founder Brand Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative bg-white rounded-3xl p-3 border border-[#ded7ca] shadow-xl shadow-stone-900/10 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              {/* Photo */}
              <div className="relative h-96 sm:h-[430px] rounded-2xl overflow-hidden bg-stone-200">
                <img
                  src="/media/founder/founder-hero.jpg"
                  alt="Atlassi Luxury Real Estate Founder"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-103"
                />
                
                {/* Badges */}
                <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide text-[#1b2622] shadow-sm flex items-center gap-1.5`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isRtl ? 'مؤسس أطلسي' : 'Fondateur Atlassi'}</span>
                </div>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} bg-[#E1306C] hover:bg-[#c1255b] text-white backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer`}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>

                {/* Bottom Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent text-white flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-[#e5c5b5] font-semibold uppercase tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#bd6b46]" />
                    <span>{isRtl ? 'العيون — المملكة المغربية' : 'Laâyoune · Maroc'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2 leading-snug">
                    {isRtl ? 'عقارات راقية بإشراف مباشر' : 'Immobilier d\'Exception & Visites Dédiées'}
                  </h2>
                  <p className="text-xs text-stone-300 line-clamp-2 mb-3 leading-relaxed">
                    {isRtl
                      ? 'جولات مرئية حصرية واستشارات عقارية مباشرة من مؤسس ماركة أطلسي.'
                      : 'Visites vidéo exclusives et conseil personnalisé en direct par le fondateur Atlassi.'}
                  </p>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/20">
                    <a
                      href="https://wa.me/212760159454"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>0760159454</span>
                    </a>
                    <button
                      onClick={onFeaturedClick}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-[#bd6b46] transition-colors cursor-pointer"
                    >
                      <span>{isRtl ? 'استكشف المعرض' : 'Explorer la sélection'}</span>
                      <ArrowUpRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-[-90deg]' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle brand tag */}
            <div className="mt-3 px-3 flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>ATLASSI BRAND REAL ESTATE</span>
              <span>LAÂYOUNE · MAROC</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

export default Hero;

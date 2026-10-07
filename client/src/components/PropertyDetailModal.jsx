import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, BedDouble, Bath, Maximize2, MapPin, 
  Sparkles, ChevronLeft, ChevronRight, Check, Send, 
  ShieldCheck, Phone
} from 'lucide-react';
import { inquiriesApi } from '../lib/api';
import { useLanguage } from '../lib/i18n';

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export function PropertyDetailModal({ property, onClose, isSaved, onToggleSave, onOpenOffer, currentUser, onShowToast, onOpenAuth }) {
  const { t, localizeListing, isRtl } = useLanguage();
  const localized = localizeListing(property);

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ id: 1, url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=85&w=1400', isPrimary: true }];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      else onShowToast({ type: 'info', message: t('modal.signInToInquire') });
      return;
    }

    setInquirySending(true);
    try {
      await inquiriesApi.send(property.id, inquiryMessage);
      setInquirySent(true);
      setInquiryMessage('');
      onShowToast({ type: 'success', message: t('modal.inquirySentSuccess') });
    } catch (err) {
      onShowToast({ type: 'error', message: err.message || 'Failed to send inquiry.' });
    } finally {
      setInquirySending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#f9f8f5] rounded-3xl shadow-2xl border border-[#ded7cb] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white shadow-md transition-all active:scale-95 cursor-pointer`}
          aria-label={t('modal.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          
          {/* Gallery Carousel */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-stone-900 overflow-hidden">
            <AnimatePresence mode="wait">
              {(() => {
                const active = images[activeImageIndex] || {};
                const url = active.url || '';
                const isVideo = active.mediaType === 'video' || url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/video/');
                return isVideo ? (
                  <motion.video
                    key={activeImageIndex}
                    src={url}
                    muted
                    loop
                    autoPlay
                    playsInline
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.4 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <motion.img
                    key={activeImageIndex}
                    src={url}
                    alt={`${localized.title} - ${activeImageIndex + 1}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.4 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover"
                  />
                );
              })()}
            </AnimatePresence>

            {/* Prev / Next Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={isRtl ? nextImage : prevImage}
                  className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900/90 text-white backdrop-blur-md transition-all cursor-pointer`}
                  aria-label={t('modal.prevPhoto')}
                >
                  <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={isRtl ? prevImage : nextImage}
                  className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900/90 text-white backdrop-blur-md transition-all cursor-pointer`}
                  aria-label={t('modal.nextPhoto')}
                >
                  <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </>
            )}

            {/* Photo Counter */}
            <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'} px-3 py-1 rounded-full bg-stone-950/75 backdrop-blur-md text-white text-xs font-mono`}>
              {activeImageIndex + 1} / {images.length}
            </div>

            {/* Purpose Tag */}
            <div className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} flex gap-2`}>
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#1b2622] text-xs font-bold tracking-wider">
                {property.purpose === 'RENT' ? t('card.forRent') : t('card.forSale')}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#bd6b46] text-white text-xs font-bold tracking-wider">
                {localized.displayType}
              </span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="px-6 py-3 bg-[#ede8df] border-b border-[#ded7cb] flex items-center gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-[#bd6b46] scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Main Column */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Heading & Location */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#bd6b46] tracking-wider mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{localized.location || localized.displayCity}, {isRtl ? 'المغرب' : 'Maroc'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b2622] leading-tight">
                    {localized.title}
                  </h1>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-[#e5e0d8] text-xs font-medium">
                  {property.bedrooms !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">{t('modal.bedrooms')}</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-[#bd6b46]" /> {property.bedrooms}
                      </strong>
                    </div>
                  )}
                  {property.bathrooms !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">{t('modal.bathrooms')}</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-[#bd6b46]" /> {property.bathrooms}
                      </strong>
                    </div>
                  )}
                  {property.surface !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">{t('modal.livingSpace')}</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-[#bd6b46]" /> {property.surface} {t('card.surfaceUnit')}
                      </strong>
                    </div>
                  )}
                  {property.condition && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">{t('modal.condition')}</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#bd6b46]" /> {localized.displayCondition}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Narrative Description */}
                <div>
                  <h3 className="text-xs font-bold text-stone-400 tracking-wider mb-2.5">
                    {t('modal.aboutResidence')}
                  </h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                    {localized.description}
                  </p>
                </div>

                {/* Amenities */}
                {localized.displayAmenities && localized.displayAmenities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-stone-400 tracking-wider mb-3">
                      {t('modal.featuresAmenities')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {localized.displayAmenities.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#ded7cb] text-xs font-medium text-stone-700 flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 text-[#bd6b46]" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instagram Reel Video Tour */}
                {property.instagramVideoUrl && (
                  <div>
                    <h3 className="text-xs font-bold text-stone-400 tracking-wider mb-3">
                      {t('modal.videoTourTitle')}
                    </h3>
                    <a
                      href={property.instagramVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#1b1b1b] border border-[#ded7cb] shadow-xs hover:shadow-md transition-shadow"
                      aria-label={t('modal.watchOnInstagram')}
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#833ab4]/60 via-[#fd1d1d]/50 to-[#fcb045]/60 group-hover:opacity-90 transition-opacity" />

                      {/* Play circle */}
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                          {/* Instagram logo */}
                          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#E1306C]" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <span className="text-white text-xs font-bold tracking-wide drop-shadow-md">
                          {t('modal.watchOnInstagram')}
                        </span>
                      </div>

                      {/* Corner badge */}
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-[#E1306C] tracking-wider">
                        REEL
                      </div>
                    </a>
                  </div>
                )}

              </div>

              {/* Sidebar Action Column */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                
                {/* Pricing & Offer Box */}
                <div className="bg-white p-5 rounded-2xl border border-[#ded7cb] shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 tracking-wider block">
                        {t('modal.listingPrice')}
                      </span>
                      <strong className="text-2xl font-mono font-bold text-[#1b2622]">
                        {localized.displayPrice}
                      </strong>
                    </div>

                    <button
                      onClick={() => onToggleSave(property.id)}
                      className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-rose-50 border-rose-200 text-[#bd6b46]'
                          : 'border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                      aria-label="Save listing"
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Make Offer Button */}
                  <button
                    onClick={() => onOpenOffer(property)}
                    className="w-full py-3 px-4 rounded-xl bg-[#bd6b46] hover:bg-[#a65d3c] text-white text-xs font-bold tracking-wider transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                  >
                    {t('modal.makeOffer')}
                  </button>

                  <div className="text-[11px] text-stone-400 text-center leading-relaxed">
                    {t('modal.nonBindingNotice')}
                  </div>
                </div>

                {/* Direct Atlassi Contact Box */}
                <div className="bg-[#ede8df] p-5 rounded-2xl border border-[#ded7cb] flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#1b2622] text-[#bd6b46] flex items-center justify-center font-bold text-xs shadow-2xs">
                      <ShieldCheck className="w-5 h-5 text-[#bd6b46]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2622]">
                        {isRtl ? 'فريق أطلسي العقاري' : 'Équipe Atlassi Real Estate'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        <span>{isRtl ? 'متصل الآن • خدمة العملاء' : 'Disponible 7j/7 • Support Direct'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Big WhatsApp Button */}
                  <a
                    href={`https://wa.me/212760159454?text=${encodeURIComponent(
                      `Bonjour Atlassi, je souhaite avoir plus d'informations sur la propriété : "${property.title}" (${property.city}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span>{isRtl ? 'مراسلة عبر واتساب (0760159454)' : 'Contacter sur WhatsApp (0760159454)'}</span>
                  </a>

                  {/* Direct Phone Call Button */}
                  <a
                    href="tel:+212760159454"
                    className="w-full py-3 px-4 rounded-xl bg-[#1b2622] hover:bg-[#283631] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-[#bd6b46]" />
                    <span>{isRtl ? 'اتصال مباشر: 07 60 15 94 54' : 'Appeler direct: 07 60 15 94 54'}</span>
                  </a>
                </div>

              </div>

            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

export default PropertyDetailModal;

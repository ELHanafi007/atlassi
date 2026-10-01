import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, BedDouble, Bath, Maximize2, MapPin, 
  Sparkles, ChevronLeft, ChevronRight, Check, Send, 
  Calendar, Layers, ShieldCheck, Home 
} from 'lucide-react';
import { inquiriesApi } from '../lib/api';

export function PropertyDetailModal({ property, onClose, isSaved, onToggleSave, onOpenOffer, currentUser, onShowToast }) {
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
      onShowToast({ type: 'info', message: 'Please sign in to send an inquiry to the owner.' });
      return;
    }

    setInquirySending(true);
    try {
      await inquiriesApi.send(property.id, inquiryMessage);
      setInquirySent(true);
      setInquiryMessage('');
      onShowToast({ type: 'success', message: 'Your message has been sent directly to the owner.' });
    } catch (err) {
      onShowToast({ type: 'error', message: err.message || 'Failed to send inquiry.' });
    } finally {
      setInquirySending(false);
    }
  };

  const formattedPrice = `${new Intl.NumberFormat('en-US').format(property.price)} ${
    property.priceLabel || (property.purpose === 'RENT' ? 'MAD / mo' : 'MAD')
  }`;

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
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white shadow-md transition-all active:scale-95"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          
          {/* Gallery Carousel */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-stone-900 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                src={images[activeImageIndex]?.url}
                alt={`${property.title} view ${activeImageIndex + 1}`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Prev / Next Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900/90 text-white backdrop-blur-md transition-all"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900/90 text-white backdrop-blur-md transition-all"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-stone-950/75 backdrop-blur-md text-white text-xs font-mono">
              {activeImageIndex + 1} / {images.length}
            </div>

            {/* Purpose Tag */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#1b2622] text-xs font-bold uppercase tracking-wider">
                {property.purpose === 'RENT' ? 'For Rent' : 'For Sale'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#bd6b46] text-white text-xs font-bold uppercase tracking-wider">
                {property.type}
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
                  className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#bd6b46] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
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
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#bd6b46] uppercase tracking-wider mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{property.location || property.city}, Morocco</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b2622] leading-tight">
                    {property.title}
                  </h1>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-[#e5e0d8] text-xs font-medium">
                  {property.bedrooms !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">Bedrooms</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-[#bd6b46]" /> {property.bedrooms}
                      </strong>
                    </div>
                  )}
                  {property.bathrooms !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">Bathrooms</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-[#bd6b46]" /> {property.bathrooms}
                      </strong>
                    </div>
                  )}
                  {property.surface !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">Living Space</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-[#bd6b46]" /> {property.surface} m²
                      </strong>
                    </div>
                  )}
                  {property.condition && (
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-400 font-normal">Condition</span>
                      <strong className="text-sm font-semibold text-[#1b2622] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#bd6b46]" /> {property.condition}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Narrative Description */}
                <div>
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    About this residence
                  </h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                    {property.description}
                  </p>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                      Features & Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((item) => (
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

              </div>

              {/* Sidebar Action Column */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                
                {/* Pricing & Offer Box */}
                <div className="bg-white p-5 rounded-2xl border border-[#ded7cb] shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Listing Price
                      </span>
                      <strong className="text-2xl font-mono font-bold text-[#1b2622]">
                        {formattedPrice}
                      </strong>
                    </div>

                    <button
                      onClick={() => onToggleSave(property.id)}
                      className={`p-2.5 rounded-full border transition-all ${
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
                    className="w-full py-3 px-4 rounded-xl bg-[#bd6b46] hover:bg-[#a65d3c] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-[0.99]"
                  >
                    Make an offer
                  </button>

                  <div className="text-[11px] text-stone-400 text-center">
                    Offers submitted are non-binding until agreed with the owner.
                  </div>
                </div>

                {/* Owner Inquiries Box */}
                <div className="bg-[#ede8df] p-5 rounded-2xl border border-[#ded7cb] flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#1b2622] text-white flex items-center justify-center font-bold text-xs">
                      {property.seller?.name ? property.seller.name.charAt(0) : 'A'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2622]">
                        {property.seller?.name || 'Verified Owner'}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3 h-3" /> Identity Verified
                      </div>
                    </div>
                  </div>

                  {inquirySent ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Message received. The owner has been notified.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSendInquiry} className="flex flex-col gap-2">
                      <textarea
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Ask the owner about visiting dates, furniture, or conditions..."
                        rows={3}
                        className="w-full p-2.5 bg-white border border-[#ded7cb] rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] resize-none"
                      />
                      <button
                        type="submit"
                        disabled={inquirySending || !inquiryMessage.trim()}
                        className="py-2.5 px-3 rounded-xl bg-[#1b2622] hover:bg-[#293833] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{inquirySending ? 'Sending…' : 'Send direct inquiry'}</span>
                      </button>
                    </form>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

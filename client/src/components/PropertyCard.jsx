import { BedDouble, Bath, Maximize2, Heart, ArrowUpRight, MapPin, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/i18n';

export function PropertyCard({ property, onOpen, isSaved, onToggleSave }) {
  const { t, localizeListing, isRtl } = useLanguage();
  const localized = localizeListing(property);

  const primaryImage = property.images?.find((img) => img.isPrimary) || property.images?.[0] || {
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=85&w=1200'
  };

  const imageCount = property.images?.length || 1;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      onClick={() => onOpen(property)}
      className="group cursor-pointer bg-white rounded-2xl border border-[#e4ded5] hover:border-[#1b2622]/40 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Photo Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={primaryImage.url}
          alt={localized.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} flex items-center gap-1.5 z-10`}>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-white/95 backdrop-blur-md text-[#1b2622] shadow-2xs">
            {property.purpose === 'RENT' ? t('card.forRent') : t('card.forSale')}
          </span>
          {property.isFeatured && (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider bg-[#bd6b46] text-white shadow-2xs">
              {t('card.featured')}
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(property.id);
          }}
          className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isSaved
              ? 'bg-white text-[#bd6b46] shadow-md scale-105'
              : 'bg-white/85 text-stone-700 hover:bg-white hover:text-[#bd6b46] shadow-2xs hover:scale-105'
          }`}
          aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Photo Count indicator */}
        {imageCount > 1 && (
          <div className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'} z-10 px-2 py-0.5 rounded-full bg-stone-900/70 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1`}>
            <Camera className="w-3 h-3" />
            <span>{imageCount}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Eyebrow / Location */}
          <div className="flex items-center justify-between text-xs text-[#6e7b74] mb-1.5">
            <div className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#bd6b46]" />
              <span>{property.neighborhood ? `${property.neighborhood}, ` : ''}{localized.displayCity}</span>
            </div>
            <span className="text-[10px] tracking-wider font-semibold text-stone-400">
              {localized.displayType}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-[#1b2622] group-hover:text-[#bd6b46] transition-colors leading-snug tracking-tight line-clamp-1">
            {localized.title}
          </h3>

          {/* Description Snippet */}
          <p className="mt-1.5 text-xs text-[#5c6863] line-clamp-2 leading-relaxed font-normal">
            {localized.description}
          </p>
        </div>

        {/* Stats & Pricing */}
        <div className="mt-4 pt-3 border-t border-[#ede7dd]">
          <div className="flex items-center justify-between text-xs text-[#525f59] mb-3 font-medium">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('card.bedCount', property.bedrooms)}</span>
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('card.bathCount', property.bathrooms)}</span>
              </span>
            )}
            {property.surface !== null && (
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                <span>{property.surface} {t('card.surfaceUnit')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] tracking-wider font-semibold text-stone-400 block -mb-0.5">
                {t('card.priceLabel')}
              </span>
              <strong className="text-sm sm:text-base font-mono font-bold text-[#1b2622]">
                {localized.displayPrice}
              </strong>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#bd6b46] group-hover:translate-x-0.5 transition-transform">
              <span>{t('card.viewAction')}</span> 
              <ArrowUpRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-[-90deg]' : ''}`} />
            </span>
          </div>
        </div>

      </div>
    </motion.article>
  );
}

export default PropertyCard;

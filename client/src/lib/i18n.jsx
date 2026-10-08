import { useState, useEffect, useMemo, useCallback } from 'react';
import { translations, sampleListingsI18n } from './translations';
import { LanguageContext } from './LanguageContext';
export { useLanguage } from './useLanguage';

export function LanguageProvider({ children }) {
  // Read initial language from localStorage or default to French ('fr')
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('atlassi-lang');
      if (saved === 'ar' || saved === 'fr') return saved;
    } catch {
      // storage unavailable
    }
    return 'fr';
  });

  const setLang = useCallback((newLang) => {
    if (newLang !== 'ar' && newLang !== 'fr') return;
    setLangState(newLang);
    try {
      localStorage.setItem('atlassi-lang', newLang);
    } catch {
      // storage unavailable
    }
  }, []);

  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  // Apply lang and dir to documentElement whenever language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    
    // Update document title & meta description
    const currentT = translations[lang];
    if (currentT?.siteTitle) {
      document.title = currentT.siteTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && currentT?.siteDescription) {
      metaDesc.setAttribute('content', currentT.siteDescription);
    }
  }, [lang, dir]);

  // Translation lookup helper: t('nav.allHomes')
  const t = useCallback((path, ...args) => {
    const keys = path.split('.');
    let curr = translations[lang];
    for (const key of keys) {
      if (curr && typeof curr === 'object' && key in curr) {
        curr = curr[key];
      } else {
        // Fallback to french
        let fallback = translations.fr;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        curr = fallback;
        break;
      }
    }
    if (typeof curr === 'function') {
      return curr(...args);
    }
    return curr ?? path;
  }, [lang]);

  // Helpers to translate metadata
  const translateCity = useCallback((cityName) => {
    if (!cityName) return '';
    const map = translations[lang].cities;
    return map[cityName] || cityName;
  }, [lang]);

  const translateType = useCallback((typeName) => {
    if (!typeName) return '';
    const map = translations[lang].types;
    return map[typeName] || map[typeName.toUpperCase()] || typeName;
  }, [lang]);

  const translateCondition = useCallback((cond) => {
    if (!cond) return '';
    const map = translations[lang].conditions;
    return map[cond] || cond;
  }, [lang]);

  const translateAmenity = useCallback((amenity) => {
    if (!amenity) return '';
    const map = translations[lang].amenities;
    return map[amenity] || amenity;
  }, [lang]);

  const translateTitleStatus = useCallback((status) => {
    if (!status) return translations[lang].filters.titled;
    const isUntitled = status.toLowerCase() === 'untitled';
    return isUntitled ? translations[lang].filters.untitled : translations[lang].filters.titled;
  }, [lang]);

  // Formatter for price with Moroccan currency
  const formatPrice = useCallback((price, purpose) => {
    if (price === null || price === undefined || isNaN(price)) return '';
    const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR';
    const formattedNum = new Intl.NumberFormat(locale).format(price);
    
    if (lang === 'ar') {
      const suffix = purpose === 'RENT' ? 'درهم / شهر' : 'درهم';
      return `${formattedNum} ${suffix}`;
    } else {
      const suffix = purpose === 'RENT' ? 'MAD / mois' : 'MAD';
      return `${formattedNum} ${suffix}`;
    }
  }, [lang]);

  // Localize listing content (titles, descriptions, amenities, location)
  const localizeListing = useCallback((listing) => {
    if (!listing) return listing;
    const sample = sampleListingsI18n[listing.id]?.[lang];
    
    return {
      ...listing,
      title: sample?.title || listing.title,
      description: sample?.description || listing.description,
      location: sample?.location || listing.location,
      displayCity: translateCity(listing.city),
      displayType: translateType(listing.type),
      displayCondition: translateCondition(listing.condition),
      displayTitleStatus: translateTitleStatus(listing.titleStatus),
      displayAmenities: listing.amenities?.map(translateAmenity) || [],
      displayPrice: formatPrice(listing.price, listing.purpose),
    };
  }, [lang, translateCity, translateType, translateCondition, translateTitleStatus, translateAmenity, formatPrice]);

  const contextValue = useMemo(() => ({
    lang,
    setLang,
    isRtl,
    dir,
    t,
    translateCity,
    translateType,
    translateCondition,
    translateAmenity,
    translateTitleStatus,
    formatPrice,
    localizeListing,
  }), [lang, setLang, isRtl, dir, t, translateCity, translateType, translateCondition, translateAmenity, translateTitleStatus, formatPrice, localizeListing]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

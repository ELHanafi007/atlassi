import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, RotateCcw, Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export function FilterBar({
  purpose,
  setPurpose,
  city,
  setCity,
  propertyType,
  setPropertyType,
  sort,
  setSort,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minBedrooms,
  setMinBedrooms,
  onReset
}) {
  const { t, translateCity, translateType, isRtl } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rawCities = ['Laayoune'];
  const rawPropertyTypes = ['Apartment', 'Villa', 'House', 'Riad', 'Studio', 'Land'];

  const hasActiveFilters = Boolean(city || propertyType || minPrice || maxPrice || minBedrooms || purpose !== 'ALL');

  return (
    <div className="w-full bg-[#f9f8f5] border-y border-[#e7e2d8] py-4 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Animated Tab Switcher */}
          <div className="flex items-center p-1 bg-[#ede8df] rounded-full border border-[#ded7cb] self-start md:self-auto">
            {[
              { id: 'ALL', label: t('filters.allListings') },
              { id: 'SALE', label: t('filters.forSale') },
              { id: 'RENT', label: t('filters.forRent') }
            ].map((tab) => {
              const isActive = purpose === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPurpose(tab.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                    isActive ? 'text-[#1b2622]' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="purpose-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-2xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: City, Type, Sort, Filters Toggle */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* City Dropdown */}
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`appearance-none bg-white border border-[#ded7cb] hover:border-stone-400 text-stone-800 text-xs font-medium rounded-xl ${
                  isRtl ? 'pr-8 pl-8' : 'pl-8 pr-8'
                } py-2 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer shadow-2xs`}
                aria-label={t('filters.allCities')}
              >
                <option value="">{t('filters.allCities')}</option>
                {rawCities.map((c) => (
                  <option key={c} value={c}>{translateCity(c)}</option>
                ))}
              </select>
              <MapPin className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            </div>

            {/* Property Type Dropdown */}
            <div className="relative">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={`appearance-none bg-white border border-[#ded7cb] hover:border-stone-400 text-stone-800 text-xs font-medium rounded-xl ${
                  isRtl ? 'pr-8 pl-8' : 'pl-8 pr-8'
                } py-2 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer shadow-2xs`}
                aria-label={t('filters.allTypes')}
              >
                <option value="">{t('filters.allTypes')}</option>
                {rawPropertyTypes.map((typeName) => (
                  <option key={typeName} value={typeName.toUpperCase()}>{translateType(typeName)}</option>
                ))}
              </select>
              <Building2 className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`appearance-none bg-white border border-[#ded7cb] hover:border-stone-400 text-stone-800 text-xs font-medium rounded-xl ${
                  isRtl ? 'pr-3 pl-8' : 'pl-3 pr-8'
                } py-2 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer shadow-2xs`}
                aria-label="Sort listings"
              >
                <option value="newest">{t('filters.sortLatest')}</option>
                <option value="priceAsc">{t('filters.sortPriceAsc')}</option>
                <option value="priceDesc">{t('filters.sortPriceDesc')}</option>
                <option value="surfaceDesc">{t('filters.sortSurfaceDesc')}</option>
              </select>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            </div>

            {/* Expandable Advanced Filters Button */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                drawerOpen || minBedrooms || minPrice || maxPrice
                  ? 'bg-[#1b2622] text-[#f9f8f5] border-[#1b2622]'
                  : 'bg-white text-stone-700 border-[#ded7cb] hover:border-stone-400'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('filters.filtersButton')}</span>
              {(minBedrooms || minPrice || maxPrice) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#bd6b46]" />
              )}
            </button>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                title={t('filters.resetButton')}
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{t('filters.resetButton')}</span>
              </button>
            )}
          </div>

        </div>

        {/* Expandable Filter Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-4 border-t border-[#e7e2d8] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                
                {/* Min Bedrooms */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5">
                    {t('filters.bedroomsLabel')}
                  </label>
                  <div className="flex gap-1">
                    {['', '1', '2', '3', '4+'].map((beds) => {
                      const val = beds === '4+' ? '4' : beds;
                      const active = minBedrooms === val;
                      return (
                        <button
                          key={beds || 'any'}
                          type="button"
                          onClick={() => setMinBedrooms(active ? '' : val)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1b2622] text-white border-[#1b2622]'
                              : 'bg-white border-[#ded7cb] text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {beds || t('filters.anyBedrooms')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5">
                    {t('filters.minPriceLabel')}
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t('filters.minPricePlaceholder')}
                    className="w-full bg-white border border-[#ded7cb] rounded-lg px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5">
                    {t('filters.maxPriceLabel')}
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t('filters.maxPricePlaceholder')}
                    className="w-full bg-white border border-[#ded7cb] rounded-lg px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                  />
                </div>

                {/* Clear Actions */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setMinBedrooms('');
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('filters.clearFilterSpecs')}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default FilterBar;

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Sparkles, ArrowUpRight, Plus, 
  HelpCircle, MessageSquarePlus 
} from 'lucide-react';
import './App.css';

import { auth, listingsApi } from './lib/api';
import { useLanguage } from './lib/i18n';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { OfferModal } from './components/OfferModal';
import { CreateListingModal } from './components/CreateListingModal';
import { CreateRequestModal } from './components/CreateRequestModal';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

export function App() {
  const { t, translateCity, translateType, formatPrice, isRtl } = useLanguage();

  // State: Authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // State: Data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State: Favorites
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('atlassi-saved-ids') || '[]');
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // State: Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [purpose, setPurpose] = useState('ALL'); // 'ALL' | 'SALE' | 'RENT'
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [titleStatus, setTitleStatus] = useState('');

  // State: Modals & Overlays
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [offerProperty, setOfferProperty] = useState(null);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('atlassi-saved-ids', JSON.stringify(savedIds));
    } catch {
      // storage unavailable
    }
  }, [savedIds]);

  // Load Current User on Mount
  useEffect(() => {
    const token = localStorage.getItem('atlassi-token');
    if (token) {
      auth.me()
        .then((res) => {
          if (res?.data?.user) {
            setCurrentUser(res.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('atlassi-token');
          setCurrentUser(null);
        });
    }
  }, []);

  // Fetch Listings from backend API
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (purpose !== 'ALL') params.purpose = purpose;
      if (city) params.city = city;
      if (propertyType) params.type = propertyType;
      if (sort) params.sort = sort;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minBedrooms) params.minBedrooms = minBedrooms;
      if (titleStatus) params.titleStatus = titleStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await listingsApi.getAll(params);
      setListings(res.data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setError(t('portfolio.loadError'));
    } finally {
      setLoading(false);
    }
  }, [purpose, city, propertyType, sort, minPrice, maxPrice, minBedrooms, titleStatus, searchQuery, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchListings]);


  // Toggle Favorite
  const handleToggleSave = (id) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      showToast({
        type: exists ? 'info' : 'success',
        message: exists ? t('toasts.removedFromSaved') : t('toasts.savedToCollection')
      });
      return next;
    });
  };

  // Filtered Listings View (Accounts for favorites toggle)
  const displayedListings = useMemo(() => {
    if (showFavoritesOnly) {
      return listings.filter((l) => savedIds.includes(l.id));
    }
    return listings;
  }, [listings, showFavoritesOnly, savedIds]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setPurpose('ALL');
    setCity('');
    setPropertyType('');
    setSort('newest');
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms('');
    setTitleStatus('');
    setShowFavoritesOnly(false);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('atlassi-token');
    setCurrentUser(null);
    showToast({ type: 'info', message: t('toasts.signedOut') });
  };

  const handleListingCreated = (newListing) => {
    setListings((prev) => [newListing, ...prev]);
    setSelectedProperty(newListing);
  };


  return (
    <div className="min-h-screen bg-[#f9f8f5] text-[#19221f] flex flex-col font-sans selection:bg-[#e2c1b1]">
      
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation Header with Language Toggle */}
      <Navbar
        currentUser={currentUser}
        savedCount={savedIds.length}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCreateListing={() => {
          if (!currentUser) setShowAuthModal(true);
          else setShowCreateListingModal(true);
        }}
        onOpenCreateRequest={() => {
          if (!currentUser) setShowAuthModal(true);
          else setShowCreateRequestModal(true);
        }}
        onLogout={handleLogout}
        onFilterByPurpose={(p) => {
          setPurpose(p);
          setShowFavoritesOnly(false);
        }}
        onShowFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
        isFavoritesFilterActive={showFavoritesOnly}
      />

      <main id="top" className="flex-1">
        
        {/* Editorial Hero Section */}
        <Hero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCity={city}
          listings={listings}
          onSelectCity={(selected) => {
            setCity(selected);
            setShowFavoritesOnly(false);
          }}
          onFeaturedClick={() => {
            const featured = listings.find((l) => l.isFeatured) || listings[0];
            if (featured) setSelectedProperty(featured);
          }}
        />

        {/* Interactive Filter Toolbar */}
        <FilterBar
          purpose={purpose}
          setPurpose={(p) => {
            setPurpose(p);
            setShowFavoritesOnly(false);
          }}
          city={city}
          setCity={(c) => {
            setCity(c);
            setShowFavoritesOnly(false);
          }}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
          sort={sort}
          setSort={setSort}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          minBedrooms={minBedrooms}
          setMinBedrooms={setMinBedrooms}
          titleStatus={titleStatus}
          setTitleStatus={setTitleStatus}
          onReset={handleResetFilters}
        />

        {/* Discovery & Listings Collection */}
        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          
          {/* Section Heading & Counter */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#bd6b46] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {showFavoritesOnly ? t('portfolio.savedBadge') : t('portfolio.badge')}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#19221f]">
                {showFavoritesOnly
                  ? t('portfolio.savedHomesTitle')
                  : city
                  ? t('portfolio.homesInCity', translateCity(city))
                  : t('portfolio.consideredArchitecture')}
              </h2>
            </div>

            <div className="text-xs text-stone-500 font-medium">
              {t('portfolio.showingCount', displayedListings.length)}
              {showFavoritesOnly && (
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className="ms-3 text-[#bd6b46] hover:underline font-semibold cursor-pointer"
                >
                  {t('portfolio.viewAll')}
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#ded7cb] p-3 animate-pulse">
                  <div className="aspect-[4/3] bg-stone-200 rounded-xl mb-4" />
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-stone-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-stone-200 rounded w-full mb-4" />
                  <div className="h-8 bg-stone-200 rounded-lg w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-xl mx-auto">
              <p className="text-sm text-rose-800 mb-4">{error}</p>
              <button
                onClick={fetchListings}
                className="px-5 py-2.5 bg-[#1b2622] text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-all cursor-pointer"
              >
                {t('portfolio.tryReloading')}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && displayedListings.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#ded7cb] max-w-xl mx-auto shadow-morocco">
              <div className="w-12 h-12 rounded-full bg-[#f5ece6] text-[#bd6b46] flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1b2622] mb-2">
                {t('portfolio.noResidencesTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
                {t('portfolio.noResidencesDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl border border-[#ded7cb] text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  {t('portfolio.clearAllFilters')}
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else setShowCreateRequestModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1b2622] text-white text-xs font-semibold hover:bg-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#bd6b46]" />
                  <span>{t('portfolio.broadcastRequest')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {!loading && !error && displayedListings.length > 0 && (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence>
                {displayedListings.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onOpen={(item) => setSelectedProperty(item)}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </section>

        {/* Confidential Custom Property Request Section */}
        <section id="custom-request" className="bg-[#ede8df] border-t border-[#ded7cb] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#ded7cb] shadow-morocco grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5ece6] border border-[#e8d2c4] text-[#bd6b46] text-xs font-semibold uppercase tracking-wider mb-3">
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'طلب عقاري خاص 100%' : 'Recherche Sur-Mesure Confidentielle'}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#19221f] leading-tight">
                  {isRtl ? 'تبحث عن عقار مخصص في المغرب؟' : 'Vous cherchez un bien d’exception sur-mesure ?'}<br />
                  <span className="italic font-normal text-[#bd6b46]">
                    {isRtl ? 'اطرح طلبك مباشرة لفريق أطلسي' : 'Transmettez votre recherche directement à notre équipe'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-3 max-w-xl leading-relaxed">
                  {isRtl
                    ? 'طلبك لا يُنشر علناً على الموقع. يتم إرسال مواصفاتك بسريّة تامّة إلى لوحة التحكم الخاصة بفريق أطلسي للبحث ومطابقة العقارات المناسبة لك.'
                    : 'Votre demande reste 100% confidentielle et n’est pas publiée publiquement sur le site. Elle est transmise directement à notre console d’administration pour un accompagnement personnalisé par nos conseillers.'}
                </p>
              </div>

              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <button
                  onClick={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else setShowCreateRequestModal(true);
                  }}
                  className="px-6 py-4 rounded-2xl bg-[#1b2622] hover:bg-[#283631] text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#bd6b46]" />
                  <span>{isRtl ? 'إرسال طلب مخصص' : 'Créer ma demande sur-mesure'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Philosophy Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#e7e2d8]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#bd6b46] block mb-2">
              {t('philosophy.badge')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#19221f] leading-tight">
              {t('philosophy.headlineMain')}<br />
              <span className="italic font-normal text-[#bd6b46]">{t('philosophy.headlineSub')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-stone-700">
            <div className="p-6 rounded-2xl bg-white border border-[#ded7cb] shadow-2xs flex flex-col justify-between">
              <div>
                <span className="font-serif text-3xl font-bold text-[#bd6b46] block mb-4">{t('philosophy.p1Number')}</span>
                <h3 className="text-lg font-bold text-[#19221f] mb-2">{t('philosophy.p1Title')}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t('philosophy.p1Desc')}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#ded7cb] shadow-2xs flex flex-col justify-between">
              <div>
                <span className="font-serif text-3xl font-bold text-[#bd6b46] block mb-4">{t('philosophy.p2Number')}</span>
                <h3 className="text-lg font-bold text-[#19221f] mb-2">{t('philosophy.p2Title')}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t('philosophy.p2Desc')}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#ded7cb] shadow-2xs flex flex-col justify-between">
              <div>
                <span className="font-serif text-3xl font-bold text-[#bd6b46] block mb-4">{t('philosophy.p3Number')}</span>
                <h3 className="text-lg font-bold text-[#19221f] mb-2">{t('philosophy.p3Title')}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t('philosophy.p3Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#1b2622] text-[#e8eee5] py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-white tracking-tight">atlassi</span>
            <span className="w-2 h-2 rounded-full bg-[#bd6b46]" />
            <span className="text-xs text-stone-400 ms-4">
              {t('footer.copyright')}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-300 flex-wrap justify-center">
            <button onClick={() => { setCity('Marrakech'); setPurpose('ALL'); }} className="hover:text-white transition-colors cursor-pointer">{translateCity('Marrakech')}</button>
            <button onClick={() => { setCity('Tangier'); setPurpose('ALL'); }} className="hover:text-white transition-colors cursor-pointer">{translateCity('Tangier')}</button>
            <button onClick={() => { setCity('Casablanca'); setPurpose('ALL'); }} className="hover:text-white transition-colors cursor-pointer">{translateCity('Casablanca')}</button>
            <button onClick={() => { setCity('Fes'); setPurpose('ALL'); }} className="hover:text-white transition-colors cursor-pointer">{translateCity('Fes')}</button>
            <a href="/admin" className="hover:text-white transition-colors cursor-pointer text-[#bd6b46] font-medium">Admin</a>
            <a href="#top" className="text-[#bd6b46] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
              <span>{t('footer.top')}</span> <ArrowUpRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-[-90deg]' : ''}`} />
            </a>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            isSaved={savedIds.includes(selectedProperty.id)}
            onToggleSave={handleToggleSave}
            onOpenOffer={(prop) => {
              setSelectedProperty(null);
              setOfferProperty(prop);
            }}
            currentUser={currentUser}
            onShowToast={showToast}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {offerProperty && (
          <OfferModal
            property={offerProperty}
            onClose={() => setOfferProperty(null)}
            currentUser={currentUser}
            onShowToast={showToast}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateListingModal && (
          <CreateListingModal
            onClose={() => setShowCreateListingModal(false)}
            currentUser={currentUser}
            onListingCreated={handleListingCreated}
            onShowToast={showToast}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateRequestModal && (
          <CreateRequestModal
            onClose={() => setShowCreateRequestModal(false)}
            currentUser={currentUser}
            onShowToast={showToast}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={(user) => setCurrentUser(user)}
            onShowToast={showToast}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;

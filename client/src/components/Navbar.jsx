import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, User, LogOut, FileText, ChevronDown, Menu, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { LanguageToggle } from './LanguageToggle';

export function Navbar({
  currentUser,
  savedCount,
  onOpenAuth,
  onOpenCreateListing,
  onOpenCreateRequest,
  onLogout,
  onFilterByPurpose,
  onShowFavoritesOnly,
  isFavoritesFilterActive
}) {
  const { t, isRtl } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f9f8f5]/92 backdrop-blur-md border-b border-[#e5e0d8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-1.5 group select-none text-decoration-none flex-shrink-0">
          <span className="text-2xl font-bold tracking-tighter text-[#1b2622] font-serif transition-colors group-hover:text-[#bd6b46]">
            atlassi
          </span>
          <span className="w-2 h-2 rounded-full bg-[#bd6b46] inline-block transition-transform duration-300 group-hover:scale-125" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium tracking-wide text-[#59645f]">
          <button
            onClick={() => { onFilterByPurpose('ALL'); scrollTo('discover'); }}
            className="hover:text-[#1b2622] transition-colors cursor-pointer"
          >
            {t('nav.allHomes')}
          </button>
          <button
            onClick={() => { onFilterByPurpose('SALE'); scrollTo('discover'); }}
            className="hover:text-[#1b2622] transition-colors cursor-pointer"
          >
            {t('nav.buy')}
          </button>
          <button
            onClick={() => { onFilterByPurpose('RENT'); scrollTo('discover'); }}
            className="hover:text-[#1b2622] transition-colors cursor-pointer"
          >
            {t('nav.rent')}
          </button>
          <button
            onClick={onOpenCreateRequest}
            className="hover:text-[#bd6b46] transition-colors cursor-pointer font-semibold"
          >
            {isRtl ? 'طلب مخصص' : 'Demande sur-mesure'}
          </button>
          <button
            onClick={() => scrollTo('about')}
            className="hover:text-[#1b2622] transition-colors cursor-pointer"
          >
            {t('nav.philosophy')}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Beautiful Language Toggle (Arabic / French) */}
          <LanguageToggle className="hidden sm:inline-flex" />

          {/* Saved Homes Button */}
          <button
            onClick={onShowFavoritesOnly}
            className={`relative p-2.5 rounded-full border transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              isFavoritesFilterActive
                ? 'bg-[#1b2622] text-[#f9f8f5] border-[#1b2622]'
                : 'bg-white/85 text-[#30403a] border-[#e5e0d8] hover:border-[#1b2622]'
            }`}
            aria-label={t('nav.savedHomes')}
            title={t('nav.savedHomes')}
          >
            <Heart className={`w-4 h-4 ${savedCount > 0 ? 'fill-[#bd6b46] text-[#bd6b46]' : ''}`} />
            {savedCount > 0 && (
              <span className="text-[11px] font-mono px-1">
                {savedCount}
              </span>
            )}
          </button>

          {/* Post Property CTA */}
          <button
            onClick={onOpenCreateListing}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide bg-white text-[#1b2622] border border-[#d6cfc4] hover:border-[#1b2622] hover:bg-[#f2efe9] shadow-2xs transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#bd6b46]" />
            <span>{t('nav.postProperty')}</span>
          </button>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b2622] text-[#f9f8f5] text-xs font-medium hover:bg-[#283631] transition-colors shadow-2xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#bd6b46] text-white flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-300" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.16 }}
                    className={`absolute mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e5e0d8] py-2 z-50 text-stone-800 ${
                      isRtl ? 'left-0' : 'right-0'
                    }`}
                  >
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      {currentUser.phoneVerified && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1 font-medium">
                          <CheckCircle className="w-3 h-3" /> {t('nav.phoneVerified')}
                        </div>
                      )}
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenCreateListing();
                        }}
                        className="w-full text-start px-4 py-2 hover:bg-[#f6f4ee] flex items-center gap-2.5 text-stone-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#bd6b46]" /> {t('nav.postNewProperty')}
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          scrollTo('requests');
                        }}
                        className="w-full text-start px-4 py-2 hover:bg-[#f6f4ee] flex items-center gap-2.5 text-stone-700 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" /> {t('nav.buyerRenterRequests')}
                      </button>
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-start px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> {t('nav.signOut')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold bg-[#1b2622] text-[#f9f8f5] hover:bg-[#283631] transition-all shadow-2xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('nav.signIn')}</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-stone-700 hover:bg-[#eeebe3] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-[#e5e0d8] bg-[#f9f8f5] px-6 py-5 flex flex-col gap-4 text-sm font-medium"
          >
            {/* Mobile Language Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e0d8]">
              <span className="text-xs font-semibold text-stone-500">{t('nav.language')}</span>
              <LanguageToggle />
            </div>

            <button
              onClick={() => { onFilterByPurpose('ALL'); scrollTo('discover'); }}
              className="text-start py-1 text-stone-700 hover:text-[#bd6b46] cursor-pointer"
            >
              {t('nav.allMoroccanHomes')}
            </button>
            <button
              onClick={() => { onFilterByPurpose('SALE'); scrollTo('discover'); }}
              className="text-start py-1 text-stone-700 hover:text-[#bd6b46] cursor-pointer"
            >
              {t('nav.propertiesForSale')}
            </button>
            <button
              onClick={() => { onFilterByPurpose('RENT'); scrollTo('discover'); }}
              className="text-start py-1 text-stone-700 hover:text-[#bd6b46] cursor-pointer"
            >
              {t('nav.propertiesForRent')}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateRequest();
              }}
              className="text-start py-1 text-stone-700 hover:text-[#bd6b46] cursor-pointer font-semibold"
            >
              {isRtl ? 'طلب مخصص' : 'Demande sur-mesure'}
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="text-start py-1 text-stone-700 hover:text-[#bd6b46] cursor-pointer"
            >
              {t('nav.philosophy')}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateListing();
              }}
              className="text-start py-2 text-[#bd6b46] font-semibold flex items-center gap-2 border-t border-[#e5e0d8] pt-3 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {t('nav.postProperty')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;

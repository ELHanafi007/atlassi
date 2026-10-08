import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUpRight, AlertCircle, User, Mail, Lock, Phone } from 'lucide-react';
import { auth } from '../lib/api';
import { useLanguage } from '../lib/i18n';

export function AuthModal({ onClose, onAuthSuccess, onShowToast }) {
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await auth.login({ email, password });
        localStorage.setItem('atlassi-token', result.data.token);
        onAuthSuccess(result.data.user);
        onShowToast({ type: 'success', message: t('toasts.welcomeBackUser', result.data.user.name) });
        onClose();
      } else {
        if (password !== passwordConfirmation) {
          throw new Error(isRtl ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.');
        }
        const result = await auth.register({
          name,
          email,
          phone,
          password,
          passwordConfirmation
        });
        localStorage.setItem('atlassi-token', result.data.token);
        onAuthSuccess(result.data.user);
        onShowToast({ type: 'success', message: t('toasts.accountCreatedUser', result.data.user.name) });
        onClose();
      }
    } catch (err) {
      setError(err.message || (isRtl ? 'فشل التحقق من الهوية. يرجى التأكد من البيانات.' : "Échec de l'authentification. Veuillez vérifier vos identifiants."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#f9f8f5] rounded-3xl shadow-2xl border border-[#ded7cb] p-6 sm:p-8 overflow-hidden my-auto"
        role="dialog"
      >
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer`}
          aria-label={t('modal.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex bg-[#ede8df] p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#1b2622] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('auth.signInTab')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#1b2622] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('auth.registerTab')}
          </button>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-serif font-bold text-[#1b2622]">
            {mode === 'login' ? t('auth.welcomeBackTitle') : t('auth.joinTitle')}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {mode === 'login' ? t('auth.signInDesc') : t('auth.registerDesc')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('auth.fullNameLabel')}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className={`w-full bg-white border border-[#ded7cb] rounded-xl ${
                      isRtl ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
                    } py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]`}
                  />
                  <User className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('auth.phoneLabel')}</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    className={`w-full bg-white border border-[#ded7cb] rounded-xl ${
                      isRtl ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
                    } py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]`}
                  />
                  <Phone className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">{t('auth.emailLabel')}</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className={`w-full bg-white border border-[#ded7cb] rounded-xl ${
                  isRtl ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
                } py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]`}
              />
              <Mail className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-white border border-[#ded7cb] rounded-xl ${
                  isRtl ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
                } py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]`}
              />
              <Lock className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('auth.confirmPasswordLabel')}</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-white border border-[#ded7cb] rounded-xl ${
                    isRtl ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
                  } py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]`}
                />
                <Lock className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-xl bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            <span>{loading ? t('auth.processing') : mode === 'login' ? t('auth.signInSubmit') : t('auth.registerSubmit')}</span>
            <ArrowUpRight className={`w-4 h-4 text-[#bd6b46] ${isRtl ? 'rotate-[-90deg]' : ''}`} />
          </button>
        </form>


      </motion.div>
    </div>
  );
}

export default AuthModal;

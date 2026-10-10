import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Trash2, ArrowUpRight, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { listingsApi } from '../lib/api';
import { useLanguage } from '../lib/i18n';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function CreateListingModal({ onClose, currentUser, onListingCreated, onShowToast, onOpenAuth }) {
  const { t, translateCity, translateType, translateCondition, translateAmenity, isRtl } = useLanguage();

  const [formData, setFormData] = useState({
    title: '',
    purpose: 'SALE',
    type: 'VILLA',
    city: 'Laayoune',
    neighborhood: '',
    price: '',
    bedrooms: '3',
    bathrooms: '2',
    surface: '220',
    condition: 'Excellent',
    furnished: false,
    description: '',
    amenities: ['Terrace', 'Private parking'],
    instagramVideoUrl: '',
    titleStatus: 'titled'
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const moroccanCities = ['Laayoune'];
  const moroccanTypes = ['Villa', 'Riad', 'Apartment', 'House', 'Studio', 'Land'];
  const availableConditions = ['New build', 'Excellent', 'Renovated', 'Restored heritage'];
  const availableAmenities = [
    'Private pool', 'Terrace', 'Sea view', 'Historic zellige', 
    'Central patio', 'Atlas views', 'Private parking', 'Fireplace', 
    'Elevator', 'Air conditioning', 'Furnished', 'Hammam potential'
  ];

  const toggleAmenity = (item) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== item)
          : [...prev.amenities, item]
      };
    });
  };

  const isImageFile = (file) =>
    (file.type || '').startsWith('image/') ||
    /\.(jpe?g|png|webp|heic|heif|avif|bmp)$/i.test(file.name || '');

  const processImageFile = (file) =>
    new Promise((resolve) => {
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return resolve(file);
      }
      if (!isImageFile(file)) {
        return resolve(file);
      }
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const name = `${(file.name || 'photo').replace(/\.[^.]+$/, '')}.jpg`;
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploadProgress(isRtl ? 'جارٍ تحضير الصور...' : 'Préparation des photos...');
    try {
      const processed = await Promise.all(files.map(processImageFile));
      const usable = processed.filter(Boolean);
      const skipped = processed.length - usable.length;
      if (usable.length) setImages((prev) => [...prev, ...usable]);
      if (skipped) {
        setError(
          isRtl
            ? `${skipped} صورة تعذّر معالجتها (صيغة غير مدعومة، مثل HEIC). حوّلها إلى JPEG ثم أعد المحاولة.`
            : `${skipped} photo(s) n’ont pas pu être traitées (format non pris en charge, ex. HEIC). Convertissez-les en JPEG puis réessayez.`
        );
      }
    } finally {
      setUploadProgress('');
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const token = localStorage.getItem('atlassi-token');
    const data = new FormData();
    data.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || (isRtl ? 'فشل تحميل الصورة.' : 'Erreur lors du téléversement de la photo.'));
    }

    const json = await res.json();
    return json.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!formData.title.trim() || !formData.price || !formData.description.trim()) {
      setError(isRtl ? 'يرجى ملء العنوان، السعر والوصف.' : 'Veuillez renseigner le titre, le prix et la description.');
      return;
    }

    if (images.length === 0) {
      setError(isRtl ? 'يرجى إضافة صورة واحدة على الأقل.' : 'Veuillez ajouter au moins une photo du bien.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        setUploading(true);
        setUploadProgress(
          isRtl
            ? `جارٍ تحميل الصورة ${i + 1}/${images.length}...`
            : `Téléversement photo ${i + 1}/${images.length}...`
        );
        const url = await uploadFile(images[i]);
        imageUrls.push(url);
      }
      setUploadProgress(isRtl ? 'جارٍ نشر العقار...' : 'Publication de l’annonce...');

      const payload = {
        ...formData,
        images: imageUrls,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        surface: formData.surface ? Number(formData.surface) : null
      };

      const result = await listingsApi.create(payload);
      
      const isAdmin = currentUser?.role === 'ADMIN';
      if (isAdmin) {
        onShowToast({ type: 'success', message: t('toasts.propertyPublished') });
        if (onListingCreated) onListingCreated(result.data);
        onClose();
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || (isRtl ? 'فشل نشر العقار.' : 'Échec de la publication de la propriété.'));
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/65 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.24 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#f9f8f5] rounded-3xl shadow-2xl border border-[#ded7cb] p-6 sm:p-8 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
      >
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors z-10 cursor-pointer`}
          aria-label={t('modal.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-10 text-center flex flex-col items-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b2622] mb-3">
              {isRtl ? 'تم استلام عرض العقار بنجاح' : 'Annonce reçue avec succès !'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mb-4 leading-relaxed">
              {isRtl
                ? 'شكراً لك! تم إرسال عقارك لمراجعة فريق أطلسي. سيتم النشر باسم أطلسي بعد الموافقة عليه.'
                : 'Merci ! Votre bien a été soumis à notre équipe. Après vérification par l\'équipe Atlassi, il sera publié sous le nom d\'Atlassi.'}
            </p>
            <p className="text-xs text-[#bd6b46] font-semibold mb-8">
              {isRtl
                ? 'سيتواصل معك فريق أطلسي قريباً لمتابعة الطلب.'
                : 'L\'équipe Atlassi vous contactera très prochainement.'}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {isRtl ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1">
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-wider text-[#bd6b46] block mb-1">
              {t('createListing.kicker')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b2622]">
              {t('createListing.title')}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {t('createListing.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            
            {/* Title */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('createListing.titleLabel')}
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('createListing.titlePlaceholder')}
                className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
              />
            </div>

            {/* Purpose & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.purposeLabel')}</label>
                <div className="flex gap-1 bg-[#ede8df] p-1 rounded-xl">
                  {['SALE', 'RENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, purpose: p })}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        formData.purpose === p ? 'bg-white text-[#1b2622] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {p === 'SALE' ? t('createListing.forSale') : t('createListing.forRent')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.typeLabel')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer"
                >
                  {moroccanTypes.map((typeName) => (
                    <option key={typeName} value={typeName.toUpperCase()}>{translateType(typeName)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City & Neighborhood */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.cityLabel')}</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer"
                >
                  {moroccanCities.map((cityName) => (
                    <option key={cityName} value={cityName}>{translateCity(cityName)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.neighborhoodLabel')}</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder={t('createListing.neighborhoodPlaceholder')}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
            </div>

            {/* Price & Surface */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {formData.purpose === 'RENT' ? t('createListing.priceRentLabel') : t('createListing.priceSaleLabel')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 3500000"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 font-mono font-bold text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.surfaceLabel')}</label>
                <input
                  type="number"
                  value={formData.surface}
                  onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                  placeholder="e.g. 240"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
            </div>

            {/* Beds, Baths, Condition */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.bedroomsLabel')}</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.bathroomsLabel')}</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">{t('createListing.conditionLabel')}</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-2 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] cursor-pointer"
                >
                  {availableConditions.map((cond) => (
                    <option key={cond} value={cond}>{translateCondition(cond)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title Status (Statut Foncier) */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('createListing.titleStatusLabel')}
              </label>
              <div className="flex gap-2 bg-[#ede8df] p-1 rounded-xl">
                {[
                  { val: 'titled', labelKey: 'createListing.titled' },
                  { val: 'untitled', labelKey: 'createListing.untitled' }
                ].map(({ val, labelKey }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, titleStatus: val })}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      formData.titleStatus === val ? 'bg-white text-[#1b2622] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('createListing.descriptionLabel')}</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('createListing.descriptionPlaceholder')}
                className="w-full bg-white border border-[#ded7cb] rounded-xl p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] resize-none"
              />
            </div>

            {/* Amenities Checklist */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">{t('createListing.amenitiesLabel')}</label>
              <div className="flex flex-wrap gap-1.5">
                {availableAmenities.map((amenity) => {
                  const active = formData.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        active
                          ? 'bg-[#1b2622] text-white border-[#1b2622]'
                          : 'bg-white border-[#ded7cb] text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-[#bd6b46]" />}
                      <span>{translateAmenity(amenity)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photos Section */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">
                {t('createListing.photosLabel', images.length)}
              </label>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#1b2622] hover:bg-[#2c3a35] text-white text-xs font-semibold rounded-xl transition-all shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{isRtl ? 'اختيار الصور' : 'Choisir des photos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-stone-500">
                  {images.length > 0
                    ? (isRtl ? `${images.length} صورة محددة` : `${images.length} photo(s) sélectionnée(s)`)
                    : (isRtl ? 'لم يتم اختيار أي صورة' : 'Aucune photo choisie')}
                </span>
              </div>

              {uploadProgress && (
                <p className="mt-2 text-[11px] text-[#bd6b46] font-medium">{uploadProgress}</p>
              )}

              {/* Selected Images Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#ded7cb] aspect-square bg-stone-100">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Aperçu ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instagram Reel Video Tour (Admin Only) */}
            {currentUser?.role === 'ADMIN' && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#E1306C]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  {t('createListing.instagramReelLabel')}
                </label>
                <input
                  type="url"
                  value={formData.instagramVideoUrl}
                  onChange={(e) => setFormData({ ...formData, instagramVideoUrl: e.target.value })}
                  placeholder={t('createListing.instagramReelPlaceholder')}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#E1306C]"
                />
                <p className="mt-1 text-[10px] text-stone-400">
                  {isRtl
                    ? 'سيتم عرض زر مباشر على صفحة العقار يوجّه العميل إلى الريل في Instagram'
                    : 'Un bouton dédié sur la fiche du bien redirigera le client directement vers le Reel Instagram.'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-4 w-full py-3.5 rounded-xl bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <span>{loading || uploading ? t('createListing.publishingBtn') : t('createListing.submitBtn')}</span>
              <ArrowUpRight className={`w-4 h-4 text-[#bd6b46] ${isRtl ? 'rotate-[-90deg]' : ''}`} />
            </button>

          </form>
        </div>
        )}
      </motion.div>
    </div>
  );
}

export default CreateListingModal;

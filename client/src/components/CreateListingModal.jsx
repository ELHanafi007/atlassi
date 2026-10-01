import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, ArrowUpRight, AlertCircle, Building2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { listingsApi } from '../lib/api';

export function CreateListingModal({ onClose, currentUser, onListingCreated, onShowToast, onOpenAuth }) {
  const [formData, setFormData] = useState({
    title: '',
    purpose: 'SALE',
    type: 'VILLA',
    city: 'Marrakech',
    neighborhood: '',
    price: '',
    bedrooms: '3',
    bathrooms: '2',
    surface: '220',
    condition: 'Excellent',
    furnished: false,
    description: '',
    amenities: ['Terrace', 'Private parking'],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1200'
    ]
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const moroccanCities = ['Marrakech', 'Tangier', 'Casablanca', 'Fes', 'Rabat', 'Agadir', 'Essaouira', 'Chefchaouen'];
  const moroccanTypes = ['Villa', 'Riad', 'Apartment', 'House', 'Studio', 'Land'];
  const availableAmenities = [
    'Private pool', 'Terrace', 'Sea view', 'Historic zellige', 
    'Central patio', 'Atlas views', 'Private parking', 'Fireplace', 
    'Elevator', 'Air conditioning', 'Furnished', 'Hammam potential'
  ];

  const presetPhotos = [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1200',
    'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=85&w=1200',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=85&w=1200',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=85&w=1200'
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

  const addImage = (url) => {
    const targetUrl = url || imageUrlInput.trim();
    if (!targetUrl) return;
    if (formData.images.includes(targetUrl)) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, targetUrl]
    }));
    setImageUrlInput('');
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!formData.title.trim() || !formData.price || !formData.description.trim()) {
      setError('Please fill in title, price, and description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        surface: formData.surface ? Number(formData.surface) : null
      };

      const result = await listingsApi.create(payload);
      onShowToast({ type: 'success', message: 'Property successfully published to Atlassi!' });
      onListingCreated(result.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish property.');
    } finally {
      setLoading(false);
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
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1">
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-wider text-[#bd6b46] uppercase block mb-1">
              List on Atlassi
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1b2622]">
              Publish a Residence
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Showcase your home to vetted buyers and tenants seeking authentic Moroccan living.
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
                Property Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Restored Courtyard Riad in the Medina"
                className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
              />
            </div>

            {/* Purpose & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Purpose *</label>
                <div className="flex gap-1 bg-[#ede8df] p-1 rounded-xl">
                  {['SALE', 'RENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, purpose: p })}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        formData.purpose === p ? 'bg-white text-[#1b2622] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {p === 'SALE' ? 'For Sale' : 'For Rent'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Property Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                >
                  {moroccanTypes.map((t) => (
                    <option key={t} value={t.toUpperCase()}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City & Neighborhood */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                >
                  {moroccanCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Neighborhood</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="e.g. Palmeraie, Gauthier, Anfa"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3.5 py-2.5 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
            </div>

            {/* Price & Surface */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Price in MAD {formData.purpose === 'RENT' ? '(per month)' : ''} *
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
                <label className="block font-semibold text-stone-700 mb-1">Surface (m²)</label>
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
                <label className="block font-semibold text-stone-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-2 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                >
                  <option value="New build">New build</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Renovated">Renovated</option>
                  <option value="Restored heritage">Restored heritage</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Description *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the architectural nuances, light quality, finishes, and neighbourhood perks..."
                className="w-full bg-white border border-[#ded7cb] rounded-xl p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] resize-none"
              />
            </div>

            {/* Amenities Checklist */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">Amenities</label>
              <div className="flex flex-wrap gap-1.5">
                {availableAmenities.map((amenity) => {
                  const active = formData.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1 ${
                        active
                          ? 'bg-[#1b2622] text-white border-[#1b2622]'
                          : 'bg-white border-[#ded7cb] text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-[#bd6b46]" />}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photos Section */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">
                Photography ({formData.images.length})
              </label>

              {/* Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-stone-300 group">
                    <img src={url} alt="listing" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add image input */}
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste high-res image URL (e.g. Unsplash or CDN)..."
                  className="flex-1 bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
                <button
                  type="button"
                  onClick={() => addImage()}
                  className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Presets */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                <span>Or add curated Moroccan sample photo:</span>
                {presetPhotos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addImage(url)}
                    className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-[10px] text-stone-700 font-mono"
                  >
                    Photo #{i + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{loading ? 'Publishing listing…' : 'Publish Property to Atlassi'}</span>
              <ArrowUpRight className="w-4 h-4 text-[#bd6b46]" />
            </button>

          </form>
        </div>
      </motion.div>
    </div>
  );
}

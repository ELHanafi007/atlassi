import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUpRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { requestsApi } from '../lib/api';

export function CreateRequestModal({ onClose, currentUser, onRequestCreated, onShowToast, onOpenAuth }) {
  const [formData, setFormData] = useState({
    purpose: 'BUY',
    type: 'VILLA',
    city: 'Marrakech',
    neighborhood: '',
    maxBudget: '',
    minBedrooms: '3',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const moroccanCities = ['Marrakech', 'Tangier', 'Casablanca', 'Fes', 'Rabat', 'Agadir', 'Essaouira', 'Chefchaouen'];
  const moroccanTypes = ['Villa', 'Riad', 'Apartment', 'House', 'Studio', 'Land'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a short description of what you are looking for.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        purpose: formData.purpose === 'BUY' ? 'SALE' : 'RENT',
        type: formData.type,
        city: formData.city,
        neighborhood: formData.neighborhood || null,
        maxBudget: formData.maxBudget ? Number(formData.maxBudget) : null,
        minBedrooms: formData.minBedrooms ? Number(formData.minBedrooms) : null,
        description: formData.description.trim()
      };

      const result = await requestsApi.create(payload);
      setSuccess(true);
      onShowToast({ type: 'success', message: 'Your property request has been posted!' });
      if (onRequestCreated) onRequestCreated(result.data);
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
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
        className="relative w-full max-w-lg bg-[#f9f8f5] rounded-3xl shadow-2xl border border-[#ded7cb] p-6 sm:p-8 overflow-hidden my-auto"
        role="dialog"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#1b2622] mb-2">
              Request Published
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-6 leading-relaxed">
              Moroccan homeowners matching your criteria in <strong>{formData.city}</strong> will be alerted to contact you directly.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#1b2622] text-white text-xs font-semibold hover:bg-stone-800 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#bd6b46] uppercase block mb-1">
                Broadcast to Owners
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1b2622]">
                Post a Property Request
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Tell verified Moroccan property owners exactly what you are looking to buy or rent.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Purpose & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Looking to *</label>
                <div className="flex gap-1 bg-[#ede8df] p-1 rounded-xl">
                  {['BUY', 'RENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, purpose: p })}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        formData.purpose === p ? 'bg-white text-[#1b2622] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {p === 'BUY' ? 'Buy' : 'Rent'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
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
                <label className="block font-semibold text-stone-700 mb-1">Target City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                >
                  {moroccanCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Preferred Neighborhood</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="e.g. Medina, Malabata, Racine"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
            </div>

            {/* Budget & Bedrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Max Budget (MAD)
                </label>
                <input
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                  placeholder="e.g. 15000 / mo"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 font-mono text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Min Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.minBedrooms}
                  onChange={(e) => setFormData({ ...formData, minBedrooms: e.target.value })}
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-3 py-2 text-xs text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Your Specific Search Criteria *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Seeking high-ceiling apartment with balcony facing the bay, parking space essential, move-in within 6 weeks..."
                className="w-full bg-white border border-[#ded7cb] rounded-xl p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-xl bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{loading ? 'Broadcasting request…' : 'Broadcast Request to Owners'}</span>
              <ArrowUpRight className="w-4 h-4 text-[#bd6b46]" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

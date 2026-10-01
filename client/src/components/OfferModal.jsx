import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, ArrowUpRight, AlertCircle, Shield } from 'lucide-react';
import { offersApi } from '../lib/api';

export function OfferModal({ property, onClose, currentUser, onShowToast, onOpenAuth }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [conditions, setConditions] = useState('');
  const [contactPreference, setContactPreference] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formattedListingPrice = `${new Intl.NumberFormat('en-US').format(property.price)} ${
    property.priceLabel || (property.purpose === 'RENT' ? 'MAD / mo' : 'MAD')
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please specify a valid numeric offer amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await offersApi.create(property.id, {
        amount: numAmount,
        message,
        conditions,
        contactPreference
      });
      setSuccess(true);
      onShowToast({ type: 'success', message: 'Offer submitted! The owner will review your proposal.' });
    } catch (err) {
      setError(err.message || 'Failed to submit offer.');
    } finally {
      setLoading(false);
    }
  };

  const diffPercent = amount ? Math.round(((Number(amount) - property.price) / property.price) * 100) : null;

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
          className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
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
              Offer Transmitted
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-6 leading-relaxed">
              Your formal offer of <strong>{new Intl.NumberFormat('en-US').format(amount)} MAD</strong> has been registered and forwarded directly to the listing owner.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#1b2622] text-white text-xs font-semibold hover:bg-stone-800 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#bd6b46] uppercase block mb-1">
                Direct Negotiation
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1b2622]">
                Make an Offer
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {property.title} · Listed at <strong className="text-stone-700">{formattedListingPrice}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Offer Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Your Offer (MAD) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500000"
                  className="w-full bg-white border border-[#ded7cb] rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-[#1b2622] focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
                />
                {diffPercent !== null && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold ${
                    diffPercent < 0 ? 'text-emerald-600' : diffPercent > 0 ? 'text-amber-600' : 'text-stone-500'
                  }`}>
                    {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`} of asking
                  </span>
                )}
              </div>
            </div>

            {/* Conditions / Contingencies */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Proposed Conditions (Optional)
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Subject to structural inspection, cash purchase, etc."
                className="w-full bg-white border border-[#ded7cb] rounded-xl px-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46]"
              />
            </div>

            {/* Message to Owner */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Note for the Owner
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain the timing or flexibility of your move..."
                rows={3}
                className="w-full bg-white border border-[#ded7cb] rounded-xl p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#bd6b46] resize-none"
              />
            </div>

            {/* Contact Preference */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Preferred Response Channel
              </label>
              <div className="flex gap-2 text-xs">
                {['phone', 'email', 'whatsapp'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setContactPreference(method)}
                    className={`flex-1 py-1.5 rounded-lg border capitalize font-medium transition-all ${
                      contactPreference === method
                        ? 'bg-[#1b2622] text-white border-[#1b2622]'
                        : 'bg-white border-[#ded7cb] text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-[#1b2622] hover:bg-[#2a3832] text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{loading ? 'Submitting offer…' : 'Submit formal offer'}</span>
              <ArrowUpRight className="w-4 h-4 text-[#bd6b46]" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <Shield className="w-3.5 h-3.5 text-stone-400" />
              <span>Protected through Atlassi’s verified buyer protocol</span>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

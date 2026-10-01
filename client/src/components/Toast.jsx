import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-50 max-w-md bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-4 py-3.5 rounded-xl shadow-2xl border border-stone-800 dark:border-stone-200 flex items-center gap-3"
        role="status"
        aria-live="polite"
      >
        {icons[toast.type || 'info']}
        <p className="text-xs md:text-sm font-medium leading-snug flex-1 pr-2">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-200 dark:text-stone-500 dark:hover:text-stone-800 transition-colors p-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

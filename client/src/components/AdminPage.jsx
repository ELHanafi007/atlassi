import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ClipboardList,
  MessageSquareQuote,
  Mail,
  Users,
  Check,
  X,
  Star,
  Phone,
  Copy,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox,
  UserCheck,
  AlertCircle,
  Plus,
  Upload,
  ImagePlus,
  Video,
  Trash2,
  FilePlus2
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { LanguageToggle } from './LanguageToggle';
import { resolveMediaUrl } from '../lib/mediaUrl';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;

/* ─── Helpers ─────────────────────────────────────────── */
const fmt = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fr-MA').format(n) + ' MAD';

const relDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return `Il y a ${diff} j`;
};

/* ─── Editorial Status Badge ─────────────────────────────────── */
const Badge = ({ label, variant = 'neutral', icon: Icon }) => {
  const variants = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    red: 'bg-rose-50 text-rose-800 border-rose-200/80',
    amber: 'bg-amber-50 text-amber-900 border-amber-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-900 border-purple-200/80',
    terracotta: 'bg-[#f5ece6] text-[#bd6b46] border-[#e8d2c4]',
    neutral: 'bg-[#f0ede6] text-[#55605b] border-[#ded7cb]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border transition-colors ${
        variants[variant] || variants.neutral
      }`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {label}
    </span>
  );
};

const statusBadge = (status) => {
  const map = {
    PUBLISHED: ['Publié', 'green', CheckCircle2],
    PENDING: ['En attente', 'amber', RefreshCw],
    UNPUBLISHED: ['Retiré', 'red', X],
    SOLD: ['Vendu', 'purple', CheckCircle2],
    ACTIVE: ['Actif', 'green', Sparkles],
    CLOSED: ['Fermé', 'red', X],
    ACCEPTED: ['Accepté', 'green', CheckCircle2],
    REJECTED: ['Refusé', 'red', X],
    READ: ['Lu', 'blue', CheckCircle2],
    UNREAD: ['Non lu', 'amber', AlertCircle],
  };
  const [label, variant, Icon] = map[status] || [status, 'neutral', null];
  return <Badge label={label} variant={variant} icon={Icon} />;
};

/* ─── Confidential Contact Pill ───────────────────────── */
const ContactPill = ({ icon: Icon, value, href, label }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = (e) => {
    if (!href) {
      e.preventDefault();
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    }
  };

  return (
    <a
      href={href || '#'}
      onClick={handleCopy}
      title={label || value}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : 'bg-white/80 hover:bg-white text-[#19221f] border border-[#e5e0d8] hover:border-[#bd6b46] shadow-2xs'
      }`}
    >
      {Icon && <Icon className={`w-3.5 h-3.5 ${copied ? 'text-emerald-600' : 'text-[#bd6b46]'}`} />}
      <span>{copied ? 'Copié !' : value}</span>
      {!href && <Copy className="w-3 h-3 text-[#7d8882] opacity-60 ml-0.5" />}
    </a>
  );
};

/* ─── Confidential Owner/Requester Block ─────────────────────── */
const ContactBlock = ({ person, label = 'CONTACT CONFIDENTIEL' }) => {
  if (!person) return null;
  return (
    <div className="bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl p-3.5 mt-3 shadow-2xs">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#bd6b46] tracking-wider uppercase mb-2">
        <Lock className="w-3 h-3" />
        <span>🔒 {label}</span>
      </div>
      <div className="font-semibold text-sm text-[#19221f] mb-2">{person.name}</div>
      <div className="flex flex-wrap gap-2">
        <ContactPill icon={Mail} value={person.email} href={`mailto:${person.email}`} label="Envoyer un e-mail" />
        <ContactPill icon={Phone} value={person.phone} href={`tel:${person.phone}`} label="Appeler" />
      </div>
    </div>
  );
};

/* ─── Stat Card Component ────────────────────────────────────── */
const StatCard = ({ label, value, sub, accentColor, icon: Icon }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-morocco flex flex-col justify-between transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-bold tracking-widest text-[#7d8882] uppercase">{label}</span>
      <div className={`p-2 rounded-xl ${accentColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <div className="text-3xl font-bold font-serif text-[#19221f] tabular-nums tracking-tight leading-none mb-1">
        {value != null ? value : '—'}
      </div>
      {sub && <div className="text-xs text-[#55605b] font-medium">{sub}</div>}
    </div>
  </motion.div>
);

/* ─── Section Header ───────────────────────────────────────── */
const SectionTitle = ({ children, count, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div className="flex items-baseline gap-3">
      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#19221f] tracking-tight">{children}</h2>
      {count != null && (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f0ede6] text-[#55605b] border border-[#ded7cb]">
          {count} entrée{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
    {action}
  </div>
);

/* ─── Action Button ────────────────────────────────────────── */
const Btn = ({ children, onClick, danger, small, disabled, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all cursor-pointer ${
      small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
    } ${
      danger
        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs'
        : 'bg-[#19221f] hover:bg-[#2c3a35] text-[#f9f8f5] shadow-xs'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {Icon && <Icon className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
    {children}
  </button>
);

/* ─── Image Thumbnail ──────────────────────────────────────── */
const Thumb = ({ images, size = 64 }) => {
  const url = images?.[0]?.url;
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl flex-shrink-0 bg-[#f0ede6] overflow-hidden border border-[#e5e0d8] relative shadow-2xs"
    >
      {url ? (
        <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#7d8882]">
          <Building2 className="w-6 h-6 stroke-1" />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB: LISTINGS
══════════════════════════════════════════════════════════════ */
function ListingsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/listings`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setData(j.data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await fetch(`${API}/admin/listings/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  };

  const toggleFeatured = async (id) => {
    await fetch(`${API}/admin/listings/${id}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const statuses = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'PUBLISHED', label: 'Publiées' },
    { id: 'PENDING', label: 'En attente' },
    { id: 'UNPUBLISHED', label: 'Retirées' },
  ];

  const filtered = data.filter(l => {
    const matchesFilter = filter === 'ALL' || l.status === filter;
    const matchesSearch = !search ||
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase()) ||
      l.owner?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#55605b] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#bd6b46]" />
        <span>Chargement des annonces…</span>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        count={filtered.length}
        action={
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8882]" />
            <input
              type="text"
              placeholder="Rechercher annonce, ville, nom…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#e7e2d8] rounded-xl text-xs text-[#19221f] placeholder:text-[#7d8882] focus:outline-none focus:border-[#bd6b46]"
            />
          </div>
        }
      >
        Annonces immobilières
      </SectionTitle>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 custom-scrollbar">
        {statuses.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              filter === s.id
                ? 'bg-[#19221f] text-[#f9f8f5] shadow-xs'
                : 'bg-white text-[#55605b] border border-[#e7e2d8] hover:border-[#bd6b46]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grid of Listings */}
      <div className="space-y-4">
        {filtered.map(l => (
          <motion.div
            key={l.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-morocco transition-all hover:border-[#ded7cb]"
          >
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <Thumb images={l.images} size={76} />
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="text-lg font-bold font-serif text-[#19221f] leading-snug">{l.title}</span>
                  {statusBadge(l.status)}
                  {l.isFeatured && (
                    <Badge label="Mis en avant" variant="terracotta" icon={Star} />
                  )}
                </div>

                <div className="text-xs text-[#55605b] font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className="font-semibold text-[#bd6b46] font-mono text-sm">{fmt(l.price)}</span>
                  <span>•</span>
                  <span>{l.city}</span>
                  <span>•</span>
                  <span>{l.type}</span>
                  <span>•</span>
                  <span>{l.purpose === 'RENT' ? 'Location' : 'Vente'}</span>
                  <span>•</span>
                  <span>{relDate(l.createdAt)}</span>
                  <span>•</span>
                  <span className="text-[#19221f] font-semibold">{l._count?.offers || 0} offres</span>
                  <span>,</span>
                  <span className="text-[#19221f] font-semibold">{l._count?.inquiries || 0} demandes</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {l.status !== 'PUBLISHED' && (
                    <Btn small icon={Check} onClick={() => setStatus(l.id, 'PUBLISHED')}>
                      Publier
                    </Btn>
                  )}
                  {l.status === 'PUBLISHED' && (
                    <Btn small danger icon={X} onClick={() => setStatus(l.id, 'UNPUBLISHED')}>
                      Retirer l'annonce
                    </Btn>
                  )}
                  <button
                    onClick={() => toggleFeatured(l.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      l.isFeatured
                        ? 'bg-[#f5ece6] text-[#bd6b46] border-[#e6d0c2] hover:bg-[#eadbd0]'
                        : 'bg-white text-[#55605b] border-[#e7e2d8] hover:border-[#bd6b46]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${l.isFeatured ? 'fill-[#bd6b46] text-[#bd6b46]' : 'text-[#7d8882]'}`} />
                    <span>{l.isFeatured ? 'Mis en avant' : 'Mettre en avant'}</span>
                  </button>
                </div>

                <ContactBlock person={l.owner} label="PROPRIÉTAIRE DU BIEN" />
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-12 text-center text-[#7d8882]">
            <Inbox className="w-10 h-10 mx-auto mb-3 stroke-1 text-[#bd6b46]" />
            <p className="text-sm font-medium">Aucune annonce trouvée dans cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: REQUESTS
══════════════════════════════════════════════════════════════ */
function RequestsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/requests`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setData(j.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await fetch(`${API}/admin/requests/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#55605b] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#bd6b46]" />
        <span>Chargement des demandes client…</span>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle count={data.length}>Demandes d'acheteurs & locataires</SectionTitle>

      <div className="space-y-4">
        {data.map(req => (
          <motion.div
            key={req.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-morocco"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                label={req.purpose === 'RENT' ? 'Location' : 'Achat'}
                variant={req.purpose === 'RENT' ? 'blue' : 'purple'}
              />
              <Badge label={req.type || 'Tout type'} variant="neutral" />
              {statusBadge(req.status)}
              <span className="text-xs text-[#7d8882] ml-auto font-medium">{relDate(req.createdAt)}</span>
            </div>

            <div className="text-sm font-semibold text-[#19221f] mb-2 flex flex-wrap gap-x-4 gap-y-1">
              <span>📍 Ville : <span className="text-[#bd6b46]">{req.city}</span>{req.neighborhood && ` (${req.neighborhood})`}</span>
              {req.maxBudget && <span>💰 Budget max : <span className="font-mono text-[#bd6b46]">{fmt(req.maxBudget)}</span></span>}
              {req.minBedrooms && <span>🛏 Min. {req.minBedrooms} ch.</span>}
            </div>

            <div className="bg-[#fcfaf7] border-l-3 border-[#bd6b46] rounded-r-xl p-3.5 my-3 text-sm text-[#30403a] leading-relaxed italic">
              "{req.description}"
            </div>

            {req.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {req.amenities.map(a => (
                  <span key={a} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0ede6] text-[#55605b]">
                    {a}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              {req.status === 'ACTIVE' && (
                <Btn small danger icon={X} onClick={() => setStatus(req.id, 'CLOSED')}>
                  Fermer la demande
                </Btn>
              )}
              {req.status !== 'ACTIVE' && (
                <Btn small icon={RefreshCw} onClick={() => setStatus(req.id, 'ACTIVE')}>
                  Réactiver
                </Btn>
              )}
            </div>

            <ContactBlock person={req.requester} label="DEMANDEUR — CONTACT CLIENT" />
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-12 text-center text-[#7d8882]">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 stroke-1 text-[#bd6b46]" />
            <p className="text-sm font-medium">Aucune demande soumise pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: OFFERS
══════════════════════════════════════════════════════════════ */
function OffersTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/offers`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setData(j.data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateOffer = async (id, status) => {
    await fetch(`${API}/admin/offers/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: notes[id] })
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#55605b] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#bd6b46]" />
        <span>Chargement des offres d'achat…</span>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle count={data.length}>Offres d'achat & location</SectionTitle>

      <div className="space-y-4">
        {data.map(o => (
          <motion.div
            key={o.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-morocco"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <Thumb images={o.listing?.images} size={68} />
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <span className="text-xl font-bold font-mono text-[#bd6b46]">{fmt(o.amount)}</span>
                  {statusBadge(o.status)}
                  <span className="text-xs text-[#7d8882] ml-auto font-medium">{relDate(o.createdAt)}</span>
                </div>

                <div className="text-xs font-semibold text-[#19221f] mb-3">
                  Annonce : {o.listing?.title || 'Bien non disponible'} — {o.listing?.city}
                </div>

                {o.message && (
                  <div className="bg-[#fcfaf7] border-l-3 border-[#bd6b46] rounded-r-xl p-3 my-2 text-xs text-[#30403a] leading-relaxed italic">
                    "{o.message}"
                  </div>
                )}

                {o.conditions && (
                  <div className="text-xs text-[#55605b] mb-2 font-medium">
                    Conditions : <span className="text-[#19221f]">{o.conditions}</span>
                  </div>
                )}

                <div className="text-xs text-[#7d8882] mb-3">
                  Mode de contact préféré : <span className="font-semibold text-[#19221f] uppercase">{o.contactPreference || 'Téléphone'}</span>
                </div>

                {/* Admin Note field */}
                <div className="mb-3">
                  <textarea
                    value={notes[o.id] !== undefined ? notes[o.id] : (o.ownerResponse || '')}
                    onChange={e => setNotes(n => ({ ...n, [o.id]: e.target.value }))}
                    placeholder="Note interne / message à transmettre..."
                    rows={2}
                    className="w-full bg-[#fdfbf7] border border-[#e7e2d8] rounded-xl p-3 text-xs text-[#19221f] focus:outline-none focus:border-[#bd6b46]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {o.status === 'PENDING' && (
                    <>
                      <Btn small icon={Check} onClick={() => updateOffer(o.id, 'ACCEPTED')}>
                        Transmettre (Accepté)
                      </Btn>
                      <Btn small danger icon={X} onClick={() => updateOffer(o.id, 'REJECTED')}>
                        Refuser
                      </Btn>
                    </>
                  )}
                  {o.status !== 'PENDING' && (
                    <Btn small icon={RefreshCw} onClick={() => updateOffer(o.id, 'PENDING')}>
                      Remettre en attente
                    </Btn>
                  )}
                  <button
                    onClick={() => updateOffer(o.id, o.status)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f0ede6] hover:bg-[#e5e0d8] text-[#19221f] border border-[#ded7cb] cursor-pointer"
                  >
                    💾 Enregistrer note
                  </button>
                </div>

                {/* Dual Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <ContactBlock person={o.buyer} label="ACHETEUR / LOCATAIRE" />
                  <ContactBlock person={o.owner} label="PROPRIÉTAIRE DU BIEN" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-12 text-center text-[#7d8882]">
            <MessageSquareQuote className="w-10 h-10 mx-auto mb-3 stroke-1 text-[#bd6b46]" />
            <p className="text-sm font-medium">Aucune offre soumise pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: MESSAGES / CONTACTS
══════════════════════════════════════════════════════════════ */
function ContactsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setData(j.data || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const update = async (id, status) => {
    await fetch(`${API}/admin/contacts/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: notes[id] })
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#55605b] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#bd6b46]" />
        <span>Chargement des messages de contact…</span>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle count={data.length}>Demandes de contact & messages</SectionTitle>

      <div className="space-y-4">
        {data.map(c => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white border rounded-2xl p-5 shadow-morocco ${
              c.status === 'UNREAD' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[#e7e2d8]'
            }`}
          >
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <Thumb images={c.listing?.images} size={60} />
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-base font-bold font-serif text-[#19221f]">
                    {c.listing?.title || 'Bien non spécifié'}
                  </span>
                  {statusBadge(c.status)}
                  <span className="text-xs text-[#7d8882] ml-auto font-medium">{relDate(c.createdAt)}</span>
                </div>

                <div className="bg-[#fcfaf7] border-l-3 border-[#bd6b46] rounded-r-xl p-3.5 my-2 text-xs text-[#30403a] leading-relaxed">
                  "{c.message}"
                </div>

                <div className="mb-3">
                  <textarea
                    value={notes[c.id] !== undefined ? notes[c.id] : (c.adminNote || '')}
                    onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                    placeholder="Note interne d'accompagnement…"
                    rows={2}
                    className="w-full bg-[#fdfbf7] border border-[#e7e2d8] rounded-xl p-3 text-xs text-[#19221f] focus:outline-none focus:border-[#bd6b46]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {c.status === 'UNREAD' && (
                    <Btn small icon={Check} onClick={() => update(c.id, 'READ')}>
                      Marquer comme lu
                    </Btn>
                  )}
                  <button
                    onClick={() => update(c.id, c.status)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f0ede6] hover:bg-[#e5e0d8] text-[#19221f] border border-[#ded7cb] cursor-pointer"
                  >
                    💾 Enregistrer note
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <ContactBlock person={c.sender} label="EXPÉDITEUR DU MESSAGE" />
                  <ContactBlock person={c.recipient} label="DESTINATAIRE (PROPRIÉTAIRE)" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="bg-white border border-[#e7e2d8] rounded-2xl p-12 text-center text-[#7d8882]">
            <Mail className="w-10 h-10 mx-auto mb-3 stroke-1 text-[#bd6b46]" />
            <p className="text-sm font-medium">Aucun message de contact enregistré.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: USERS
══════════════════════════════════════════════════════════════ */
function UsersTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      setData(j.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#55605b] gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-[#bd6b46]" />
        <span>Chargement des utilisateurs inscrits…</span>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle count={data.length}>Utilisateurs & Membres</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(u => (
          <motion.div
            key={u.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#e7e2d8] rounded-2xl p-5 shadow-morocco flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#19221f] to-[#bd6b46] text-white flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
                  {u.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-[#19221f] truncate">{u.name}</div>
                  <div className="text-xs text-[#7d8882]">Inscrit {relDate(u.createdAt)}</div>
                </div>
                {u.phoneVerified && (
                  <Badge label="Vérifié" variant="green" icon={CheckCircle2} />
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                <ContactPill icon={Mail} value={u.email} href={`mailto:${u.email}`} />
                <ContactPill icon={Phone} value={u.phone} href={`tel:${u.phone}`} />
              </div>
            </div>

            <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs text-[#55605b] font-medium">
              <span>🏠 {u.listingsCount || 0} annonces</span>
              <span>📋 {u.requestsCount || 0} demandes</span>
              <span>💬 {u.offersCount || 0} offres</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN LOGIN SCREEN
══════════════════════════════════════════════════════════════ */
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let j;
      try {
        j = await r.clone().json();
      } catch {
        const text = await r.text().catch(() => '');
        j = { error: text || `Erreur serveur (HTTP ${r.status})` };
      }
      if (!r.ok) {
        setError(j.error || 'Identifiants incorrects.');
        setLoading(false);
        return;
      }
      if (j.data?.user?.role !== 'ADMIN') {
        setError('Accès réservé exclusivement aux administrateurs Atlassi.');
        setLoading(false);
        return;
      }
      onLogin(j.data.token, j.data.user);
    } catch (err) {
      setError(err.message || 'Impossible de joindre le serveur.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center p-4 font-sans text-[#19221f]">
      <div className="w-full max-w-md">
        {/* Editorial Brand Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-1.5 group select-none">
            <span className="text-3xl font-bold tracking-tighter text-[#19221f] font-serif">
              atlassi
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#bd6b46] inline-block" />
          </a>
          <div className="text-xs uppercase tracking-widest text-[#7d8882] font-semibold mt-2">
            Console d'Administration
          </div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#e7e2d8] rounded-3xl p-8 shadow-morocco"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#f5ece6] text-[#bd6b46] rounded-2xl">
              <ShieldCheck className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-serif text-[#19221f]">Accès Administrateur</h1>
              <p className="text-xs text-[#7d8882]">Veuillez vous authentifier pour continuer</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#55605b] mb-1.5">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm text-[#19221f] focus:outline-none focus:border-[#bd6b46] transition-colors"
                placeholder="admin@atlassi.ma"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#55605b] mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm text-[#19221f] focus:outline-none focus:border-[#bd6b46] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#19221f] hover:bg-[#2c3a35] text-[#f9f8f5] font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#bd6b46]" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#7d8882] mt-6">
            Accès sécurisé réservé à l'équipe Atlassi Maroc
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PUBLISH NEW PROPERTY TAB
══════════════════════════════════════════════════════════════ */
function NewListingTab({ token }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment',
    status: 'for_sale',
    price: '',
    location: 'Marrakech',
    neighborhood: '',
    surface: '',
    bedrooms: '',
    bathrooms: '',
    titleStatus: 'titled',
    description: '',
    features: '',
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setUploadProgress('Préparation des photos...');
    try {
      const processed = await Promise.all(files.map(processImageFile));
      const usable = processed.filter(Boolean);
      const skipped = processed.length - usable.length;
      if (usable.length) setImages((prev) => [...prev, ...usable]);
      if (skipped) {
        setError(
          `${skipped} photo(s) n’ont pas pu être traitées (format non pris en charge par ce navigateur, ex. HEIC). Convertissez-les en JPEG puis réessayez.`
        );
      }
    } finally {
      setUploadProgress('');
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const uploadFile = async (file) => {
    const data = new FormData();
    data.append('file', file);

    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Erreur lors du téléversement du fichier');
    }

    const json = await res.json();
    return json.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (images.length === 0) {
      setError('Veuillez ajouter au moins une photo du bien.');
      return;
    }

    try {
      setUploading(true);

      // Upload images
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Téléversement photo ${i + 1}/${images.length}...`);
        const url = await uploadFile(images[i]);
        imageUrls.push(url);
      }

      // Upload video if present
      let videoUrl = '';
      if (video) {
        setUploadProgress('Téléversement de la vidéo...');
        videoUrl = await uploadFile(video);
      }

      setUploadProgress('Publication de l’annonce...');

      const payload = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        price: Number(formData.price),
        location: formData.location,
        neighborhood: formData.neighborhood,
        surface: Number(formData.surface),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        titleStatus: formData.titleStatus,
        description: formData.description,
        features: formData.features
          ? formData.features.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
        images: imageUrls,
        video: videoUrl || undefined,
      };

      const res = await fetch(`${API}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Impossible de créer l’annonce.');
      }

      setSuccess(true);
      setFormData({
        title: '',
        type: 'apartment',
        status: 'for_sale',
        price: '',
        location: 'Marrakech',
        neighborhood: '',
        surface: '',
        bedrooms: '',
        bathrooms: '',
        titleStatus: 'titled',
        description: '',
        features: '',
      });
      setImages([]);
      setVideo(null);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-xs p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#e5e0d8]">
        <div className="w-10 h-10 rounded-xl bg-[#bd6b46]/10 text-[#bd6b46] flex items-center justify-center">
          <FilePlus2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#19221f] font-serif">Publier un nouveau bien</h2>
          <p className="text-xs text-[#7d8882]">
            Ajoutez une nouvelle propriété au catalogue Atlassi avec photos et vidéo depuis votre appareil.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>L'annonce a été publiée avec succès sur la plateforme !</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Titre de l'annonce *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Appartement de Luxe au Cœur de Guéliz"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Type de bien *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            >
              <option value="apartment">Appartement</option>
              <option value="villa">Villa</option>
              <option value="riad">Riad</option>
              <option value="other">Duplex / Penthouse</option>
              <option value="land">Terrain</option>
              <option value="commercial">Local Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Statut Transaction *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            >
              <option value="for_sale">À Vendre</option>
              <option value="for_rent">À Louer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Prix (MAD) *
            </label>
            <input
              type="number"
              required
              min="0"
              placeholder="ex: 2500000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Statut Foncier *
            </label>
            <select
              value={formData.titleStatus}
              onChange={(e) => setFormData({ ...formData, titleStatus: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            >
              <option value="titled">Titré / محفظة</option>
              <option value="untitled">Non Titré / غير محفظة</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Ville / Localisation *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Marrakech"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Quartier / Zone
            </label>
            <input
              type="text"
              placeholder="ex: Guéliz, Palmeraie, Hivernage..."
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Surface (m²) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="ex: 120"
              value={formData.surface}
              onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Chambres
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex: 3"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Salles de bain
            </label>
            <input
              type="number"
              min="0"
              placeholder="ex: 2"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="space-y-4 pt-4 border-t border-[#e5e0d8]">
          <h3 className="text-sm font-bold text-[#19221f] flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#bd6b46]" />
            <span>Photos & Vidéo (Galerie / Fichiers)</span>
          </h3>

          {/* Photo upload picker */}
          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Photos du bien *
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#19221f] hover:bg-[#2c3a35] text-white text-xs font-semibold rounded-xl transition-all shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Choisir des photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-[#7d8882]">
                {images.length > 0 ? `${images.length} photo(s) sélectionnée(s)` : 'Aucune photo choisie'}
              </span>
            </div>

            {/* Preview Selected Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e5e0d8] aspect-square bg-gray-100">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Aperçu ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video upload picker */}
          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Vidéo du bien (optionnel)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] hover:border-[#bd6b46] text-[#19221f] text-xs font-semibold rounded-xl transition-all">
                <Video className="w-4 h-4 text-[#bd6b46]" />
                <span>{video ? 'Changer la vidéo' : 'Choisir une vidéo'}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
              {video && (
                <div className="flex items-center gap-2 text-xs text-[#19221f] font-medium bg-[#f5f2ed] px-3 py-1.5 rounded-lg border border-[#e5e0d8]">
                  <span className="truncate max-w-[200px]">{video.name}</span>
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="text-rose-600 hover:text-rose-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description & Features */}
        <div className="space-y-4 pt-4 border-t border-[#e5e0d8]">
          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Description détaillée
            </label>
            <textarea
              rows={4}
              placeholder="Décrivez les atouts, l'agencement et l'environnement du bien..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19221f] mb-1.5">
              Équipements / Caractéristiques (séparés par des virgules)
            </label>
            <input
              type="text"
              placeholder="ex: Piscine, Garage, Climatisation, Jardin, Ascenseur"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e7e2d8] rounded-xl text-sm focus:outline-none focus:border-[#bd6b46]"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-[#e5e0d8] flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3 bg-[#bd6b46] hover:bg-[#a55a38] text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || 'Traitement...'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Publier l'annonce</span>
              </>
            ) }
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD SHELL
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'publish', label: 'Publier un bien', icon: FilePlus2 },
  { id: 'listings', label: 'Annonces', icon: Building2 },
  { id: 'requests', label: 'Demandes', icon: ClipboardList },
  { id: 'offers', label: 'Offres', icon: MessageSquareQuote },
  { id: 'contacts', label: 'Messages', icon: Mail },
  { id: 'users', label: 'Utilisateurs', icon: Users },
];

function Dashboard({ token, admin, onLogout }) {
  const [tab, setTab] = useState('publish');
  const [stats, setStats] = useState(null);
  const { isRtl } = useLanguage();

  const loadStats = useCallback(() => {
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => setStats(j.data))
      .catch(() => {});
  }, [token]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="min-h-screen bg-[#f9f8f5] text-[#19221f] font-sans antialiased">
      {/* Editorial Navbar Header */}
      <header className="sticky top-0 z-40 w-full bg-[#f9f8f5]/92 backdrop-blur-md border-b border-[#e5e0d8] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 group select-none">
              <span className="text-2xl font-bold tracking-tighter text-[#19221f] font-serif transition-colors group-hover:text-[#bd6b46]">
                atlassi
              </span>
              <span className="w-2 h-2 rounded-full bg-[#bd6b46] inline-block" />
            </a>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#19221f] text-[#f9f8f5]">
              <ShieldCheck className="w-3 h-3 text-[#bd6b46]" /> Admin
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden sm:inline-flex" />

            <div className="flex items-center gap-2 pl-3 border-l border-[#e5e0d8]">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-[#19221f]">{admin.name}</div>
                <div className="text-[10px] text-[#7d8882]">Administrateur</div>
              </div>
              <button
                onClick={onLogout}
                title="Déconnexion"
                className="p-2 rounded-xl border border-[#e5e0d8] bg-white hover:bg-[#f0ede6] text-[#55605b] hover:text-rose-700 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-1.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Summary Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
            <StatCard
              label="Annonces"
              value={stats.publishedListings}
              sub={`/ ${stats.totalListings} au total`}
              accentColor="bg-emerald-50 text-emerald-700"
              icon={Building2}
            />
            <StatCard
              label="Demandes Actives"
              value={stats.activeRequests}
              sub={`/ ${stats.totalRequests} au total`}
              accentColor="bg-sky-50 text-sky-700"
              icon={ClipboardList}
            />
            <StatCard
              label="Offres en attente"
              value={stats.pendingOffers}
              sub={`/ ${stats.totalOffers} au total`}
              accentColor="bg-amber-50 text-amber-800"
              icon={MessageSquareQuote}
            />
            <StatCard
              label="Messages non lus"
              value={stats.unreadContacts}
              sub={`/ ${stats.totalContacts} au total`}
              accentColor="bg-rose-50 text-rose-700"
              icon={Mail}
            />
            <StatCard
              label="Membres Inscrits"
              value={stats.totalUsers}
              sub="Comptes clients"
              accentColor="bg-[#f5ece6] text-[#bd6b46]"
              icon={Users}
            />
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <div className="bg-[#f0ede6] p-1.5 rounded-2xl flex gap-1 sm:gap-2 mb-8 overflow-x-auto border border-[#e5e0d8] custom-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            const count =
              t.id === 'listings' ? stats?.totalListings :
              t.id === 'requests' ? stats?.totalRequests :
              t.id === 'offers' ? stats?.totalOffers :
              t.id === 'contacts' ? stats?.totalContacts :
              t.id === 'users' ? stats?.totalUsers : null;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-[#19221f] text-[#f9f8f5] shadow-sm'
                    : 'text-[#55605b] hover:text-[#19221f] hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4 stroke-1.5" />
                <span>{t.label}</span>
                {count != null && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab === t.id ? 'bg-[#bd6b46] text-white' : 'bg-[#e5e0d8] text-[#55605b]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'publish' && <NewListingTab token={token} />}
            {tab === 'listings' && <ListingsTab token={token} />}
            {tab === 'requests' && <RequestsTab token={token} />}
            {tab === 'offers' && <OffersTab token={token} />}
            {tab === 'contacts' && <ContactsTab token={token} />}
            {tab === 'users' && <UsersTab token={token} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT ADMIN PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [auth, setAuth] = useState(() => {
    try {
      const t = sessionStorage.getItem('atlassi-admin-token');
      const u = sessionStorage.getItem('atlassi-admin-user');
      return t && u ? { token: t, user: JSON.parse(u) } : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (token, user) => {
    sessionStorage.setItem('atlassi-admin-token', token);
    sessionStorage.setItem('atlassi-admin-user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('atlassi-admin-token');
    sessionStorage.removeItem('atlassi-admin-user');
    setAuth(null);
  };

  if (!auth) return <AdminLogin onLogin={handleLogin} />;
  return <Dashboard token={auth.token} admin={auth.user} onLogout={handleLogout} />;
}

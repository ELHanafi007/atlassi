import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;

/* ─── tiny helpers ─────────────────────────────────────────── */
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

const Badge = ({ label, color = 'neutral' }) => {
  const colors = {
    green: '#1a4731 / #22c55e',
    red: '#4c1d1d / #f87171',
    amber: '#422006 / #fbbf24',
    blue: '#172554 / #60a5fa',
    neutral: '#1c1c1c / #a3a3a3',
    purple: '#2e1065 / #c084fc',
  };
  const [bg, fg] = (colors[color] || colors.neutral).split(' / ');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      letterSpacing: '.04em', textTransform: 'uppercase',
      background: bg, color: fg
    }}>{label}</span>
  );
};

const statusBadge = (status) => {
  const map = {
    PUBLISHED: ['Publié', 'green'], PENDING: ['En attente', 'amber'],
    UNPUBLISHED: ['Retiré', 'red'], SOLD: ['Vendu', 'purple'],
    ACTIVE: ['Actif', 'green'], CLOSED: ['Fermé', 'red'],
    ACCEPTED: ['Accepté', 'green'], REJECTED: ['Refusé', 'red'],
    READ: ['Lu', 'blue'], UNREAD: ['Non lu', 'amber'],
  };
  const [label, color] = map[status] || [status, 'neutral'];
  return <Badge label={label} color={color} />;
};

/* ─── contact pill (clickable copy) ───────────────────────── */
const ContactPill = ({ icon, value, href }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <a
      href={href || '#'}
      onClick={href ? undefined : (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 6, fontSize: 12,
        background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)',
        color: copied ? '#4ade80' : '#d4d4d4', textDecoration: 'none',
        transition: 'color .15s',
        cursor: href ? 'pointer' : 'copy',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {copied ? 'Copié !' : value}
    </a>
  );
};

/* ─── stat card ────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: '#161618', border: '1px solid #2a2a2d', borderRadius: 12,
    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4
  }}>
    <span style={{ fontSize: 12, color: '#737373', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 32, fontWeight: 700, color: accent || '#e3e2e2', lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: '#737373' }}>{sub}</span>}
  </div>
);

/* ─── section header ───────────────────────────────────────── */
const SectionTitle = ({ children, count }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e3e2e2' }}>{children}</h2>
    {count != null && (
      <span style={{ fontSize: 12, color: '#737373' }}>{count} entrée{count !== 1 ? 's' : ''}</span>
    )}
  </div>
);

/* ─── action button ────────────────────────────────────────── */
const Btn = ({ children, onClick, danger, small, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: small ? '4px 10px' : '6px 14px',
      fontSize: small ? 12 : 13, fontWeight: 500, borderRadius: 6,
      border: danger ? '1px solid #7f1d1d' : '1px solid #3a3a3d',
      background: danger ? 'rgba(127,29,29,.35)' : 'rgba(255,255,255,.05)',
      color: danger ? '#f87171' : '#d4d4d4',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
      transition: 'background .15s',
    }}
  >{children}</button>
);

/* ─── image thumbnail ──────────────────────────────────────── */
const Thumb = ({ images, size = 52 }) => {
  const url = images?.[0]?.url;
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: '#222', overflow: 'hidden',
      border: '1px solid #2a2a2d'
    }}>
      {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
};

/* ─── owner / requester contact block ─────────────────────── */
const ContactBlock = ({ person, label }) => {
  if (!person) return null;
  return (
    <div style={{
      background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.18)',
      borderRadius: 8, padding: '10px 14px', marginTop: 8
    }}>
      <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, letterSpacing: '.06em', marginBottom: 6 }}>
        🔒 {label || 'CONTACT PRIVÉ'}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#e3e2e2', marginBottom: 6 }}>{person.name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <ContactPill icon="✉" value={person.email} href={`mailto:${person.email}`} />
        <ContactPill icon="📞" value={person.phone} href={`tel:${person.phone}`} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB: Listings
══════════════════════════════════════════════════════════════ */
function ListingsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    const r = await fetch(`${API}/admin/listings`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setData(j.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await fetch(`${API}/admin/listings/${id}/status`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  };

  const toggleFeatured = async (id) => {
    await fetch(`${API}/admin/listings/${id}/featured`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const statuses = ['ALL', 'PUBLISHED', 'PENDING', 'UNPUBLISHED'];
  const filtered = filter === 'ALL' ? data : data.filter(l => l.status === filter);

  if (loading) return <p style={{ color: '#737373' }}>Chargement…</p>;

  return (
    <div>
      <SectionTitle count={filtered.length}>Annonces immobilières</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: filter === s ? '1px solid #34d399' : '1px solid #3a3a3d',
            background: filter === s ? 'rgba(52,211,153,.12)' : 'transparent',
            color: filter === s ? '#34d399' : '#737373'
          }}>{s === 'ALL' ? 'Tout' : s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(l => (
          <div key={l.id} style={{
            background: '#161618', border: '1px solid #2a2a2d', borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Thumb images={l.images} size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#e3e2e2' }}>{l.title}</span>
                  {statusBadge(l.status)}
                  {l.isFeatured && <Badge label="⭐ Mis en avant" color="amber" />}
                </div>
                <div style={{ fontSize: 13, color: '#737373', marginBottom: 8 }}>
                  {l.city} · {l.type} · {l.purpose === 'RENT' ? 'Location' : 'Vente'} · {fmt(l.price)} · {relDate(l.createdAt)}
                  &nbsp;·&nbsp;{l._count?.offers || 0} offres, {l._count?.inquiries || 0} demandes
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {l.status !== 'PUBLISHED' && (
                    <Btn small onClick={() => setStatus(l.id, 'PUBLISHED')}>✓ Publier</Btn>
                  )}
                  {l.status === 'PUBLISHED' && (
                    <Btn small danger onClick={() => setStatus(l.id, 'UNPUBLISHED')}>✗ Retirer</Btn>
                  )}
                  <Btn small onClick={() => toggleFeatured(l.id)}>
                    {l.isFeatured ? '★ Retirer la mise en avant' : '☆ Mettre en avant'}
                  </Btn>
                </div>
                <ContactBlock person={l.owner} label="PROPRIÉTAIRE — CONTACT CONFIDENTIEL" />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: '#737373' }}>Aucune annonce.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: Requests
══════════════════════════════════════════════════════════════ */
function RequestsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/admin/requests`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setData(j.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await fetch(`${API}/admin/requests/${id}/status`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  };

  if (loading) return <p style={{ color: '#737373' }}>Chargement…</p>;

  return (
    <div>
      <SectionTitle count={data.length}>Demandes d'acheteurs & locataires</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(req => (
          <div key={req.id} style={{
            background: '#161618', border: '1px solid #2a2a2d', borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <Badge label={req.purpose === 'RENT' ? 'Location' : 'Achat'} color={req.purpose === 'RENT' ? 'blue' : 'purple'} />
              <Badge label={req.type || 'Tout type'} color="neutral" />
              {statusBadge(req.status)}
              <span style={{ fontSize: 12, color: '#737373', marginLeft: 'auto' }}>{relDate(req.createdAt)}</span>
            </div>
            <div style={{ fontSize: 13, color: '#737373', marginBottom: 4 }}>
              <strong style={{ color: '#a3a3a3' }}>{req.city}</strong>
              {req.neighborhood && ` · ${req.neighborhood}`}
              {req.maxBudget && ` · Budget max : ${fmt(req.maxBudget)}`}
              {req.minBedrooms && ` · Min. ${req.minBedrooms} ch.`}
            </div>
            <p style={{ margin: '8px 0', fontSize: 13, color: '#d4d4d4', lineHeight: 1.5 }}>{req.description}</p>
            {req.amenities?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {req.amenities.map(a => <Badge key={a} label={a} color="neutral" />)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {req.status === 'ACTIVE' && (
                <Btn small danger onClick={() => setStatus(req.id, 'CLOSED')}>✗ Fermer la demande</Btn>
              )}
              {req.status !== 'ACTIVE' && (
                <Btn small onClick={() => setStatus(req.id, 'ACTIVE')}>↺ Réactiver</Btn>
              )}
            </div>
            <ContactBlock person={req.requester} label="DEMANDEUR — CONTACT CONFIDENTIEL" />
          </div>
        ))}
        {data.length === 0 && <p style={{ color: '#737373' }}>Aucune demande.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: Offers
══════════════════════════════════════════════════════════════ */
function OffersTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    const r = await fetch(`${API}/admin/offers`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setData(j.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateOffer = async (id, status) => {
    await fetch(`${API}/admin/offers/${id}/status`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: notes[id] })
    });
    load();
  };

  if (loading) return <p style={{ color: '#737373' }}>Chargement…</p>;

  return (
    <div>
      <SectionTitle count={data.length}>Offres d'achat / location</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(o => (
          <div key={o.id} style={{
            background: '#161618', border: '1px solid #2a2a2d', borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Thumb images={o.listing?.images} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#e3e2e2' }}>
                    {fmt(o.amount)}
                  </span>
                  {statusBadge(o.status)}
                  <span style={{ fontSize: 12, color: '#737373' }}>{relDate(o.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#737373', marginBottom: 8 }}>
                  {o.listing?.title} — {o.listing?.city}
                </div>
                {o.message && (
                  <div style={{ fontSize: 13, color: '#a3a3a3', background: '#1c1c1e', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                    "{o.message}"
                  </div>
                )}
                {o.conditions && (
                  <p style={{ fontSize: 12, color: '#737373', margin: '0 0 8px' }}>Conditions : {o.conditions}</p>
                )}
                {/* Contact préféré */}
                <div style={{ fontSize: 12, color: '#737373', marginBottom: 10 }}>
                  Contact préféré : <strong style={{ color: '#a3a3a3' }}>{o.contactPreference}</strong>
                </div>

                {/* Admin note */}
                <div style={{ marginBottom: 10 }}>
                  <textarea
                    value={notes[o.id] || o.ownerResponse || ''}
                    onChange={e => setNotes(n => ({ ...n, [o.id]: e.target.value }))}
                    placeholder="Note interne / réponse transmise au vendeur…"
                    rows={2}
                    style={{
                      width: '100%', resize: 'vertical', boxSizing: 'border-box',
                      background: '#1c1c1e', border: '1px solid #3a3a3d', borderRadius: 8,
                      color: '#d4d4d4', fontSize: 13, padding: '8px 12px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {o.status === 'PENDING' && <>
                    <Btn small onClick={() => updateOffer(o.id, 'ACCEPTED')}>✓ Transmettre (Accepté)</Btn>
                    <Btn small danger onClick={() => updateOffer(o.id, 'REJECTED')}>✗ Refuser</Btn>
                  </>}
                  {o.status !== 'PENDING' && (
                    <Btn small onClick={() => updateOffer(o.id, 'PENDING')}>↺ Remettre en attente</Btn>
                  )}
                  <Btn small onClick={() => updateOffer(o.id, o.status)}>💾 Enregistrer note</Btn>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <ContactBlock person={o.buyer} label="ACHETEUR / LOCATAIRE" />
                  <ContactBlock person={o.owner} label="PROPRIÉTAIRE" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: '#737373' }}>Aucune offre.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: Contacts / Inquiries
══════════════════════════════════════════════════════════════ */
function ContactsTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    const r = await fetch(`${API}/admin/contacts`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setData(j.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const update = async (id, status) => {
    await fetch(`${API}/admin/contacts/${id}/status`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: notes[id] })
    });
    load();
  };

  if (loading) return <p style={{ color: '#737373' }}>Chargement…</p>;

  return (
    <div>
      <SectionTitle count={data.length}>Demandes de contact</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(c => (
          <div key={c.id} style={{
            background: '#161618', border: `1px solid ${c.status === 'UNREAD' ? '#854d0e' : '#2a2a2d'}`,
            borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Thumb images={c.listing?.images} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e3e2e2' }}>{c.listing?.title || 'Bien inconnu'}</span>
                  {statusBadge(c.status)}
                  <span style={{ fontSize: 12, color: '#737373' }}>{relDate(c.createdAt)}</span>
                </div>
                <div style={{
                  fontSize: 13, color: '#d4d4d4', background: '#1c1c1e',
                  borderRadius: 8, padding: '8px 12px', margin: '8px 0', lineHeight: 1.5
                }}>
                  "{c.message}"
                </div>
                <textarea
                  value={notes[c.id] || c.adminNote || ''}
                  onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                  placeholder="Note interne…"
                  rows={2}
                  style={{
                    width: '100%', resize: 'vertical', boxSizing: 'border-box',
                    background: '#1c1c1e', border: '1px solid #3a3a3d', borderRadius: 8,
                    color: '#d4d4d4', fontSize: 13, padding: '8px 12px', marginBottom: 8
                  }}
                />
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {c.status === 'UNREAD' && (
                    <Btn small onClick={() => update(c.id, 'READ')}>✓ Marquer lu</Btn>
                  )}
                  <Btn small onClick={() => update(c.id, c.status)}>💾 Enregistrer note</Btn>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <ContactBlock person={c.sender} label="EXPÉDITEUR" />
                  <ContactBlock person={c.recipient} label="DESTINATAIRE (PROPRIÉTAIRE)" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: '#737373' }}>Aucun message.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: Users
══════════════════════════════════════════════════════════════ */
function UsersTab({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setData(j.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ color: '#737373' }}>Chargement…</p>;

  return (
    <div>
      <SectionTitle count={data.length}>Utilisateurs inscrits</SectionTitle>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12
      }}>
        {data.map(u => (
          <div key={u.id} style={{
            background: '#161618', border: '1px solid #2a2a2d', borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#1a3a2a,#0f2d1a)',
                border: '1px solid #34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#34d399'
              }}>
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#e3e2e2' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#737373' }}>Inscrit {relDate(u.createdAt)}</div>
              </div>
              {u.phoneVerified && <Badge label="✓ Vérifié" color="green" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              <ContactPill icon="✉" value={u.email} href={`mailto:${u.email}`} />
              <ContactPill icon="📞" value={u.phone} href={`tel:${u.phone}`} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#737373' }}>🏠 {u.listingsCount} annonces</span>
              <span style={{ fontSize: 12, color: '#737373' }}>📋 {u.requestsCount} demandes</span>
              <span style={{ fontSize: 12, color: '#737373' }}>💬 {u.offersCount} offres</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGIN GATE
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
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'Identifiants incorrects.'); setLoading(false); return; }
      if (j.data?.user?.role !== 'ADMIN') {
        setError('Accès réservé aux administrateurs Atlassi.');
        setLoading(false);
        return;
      }
      onLogin(j.data.token, j.data.user);
    } catch (err) {
      setError(err.message || 'Impossible de joindre le serveur.');
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: '#161618', border: '1px solid #3a3a3d', borderRadius: 8,
    color: '#e3e2e2', fontSize: 14, padding: '10px 14px',
    outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0f11', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: '0 20px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', letterSpacing: '-.02em' }}>
            atlassi
          </div>
          <div style={{ fontSize: 13, color: '#737373', marginTop: 4 }}>Console d'administration</div>
        </div>

        <form onSubmit={submit} style={{
          background: '#111113', border: '1px solid #2a2a2d',
          borderRadius: 16, padding: '28px 24px'
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600, color: '#e3e2e2' }}>
            Accès administrateur
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>
                Adresse e-mail
              </label>
              <input style={inp} type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>
                Mot de passe
              </label>
              <input style={inp} type="password" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              padding: '11px', borderRadius: 8, border: 'none',
              background: loading ? '#1a3a2a' : 'linear-gradient(135deg,#059669,#34d399)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <button type="button" onClick={() => { setEmail('admin@atlassi.ma'); setPassword('atlassi2024'); }} style={{
              background: 'none', border: '1px dashed #3a3a3d', borderRadius: 8, padding: '8px',
              color: '#34d399', fontSize: 12, cursor: 'pointer', marginTop: 4
            }}>
              Remplir identifiants démo (Admin)
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 16, textAlign: 'center' }}>
            Accès réservé à l'équipe Atlassi
          </p>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD SHELL + STATS
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'listings', label: '🏠 Annonces' },
  { id: 'requests', label: '📋 Demandes' },
  { id: 'offers', label: '💬 Offres' },
  { id: 'contacts', label: '✉ Messages' },
  { id: 'users', label: '👤 Utilisateurs' },
];

function Dashboard({ token, admin, onLogout }) {
  const [tab, setTab] = useState('listings');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setStats(j.data)).catch(() => {});
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f11',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: '#e3e2e2'
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', borderBottom: '1px solid #1e1e21',
        background: '#111113', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#34d399', letterSpacing: '-.02em' }}>atlassi</span>
          <span style={{ fontSize: 12, color: '#4a4a4a', borderLeft: '1px solid #2a2a2d', paddingLeft: 16 }}>
            Console d'administration
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#737373' }}>
            Connecté en tant que <strong style={{ color: '#a3a3a3' }}>{admin.name}</strong>
          </span>
          <button onClick={onLogout} style={{
            padding: '5px 12px', borderRadius: 6, border: '1px solid #3a3a3d',
            background: 'transparent', color: '#737373', fontSize: 12, cursor: 'pointer'
          }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12, marginBottom: 32
          }}>
            <StatCard label="Annonces publiées" value={stats.publishedListings} sub={`/ ${stats.totalListings} total`} accent="#34d399" />
            <StatCard label="Demandes actives" value={stats.activeRequests} sub={`/ ${stats.totalRequests} total`} accent="#60a5fa" />
            <StatCard label="Offres en attente" value={stats.pendingOffers} sub={`/ ${stats.totalOffers} total`} accent="#fbbf24" />
            <StatCard label="Messages non lus" value={stats.unreadContacts} sub={`/ ${stats.totalContacts} total`} accent="#f87171" />
            <StatCard label="Utilisateurs" value={stats.totalUsers} accent="#c084fc" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              background: tab === t.id ? 'rgba(52,211,153,.12)' : 'transparent',
              color: tab === t.id ? '#34d399' : '#737373',
              outline: tab === t.id ? '1px solid rgba(52,211,153,.3)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'listings' && <ListingsTab token={token} />}
        {tab === 'requests' && <RequestsTab token={token} />}
        {tab === 'offers' && <OffersTab token={token} />}
        {tab === 'contacts' && <ContactsTab token={token} />}
        {tab === 'users' && <UsersTab token={token} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [auth, setAuth] = useState(() => {
    try {
      const t = sessionStorage.getItem('atlassi-admin-token');
      const u = sessionStorage.getItem('atlassi-admin-user');
      return t && u ? { token: t, user: JSON.parse(u) } : null;
    } catch { return null; }
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

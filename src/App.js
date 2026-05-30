import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://kwzyyjewdpgeheykfmvf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3enl5amV3ZHBnZWhleWtmbXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjIwMzksImV4cCI6MjA5NTEzODAzOX0.FwdW0p-K1KQSDrT-OaaRvxjtz4z3Bv3fpH6FMt1cxkk'; // remplace par ta clé eyJ...

const db = {
  async query(table, method = 'GET', body = null, filters = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filters}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) { const e = await res.text(); throw new Error(e); }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
  get: (t, f = '') => db.query(t, 'GET', null, f),
  post: (t, b) => db.query(t, 'POST', b),
  patch: (t, b, f) => db.query(t, 'PATCH', b, f),
  del: (t, f) => db.query(t, 'DELETE', null, f),
};

const fmt = (n) => Math.round(n).toLocaleString('fr-FR') + ' F';
const fmtDate = (s) => new Date(s).toLocaleDateString('fr-FR');
const fmtTime = (s) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const CAT_ICONS = { Tissu: '🧵', Chaussure: '👟', Vaisselle: '🍽️', Autre: '📦' };
const CAT_COLORS = {
  Tissu: { bg: '#E1F5EE', text: '#085041' },
  Chaussure: { bg: '#E6F1FB', text: '#0C447C' },
  Vaisselle: { bg: '#FAEEDA', text: '#633806' },
  Autre: { bg: '#F1EFE8', text: '#444441' },
};
const G = {
  brand: '#1D9E75', brandDark: '#0F6E56', brandLight: '#E1F5EE',
  danger: '#E24B4A', dangerLight: '#FCEBEB', amber: '#BA7517', amberLight: '#FAEEDA',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${G.brandLight}`, borderTop: `3px solid ${G.brand}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: wide ? 700 : 440, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };

function Inp({ label, ...p }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      <input style={inputStyle} {...p} />
    </div>
  );
}

function Sel({ label, children, ...p }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      <select style={inputStyle} {...p}>{children}</select>
    </div>
  );
}

function Btn({ children, onClick, color = 'green', small, full, disabled, style: sx }) {
  const bg = color === 'green' ? G.brand : color === 'red' ? G.danger : color === 'amber' ? G.amber : '#f0f0f0';
  const col = color === 'gray' ? '#555' : '#fff';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: bg, color: col, border: 'none', borderRadius: 8, padding: small ? '6px 12px' : '9px 18px', fontSize: small ? 12 : 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', width: full ? '100%' : undefined, opacity: disabled ? 0.5 : 1, ...sx }}>
      {children}
    </button>
  );
}

function Badge({ children, color = 'green' }) {
  const c = color === 'green' ? { bg: G.brandLight, text: G.brandDark } : color === 'red' ? { bg: G.dangerLight, text: G.danger } : color === 'amber' ? { bg: G.amberLight, text: G.amber } : { bg: '#f0f0f0', text: '#555' };
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{children}</span>;
}

function printReceipt(boutique, items, total, received, discount, payMode, num, client) {
  const win = window.open('', '_blank', 'width=360,height=600');
  const net = total - (discount || 0);
  const monnaie = (received || net) - net;
  win.document.write(`<html><head><title>Reçu #${num}</title><style>
    body{font-family:monospace;font-size:12px;padding:20px;max-width:280px;margin:auto}
    h2{text-align:center;font-size:15px;margin:0}.sub{text-align:center;color:#666;font-size:11px;margin-bottom:8px}
    hr{border:none;border-top:1px dashed #ccc;margin:8px 0}.row{display:flex;justify-content:space-between;margin:3px 0}
    .bold{font-weight:bold}.thanks{text-align:center;color:#888;font-size:11px;margin-top:12px}
  </style></head><body>
    <h2>${boutique.nom}</h2>
    <div class="sub">${boutique.tel || ''}<br>${boutique.adresse || ''}</div>
    <div class="sub">Reçu N° ${num} — ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    ${client ? `<div class="sub">Client : ${client}</div>` : ''}
    <hr>
    ${items.map((it) => `<div class="row"><span>${it.nom} x${it.qty}</span><span>${Math.round(it.prix * it.qty).toLocaleString()} F</span></div>`).join('')}
    <hr>
    <div class="row bold"><span>Total</span><span>${Math.round(total).toLocaleString()} F</span></div>
    ${discount > 0 ? `<div class="row" style="color:#854F0B"><span>Remise</span><span>-${Math.round(discount).toLocaleString()} F</span></div>` : ''}
    <div class="row" style="color:#0F6E56"><span>Payé (${payMode})</span><span>${Math.round(received || net).toLocaleString()} F</span></div>
    ${monnaie > 0 ? `<div class="row"><span>Monnaie rendue</span><span>${Math.round(monnaie).toLocaleString()} F</span></div>` : ''}
    <hr><div class="thanks">Merci pour votre achat !<br>À bientôt chez ${boutique.nom}</div>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────
function AdminDashboard({ adminBoutique, onLogout }) {
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => { loadBoutiques(); }, []);

  async function loadBoutiques() {
    setLoading(true);
    try {
      const rows = await db.get('boutiques', '?order=created_at.desc');
      setBoutiques(rows || []);
      // Charger stats ventes pour chaque boutique
      const allVentes = await db.get('ventes', '?select=boutique_id,total');
      const s = {};
      (allVentes || []).forEach(v => {
        if (!s[v.boutique_id]) s[v.boutique_id] = { count: 0, total: 0 };
        s[v.boutique_id].count++;
        s[v.boutique_id].total += v.total;
      });
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleActif(b) {
    await db.patch('boutiques', { actif: !b.actif }, `?id=eq.${b.id}`);
    setBoutiques(boutiques.map(x => x.id === b.id ? { ...x, actif: !x.actif } : x));
  }

  async function prolonger(b, jours) {
    const newDate = new Date(b.date_expiration || new Date());
    newDate.setDate(newDate.getDate() + jours);
    const dateStr = newDate.toISOString().split('T')[0];
    await db.patch('boutiques', { date_expiration: dateStr, actif: true }, `?id=eq.${b.id}`);
    setBoutiques(boutiques.map(x => x.id === b.id ? { ...x, date_expiration: dateStr, actif: true } : x));
    alert(`✅ Abonnement prolongé de ${jours} jours !`);
  }

  async function supprimerBoutique(b) {
    if (!window.confirm(`Supprimer définitivement "${b.nom}" et toutes ses données ?`)) return;
    await db.del('boutiques', `?id=eq.${b.id}`);
    setBoutiques(boutiques.filter(x => x.id !== b.id));
  }

  const filtered = boutiques.filter(b =>
    b.nom?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  ).filter(b => !b.is_admin);

  const totalActifs = filtered.filter(b => b.actif).length;
  const totalExpires = filtered.filter(b => b.date_expiration && new Date(b.date_expiration) < new Date()).length;
  const totalCA = Object.values(stats).reduce((s, v) => s + v.total, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: G.brand, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>B</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>BoutikPro Admin</div>
            <div style={{ color: '#aaa', fontSize: 11 }}>Tableau de bord administrateur</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 12 }}>👤 {adminBoutique.nom}</span>
          <Btn small color="red" onClick={onLogout}>Déconnexion</Btn>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Métriques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total boutiques', val: filtered.length, icon: '🏪', color: G.brand },
            { label: 'Boutiques actives', val: totalActifs, icon: '✅', color: G.brand },
            { label: 'Abonnements expirés', val: totalExpires, icon: '⚠️', color: G.danger },
            { label: 'CA total généré', val: fmt(totalCA), icon: '💰', color: '#185FA5' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #eee' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <input placeholder="Rechercher une boutique..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          <Btn small onClick={loadBoutiques}>🔄 Actualiser</Btn>
        </div>

        {/* Tableau clients */}
        {loading ? <Spinner /> : (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: 14 }}>
              📋 Clients ({filtered.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                    {['Boutique', 'Email', 'Inscription', 'Expiration', 'Ventes', 'CA', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#aaa', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const expire = b.date_expiration ? new Date(b.date_expiration) < new Date() : false;
                    const bStats = stats[b.id] || { count: 0, total: 0 };
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>🏪 {b.nom}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>{b.email}</td>
                        <td style={{ padding: '10px 12px', color: '#888', fontSize: 12 }}>{fmtDate(b.created_at)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>
                          <span style={{ color: expire ? G.danger : G.brand, fontWeight: 500 }}>
                            {b.date_expiration ? fmtDate(b.date_expiration) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{bStats.count}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: G.brand }}>{fmt(bStats.total)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {!b.actif ? <Badge color="red">Suspendu</Badge>
                            : expire ? <Badge color="amber">Expiré</Badge>
                            : <Badge color="green">Actif</Badge>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 4n, flexWrap: 'wrap' }}>
                            <button onClick={() => setDetail(b)}
                              style={{ fontSize: 11, padding: '4px 8px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                              👁 Détails
                            </button>
                            <button onClick={() => toggleActif(b)}
                              style={{ fontSize: 11, padding: '4px 8px', background: b.actif ? G.dangerLight : G.brandLight, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, color: b.actif ? G.danger : G.brandDark }}>
                              {b.actif ? '🚫 Bloquer' : '✅ Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '40px 0', fontSize: 13 }}>Aucun client inscrit</div>}
            </div>
          </div>
        )}
      </div>

      {/* Modal détail client */}
      {detail && (
        <Modal title={`Client : ${detail.nom}`} onClose={() => setDetail(null)} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Nom de la boutique</div>
              <div style={{ fontWeight: 600 }}>{detail.nom}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Email</div>
              <div style={{ fontWeight: 500 }}>{detail.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Téléphone</div>
              <div>{detail.tel || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Adresse</div>
              <div>{detail.adresse || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Inscription</div>
              <div>{fmtDate(detail.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Expiration</div>
              <div style={{ color: detail.date_expiration && new Date(detail.date_expiration) < new Date() ? G.danger : G.brand, fontWeight: 500 }}>
                {detail.date_expiration ? fmtDate(detail.date_expiration) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Total ventes</div>
              <div style={{ fontWeight: 600, color: G.brand }}>{fmt((stats[detail.id] || {}).total || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Nombre de ventes</div>
              <div style={{ fontWeight: 600 }}>{(stats[detail.id] || {}).count || 0}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn small onClick={() => { prolonger(detail, 30); setDetail(null); }}>+30 jours</Btn>
              <Btn small onClick={() => { prolonger(detail, 90); setDetail(null); }}>+90 jours</Btn>
              <Btn small onClick={() => { prolonger(detail, 365); setDetail(null); }}>+1 an</Btn>
              <Btn small color={detail.actif ? 'red' : 'green'} onClick={() => { toggleActif(detail); setDetail({ ...detail, actif: !detail.actif }); }}>
                {detail.actif ? '🚫 Suspendre' : '✅ Activer'}
              </Btn>
              <Btn small color="red" onClick={() => { supprimerBoutique(detail); setDetail(null); }}>🗑 Supprimer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nom: '', tel: '', adresse: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const rows = await db.get('boutiques', `?email=eq.${encodeURIComponent(form.email)}&select=*`);
        if (!rows || rows.length === 0) { setError('Email introuvable.'); setLoading(false); return; }
        const b = rows[0];
        if (b.password_hash !== btoa(form.password)) { setError('Mot de passe incorrect.'); setLoading(false); return; }
        if (!b.actif && !b.is_admin) { setError('Compte suspendu. Contactez BoutikPro pour renouveler votre abonnement.'); setLoading(false); return; }
        localStorage.setItem('boutikpro_session', JSON.stringify(b));
        onLogin(b);
      } else {
        if (!form.nom || !form.email || !form.password) { setError('Remplis tous les champs *'); setLoading(false); return; }
        const ex = await db.get('boutiques', `?email=eq.${encodeURIComponent(form.email)}`);
        if (ex && ex.length > 0) { setError('Email déjà utilisé.'); setLoading(false); return; }
        const rows = await db.post('boutiques', { nom: form.nom, tel: form.tel, adresse: form.adresse, email: form.email, password_hash: btoa(form.password), plan: 'gratuit', actif: true });
        const b = rows[0];
        localStorage.setItem('boutikpro_session', JSON.stringify(b));
        onLogin(b);
      }
    } catch (e) { setError('Erreur réseau. Vérifie ta clé Supabase.'); console.error(e); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: G.brand, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontWeight: 700, fontSize: 20 }}>B</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>BoutikPro</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{mode === 'login' ? 'Connecte-toi à ta boutique' : 'Crée ton compte boutique'}</div>
        </div>
        {mode === 'register' && (
          <>
            <Inp label="Nom de la boutique *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="ex: Boutique Awa Mode" />
            <Inp label="Téléphone" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="+221 77 000 00 00" />
            <Inp label="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Marché Sandaga, Dakar" />
          </>
        )}
        <Inp label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="boutique@email.com" />
        <Inp label="Mot de passe *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        {error && <div style={{ background: G.dangerLight, color: G.danger, borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <Btn full onClick={submit} disabled={loading}>{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Btn>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
          {mode === 'login'
            ? <> Pas de compte ? <span onClick={() => { setMode('register'); setError(''); }} style={{ color: G.brand, cursor: 'pointer', fontWeight: 500 }}>S'inscrire</span></>
            : <>Déjà un compte ? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: G.brand, cursor: 'pointer', fontWeight: 500 }}>Se connecter</span></>}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD BOUTIQUE ───────────────────────────────────────────────────
function Dashboard({ boutique, produits, ventes }) {
  const today = new Date().toDateString();
  const ventesAuj = ventes.filter(v => new Date(v.created_at).toDateString() === today);
  const caAuj = ventesAuj.reduce((s, v) => s + v.total, 0);
  const n = new Date();
  const caMois = ventes.filter(v => { const d = new Date(v.created_at); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce((s, v) => s + v.total, 0);
  const stockFaible = produits.filter(p => p.stock <= p.stock_min);
  const valeurStock = produits.reduce((s, p) => s + p.prix * p.stock, 0);

  const metrics = [
    { label: "Ventes aujourd'hui", val: ventesAuj.length, sub: fmt(caAuj), color: G.brand },
    { label: 'CA ce mois', val: fmt(caMois), sub: ventes.filter(v => { const d = new Date(v.created_at); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length + ' ventes', color: '#185FA5' },
    { label: 'Valeur du stock', val: fmt(valeurStock), sub: produits.reduce((s, p) => s + p.stock, 0) + ' articles', color: '#854F0B' },
    { label: 'Alertes stock', val: stockFaible.length, sub: 'produits faibles', color: stockFaible.length > 0 ? G.danger : G.brand },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Bonjour, {boutique.nom} 👋</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#fafafa', borderRadius: 12, padding: '14px 16px', border: '1px solid #eee' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      {stockFaible.length > 0 && (
        <div style={{ background: G.dangerLight, border: '1px solid #f7c1c1', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: G.danger, fontSize: 13, marginBottom: 6 }}>⚠️ Stock faible</div>
          {stockFaible.map(p => (
            <div key={p.id} style={{ fontSize: 12, color: '#c0392b', display: 'flex', justifyContent: 'space-between' }}>
              <span>{p.nom}</span><span>{p.stock} restant(s)</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Dernières ventes</div>
      {[...ventes].reverse().slice(0, 5).map(v => (
        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Reçu #{v.receipt_num} {v.client_nom ? `— ${v.client_nom}` : ''}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{fmtDate(v.created_at)} {fmtTime(v.created_at)} · {v.items.length} article(s) · {v.pay_mode}</div>
          </div>
          <span style={{ fontWeight: 700, color: G.brand }}>{fmt(v.total)}</span>
        </div>
      ))}
      {ventes.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '24px 0', fontSize: 13 }}>Aucune vente encore</div>}
    </div>
  );
}

function Produits({ boutique, produits, setProduits }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tout');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const cats = ['Tout', ...Array.from(new Set(produits.map(p => p.categorie)))];
  const filtered = produits.filter(p => (cat === 'Tout' || p.categorie === cat) && p.nom.toLowerCase().includes(search.toLowerCase()));

  async function save() {
    if (!form.nom || !form.prix || form.stock === '') return;
    setSaving(true);
    try {
      if (modal === 'add') {
        const rows = await db.post('produits', { boutique_id: boutique.id, nom: form.nom, categorie: form.categorie || 'Autre', prix: +form.prix, stock: +form.stock, stock_min: +form.stock_min || 5 });
        setProduits([...produits, rows[0]]);
      } else {
        await db.patch('produits', { nom: form.nom, categorie: form.categorie, prix: +form.prix, stock: +form.stock, stock_min: +form.stock_min || 5 }, `?id=eq.${form.id}`);
        setProduits(produits.map(p => p.id === form.id ? { ...p, nom: form.nom, categorie: form.categorie, prix: +form.prix, stock: +form.stock, stock_min: +form.stock_min } : p));
      }
      setModal(null);
    } catch (e) { alert('Erreur : ' + e.message); }
    setSaving(false);
  }

  async function del(id) {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await db.del('produits', `?id=eq.${id}`);
    setProduits(produits.filter(p => p.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: '8px 12px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13 }}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <Btn onClick={() => { setForm({ nom: '', categorie: '', prix: '', stock: '', stock_min: '5' }); setModal('add'); }}>+ Nouveau produit</Btn>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              {['Produit', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#aaa', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const cc = CAT_COLORS[p.categorie] || { bg: '#f0f0f0', text: '#555' };
              const sc = p.stock <= 0 ? 'red' : p.stock <= p.stock_min ? 'amber' : 'green';
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: 10, fontWeight: 500 }}>{CAT_ICONS[p.categorie] || '📦'} {p.nom}</td>
                  <td style={{ padding: 10 }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cc.bg, color: cc.text, fontWeight: 500 }}>{p.categorie}</span></td>
                  <td style={{ padding: 10, fontWeight: 500 }}>{fmt(p.prix)}</td>
                  <td style={{ padding: 10, color: p.stock <= p.stock_min ? G.danger : '#333', fontWeight: 500 }}>{p.stock}</td>
                  <td style={{ padding: 10 }}><Badge color={sc}>{p.stock <= 0 ? 'Rupture' : p.stock <= p.stock_min ? 'Faible' : 'OK'}</Badge></td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small color="gray" onClick={() => { setForm({ ...p }); setModal('edit'); }}>Modifier</Btn>
                      <Btn small color="red" onClick={() => del(p.id)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '40px 0', fontSize: 13 }}>Aucun produit</div>}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Nouveau produit' : 'Modifier produit'} onClose={() => setModal(null)}>
          <Inp label="Nom *" value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} />
          <Inp label="Catégorie" value={form.categorie || ''} onChange={e => setForm({ ...form, categorie: e.target.value })} placeholder="ex: Tissu, Habillement, Chaussure..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Inp label="Prix (F) *" type="number" value={form.prix || ''} onChange={e => setForm({ ...form, prix: e.target.value })} />
            <Inp label="Stock *" type="number" value={form.stock !== undefined ? form.stock : ''} onChange={e => setForm({ ...form, stock: e.target.value })} />
          </div>
          <Inp label="Seuil alerte stock" type="number" value={form.stock_min || '5'} onChange={e => setForm({ ...form, stock_min: e.target.value })} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn color="gray" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? '...' : modal === 'add' ? 'Ajouter' : 'Enregistrer'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Caisse({ boutique, produits, setProduits, ventes, setVentes }) {
  const [panier, setPanier] = useState([]);
  const [search, setSearch] = useState('');
  const [payMode, setPayMode] = useState('Espèces');
  const [received, setReceived] = useState('');
  const [discount, setDiscount] = useState('');
  const [client, setClient] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);

  const dispo = produits.filter(p => p.stock > 0 && p.nom.toLowerCase().includes(search.toLowerCase()));
  const total = panier.reduce((s, it) => s + it.prix * it.qty, 0);
  const net = total - (+discount || 0);
  const monnaie = (+received || 0) - net;

  function addToPanier(p) {
    const ex = panier.find(x => x.id === p.id);
    setPanier(ex ? panier.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...panier, { ...p, qty: 1 }]);
  }

  function changeQty(id, qty) {
    setPanier(qty <= 0 ? panier.filter(x => x.id !== id) : panier.map(x => x.id === id ? { ...x, qty } : x));
  }

  async function valider() {
    if (panier.length === 0 || saving) return;
    setSaving(true);
    const num = (ventes.length > 0 ? Math.max(...ventes.map(v => v.receipt_num)) : 1000) + 1;
    try {
      const rows = await db.post('ventes', { boutique_id: boutique.id, receipt_num: num, total: net, discount: +discount || 0, received: +received || net, pay_mode: payMode, client_nom: client || null, items: panier.map(x => ({ id: x.id, nom: x.nom, prix: x.prix, qty: x.qty })) });
      setVentes([...ventes, rows[0]]);
      for (const it of panier) {
        const p = produits.find(x => x.id === it.id);
        await db.patch('produits', { stock: p.stock - it.qty }, `?id=eq.${it.id}`);
      }
      setProduits(produits.map(p => { const it = panier.find(x => x.id === p.id); return it ? { ...p, stock: p.stock - it.qty } : p; }));
      printReceipt(boutique, panier, total, +received || net, +discount || 0, payMode, num, client);
      setDone({ num, total: net, payMode });
      setPanier([]); setReceived(''); setDiscount(''); setClient('');
    } catch (e) { alert('Erreur vente : ' + e.message); }
    setSaving(false);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
      <div>
        <input placeholder="Chercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {dispo.map(p => (
            <div key={p.id} onClick={() => addToPanier(p)}
              style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = G.brand}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{CAT_ICONS[p.categorie] || '📦'}</div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{p.nom}</div>
              <div style={{ fontSize: 13, color: G.brand, fontWeight: 700 }}>{fmt(p.prix)}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>Stock: {p.stock}</div>
            </div>
          ))}
          {dispo.length === 0 && <div style={{ color: '#ccc', fontSize: 13, gridColumn: '1/-1', padding: '30px 0', textAlign: 'center' }}>Aucun produit disponible</div>}
        </div>
      </div>
      <div style={{ background: '#fafafa', borderRadius: 14, padding: 16, border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🧾 Panier</div>
        {panier.length === 0 ? <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Clique sur un produit</div>
          : panier.map(it => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 12 }}>{it.nom}</div>
                <div style={{ color: G.brand, fontSize: 12 }}>{fmt(it.prix)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => changeQty(it.id, it.qty - 1)} style={{ width: 24, height: 24, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 14 }}>−</button>
                <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{it.qty}</span>
                <button onClick={() => changeQty(it.id, it.qty + 1)} style={{ width: 24, height: 24, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 14 }}>+</button>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 55, textAlign: 'right' }}>{fmt(it.prix * it.qty)}</span>
            </div>
          ))}
        <div style={{ borderTop: '1px dashed #ddd', marginTop: 8, paddingTop: 10 }}>
          <input placeholder="Nom client (optionnel)" value={client} onChange={e => setClient(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input placeholder="Remise (F)" type="number" value={discount} onChange={e => setDiscount(e.target.value)}
              style={{ padding: '7px 8px', border: '1px solid #eee', borderRadius: 8, fontSize: 12, outline: 'none' }} />
            <select value={payMode} onChange={e => setPayMode(e.target.value)} style={{ padding: '7px 8px', border: '1px solid #eee', borderRadius: 8, fontSize: 12 }}>
              {['Espèces', 'Wave', 'Orange Money', 'Carte'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <input placeholder="Montant reçu (F)" type="number" value={received} onChange={e => setReceived(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
          {+received > 0 && (
            <div style={{ fontSize: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Monnaie</span>
              <span style={{ fontWeight: 600, color: monnaie >= 0 ? G.brand : G.danger }}>{fmt(Math.abs(monnaie))}{monnaie < 0 ? ' manquant' : ''}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            <span>Total</span><span style={{ color: G.brand }}>{fmt(net)}</span>
          </div>
          <Btn full onClick={valider} disabled={panier.length === 0 || saving}>{saving ? 'Enregistrement...' : '✓ Valider & Imprimer'}</Btn>
        </div>
      </div>
      {done && (
        <Modal title="Vente enregistrée !" onClose={() => setDone(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Reçu #{done.num}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{fmt(done.total)} · {done.payMode}</div>
            <Btn full color="gray" onClick={() => setDone(null)}>Nouvelle vente</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Ventes({ boutique, ventes }) {
  const [detail, setDetail] = useState(null);
  const total = ventes.reduce((s, v) => s + v.total, 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#888' }}>Total cumulé</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: G.brand }}>{fmt(total)}</div>
        </div>
        <Badge>{ventes.length} ventes</Badge>
      </div>
      {[...ventes].reverse().map(v => (
        <div key={v.id} onClick={() => setDetail(v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Reçu #{v.receipt_num}{v.client_nom ? ` — ${v.client_nom}` : ''}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{fmtDate(v.created_at)} {fmtTime(v.created_at)} · {v.items.length} article(s) · {v.pay_mode}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: G.brand }}>{fmt(v.total)}</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>voir →</div>
          </div>
        </div>
      ))}
      {ventes.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '40px 0', fontSize: 13 }}>Aucune vente</div>}
      {detail && (
        <Modal title={`Vente #${detail.receipt_num}`} onClose={() => setDetail(null)}>
          <div style={{ fontSize: 13 }}>
            <div style={{ marginBottom: 10, color: '#888' }}>{fmtDate(detail.created_at)} à {fmtTime(detail.created_at)} · {detail.pay_mode}{detail.client_nom ? ` · ${detail.client_nom}` : ''}</div>
            {detail.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span>{it.nom} × {it.qty}</span><span style={{ fontWeight: 600 }}>{fmt(it.prix * it.qty)}</span>
              </div>
            ))}
            {detail.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: G.amber }}><span>Remise</span><span>-{fmt(detail.discount)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontWeight: 700, fontSize: 15 }}>
              <span>Total</span><span style={{ color: G.brand }}>{fmt(detail.total)}</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn full onClick={() => printReceipt(boutique, detail.items, detail.items.reduce((s, i) => s + i.prix * i.qty, 0), detail.received, detail.discount, detail.pay_mode, detail.receipt_num, detail.client_nom)}>
                🖨️ Réimprimer le reçu
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stats({ ventes, produits }) {
  const byDay = {};
  ventes.forEach(v => { const d = fmtDate(v.created_at); byDay[d] = (byDay[d] || 0) + v.total; });
  const days = Object.entries(byDay).slice(-7);
  const maxDay = Math.max(...days.map(d => d[1]), 1);
  const byCat = {};
  ventes.forEach(v => v.items.forEach(it => {
    const p = produits.find(x => x.id === it.id);
    const cat = p?.categorie || 'Autre';
    byCat[cat] = (byCat[cat] || 0) + it.prix * it.qty;
  }));
  const top = Object.entries(ventes.reduce((acc, v) => {
    v.items.forEach(it => { if (!acc[it.id]) acc[it.id] = { nom: it.nom, qty: 0, total: 0 }; acc[it.id].qty += it.qty; acc[it.id].total += it.prix * it.qty; });
    return acc;
  }, {})).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Ventes des 7 derniers jours</div>
        {days.length === 0 ? <div style={{ color: '#ccc', fontSize: 13 }}>Pas encore de données</div> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {days.map(([d, v]) => (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: G.brand, borderRadius: 4, height: Math.max(6, (v / maxDay) * 80) }} />
                <div style={{ fontSize: 10, color: '#aaa' }}>{d.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Par catégorie</div>
          {Object.entries(byCat).length === 0 ? <div style={{ color: '#ccc', fontSize: 13 }}>Pas de données</div>
            : Object.entries(byCat).map(([cat, v]) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{CAT_ICONS[cat] || '📦'} {cat}</span><span style={{ fontWeight: 600 }}>{fmt(v)}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                  <div style={{ height: 6, background: G.brand, borderRadius: 3, width: `${(v / Math.max(...Object.values(byCat))) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Top produits</div>
          {top.length === 0 ? <div style={{ color: '#ccc', fontSize: 13 }}>Pas de données</div>
            : top.map(([id, p], i) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span><span style={{ color: G.brand, fontWeight: 700, marginRight: 6 }}>#{i + 1}</span>{p.nom}</span>
                <span style={{ fontWeight: 600 }}>{p.qty} vendus</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Parametres({ boutique, setBoutique, onLogout }) {
  const [form, setForm] = useState({ nom: boutique.nom, tel: boutique.tel || '', adresse: boutique.adresse || '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await db.patch('boutiques', { nom: form.nom, tel: form.tel, adresse: form.adresse }, `?id=eq.${boutique.id}`);
    const updated = { ...boutique, ...form };
    setBoutique(updated);
    localStorage.setItem('boutikpro_session', JSON.stringify(updated));
    setSaving(false);
    alert('Sauvegardé !');
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <Inp label="Nom de la boutique" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
      <Inp label="Téléphone" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} />
      <Inp label="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn onClick={save} disabled={saving}>{saving ? '...' : 'Enregistrer'}</Btn>
        <Btn color="red" onClick={onLogout}>Se déconnecter</Btn>
      </div>
      <div style={{ marginTop: 24, padding: '14px 16px', background: G.brandLight, borderRadius: 10 }}>
        <div style={{ fontWeight: 600, color: G.brandDark, fontSize: 13 }}>Plan : Gratuit (30 jours d'essai)</div>
        <div style={{ fontSize: 12, color: G.brandDark, marginTop: 4 }}>Toutes les fonctionnalités actives.</div>
      </div>
    </div>
  );
}

const NAVS = [
  { id: 'dashboard', icon: '🏠', label: 'Accueil' },
  { id: 'caisse', icon: '💳', label: 'Caisse' },
  { id: 'produits', icon: '📦', label: 'Produits' },
  { id: 'ventes', icon: '📋', label: 'Ventes' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'parametres', icon: '⚙️', label: 'Paramètres' },
];

export default function App() {
  const [boutique, setBoutique] = useState(null);
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('boutikpro_session');
    if (s) { const b = JSON.parse(s); setBoutique(b); loadData(b.id); }
    else setLoading(false);
  }, []);
  useEffect(() => {
    if (!boutique) return;
    const interval = setInterval(async () => {
      try {
        const rows = await db.get('boutiques', `?id=eq.${boutique.id}&select=actif,is_admin`);
        if (!rows || rows.length === 0 || (!rows[0].actif && !rows[0].is_admin)) {
          localStorage.removeItem('boutikpro_session');
          setBoutique(null);
          setProduits([]);
          setVentes([]);
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [boutique]);
  async function loadData(id) {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([
        db.get('produits', `?boutique_id=eq.${id}&order=created_at.asc`),
        db.get('ventes', `?boutique_id=eq.${id}&order=created_at.asc`),
      ]);
      setProduits(p || []); setVentes(v || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleLogin(b) { setBoutique(b); await loadData(b.id); }

  function handleLogout() {
    localStorage.removeItem('boutikpro_session');
    setBoutique(null); setProduits([]); setVentes([]); setView('dashboard');
  }

  if (!boutique) return <LoginPage onLogin={handleLogin} />;
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}><Spinner /></div>;

  // ─── ADMIN ───
  if (boutique.is_admin) return <AdminDashboard adminBoutique={boutique} onLogout={handleLogout} />;

  const props = { boutique, setBoutique, produits, setProduits, ventes, setVentes, onLogout: handleLogout };
  const views = { dashboard: Dashboard, caisse: Caisse, produits: Produits, ventes: Ventes, stats: Stats, parametres: Parametres };
  const ViewComp = views[view];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f7f8fa' }}>
      <div style={{ width: sideOpen ? 200 : 58, background: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', transition: 'width .2s', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ width: 32, height: 32, background: G.brand, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>B</div>
          {sideOpen && <div><div style={{ fontWeight: 700, fontSize: 14 }}>BoutikPro</div><div style={{ fontSize: 10, color: '#aaa' }}>SaaS v3.0</div></div>}
        </div>
        {sideOpen && <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Boutique</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: G.brand }}>{boutique.nom}</div>
        </div>}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAVS.map(n => (
            <div key={n.id} onClick={() => setView(n.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: view === n.id ? G.brand : '#555', fontWeight: view === n.id ? 600 : 400, background: view === n.id ? G.brandLight : 'transparent', borderRight: view === n.id ? `3px solid ${G.brand}` : '3px solid transparent' }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && <span style={{ whiteSpace: 'nowrap' }}>{n.label}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0' }}>
          <div onClick={() => setSideOpen(!sideOpen)} style={{ cursor: 'pointer', fontSize: 16, textAlign: sideOpen ? 'right' : 'center', color: '#bbb' }}>{sideOpen ? '◀' : '▶'}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{NAVS.find(n => n.id === view)?.icon} {NAVS.find(n => n.id === view)?.label}</div>
          <div style={{ fontSize: 12, color: G.brand, fontWeight: 500 }}>● En ligne</div>
        </div>
        <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
          <ViewComp {...props} />
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Trash2, Plus, Trophy, Fish, RefreshCw, LogOut, FolderOpen,
  Lock, Archive, Share2, CheckCircle, Eye, EyeOff,
  MapPin, Phone, Upload, Users, ChevronDown, ChevronUp, Calendar,
  X, ClipboardList, AlertTriangle
} from 'lucide-react';

const supabaseUrl = 'https://sskzueeefjcuqtuesojm.supabase.co';
const supabaseKey = 'sb_publishable_8iZhmXZCwGJpkJaoEm7cZg_3WFhQwUa';
const supabase    = createClient(supabaseUrl, supabaseKey);

// ── EmailJS ───────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_wu00jmp';
const EMAILJS_TEMPLATE_ID = 'template_nu9ip5j';
const EMAILJS_PUBLIC_KEY  = 'V012FAAyECRsTZmXp';
const EMAILJS_TO_EMAIL    = 'horgaszathonlap@gmail.com';
// EmailJS template változók: {{verseny_nev}}, {{jelentkezo_nev}}, {{telefon}}, {{datum}}, {{to_email}}

const sendRegEmail = async (versenyNev, nev, telefon) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY, accessToken: EMAILJS_PUBLIC_KEY,
        template_params: {
          verseny_nev: versenyNev, jelentkezo_nev: nev, telefon: telefon,
          datum: new Date().toLocaleString('hu-HU'), to_email: EMAILJS_TO_EMAIL,
        },
      }),
    });
  } catch (e) { console.warn('Email küldési hiba:', e); }
};

const DEFAULT_MAX_FISH = 10;

const safeField = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  return (s === '' || s === 'nullable' || s === 'nullable::text') ? '' : s;
};

// ── REGISZTRÁCIÓS MODAL ───────────────────────────────────────────────────────
const RegistrationModal = ({ competitionTitle, onClose, onSubmit }) => {
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  const handlePhone = (v) => setPhone(v.replace(/[^0-9+\-\s]/g, ''));

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Add meg a neved!'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Adj meg egy érvényes telefonszámot!'); return;
    }
    setSubmitting(true); setError('');
    try {
      await onSubmit(name.trim(), phone.trim());
      setDone(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sikeres jelentkezés!</h2>
        <p className="text-sm text-gray-500 mb-1">Neved felkerült a nevezési listára.</p>
        <p className="text-xs text-gray-400 mb-5">A szervező értesítést kapott a jelentkezésedről.</p>
        <button onClick={onClose} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Bezárás</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-600" />Jelentkezés
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {competitionTitle && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Verseny</p>
            <p className="text-sm font-bold text-blue-800">{competitionTitle}</p>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Neved <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="pl.: Pontyos Pál"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Telefonszám <span className="text-red-500">*</span></label>
            <input type="tel" value={phone} onChange={(e) => handlePhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="+36 30 123 4567"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-sm" />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />A telefonszámot csak a szervező kapja meg, nem tároljuk.
            </p>
          </div>
        </div>
        {error && <p className="text-red-600 text-xs mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm">Mégse</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm disabled:bg-gray-400 flex items-center justify-center gap-2">
            {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" />Küldés...</> : 'Jelentkezés ✓'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── VERSENY KÁRTYA ────────────────────────────────────────────────────────────
const EventCard = ({ comp, registrations, onRegister }) => {
  const [expanded, setExpanded] = useState(true);

  const desc      = safeField(comp?.description);
  const loc       = safeField(comp?.location);
  const contact   = safeField(comp?.contact);
  const imgUrl    = safeField(comp?.image_url);
  const startDate = safeField(comp?.start_date);
  const startTime = safeField(comp?.start_time) || '00:01';
  const endTime   = safeField(comp?.end_time)   || '23:59';
  const days      = comp?.days     || 1;
  const maxFish   = comp?.max_fish || DEFAULT_MAX_FISH;

  const formatDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return d.getFullYear() + '. ' +
      ['január','február','március','április','május','június',
       'július','augusztus','szeptember','október','november','december'][d.getMonth()] +
      ' ' + d.getDate() + '.';
  };

  return (
    <div className="rounded-2xl shadow-md overflow-hidden mb-2 border-2 border-green-300">
      {/* Fejléc */}
      <div className="px-5 py-4 cursor-pointer select-none bg-gradient-to-r from-green-700 to-teal-600 text-white"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="block w-3 h-3 rounded-full bg-green-300 animate-pulse flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Aktuális verseny{startDate ? ` · ${formatDate(startDate)}` : ''}
              </span>
              <h2 className="text-lg font-bold leading-snug">{comp.title}</h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="bg-white bg-opacity-20 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white border-opacity-30">{days} napos</span>
                <span className="bg-white bg-opacity-20 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white border-opacity-30">{maxFish} halat fogott</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {registrations.length > 0 && (
              <span className="text-xs bg-white bg-opacity-25 font-bold px-2 py-1 rounded-full">{registrations.length} jelentkező</span>
            )}
            {expanded ? <ChevronUp className="w-5 h-5 opacity-70" /> : <ChevronDown className="w-5 h-5 opacity-70" />}
          </div>
        </div>
      </div>

      {/* Tartalom */}
      {expanded && (
        <div className="bg-white">
          {imgUrl && (
            <div className="overflow-hidden">
              <img src={imgUrl} alt="Verseny" className="w-full h-auto"
                onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
            </div>
          )}
          <div className="px-5 py-4 space-y-4">
            {(desc || loc || startDate || contact) ? (
              <div className="space-y-3">
                {startDate && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-800">{days} napos verseny · {formatDate(startDate)}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Napi horgászat: {startTime} – {endTime}</p>
                    </div>
                  </div>
                )}
                {loc && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm">{loc}</p>
                  </div>
                )}
                {desc && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />Verseny kiírás
                    </p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{desc}</p>
                  </div>
                )}
                {contact && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm">{contact}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-2">A verseny kiírása hamarosan megjelenik.</p>
            )}

            {/* Jelentkezők */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" />Jelentkezők
                {registrations.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">{registrations.length}</span>
                )}
              </p>
              {registrations.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {registrations.map((r, i) => (
                    <div key={r.id || i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
                      <span className="text-sm font-semibold text-blue-800">{r.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3 italic">Még nincs jelentkező — légy az első!</p>
              )}
              <button onClick={onRegister}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" />Jelentkezés a versenyre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── RAJTSZÁM SOR (admin) ──────────────────────────────────────────────────────
const RegRow = ({ reg, onAdd, alreadyAdded }) => {
  const [rajt, setRajt] = useState(reg.start_number ? String(reg.start_number) : '');

  if (alreadyAdded) return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 opacity-60">
      <span className="w-16 text-center text-xs text-gray-400 font-bold">#{rajt||'–'}</span>
      <span className="flex-1 text-sm text-gray-500 line-through">{reg.name}</span>
      <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />Hozzáadva</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
      <input type="number" min="1" max="9999" value={rajt} onChange={(e) => setRajt(e.target.value)}
        placeholder="Rajt#"
        className="w-16 px-2 py-1.5 border-2 border-gray-300 rounded-lg text-sm text-center focus:border-blue-500 focus:outline-none bg-white font-bold" />
      <span className="flex-1 text-sm font-semibold text-blue-800">{reg.name}</span>
      <button onClick={() => onAdd(reg.name, parseInt(rajt) || null)}
        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1 flex-shrink-0">
        <Plus className="w-3 h-3" />Hozzáad
      </button>
    </div>
  );
};

// ── RAJTSZÁM CELLA (szerkeszthető, fogásbeviteli táblában) ────────────────────
const StartNumberCell = ({ competitor, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(competitor.start_number ? String(competitor.start_number) : '');

  const handleSave = () => {
    onSave(competitor.id, val);
    setEditing(false);
  };

  if (editing) return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number" min="1" max="9999"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        className="w-16 px-1.5 py-0.5 border-2 border-blue-500 rounded-lg text-xs text-center focus:outline-none font-bold bg-white"
        autoFocus
      />
      <button onClick={handleSave} className="px-1.5 py-0.5 bg-green-600 text-white rounded text-xs font-bold">✓</button>
      <button onClick={() => setEditing(false)} className="px-1.5 py-0.5 bg-gray-400 text-white rounded text-xs">✕</button>
    </span>
  );

  return (
    <span
      onClick={() => setEditing(true)}
      title="Kattints a rajtszám szerkesztéséhez"
      className="cursor-pointer"
    >
      {competitor.start_number
        ? <span className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-2 py-0.5 rounded-lg min-w-[2rem] text-center inline-block transition-colors">#{competitor.start_number}</span>
        : <span className="bg-gray-200 hover:bg-blue-100 text-gray-400 hover:text-blue-600 text-xs font-bold px-2 py-0.5 rounded-lg inline-block border border-dashed border-gray-300 hover:border-blue-400 transition-colors">#–</span>
      }
    </span>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function FishingCompetition() {

  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [loginError,     setLoginError]     = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [competitions,        setCompetitions]        = useState([]);
  const [showCompetitionList, setShowCompetitionList] = useState(false);
  const [showArchived,        setShowArchived]        = useState(false);
  const [archivedComp,        setArchivedComp]        = useState(null);
  const [archivedCompetitors, setArchivedCompetitors] = useState([]);

  const [competitionId,   setCompetitionId]   = useState(null);
  const [title,           setTitle]           = useState('Horgászverseny');
  const [maxFish,         setMaxFish]         = useState(DEFAULT_MAX_FISH);
  const [compDays,        setCompDays]        = useState(1);
  const [startDate,       setStartDate]       = useState('');
  const [dailyStartTime,  setDailyStartTime]  = useState('00:01');
  const [dailyEndTime,    setDailyEndTime]    = useState('23:59');
  const [location,        setLocation]        = useState('');
  const [description,     setDescription]     = useState('');
  const [contact,         setContact]         = useState('');
  const [imageUrl,        setImageUrl]        = useState('');
  const [tableVisibility, setTableVisibility] = useState({ mainRanking: true, todayBiggest: true, dailyBiggest: true });

  const [showSettings,    setShowSettings]    = useState(false);
  const [sTitle,          setSTitle]          = useState('');
  const [sLocation,       setSLocation]       = useState('');
  const [sDescription,    setSDescription]    = useState('');
  const [sContact,        setSContact]        = useState('');
  const [sStartDate,      setSStartDate]      = useState('');
  const [sDailyStartTime, setSDailyStartTime] = useState('00:01');
  const [sDailyEndTime,   setSDailyEndTime]   = useState('23:59');
  const [sDays,           setSDays]           = useState(1);

  const [competitors,   setCompetitors]   = useState([]);
  const [newName,       setNewName]       = useState('');
  const [editingId,     setEditingId]     = useState(null);
  const [weightInput,   setWeightInput]   = useState('');
  const [editingCatch,  setEditingCatch]  = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [catchDay,      setCatchDay]      = useState(1);

  const [registrations,  setRegistrations]  = useState([]);
  const [showRegModal,   setShowRegModal]   = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [pageViews,      setPageViews]      = useState({ today: 0, week: 0, total: 0, mobil: 0, pc: 0 });
  const [dbError,        setDbError]        = useState(null);

  useEffect(() => {
    trackVisit(); checkUser();
    const { data: auth } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => auth?.subscription?.unsubscribe();
  }, []);

  const calcCurrentDay = (sd, st, days) => {
    if (!sd) return 1;
    const start = new Date(`${sd}T${st || '00:01'}:00`);
    const diff  = Math.floor((Date.now() - start) / 86400000) + 1;
    return Math.max(1, Math.min(days || 1, diff));
  };

  const trackVisit = async () => {
    try {
      const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobil' : 'pc';
      await supabase.from('page_views').insert([{ device }]);
      await loadPageViews();
    } catch (e) { console.error(e); }
  };

  const loadPageViews = async () => {
    try {
      const now        = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const [{ count: total }, { count: today }, { count: week }, { count: mob }, { count: pc }] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', todayStart),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', weekStart),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('device', 'mobil'),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('device', 'pc'),
      ]);
      setPageViews({ today: today||0, week: week||0, total: total||0, mobil: mob||0, pc: pc||0 });
    } catch (e) { console.error(e); }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await loadCompetitions();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setLoginError(''); setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user); setShowLoginModal(false); setEmail(''); setPassword('');
    } catch { setLoginError('Hibás email vagy jelszó'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); setUser(null); } catch (e) { console.error(e); }
  };

  const buildCompetitors = async (compId, mf) => {
    const { data: cd, error: ce } = await supabase.from('competitors').select('*').eq('competition_id', compId).order('created_at', { ascending: true });
    if (ce) throw ce;
    return Promise.all((cd || []).map(async (c) => {
      const { data: catches } = await supabase.from('catches').select('*').eq('competitor_id', c.id).order('weight', { ascending: false });
      return { ...c, catches: (catches || []).slice(0, mf).map(x => ({ weight: x.weight, day: x.competition_day || 1, id: x.id })) };
    }));
  };

  const loadCompetitions = async () => {
    try {
      const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCompetitions(data || []);
      const active = (data || []).find(c => !c.archived);
      if (active) await loadCompetition(active.id, data);
      else if (data && data.length > 0) await loadCompetition(data[0].id, data);
    } catch (e) { setDbError(e.message); }
  };

  const loadCompetition = async (compId, allComps) => {
    try {
      setLoading(true);
      const { data: comp, error: ce } = await supabase.from('competitions').select('*').eq('id', compId).single();
      if (ce) throw ce;
      const mf = comp.max_fish || DEFAULT_MAX_FISH;
      const days = comp.days || 1;
      const sd = comp.start_date || '';
      const st = comp.start_time || '00:01';
      const et = comp.end_time   || '23:59';
      setCompetitionId(comp.id); setTitle(comp.title); setMaxFish(mf); setCompDays(days);
      setStartDate(sd); setDailyStartTime(st); setDailyEndTime(et);
      setLocation(comp.location || ''); setDescription(comp.description || '');
      setContact(comp.contact || ''); setImageUrl(comp.image_url || '');
      setTableVisibility(comp.table_visibility || { mainRanking: true, todayBiggest: true, dailyBiggest: true });
      setSTitle(comp.title); setSLocation(comp.location||''); setSDescription(comp.description||'');
      setSContact(comp.contact||''); setSStartDate(sd); setSDailyStartTime(st); setSDailyEndTime(et); setSDays(days);
      const built = await buildCompetitors(comp.id, mf);
      setCompetitors(built);
      setCatchDay(calcCurrentDay(sd, st, days));
      const { data: regs } = await supabase.from('registrations').select('*').eq('competition_id', comp.id).order('created_at', { ascending: true });
      setRegistrations(regs || []);
      setShowCompetitionList(false);
      if (allComps) setCompetitions(allComps);
    } catch (e) { setDbError(e.message); }
    finally { setLoading(false); }
  };

  const loadArchivedCompetition = async (compId) => {
    try {
      setLoading(true);
      const { data: comp, error } = await supabase.from('competitions').select('*').eq('id', compId).single();
      if (error) throw error;
      setArchivedComp(comp);
      const built = await buildCompetitors(comp.id, comp.max_fish || DEFAULT_MAX_FISH);
      setArchivedCompetitors(built);
      setShowArchived(true); setShowCompetitionList(false);
    } catch (e) { setDbError(e.message); }
    finally { setLoading(false); }
  };

  const saveCompSettings = async (updates) => {
    if (!competitionId) return;
    try { await supabase.from('competitions').update(updates).eq('id', competitionId); }
    catch (e) { setDbError(e.message); }
  };

  const saveAnnouncementSettings = async () => {
    const u = { title: sTitle, location: sLocation, description: sDescription, contact: sContact,
      start_date: sStartDate, start_time: sDailyStartTime, end_time: sDailyEndTime, days: sDays };
    await saveCompSettings(u);
    setTitle(sTitle); setLocation(sLocation); setDescription(sDescription); setContact(sContact);
    setStartDate(sStartDate); setDailyStartTime(sDailyStartTime); setDailyEndTime(sDailyEndTime); setCompDays(sDays);
    setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, ...u } : c));
    setCatchDay(calcCurrentDay(sStartDate, sDailyStartTime, sDays));
    alert('Beállítások mentve!');
  };

  const handleMaxFishChange = (n) => { setMaxFish(n); saveCompSettings({ max_fish: n }); };

  const toggleTableVisibility = (key) => {
    const nv = { ...tableVisibility, [key]: !tableVisibility[key] };
    setTableVisibility(nv); saveCompSettings({ table_visibility: nv });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !competitionId) return;
    setImageUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const name = `competition-${competitionId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('competition-images').upload(name, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('competition-images').getPublicUrl(name);
      setImageUrl(urlData.publicUrl);
      await saveCompSettings({ image_url: urlData.publicUrl });
    } catch (e) { alert('Képfeltöltési hiba: ' + e.message); }
    finally { setImageUploading(false); }
  };

  const archiveCompetition = async () => {
    if (!competitionId || !window.confirm('Biztosan lezárod és archiválod?')) return;
    try { await supabase.from('competitions').update({ archived: true }).eq('id', competitionId); await loadCompetitions(); }
    catch (e) { alert('Hiba: ' + e.message); }
  };

  const unarchiveCompetition = async (compId) => {
    try { await supabase.from('competitions').update({ archived: false }).eq('id', compId); setShowArchived(false); setArchivedComp(null); await loadCompetitions(); }
    catch (e) { alert('Hiba: ' + e.message); }
  };

  const createNewCompetition = async () => {
    try {
      const now = new Date();
      const ds  = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
      const { error } = await supabase.from('competitions').insert([{
        title: 'Horgászverseny - ' + ds, archived: false,
        max_fish: DEFAULT_MAX_FISH, days: 1, start_time: '00:01', end_time: '23:59',
        table_visibility: { mainRanking: true, todayBiggest: true, dailyBiggest: true }
      }]);
      if (error) throw error;
      await loadCompetitions(); setShowCompetitionList(false);
    } catch (e) { alert('Hiba: ' + e.message); }
  };

  const deleteCompetition = async (compId) => {
    if (!window.confirm('Biztosan törölni szeretnéd?')) return;
    try { await supabase.from('competitions').delete().eq('id', compId); await loadCompetitions(); }
    catch (e) { alert('Hiba: ' + e.message); }
  };

  const addCompetitor = async (nameOverride, startNumber) => {
    const name = (nameOverride || newName).trim();
    if (!name || !competitionId) return;
    try {
      const { data, error } = await supabase.from('competitors').insert([{ competition_id: competitionId, name, start_number: startNumber || null }]).select();
      if (error) throw error;
      setCompetitors(prev => [...prev, { ...data[0], catches: [] }]);
      if (!nameOverride) setNewName('');
    } catch (e) { alert('Hiba: ' + e.message); }
  };

  const saveStartNumber = async (competitorId, num) => {
    const n = num ? (parseInt(num) || null) : null;
    try {
      await supabase.from('competitors').update({ start_number: n }).eq('id', competitorId);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, start_number: n } : c));
    } catch (e) { alert('Hiba: ' + e.message); }
  };
    if (!deleteConfirm) return;
    try {
      await supabase.from('competitors').delete().eq('id', deleteConfirm.id);
      setCompetitors(prev => prev.filter(c => c.id !== deleteConfirm.id));
    } catch (e) { alert('Hiba: ' + e.message); }
    finally { setDeleteConfirm(null); }
  };

  const addWeight = async (competitorId) => {
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) { alert('Adj meg érvényes súlyt grammban'); return; }
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      let nc = [...competitor.catches, { weight, day: catchDay }];
      if (nc.length > maxFish) {
        const minW   = Math.min(...nc.map(c => c.weight));
        const minIdx = nc.map(c => c.weight).lastIndexOf(minW);
        const minC   = nc[minIdx];
        if (minC.id) await supabase.from('catches').delete().eq('id', minC.id);
        nc.splice(minIdx, 1);
      }
      const { data: ins } = await supabase.from('catches').insert([{ competitor_id: competitorId, weight, competition_day: catchDay }]).select();
      nc[nc.length - 1] = { weight, day: catchDay, id: ins?.[0]?.id };
      nc.sort((a, b) => b.weight - a.weight);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: nc } : c));
      setWeightInput(''); setEditingId(null);
    } catch (e) { alert('Hiba: ' + e.message); }
  };

  const removeCatch = async (competitorId, catchIndex) => {
    try {
      const catchObj = competitors.find(c => c.id === competitorId).catches[catchIndex];
      if (catchObj.id) await supabase.from('catches').delete().eq('id', catchObj.id);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: c.catches.filter((_, i) => i !== catchIndex) } : c));
    } catch (e) { alert('Hiba: ' + e.message); }
  };

  const updateCatch = async (competitorId, catchIndex, newWeight) => {
    const w = parseInt(newWeight);
    if (isNaN(w) || w <= 0) { alert('Adj meg érvényes súlyt grammban'); return; }
    try {
      const catchObj = competitors.find(c => c.id === competitorId).catches[catchIndex];
      if (catchObj.id) await supabase.from('catches').update({ weight: w }).eq('id', catchObj.id);
      const nc = competitors.find(c => c.id === competitorId).catches.map((c, i) => i === catchIndex ? { ...c, weight: w } : c);
      nc.sort((a, b) => b.weight - a.weight);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: nc } : c));
      setEditingCatch(null);
    } catch (e) { alert('Hiba: ' + e.message); }
  };

  const submitRegistration = async (name, phone) => {
    if (!competitionId) throw new Error('Nincs aktív verseny');
    // Csak nevet mentünk — telefonszámot NEM tároljuk (azonos nevűek is jelentkezhetnek)
    const { data, error } = await supabase.from('registrations').insert([{ competition_id: competitionId, name }]).select();
    if (error) throw error;
    await sendRegEmail(title, name, phone);
    setRegistrations(prev => [...prev, { ...(data?.[0] || {}), name }]);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title, url });
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 3000); });
    } else alert('Másold ki a böngésző címsorából!');
  };

  const results = useMemo(() => {
    const currentDay = calcCurrentDay(startDate, dailyStartTime, compDays);
    const withScores = competitors.map(c => ({
      ...c, totalWeight: c.catches.reduce((s, x) => s + x.weight, 0), fishCount: c.catches.length,
    }));
    const mainRanking = [...withScores].sort((a, b) =>
      b.fishCount !== a.fishCount ? b.fishCount - a.fishCount : b.totalWeight - a.totalWeight);
    const allCatches = [];
    competitors.forEach(c => c.catches.forEach(x => allCatches.push({ name: c.name, weight: x.weight, day: x.day || 1 })));
    const todayBiggest = allCatches.filter(x => x.day === currentDay).sort((a, b) => b.weight - a.weight);
    const dailyBiggest = {};
    for (let d = 1; d <= compDays; d++) {
      dailyBiggest[d] = allCatches.filter(x => x.day === d).sort((a, b) => b.weight - a.weight).slice(0, 3);
    }
    return { mainRanking, todayBiggest, dailyBiggest, currentDay };
  }, [competitors, compDays, startDate, dailyStartTime]);

  const archivedResults = useMemo(() => {
    if (!archivedComp) return { mainRanking: [], dailyBiggest: {} };
    const days = archivedComp.days || 1;
    const withScores = archivedCompetitors.map(c => ({
      ...c, totalWeight: c.catches.reduce((s, x) => s + x.weight, 0), fishCount: c.catches.length,
    }));
    const mainRanking = [...withScores].sort((a, b) =>
      b.fishCount !== a.fishCount ? b.fishCount - a.fishCount : b.totalWeight - a.totalWeight);
    const allCatches = [];
    archivedCompetitors.forEach(c => c.catches.forEach(x => allCatches.push({ name: c.name, weight: x.weight, day: x.day || 1 })));
    const dailyBiggest = {};
    for (let d = 1; d <= days; d++) {
      dailyBiggest[d] = allCatches.filter(x => x.day === d).sort((a, b) => b.weight - a.weight).slice(0, 3);
    }
    return { mainRanking, dailyBiggest, days, mf: archivedComp.max_fish || DEFAULT_MAX_FISH };
  }, [archivedCompetitors, archivedComp]);

  const placeEmoji = (i) => ['🥇', '🥈', '🥉'][i] || `${i+1}.`;
  const placeStyle = (i) =>
    i === 0 ? 'flex justify-between items-center p-3 rounded-xl bg-yellow-50 border-2 border-yellow-300'
    : i === 1 ? 'flex justify-between items-center p-3 rounded-xl bg-gray-50 border-2 border-gray-300'
    : i === 2 ? 'flex justify-between items-center p-3 rounded-xl bg-orange-50 border-2 border-orange-300'
    : 'flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-200';

  const hiddenBanner = (label) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-40">
      <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
      <p className="font-bold text-gray-400">{label}</p>
      <p className="text-sm text-gray-300">Eredmény hamarosan</p>
    </div>
  );
  const adminHiddenNote = (
    <div className="flex items-center gap-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
      <EyeOff className="w-4 h-4 text-yellow-500" />
      <span className="text-xs text-yellow-600 font-semibold">Látogatók elől elrejtve</span>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Fish className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600 text-xl font-semibold">Betöltés...</p>
      </div>
    </div>
  );

  // ── ARCHÍV NÉZET ──────────────────────────────────────────────────────────
  if (showArchived && archivedComp) {
    const { mainRanking: ar, dailyBiggest: adb, days } = archivedResults;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-2xl shadow-xl mb-4">
            <div className="flex items-center gap-3">
              <Archive className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold">{archivedComp.title}</h1>
                <p className="mt-1 text-gray-300 text-sm">Korábbi verseny · {days} napos · {archivedComp.max_fish || DEFAULT_MAX_FISH} halat fogott</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => { setShowArchived(false); setArchivedComp(null); }} className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-100 text-sm font-semibold shadow">← Vissza</button>
            {user && <button onClick={() => unarchiveCompetition(archivedComp.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold flex items-center gap-2 shadow"><RefreshCw className="w-4 h-4" />Visszaállítás</button>}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800"><Trophy className="w-5 h-5 text-yellow-500" />Végeredmény Rangsor</h2>
            <div className="space-y-2">
              {ar.map((c, i) => (
                <div key={c.id} className={placeStyle(i)}>
                  <div className="flex items-center gap-2"><span className="text-2xl">{placeEmoji(i)}</span><span className="font-bold">{c.name}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-xs">{c.fishCount} hal</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold text-sm">{c.totalWeight}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5">
            <h3 className="text-base font-bold mb-4 text-purple-700 flex items-center gap-2"><Fish className="w-5 h-5 text-purple-400" />Napi Legnagyobb Halak</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: days }, (_, i) => i+1).map(d => (
                <div key={d} className="rounded-xl p-4 border-2 border-gray-200 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-2 text-sm">{d}. nap</p>
                  {(adb[d]||[]).length > 0
                    ? (adb[d]||[]).map((e,i) => (
                        <div key={i} className="flex justify-between py-1 text-sm">
                          <span>{placeEmoji(i)} {e.name}</span>
                          <span className="font-bold text-purple-700">{e.weight}g</span>
                        </div>))
                    : <p className="text-gray-400 text-xs">Nincs adat</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VERSENY LISTA NÉZET ───────────────────────────────────────────────────
  if (showCompetitionList) {
    const activeList   = competitions.filter(c => !c.archived);
    const archivedList = competitions.filter(c =>  c.archived);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FolderOpen className="w-7 h-7 text-blue-600" />Versenyek</h2>
              <button onClick={() => setShowCompetitionList(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            {user && <button onClick={createNewCompetition} className="w-full mb-6 bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-700 font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" />Új Verseny Indítása</button>}
            <h3 className="text-xs font-bold text-green-700 mb-2 uppercase tracking-wide flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />Aktuális Versenyek</h3>
            <div className="space-y-3 mb-6">
              {activeList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nincs aktív verseny</p>}
              {activeList.map(comp => {
                const isAct = comp.id === competitionId;
                return (
                  <div key={comp.id} className={`border-2 rounded-2xl p-4 flex justify-between items-center ${isAct ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{comp.title}</h3>
                      <p className="text-gray-500 text-sm">{comp.days||1} napos · {comp.max_fish||DEFAULT_MAX_FISH} halat fogott</p>
                      {isAct && <span className="inline-block mt-1 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">Aktuális</span>}
                    </div>
                    <div className="flex gap-2">
                      {!isAct && <button onClick={() => loadCompetition(comp.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm">Megnyitás</button>}
                      {user && <button onClick={() => deleteCompetition(comp.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm">Törlés</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1"><Archive className="w-3 h-3" />Korábbi Versenyek</h3>
            <div className="space-y-3">
              {archivedList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Még nincsenek lezárt versenyek</p>}
              {archivedList.map(comp => (
                <div key={comp.id} className="border-2 rounded-2xl p-4 flex justify-between items-center border-gray-200 bg-gray-50">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-700">{comp.title}</h3>
                    <p className="text-gray-400 text-sm">{comp.days||1} napos · {comp.max_fish||DEFAULT_MAX_FISH} halat fogott</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadArchivedCompetition(comp.id)} className="px-3 py-1.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-semibold text-sm">Megtekint</button>
                    {user && <button onClick={() => deleteCompetition(comp.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm">Törlés</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FŐ NÉZET ──────────────────────────────────────────────────────────────
  const activeCompData = competitions.find(c => c.id === competitionId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">

      {showRegModal && (
        <RegistrationModal
          competitionTitle={title}
          onClose={() => setShowRegModal(false)}
          onSubmit={submitRegistration}
        />
      )}

      {showLoginModal && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Admin Bejelentkezés</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email cím</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jelszó</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" placeholder="••••••••" />
              </div>
              {loginError && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-3 py-2 rounded-xl text-sm">{loginError}</div>}
              <button onClick={handleLogin} disabled={loading}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-bold disabled:bg-gray-400">
                {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Versenyző törlése</h3>
            <p className="text-gray-600 mb-6">Biztosan törlöd <strong>{deleteConfirm.name}</strong> versenyzőt?</p>
            <div className="flex gap-3">
              <button onClick={executeDeleteCompetitor} className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 font-bold">Törlés</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-semibold">Mégsem</button>
            </div>
          </div>
        </div>
      )}

      {showShareToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />Link másolva!
        </div>
      )}

      {dbError && (
        <div className="bg-red-50 border-b-2 border-red-400 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{dbError}</p>
          <button onClick={() => setDbError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── FEJLÉC ── */}
      <div className="bg-gradient-to-r from-green-700 to-teal-600 text-white px-4 py-5 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-full p-2"><Fish className="w-7 h-7" /></div>
            <div>
              <h1 className="text-2xl font-bold">Horgászverseny</h1>
              <p className="text-green-200 text-xs mt-0.5">Eredmények és versenykiírások</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://egynaposverseny.vercel.app/" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 text-xs font-bold whitespace-nowrap flex items-center gap-1.5" title="Egynapos horgászverseny oldal">
              <Fish className="w-3.5 h-3.5" />Egynapos verseny
            </a>
            <button onClick={() => setShowCompetitionList(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30" title="Versenyek"><FolderOpen className="w-4 h-4" /></button>
            <button onClick={handleShare} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30" title="Megosztás"><Share2 className="w-4 h-4" /></button>
            {user
              ? <button onClick={handleLogout} className="p-2 bg-red-500/70 rounded-lg hover:bg-red-600/70" title="Kilépés"><LogOut className="w-4 h-4" /></button>
              : <button onClick={() => setShowLoginModal(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30" title="Admin"><Lock className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        {/* VERSENY KÁRTYA — csak látogatóknak */}
        {!user && activeCompData && (
          <EventCard
            comp={activeCompData}
            registrations={registrations}
            onRegister={() => setShowRegModal(true)}
          />
        )}

        {/* ADMIN: Beállítások */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">⚙️ Verseny Beállítások</h2>
              <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-semibold">
                {showSettings ? '▲ Bezár' : '▼ Megnyit'}
              </button>
            </div>
            {showSettings && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3 text-xs uppercase tracking-wide">📋 Verseny Kiírás & Adatok</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Verseny neve</label><input value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Helyszín</label><input value={sLocation} onChange={(e) => setSLocation(e.target.value)} placeholder="Pl.: Tisza-tó" className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Elérhetőség</label><input value={sContact} onChange={(e) => setSContact(e.target.value)} placeholder="Telefon / email" className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Kezdő dátum</label><input type="date" value={sStartDate} onChange={(e) => setSStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Napi verseny kezdése</label><input type="time" value={sDailyStartTime} onChange={(e) => setSDailyStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Napi verseny zárása</label><input type="time" value={sDailyEndTime} onChange={(e) => setSDailyEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400" /></div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Verseny kiírás / szabályok</label>
                    <textarea value={sDescription} onChange={(e) => setSDescription(e.target.value)} rows={4} placeholder="Verseny részletei, szabályok, nevezési díj..." className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-y" />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Borítókép</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className={`px-4 py-2 rounded-xl cursor-pointer text-sm flex items-center gap-2 font-semibold ${imageUploading ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        <Upload className="w-4 h-4" />{imageUploading ? 'Feltöltés...' : 'Kép feltöltése'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
                      </label>
                      {imageUrl && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />Feltöltve</span>}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-3 text-xs uppercase tracking-wide">🎣 Verseny Paraméterek</h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Hány napos? (1–5)</label>
                      <div className="flex gap-2">{[1,2,3,4,5].map(d => <button key={d} onClick={() => setSDays(d)} className={`w-11 h-11 rounded-full font-bold ${sDays===d?'bg-green-600 text-white shadow':'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'}`}>{d}</button>)}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Hány halat fogott verseny?</label>
                      <div className="flex gap-2 flex-wrap">{[1,2,3,4,5,6,7,8,9,10].map(n => <button key={n} onClick={() => handleMaxFishChange(n)} className={`w-11 h-11 rounded-full font-bold ${maxFish===n?'bg-blue-600 text-white shadow':'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'}`}>{n}</button>)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-3 text-xs uppercase tracking-wide">👁️ Eredmény Táblák</h3>
                  <div className="space-y-2">
                    {[{ key: 'mainRanking', label: '🏆 Fő Verseny Rangsor' }, { key: 'todayBiggest', label: '🐟 Mai Legnagyobb Hal' }, { key: 'dailyBiggest', label: '📅 Napi Legnagyobb Halak' }].map(({ key, label }) => (
                      <div key={key} className={`flex items-center justify-between p-2.5 rounded-xl border-2 ${tableVisibility[key] ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <span className="font-semibold text-sm">{label}</span>
                        <button onClick={() => toggleTableVisibility(key)} className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 font-semibold ${tableVisibility[key] ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                          {tableVisibility[key] ? <><EyeOff className="w-3 h-3" />Elrejt</> : <><Eye className="w-3 h-3" />Mutat</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button onClick={saveAnnouncementSettings} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold flex items-center gap-2 shadow">
                    <CheckCircle className="w-4 h-4" />Beállítások Mentése
                  </button>
                  <button onClick={archiveCompetition} className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-bold flex items-center gap-2 shadow">
                    <Archive className="w-4 h-4" />Lezárás & Archiválás
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN: Versenyző hozzáadása */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h2 className="text-base font-bold mb-4 text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Versenyző Hozzáadása</h2>
            {registrations.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                  <Users className="w-3 h-3" />Online jelentkezők — írd be a kihúzott rajtszámot, majd add hozzá:
                </p>
                <div className="space-y-2">
                  {registrations.map((r, i) => (
                    <RegRow key={r.id || i} reg={r}
                      alreadyAdded={competitors.some(c => c.name === r.name)}
                      onAdd={(name, startNum) => addCompetitor(name, startNum)} />
                  ))}
                </div>
              </div>
            )}
            <div className={registrations.length > 0 ? 'border-t border-gray-100 pt-4' : ''}>
              {registrations.length > 0 && <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kézi hozzáadás</p>}
              <div className="flex gap-2">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                  placeholder="Versenyző neve..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-sm" />
                <button onClick={() => addCompetitor()} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 font-bold text-sm">
                  <Plus className="w-4 h-4" />Hozzáad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN: Fogások bevitele */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base font-bold text-gray-800">🎣 Fogások Bevitele</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase">Bevitt nap:</span>
                {Array.from({ length: compDays }, (_, i) => i+1).map(d => (
                  <button key={d} onClick={() => setCatchDay(d)} className={`w-10 h-10 rounded-full font-bold text-sm ${catchDay===d?'bg-blue-600 text-white shadow':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{d}.</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-3 py-2.5 text-left font-bold sticky left-0 bg-gray-50">Versenyző</th>
                    <th className="px-2 py-2.5 text-center font-bold">Db</th>
                    {Array.from({ length: maxFish }, (_, i) => <th key={i} className="px-2 py-2.5 text-center font-bold text-xs whitespace-nowrap">{i+1}. hal</th>)}
                    <th className="px-2 py-2.5 text-center font-bold">Összsúly</th>
                    <th className="px-2 py-2.5 text-center font-bold">Bevitel</th>
                    <th className="px-2 py-2.5 text-center font-bold">Törlés</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c, idx) => {
                    const total = c.catches.reduce((s,x)=>s+x.weight,0);
                    return (
                      <tr key={c.id} className={idx%2===0?'bg-white':'bg-gray-50/50'}>
                        <td className="px-3 py-2.5 font-bold text-gray-800 sticky left-0 bg-inherit whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <StartNumberCell competitor={c} onSave={(id, num) => saveStartNumber(id, num)} />
                            {c.name}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-xs">{c.catches.length}</span></td>
                        {Array.from({ length: maxFish }, (_, i) => (
                          <td key={i} className="px-1.5 py-2 text-center">
                            {c.catches[i] ? (
                              editingCatch?.competitorId===c.id && editingCatch?.catchIndex===i ? (
                                <div className="flex gap-1 items-center justify-center">
                                  <input type="number" value={editingCatch.value} onChange={(e) => setEditingCatch({...editingCatch,value:e.target.value})} onKeyPress={(e) => e.key==='Enter'&&updateCatch(c.id,i,editingCatch.value)} className="w-14 px-1 py-0.5 border-2 border-green-500 rounded-lg text-center text-xs focus:outline-none" autoFocus />
                                  <button onClick={() => updateCatch(c.id,i,editingCatch.value)} className="px-1.5 py-0.5 bg-green-600 text-white rounded text-xs">✓</button>
                                  <button onClick={() => setEditingCatch(null)} className="px-1.5 py-0.5 bg-gray-400 text-white rounded text-xs">✕</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-xs font-semibold text-green-700 cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setEditingCatch({competitorId:c.id,catchIndex:i,value:c.catches[i].weight})}>{c.catches[i].weight}g</span>
                                  <span className="text-gray-300 text-xs">({c.catches[i].day}n)</span>
                                  <button onClick={() => removeCatch(c.id,i)} className="text-red-400 hover:text-red-600 text-sm ml-0.5">×</button>
                                </div>
                              )
                            ) : <span className="text-gray-300 text-xs">–</span>}
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold text-xs whitespace-nowrap">{total}g</span></td>
                        <td className="px-2 py-2">
                          {editingId===c.id
                            ? <div className="flex gap-1 items-center">
                                <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyPress={(e) => e.key==='Enter'&&addWeight(c.id)} placeholder="g" className="w-16 px-2 py-1 border-2 border-blue-500 rounded-lg text-sm focus:outline-none" autoFocus />
                                <button onClick={() => addWeight(c.id)} className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">OK</button>
                                <button onClick={() => {setEditingId(null);setWeightInput('');}} className="px-2 py-1 bg-gray-400 text-white rounded-lg text-xs">✕</button>
                              </div>
                            : <button onClick={() => setEditingId(c.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold whitespace-nowrap">Bevitel</button>}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => setDeleteConfirm({id:c.id,name:c.name})} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {competitors.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Fish className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Még nincsenek versenyzők.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EREDMÉNY TÁBLÁK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {(user || tableVisibility.mainRanking) ? (
              <div className="bg-white rounded-2xl shadow-lg p-5 h-full">
                {user && !tableVisibility.mainRanking && adminHiddenNote}
                <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />Verseny Rangsor
                  <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{results.currentDay}. nap</span>
                </h3>
                {results.mainRanking.length > 0 ? (
                  <div className="space-y-2">
                    {results.mainRanking.map((c, i) => (
                      <div key={c.id} className={placeStyle(i)}>
                        <div className="flex items-center gap-2"><span className="text-2xl">{placeEmoji(i)}</span><span className="font-bold text-gray-800">{c.name}</span></div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-xs">{c.fishCount} hal</span>
                          <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold text-sm">{c.totalWeight} g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400"><Fish className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Még nincs adat</p></div>
                )}
              </div>
            ) : hiddenBanner('Verseny Rangsor')}
          </div>

          <div className="space-y-5">
            {(user || tableVisibility.todayBiggest) ? (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                {user && !tableVisibility.todayBiggest && adminHiddenNote}
                <h3 className="text-base font-bold mb-3 text-red-700 flex items-center gap-2">
                  <Fish className="w-5 h-5 text-red-400" />Mai Legnagyobb Hal
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{results.currentDay}. nap</span>
                </h3>
                {results.todayBiggest.length > 0
                  ? <div className="space-y-2">{results.todayBiggest.slice(0,5).map((e,i) => (
                      <div key={i} className={placeStyle(i)}>
                        <div className="flex items-center gap-2 text-sm"><span className="text-xl">{placeEmoji(i)}</span><span className="font-semibold">{e.name}</span></div>
                        <span className="font-bold text-red-700 text-sm whitespace-nowrap">{e.weight} g</span>
                      </div>))}</div>
                  : <p className="text-gray-400 text-center py-6 text-sm">Még nincs mai fogás</p>}
              </div>
            ) : hiddenBanner('Mai Legnagyobb Hal')}

            {(user || tableVisibility.dailyBiggest) ? (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                {user && !tableVisibility.dailyBiggest && adminHiddenNote}
                <h3 className="text-base font-bold mb-3 text-purple-700 flex items-center gap-2"><Trophy className="w-5 h-5 text-purple-400" />Napi Legnagyobb Halak</h3>
                <div className="space-y-3">
                  {Array.from({ length: compDays }, (_, i) => i+1).map(d => {
                    const dayList  = results.dailyBiggest[d] || [];
                    const isToday  = d === results.currentDay;
                    const isFuture = d > results.currentDay;
                    return (
                      <div key={d} className={`rounded-xl p-3 border-2 ${isToday?'border-purple-300 bg-purple-50':isFuture?'border-dashed border-gray-200 bg-gray-50 opacity-50':'border-gray-200 bg-gray-50'}`}>
                        <p className={`text-xs font-bold mb-2 flex items-center gap-1 ${isToday?'text-purple-700':'text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />{d}. nap{isToday&&<span className="text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full ml-1">ma</span>}
                        </p>
                        {dayList.length > 0
                          ? dayList.map((e,i) => <div key={i} className="flex justify-between py-1 text-xs"><span className="font-medium">{placeEmoji(i)} {e.name}</span><span className="font-bold text-purple-700">{e.weight} g</span></div>)
                          : <p className="text-gray-400 text-xs">{isFuture?'Még nem kezdődött':'Nincs adat'}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : hiddenBanner('Napi Legnagyobb Halak')}
          </div>
        </div>

        {/* ADMIN: Látogatók */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
              👁️ Látogatók
              <button onClick={loadPageViews} className="ml-auto px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" />Frissítés</button>
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[['Mai', pageViews.today, 'blue'], ['7 nap', pageViews.week, 'green'], ['Összes', pageViews.total, 'purple']].map(([lbl, val, c]) => (
                <div key={lbl} className={`bg-${c}-50 border-2 border-${c}-200 rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold text-${c}-700`}>{val}</p>
                  <p className={`text-xs text-${c}-500 font-semibold mt-1`}>{lbl}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-orange-600">📱 {pageViews.mobil}</p><p className="text-xs text-orange-500 mt-1">Mobil — {pageViews.total>0?Math.round(pageViews.mobil/pageViews.total*100):0}%</p></div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-gray-600">💻 {pageViews.pc}</p><p className="text-xs text-gray-500 mt-1">PC — {pageViews.total>0?Math.round(pageViews.pc/pageViews.total*100):0}%</p></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

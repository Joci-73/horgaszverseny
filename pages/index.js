import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Trash2, Plus, Trophy, Fish, RefreshCw, LogOut, FolderOpen,
  PlusCircle, Lock, Archive, Share2, CheckCircle, Eye, EyeOff,
  MapPin, Phone, Upload, Users, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';

const supabaseUrl = 'https://sskzueeefjcuqtuesojm.supabase.co';
const supabaseKey = 'sb_publishable_8iZhmXZCwGJpkJaoEm7cZg_3WFhQwUa';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── EmailJS beállítások (emailjs.com-on kell létrehozni) ──────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
const ADMIN_EMAIL         = 'horgaszathonlap@gmail.com';

const DEFAULT_MAX_FISH = 10;

// ─────────────────────────────────────────────────────────────────────────────
export default function FishingCompetition() {

  // ── Auth
  const [user,           setUser]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [loginError,     setLoginError]     = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ── Competition list / archive
  const [competitions,        setCompetitions]        = useState([]);
  const [showCompetitionList, setShowCompetitionList] = useState(false);
  const [showArchived,        setShowArchived]        = useState(false);
  const [archivedComp,        setArchivedComp]        = useState(null);
  const [archivedCompetitors, setArchivedCompetitors] = useState([]);

  // ── Active competition meta
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

  // ── Settings panel (local edit state)
  const [showSettings,     setShowSettings]     = useState(false);
  const [sTitle,           setSTitle]           = useState('');
  const [sLocation,        setSLocation]        = useState('');
  const [sDescription,     setSDescription]     = useState('');
  const [sContact,         setSContact]         = useState('');
  const [sStartDate,       setSStartDate]       = useState('');
  const [sDailyStartTime,  setSDailyStartTime]  = useState('00:01');
  const [sDailyEndTime,    setSDailyEndTime]    = useState('23:59');
  const [sDays,            setSDays]            = useState(1);

  // ── Competitors & catches
  const [competitors,  setCompetitors]  = useState([]);
  const [newName,      setNewName]      = useState('');
  const [editingId,    setEditingId]    = useState(null);
  const [weightInput,  setWeightInput]  = useState('');
  const [editingCatch, setEditingCatch] = useState(null);
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [catchDay,     setCatchDay]     = useState(1);

  // ── Registration
  const [registrations, setRegistrations] = useState([]);
  const [regName,       setRegName]       = useState('');
  const [regPhone,      setRegPhone]      = useState('');
  const [regLoading,    setRegLoading]    = useState(false);
  const [regSuccess,    setRegSuccess]    = useState(false);
  const [regError,      setRegError]      = useState('');

  // ── UI misc
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showShareToast,   setShowShareToast]   = useState(false);
  const [imageUploading,   setImageUploading]   = useState(false);
  const [pageViews,        setPageViews]        = useState({ today: 0, week: 0, total: 0, mobil: 0, pc: 0 });

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    trackVisit();
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calcCurrentDay = (sd, st, days) => {
    if (!sd) return 1;
    const start = new Date(`${sd}T${st || '00:01'}:00`);
    const diffDays = Math.floor((Date.now() - start) / 86400000) + 1;
    return Math.max(1, Math.min(days || 1, diffDays));
  };

  const trackVisit = async () => {
    try {
      const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobil' : 'pc';
      await supabase.from('page_views').insert([{ device }]);
      await loadPageViews();
    } catch (err) { console.error('Látogatás rögzítési hiba:', err); }
  };

  const loadPageViews = async () => {
    try {
      const now = new Date();
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
    } catch (err) { console.error('Látogatók betöltési hiba:', err); }
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await loadCompetitions();
    } catch (err) { console.error('Auth hiba:', err); }
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
    try { await supabase.auth.signOut(); setUser(null); } catch (err) { console.error(err); }
  };

  // ── Data loading ──────────────────────────────────────────────────────────
  const buildCompetitors = async (compId, mf) => {
    const { data: cd, error: ce } = await supabase.from('competitors').select('*').eq('competition_id', compId).order('created_at', { ascending: true });
    if (ce) throw ce;
    return Promise.all((cd || []).map(async (c) => {
      const { data: catches, error: catchErr } = await supabase.from('catches').select('*').eq('competitor_id', c.id).order('weight', { ascending: false });
      if (catchErr) throw catchErr;
      return { ...c, catches: catches.slice(0, mf).map(x => ({ weight: x.weight, day: x.competition_day || 1, id: x.id })) };
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
    } catch (err) { console.error('Versenyek betöltési hiba:', err); }
  };

  const loadCompetition = async (compId, allComps) => {
    try {
      setLoading(true);
      const { data: comp, error: ce } = await supabase.from('competitions').select('*').eq('id', compId).single();
      if (ce) throw ce;
      const mf  = comp.max_fish    || DEFAULT_MAX_FISH;
      const days = comp.days        || 1;
      const sd   = comp.start_date  || '';
      const st   = comp.start_time  || '00:01';
      const et   = comp.end_time    || '23:59';
      setCompetitionId(comp.id);
      setTitle(comp.title);
      setMaxFish(mf);
      setCompDays(days);
      setStartDate(sd);
      setDailyStartTime(st);
      setDailyEndTime(et);
      setLocation(comp.location    || '');
      setDescription(comp.description || '');
      setContact(comp.contact       || '');
      setImageUrl(comp.image_url    || '');
      setTableVisibility(comp.table_visibility || { mainRanking: true, todayBiggest: true, dailyBiggest: true });
      // sync settings panel
      setSTitle(comp.title); setSLocation(comp.location||''); setSDescription(comp.description||'');
      setSContact(comp.contact||''); setSStartDate(sd); setSDailyStartTime(st); setSDailyEndTime(et); setSDays(days);
      // data
      const built = await buildCompetitors(comp.id, mf);
      setCompetitors(built);
      setCatchDay(calcCurrentDay(sd, st, days));
      const { data: regs } = await supabase.from('registrations').select('*').eq('competition_id', comp.id).order('start_number', { ascending: true });
      setRegistrations(regs || []);
      setShowCompetitionList(false);
      if (allComps) setCompetitions(allComps);
    } catch (err) { console.error('Betöltési hiba:', err); }
    finally { setLoading(false); }
  };

  const loadArchivedCompetition = async (compId) => {
    try {
      setLoading(true);
      const { data: comp, error: ce } = await supabase.from('competitions').select('*').eq('id', compId).single();
      if (ce) throw ce;
      setArchivedComp(comp);
      const built = await buildCompetitors(comp.id, comp.max_fish || DEFAULT_MAX_FISH);
      setArchivedCompetitors(built);
      setShowArchived(true); setShowCompetitionList(false);
    } catch (err) { console.error('Archív betöltési hiba:', err); }
    finally { setLoading(false); }
  };

  // ── Settings save ─────────────────────────────────────────────────────────
  const saveCompSettings = async (updates) => {
    if (!competitionId) return;
    try { await supabase.from('competitions').update(updates).eq('id', competitionId); }
    catch (err) { console.error('Beállítás mentési hiba:', err); }
  };

  const saveAnnouncementSettings = async () => {
    const updates = {
      title: sTitle, location: sLocation, description: sDescription, contact: sContact,
      start_date: sStartDate, start_time: sDailyStartTime, end_time: sDailyEndTime, days: sDays,
    };
    await saveCompSettings(updates);
    setTitle(sTitle); setLocation(sLocation); setDescription(sDescription); setContact(sContact);
    setStartDate(sStartDate); setDailyStartTime(sDailyStartTime); setDailyEndTime(sDailyEndTime); setCompDays(sDays);
    setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, ...updates } : c));
    setCatchDay(calcCurrentDay(sStartDate, sDailyStartTime, sDays));
    alert('Beállítások mentve!');
  };

  const handleMaxFishChange = (n) => {
    setMaxFish(n);
    saveCompSettings({ max_fish: n });
  };

  const toggleTableVisibility = (key) => {
    const newVis = { ...tableVisibility, [key]: !tableVisibility[key] };
    setTableVisibility(newVis);
    saveCompSettings({ table_visibility: newVis });
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !competitionId) return;
    setImageUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const fileName = `competition-${competitionId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('competition-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('competition-images').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      setImageUrl(url);
      await saveCompSettings({ image_url: url });
    } catch (err) { alert('Képfeltöltési hiba: ' + err.message); }
    finally { setImageUploading(false); }
  };

  // ── Competition management ─────────────────────────────────────────────────
  const archiveCompetition = async () => {
    if (!competitionId || !window.confirm('Biztosan lezárod és archiválod?')) return;
    try {
      await supabase.from('competitions').update({ archived: true }).eq('id', competitionId);
      await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const unarchiveCompetition = async (compId) => {
    try {
      await supabase.from('competitions').update({ archived: false }).eq('id', compId);
      setShowArchived(false); setArchivedComp(null); await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const createNewCompetition = async () => {
    try {
      const now = new Date();
      const ds = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
      const { error } = await supabase.from('competitions').insert([{
        title: 'Horgászverseny - ' + ds, archived: false,
        max_fish: DEFAULT_MAX_FISH, days: 1, start_time: '00:01', end_time: '23:59',
        table_visibility: { mainRanking: true, todayBiggest: true, dailyBiggest: true }
      }]);
      if (error) throw error;
      await loadCompetitions(); setShowCompetitionList(false);
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const deleteCompetition = async (compId) => {
    if (!window.confirm('Biztosan törölni szeretnéd?')) return;
    try {
      await supabase.from('competitions').delete().eq('id', compId);
      await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  // ── Competitor management ──────────────────────────────────────────────────
  const addCompetitor = async (nameOverride) => {
    const name = (nameOverride || newName).trim();
    if (!name || !competitionId) return;
    try {
      const { data, error } = await supabase.from('competitors').insert([{ competition_id: competitionId, name }]).select();
      if (error) throw error;
      setCompetitors(prev => [...prev, { ...data[0], catches: [] }]);
      if (!nameOverride) setNewName('');
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const confirmDeleteCompetitor = (id, name) => setDeleteConfirm({ id, name });

  const executeDeleteCompetitor = async () => {
    if (!deleteConfirm) return;
    try {
      await supabase.from('competitors').delete().eq('id', deleteConfirm.id);
      setCompetitors(prev => prev.filter(c => c.id !== deleteConfirm.id));
    } catch (err) { alert('Hiba: ' + err.message); }
    finally { setDeleteConfirm(null); }
  };

  // ── Catch management ───────────────────────────────────────────────────────
  const addWeight = async (competitorId) => {
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) { alert('Adj meg érvényes súlyt grammban'); return; }
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      let newCatches = [...competitor.catches, { weight, day: catchDay }];
      if (newCatches.length > maxFish) {
        const minW = Math.min(...newCatches.map(c => c.weight));
        const minIdx = newCatches.map(c => c.weight).lastIndexOf(minW);
        const minCatch = newCatches[minIdx];
        if (minCatch.id) await supabase.from('catches').delete().eq('id', minCatch.id);
        newCatches.splice(minIdx, 1);
      }
      const { data: inserted } = await supabase.from('catches').insert([{ competitor_id: competitorId, weight, competition_day: catchDay }]).select();
      newCatches[newCatches.length - 1] = { weight, day: catchDay, id: inserted?.[0]?.id };
      newCatches.sort((a, b) => b.weight - a.weight);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: newCatches } : c));
      setWeightInput(''); setEditingId(null);
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const removeCatch = async (competitorId, catchIndex) => {
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      const catchObj = competitor.catches[catchIndex];
      if (catchObj.id) await supabase.from('catches').delete().eq('id', catchObj.id);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: c.catches.filter((_, i) => i !== catchIndex) } : c));
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const updateCatch = async (competitorId, catchIndex, newWeight) => {
    const w = parseInt(newWeight);
    if (isNaN(w) || w <= 0) { alert('Adj meg érvényes súlyt grammban'); return; }
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      const catchObj = competitor.catches[catchIndex];
      if (catchObj.id) await supabase.from('catches').update({ weight: w }).eq('id', catchObj.id);
      const newCatches = competitor.catches.map((c, i) => i === catchIndex ? { ...c, weight: w } : c);
      newCatches.sort((a, b) => b.weight - a.weight);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: newCatches } : c));
      setEditingCatch(null);
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  // ── Registration ───────────────────────────────────────────────────────────
  const handleRegistration = async () => {
    if (!regName.trim() || !regPhone.trim()) { setRegError('Kérjük add meg a neved és a telefonszámodat!'); return; }
    if (!competitionId) return;
    setRegLoading(true); setRegError('');
    try {
      const { data: existing } = await supabase.from('registrations').select('id').eq('competition_id', competitionId).eq('name', regName.trim());
      if (existing && existing.length > 0) { setRegError('Ez a név már regisztrálva van!'); return; }
      // Csak névvel mentünk — telefonszámot NEM tároljuk
      const { error } = await supabase.from('registrations').insert([{ competition_id: competitionId, name: regName.trim() }]);
      if (error) throw error;
      // Email küldés EmailJS REST API-n (telefonszám csak emailben, DB-ben nincs)
      try {
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: {
              to_email: ADMIN_EMAIL,
              verseny_nev: title,
              versenyzo_nev: regName.trim(),
              telefonszam: regPhone.trim(),
            }
          })
        });
      } catch (mailErr) { console.warn('Email küldési hiba:', mailErr); }
      setRegistrations(prev => [...prev, { name: regName.trim(), competition_id: competitionId }]);
      setRegName(''); setRegPhone('');
      setRegSuccess(true);
      setTimeout(() => setRegSuccess(false), 6000);
    } catch (err) { setRegError('Hiba a regisztráció során: ' + err.message); }
    finally { setRegLoading(false); }
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title, url });
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 3000); });
    } else alert('Másold ki a böngésző címsorából!');
  };

  // ── Results ────────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const currentDay = calcCurrentDay(startDate, dailyStartTime, compDays);
    const withScores = competitors.map(c => ({
      ...c,
      totalWeight: c.catches.reduce((s, x) => s + x.weight, 0),
      fishCount: c.catches.length,
    }));
    const mainRanking = [...withScores].sort((a, b) =>
      b.fishCount !== a.fishCount ? b.fishCount - a.fishCount : b.totalWeight - a.totalWeight
    );
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
    if (!archivedComp) return { mainRanking: [], todayBiggest: [], dailyBiggest: {} };
    const mf   = archivedComp.max_fish || DEFAULT_MAX_FISH;
    const days = archivedComp.days || 1;
    const withScores = archivedCompetitors.map(c => ({
      ...c, totalWeight: c.catches.reduce((s, x) => s + x.weight, 0), fishCount: c.catches.length,
    }));
    const mainRanking = [...withScores].sort((a, b) =>
      b.fishCount !== a.fishCount ? b.fishCount - a.fishCount : b.totalWeight - a.totalWeight
    );
    const allCatches = [];
    archivedCompetitors.forEach(c => c.catches.forEach(x => allCatches.push({ name: c.name, weight: x.weight, day: x.day || 1 })));
    const dailyBiggest = {};
    for (let d = 1; d <= days; d++) {
      dailyBiggest[d] = allCatches.filter(x => x.day === d).sort((a, b) => b.weight - a.weight).slice(0, 3);
    }
    return { mainRanking, dailyBiggest, mf, days };
  }, [archivedCompetitors, archivedComp]);

  // ── Style helpers ──────────────────────────────────────────────────────────
  const placeStyle = (i) =>
    i === 0 ? 'flex justify-between items-center p-3 rounded-lg bg-yellow-100 border-2 border-yellow-400'
    : i === 1 ? 'flex justify-between items-center p-3 rounded-lg bg-gray-100 border-2 border-gray-400'
    : i === 2 ? 'flex justify-between items-center p-3 rounded-lg bg-orange-100 border-2 border-orange-400'
    : 'flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-200';

  const placeEmoji = (i) => ['🥇', '🥈', '🥉'][i] || `${i+1}.`;

  const hiddenBanner = (label) => (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center min-h-48">
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

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <Fish className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600 text-xl font-semibold">Betöltés...</p>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // ARCHÍV NÉZET
  // ──────────────────────────────────────────────────────────────────────────
  if (showArchived && archivedComp) {
    const { mainRanking: ar, dailyBiggest: adb, mf, days } = archivedResults;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-xl shadow-xl mb-4">
            <div className="flex items-center gap-3">
              <Archive className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">{archivedComp.title}</h1>
                <p className="mt-1 text-gray-300 text-sm">Korábbi verseny — Lezárt eredmények • {days} napos • {mf} halas</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => { setShowArchived(false); setArchivedComp(null); }} className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-semibold shadow">← Vissza</button>
            {user && <button onClick={() => unarchiveCompetition(archivedComp.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center gap-2 shadow"><RefreshCw className="w-4 h-4" />Visszaállítás</button>}
          </div>
          {/* Archived main ranking */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800"><Trophy className="w-6 h-6 text-yellow-500" />Végeredmény Rangsor</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-blue-50 border-b-2 border-blue-200">
                  <th className="px-3 py-2 text-center text-sm font-bold text-blue-800">Helyezés</th>
                  <th className="px-3 py-2 text-left text-sm font-bold text-blue-800">Versenyző</th>
                  <th className="px-3 py-2 text-center text-sm font-bold text-blue-800">Fogás (db)</th>
                  <th className="px-3 py-2 text-center text-sm font-bold text-blue-800">Összsúly (g)</th>
                </tr></thead>
                <tbody>{ar.map((c, i) => (
                  <tr key={c.id} className={i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-gray-50' : i === 2 ? 'bg-orange-50' : 'bg-white border-b border-gray-100'}>
                    <td className="px-3 py-2.5 text-center text-xl">{placeEmoji(i)}</td>
                    <td className="px-3 py-2.5 font-bold">{c.name}</td>
                    <td className="px-3 py-2.5 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-sm">{c.fishCount}</span></td>
                    <td className="px-3 py-2.5 text-center"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold text-sm">{c.totalWeight}g</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* Archived daily biggest */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-purple-700 flex items-center gap-2"><Fish className="w-5 h-5 text-purple-500" />Napi Legnagyobb Halak</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: days }, (_, i) => i+1).map(d => (
                <div key={d} className="rounded-lg p-4 border-2 border-gray-200 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-2">{d}. nap</p>
                  {(adb[d] || []).length > 0
                    ? (adb[d] || []).map((e, i) => (
                        <div key={i} className="flex justify-between items-center py-1 text-sm">
                          <span>{placeEmoji(i)} {e.name}</span>
                          <span className="font-bold text-purple-700">{e.weight}g</span>
                        </div>
                      ))
                    : <p className="text-gray-400 text-xs">Nincs adat</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VERSENY LISTA NÉZET
  // ──────────────────────────────────────────────────────────────────────────
  if (showCompetitionList) {
    const activeList   = competitions.filter(c => !c.archived);
    const archivedList = competitions.filter(c =>  c.archived);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FolderOpen className="w-8 h-8 text-blue-600" />Versenyek</h2>
              <button onClick={() => setShowCompetitionList(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            {user && <button onClick={createNewCompetition} className="w-full mb-6 bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 font-semibold flex items-center justify-center gap-2"><PlusCircle className="w-6 h-6" />Új Verseny Indítása</button>}
            <h3 className="text-base font-bold text-green-700 mb-2 flex items-center gap-2"><Fish className="w-4 h-4" />Aktuális Versenyek</h3>
            <div className="space-y-3 mb-6">
              {activeList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nincs aktív verseny</p>}
              {activeList.map(comp => {
                const d = new Date(comp.created_at);
                const ds = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
                const isAct = comp.id === competitionId;
                return (
                  <div key={comp.id} className={`border-2 rounded-xl p-4 flex justify-between items-center ${isAct ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{comp.title}</h3>
                      <p className="text-gray-500 text-sm">{ds} • {comp.days || 1} napos • {comp.max_fish || DEFAULT_MAX_FISH} halas</p>
                      {isAct && <span className="inline-block mt-1 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">Aktuális</span>}
                    </div>
                    <div className="flex gap-2">
                      {!isAct && <button onClick={() => loadCompetition(comp.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">Megnyitás</button>}
                      {user && <button onClick={() => deleteCompetition(comp.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm">Törlés</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <h3 className="text-base font-bold text-gray-600 mb-2 flex items-center gap-2"><Archive className="w-4 h-4" />Korábbi Versenyek</h3>
            <div className="space-y-3">
              {archivedList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Még nincsenek lezárt versenyek</p>}
              {archivedList.map(comp => {
                const d  = new Date(comp.created_at);
                const ds = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
                return (
                  <div key={comp.id} className="border-2 rounded-xl p-4 flex justify-between items-center border-gray-200 bg-gray-50">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-700">{comp.title}</h3>
                      <p className="text-gray-400 text-sm">{ds} • {comp.days || 1} napos • {comp.max_fish || DEFAULT_MAX_FISH} halas</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadArchivedCompetition(comp.id)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm">Megtekint</button>
                      {user && <button onClick={() => deleteCompetition(comp.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm">Törlés</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FŐ NÉZET
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">

      {/* ── FEJLÉC ── */}
      <div className="bg-gradient-to-r from-blue-700 to-green-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Fish className="w-9 h-9" />
            <div>
              <h1 className="text-2xl font-bold leading-tight">{title}</h1>
              {location && <p className="text-sm text-blue-100 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{location}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleShare} className="px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm flex items-center gap-1 font-semibold">
              <Share2 className="w-4 h-4" />Megosztás
            </button>
            <button onClick={() => setShowCompetitionList(true)} className="px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm flex items-center gap-1 font-semibold">
              <FolderOpen className="w-4 h-4" />Versenyek
            </button>
            {user
              ? <button onClick={handleLogout} className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600/80 text-sm flex items-center gap-1 font-semibold"><LogOut className="w-4 h-4" />Kilépés</button>
              : <button onClick={() => setShowLoginModal(true)} className="px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm flex items-center gap-1 font-semibold"><Lock className="w-4 h-4" />Admin</button>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* ── VERSENY KIÍRÁS ── */}
        {(imageUrl || description || location || contact || startDate) && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {imageUrl && <img src={imageUrl} alt="Verseny" className="w-full max-h-72 object-cover" />}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-800">📋 Verseny Kiírás</h2>
                <button onClick={() => setShowAnnouncement(!showAnnouncement)} className="text-gray-500 hover:text-gray-700 p-1">
                  {showAnnouncement ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              {showAnnouncement && (
                <div className="space-y-3">
                  {startDate && (
                    <div className="flex items-start gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>{compDays} napos verseny</strong> • {startDate.replace(/-/g,'.')} • Napi időszak: {dailyStartTime} – {dailyEndTime}</span>
                    </div>
                  )}
                  {location && <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-green-500 flex-shrink-0" /><span>{location}</span></div>}
                  {description && <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{description}</p>}
                  {contact && <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-purple-500 flex-shrink-0" /><span>{contact}</span></div>}
                  <div className="inline-flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                    <Fish className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">{maxFish} halat fogott verseny • {compDays} nap</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VERSENYZŐ JELENTKEZÉS ── */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Versenyző Jelentkezés</h2>
          {regSuccess ? (
            <div className="flex items-center gap-3 bg-green-100 border-2 border-green-400 rounded-xl p-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-semibold">Sikeres jelentkezés! A szervező emailben értesítést kap, és hamarosan felveszi Önnel a kapcsolatot.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Teljes neve..." className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} onKeyPress={(e) => e.key==='Enter' && handleRegistration()} placeholder="Telefonszám..." className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                <button onClick={handleRegistration} disabled={regLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2 min-w-max">
                  {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Jelentkezés
                </button>
              </div>
              {regError && <p className="mt-2 text-red-600 text-sm font-semibold">{regError}</p>}
              <p className="mt-2 text-xs text-gray-400">* Telefonszámát nem tároljuk — csak a szervezőnek továbbítjuk emailben. A honlapon kizárólag a neve jelenik meg.</p>
            </>
          )}
        </div>

        {/* ── BEJELENTKEZŐ MODAL ── */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Admin Bejelentkezés</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email cím</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="admin@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jelszó</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleLogin()} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="••••••••" />
                </div>
                {loginError && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">{loginError}</div>}
                <button onClick={handleLogin} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400">{loading ? 'Bejelentkezés...' : 'Bejelentkezés'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TÖRLÉS MEGERŐSÍTŐ MODAL ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4">Versenyző törlése</h3>
              <p className="text-gray-600 mb-6">Biztosan törlöd <strong>{deleteConfirm.name}</strong> versenyzőt és összes fogását?</p>
              <div className="flex gap-3">
                <button onClick={executeDeleteCompetitor} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold">Törlés</button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold">Mégsem</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SHARE TOAST ── */}
        {showShareToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
            <CheckCircle className="w-5 h-5" />Link vágólapra másolva!
          </div>
        )}

        {/* ── ADMIN: VERSENY BEÁLLÍTÁSOK ── */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">⚙️ Verseny Beállítások</h2>
              <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-semibold">
                {showSettings ? '▲ Bezár' : '▼ Megnyit'}
              </button>
            </div>

            {showSettings && (
              <div className="mt-4 space-y-4">

                {/* Verseny kiírás */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3">📋 Verseny Kiírás & Adatok</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Verseny neve</label>
                      <input value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Helyszín</label>
                      <input value={sLocation} onChange={(e) => setSLocation(e.target.value)} placeholder="Pl.: Tisza-tó, Porrogi öböl" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Elérhetőség</label>
                      <input value={sContact} onChange={(e) => setSContact(e.target.value)} placeholder="Telefon / email" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Kezdő dátum</label>
                      <input type="date" value={sStartDate} onChange={(e) => setSStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Napi verseny kezdése</label>
                      <input type="time" value={sDailyStartTime} onChange={(e) => setSDailyStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Napi verseny zárása</label>
                      <input type="time" value={sDailyEndTime} onChange={(e) => setSDailyEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Verseny kiírás / leírás / szabályok</label>
                    <textarea value={sDescription} onChange={(e) => setSDescription(e.target.value)} rows={4} placeholder="Verseny részletei, szabályok, nevezési díj..." className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-y" />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Verseny képe (borítókép)</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className={`px-4 py-2 rounded-lg cursor-pointer text-sm flex items-center gap-2 font-semibold ${imageUploading ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        <Upload className="w-4 h-4" />{imageUploading ? 'Feltöltés...' : 'Kép feltöltése'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
                      </label>
                      {imageUrl && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />Kép feltöltve</span>}
                    </div>
                  </div>
                </div>

                {/* Paraméterek */}
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-3">🎣 Verseny Paraméterek</h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Hány napos a verseny? (1–5)</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(d => (
                          <button key={d} onClick={() => setSDays(d)} className={`w-11 h-11 rounded-full font-bold ${sDays===d ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'}`}>{d}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Hány halat fogott verseny? (1–10)</label>
                      <div className="flex gap-2 flex-wrap">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <button key={n} onClick={() => handleMaxFishChange(n)} className={`w-11 h-11 rounded-full font-bold ${maxFish===n ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Táblák láthatósága */}
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-3">👁️ Eredmény Táblák Láthatósága</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'mainRanking',   label: '🏆 Fő Verseny Rangsor' },
                      { key: 'todayBiggest',  label: '🐟 Mai Legnagyobb Hal' },
                      { key: 'dailyBiggest',  label: '📅 Napi Legnagyobb Halak (napok szerint)' },
                    ].map(({ key, label }) => (
                      <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg border-2 ${tableVisibility[key] ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <span className="font-semibold text-sm">{label}</span>
                        <button onClick={() => toggleTableVisibility(key)} className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 font-semibold ${tableVisibility[key] ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                          {tableVisibility[key] ? <><EyeOff className="w-3 h-3" />Elrejt</> : <><Eye className="w-3 h-3" />Mutat</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mentés & archiválás */}
                <div className="flex gap-3 flex-wrap pt-1">
                  <button onClick={saveAnnouncementSettings} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 shadow-md">
                    <CheckCircle className="w-4 h-4" />Beállítások Mentése
                  </button>
                  <button onClick={archiveCompetition} className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold flex items-center gap-2 shadow-md">
                    <Archive className="w-4 h-4" />Lezárás & Archiválás
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN: VERSENYZŐ HOZZÁADÁSA ── */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">👤 Versenyző Hozzáadása</h2>
            {/* Jelentkezők listájából */}
            {registrations.filter(r => !competitors.some(c => c.name === r.name)).length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-1"><Users className="w-4 h-4" />Jelentkezők (rajtszámmal):</p>
                <div className="flex flex-wrap gap-2">
                  {registrations
                    .filter(r => !competitors.some(c => c.name === r.name))
                    .map((r, idx) => (
                      <button key={idx} onClick={() => addCompetitor(r.name)} className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:border-blue-500 transition-colors">
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">#{r.start_number}</span>
                        {r.name}
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
                    ))}
                </div>
              </div>
            )}
            {/* Kézi hozzáadás */}
            <div className="flex gap-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={(e) => e.key==='Enter' && addCompetitor()} placeholder="Versenyző neve (kézi bevitel)..." className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
              <button onClick={() => addCompetitor()} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold">
                <Plus className="w-5 h-5" />Hozzáad
              </button>
            </div>
          </div>
        )}

        {/* ── ADMIN: FOGÁS BEVITELI TÁBLA ── */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-800">🎣 Fogások Bevitele</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-600">Bevitt nap:</span>
                {Array.from({ length: compDays }, (_, i) => i+1).map(d => (
                  <button key={d} onClick={() => setCatchDay(d)} className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${catchDay===d ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{d}.</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100">Versenyző</th>
                    <th className="px-3 py-3 text-center font-semibold">Db</th>
                    {Array.from({ length: maxFish }, (_, i) => (
                      <th key={i} className="px-3 py-3 text-center font-semibold text-xs whitespace-nowrap">{i+1}. hal</th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold">Összsúly</th>
                    <th className="px-3 py-3 text-center font-semibold">Bevitel</th>
                    <th className="px-3 py-3 text-center font-semibold">Törlés</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c, idx) => {
                    const total = c.catches.reduce((s,x)=>s+x.weight,0);
                    return (
                      <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-inherit whitespace-nowrap">{c.name}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-sm">{c.catches.length}</span>
                        </td>
                        {Array.from({ length: maxFish }, (_, i) => (
                          <td key={i} className="px-2 py-2 text-center">
                            {c.catches[i] ? (
                              editingCatch && editingCatch.competitorId===c.id && editingCatch.catchIndex===i ? (
                                <div className="flex gap-1 items-center justify-center">
                                  <input type="number" value={editingCatch.value} onChange={(e) => setEditingCatch({...editingCatch,value:e.target.value})} onKeyPress={(e) => e.key==='Enter' && updateCatch(c.id,i,editingCatch.value)} className="w-16 px-1 py-0.5 border-2 border-green-500 rounded text-center text-xs focus:outline-none" autoFocus />
                                  <button onClick={() => updateCatch(c.id,i,editingCatch.value)} className="px-1.5 py-0.5 bg-green-600 text-white rounded text-xs">✓</button>
                                  <button onClick={() => setEditingCatch(null)} className="px-1.5 py-0.5 bg-gray-400 text-white rounded text-xs">✕</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-xs font-semibold text-green-700 cursor-pointer hover:text-blue-600 hover:underline"
                                    onClick={() => setEditingCatch({competitorId:c.id,catchIndex:i,value:c.catches[i].weight})}>
                                    {c.catches[i].weight}g
                                  </span>
                                  <span className="text-gray-300 text-xs">({c.catches[i].day||1}n)</span>
                                  <button onClick={() => removeCatch(c.id,i)} className="text-red-400 hover:text-red-600 text-sm ml-0.5 leading-none">×</button>
                                </div>
                              )
                            ) : <span className="text-gray-300 text-xs">–</span>}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold text-sm whitespace-nowrap">{total}g</span>
                        </td>
                        <td className="px-3 py-2">
                          {editingId===c.id
                            ? <div className="flex gap-1 items-center">
                                <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyPress={(e) => e.key==='Enter' && addWeight(c.id)} placeholder="g" className="w-20 px-2 py-1 border-2 border-blue-500 rounded text-sm focus:outline-none" autoFocus />
                                <button onClick={() => addWeight(c.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm font-semibold">OK</button>
                                <button onClick={() => {setEditingId(null);setWeightInput('');}} className="px-2 py-1 bg-gray-400 text-white rounded text-sm">✕</button>
                              </div>
                            : <button onClick={() => setEditingId(c.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold whitespace-nowrap">Bevitel</button>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => confirmDeleteCompetitor(c.id,c.name)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {competitors.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Fish className="w-14 h-14 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Még nincsenek versenyzők.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EREDMÉNY TÁBLÁK ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* BAL OLDAL: Fő rangsor (2 col) */}
          <div className="lg:col-span-2">
            {(user || tableVisibility.mainRanking) ? (
              <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                {user && !tableVisibility.mainRanking && adminHiddenNote}
                <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />Verseny Rangsor
                  <span className="ml-auto text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{results.currentDay}. nap</span>
                </h3>
                {results.mainRanking.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-50 border-b-2 border-blue-200">
                          <th className="px-3 py-2.5 text-center text-sm font-bold text-blue-800 w-16">Hely</th>
                          <th className="px-3 py-2.5 text-left text-sm font-bold text-blue-800">Versenyző</th>
                          <th className="px-3 py-2.5 text-center text-sm font-bold text-blue-800">Fogás (db)</th>
                          <th className="px-3 py-2.5 text-center text-sm font-bold text-blue-800">Összsúly</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.mainRanking.map((c, i) => (
                          <tr key={c.id} className={
                            i===0 ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : i===1 ? 'bg-gray-50 border-l-4 border-gray-400'
                            : i===2 ? 'bg-orange-50 border-l-4 border-orange-400'
                            : 'bg-white border-b border-gray-100'
                          }>
                            <td className="px-3 py-3 text-center text-2xl">{placeEmoji(i)}</td>
                            <td className="px-3 py-3 font-bold text-gray-800">{c.name}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold text-sm">{c.fishCount}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold text-sm">{c.totalWeight} g</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Fish className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Még nincs adat</p>
                  </div>
                )}
              </div>
            ) : hiddenBanner('Verseny Rangsor')}
          </div>

          {/* JOBB OLDAL: Két tábla egymás alatt */}
          <div className="space-y-6">

            {/* Mai legnagyobb hal */}
            {(user || tableVisibility.todayBiggest) ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {user && !tableVisibility.todayBiggest && adminHiddenNote}
                <h3 className="text-lg font-bold mb-3 text-red-700 flex items-center gap-2">
                  <Fish className="w-5 h-5 text-red-500" />Mai Legnagyobb Hal
                  <span className="ml-auto text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{results.currentDay}. nap</span>
                </h3>
                {results.todayBiggest.length > 0 ? (
                  <div className="space-y-2">
                    {results.todayBiggest.slice(0, 5).map((e, i) => (
                      <div key={i} className={placeStyle(i)}>
                        <span className="font-semibold text-sm"><span className="text-xl mr-2">{placeEmoji(i)}</span>{e.name}</span>
                        <span className="font-bold text-red-700 whitespace-nowrap">{e.weight} g</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6 text-sm">Még nincs mai fogás</p>
                )}
              </div>
            ) : hiddenBanner('Mai Legnagyobb Hal')}

            {/* Napi legnagyobb halak — napi bontás */}
            {(user || tableVisibility.dailyBiggest) ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {user && !tableVisibility.dailyBiggest && adminHiddenNote}
                <h3 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-500" />Napi Legnagyobb Halak
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: compDays }, (_, i) => i+1).map(d => {
                    const dayList = results.dailyBiggest[d] || [];
                    const isToday = d === results.currentDay;
                    const isFuture = d > results.currentDay;
                    return (
                      <div key={d} className={`rounded-xl p-3 border-2 ${isToday ? 'border-purple-300 bg-purple-50' : isFuture ? 'border-dashed border-gray-200 bg-gray-50 opacity-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className={`text-sm font-bold mb-2 flex items-center gap-1 ${isToday ? 'text-purple-700' : 'text-gray-600'}`}>
                          <Calendar className="w-3.5 h-3.5" />{d}. nap {isToday ? <span className="text-xs font-normal bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">(ma)</span> : ''}
                        </p>
                        {dayList.length > 0 ? (
                          dayList.map((e, i) => (
                            <div key={i} className="flex justify-between items-center py-1 text-sm">
                              <span className="font-medium">{placeEmoji(i)} {e.name}</span>
                              <span className="font-bold text-purple-700 whitespace-nowrap">{e.weight} g</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-xs">{isFuture ? 'Még nem kezdődött el' : 'Még nincs adat'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : hiddenBanner('Napi Legnagyobb Halak')}

          </div>
        </div>

        {/* ── ADMIN: LÁTOGATÓK ── */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
              👁️ Látogatók Statisztikája
              <button onClick={loadPageViews} className="ml-auto px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />Frissítés
              </button>
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-700">{pageViews.today}</p><p className="text-xs text-blue-500 font-semibold mt-1">Mai</p></div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-700">{pageViews.week}</p><p className="text-xs text-green-500 font-semibold mt-1">7 nap</p></div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-purple-700">{pageViews.total}</p><p className="text-xs text-purple-500 font-semibold mt-1">Összes</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">📱 {pageViews.mobil}</p>
                <p className="text-xs text-orange-500 font-semibold mt-1">Mobil — {pageViews.total>0?Math.round((pageViews.mobil/pageViews.total)*100):0}%</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-600">💻 {pageViews.pc}</p>
                <p className="text-xs text-gray-500 font-semibold mt-1">PC — {pageViews.total>0?Math.round((pageViews.pc/pageViews.total)*100):0}%</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

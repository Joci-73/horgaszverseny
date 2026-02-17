import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Trophy, Fish, RefreshCw, LogOut, FolderOpen, PlusCircle, Lock, Archive, Share2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const supabaseUrl = 'https://sskzueeefjcuqtuesojm.supabase.co';
const supabaseKey = 'sb_publishable_8iZhmXZCwGJpkJaoEm7cZg_3WFhQwUa';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FishingCompetition() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showCompetitionList, setShowCompetitionList] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [title, setTitle] = useState('Horgászverseny');
  const [competitors, setCompetitors] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [competitionId, setCompetitionId] = useState(null);
  // ÚJ STATE-EK
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedCompetition, setArchivedCompetition] = useState(null);
  const [archivedCompetitors, setArchivedCompetitors] = useState([]);
  const [showShareToast, setShowShareToast] = useState(false);
  const [pageViews, setPageViews] = useState({ today: 0, week: 0, total: 0, mobil: 0, pc: 0 });
  const [resultsVisible, setResultsVisible] = useState({
    all: true, fish5: true, fish4: true, fish3: true, biggest: true
  });

  const toggleAll = () => {
    const newVal = !resultsVisible.all;
    setResultsVisible({ all: newVal, fish5: newVal, fish4: newVal, fish3: newVal, biggest: newVal });
  };
  const toggleOne = (key) => {
    setResultsVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    trackVisit();
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => { authListener?.subscription?.unsubscribe(); };
  }, []);

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
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const [{ count: total }, { count: today }, { count: week }, { count: mobilTotal }, { count: pcTotal }] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', todayStart),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', weekStart),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('device', 'mobil'),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('device', 'pc'),
      ]);
      setPageViews({ today: today || 0, week: week || 0, total: total || 0, mobil: mobilTotal || 0, pc: pcTotal || 0 });
    } catch (err) { console.error('Látogatók betöltési hiba:', err); }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await loadCompetitions();
    } catch (err) { console.error('Auth hiba:', err); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      setShowLoginModal(false);
      setEmail(''); setPassword('');
    } catch { setLoginError('Hibás email vagy jelszó'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); setUser(null); } catch (err) { console.error(err); }
  };

  const buildCompetitors = async (compId) => {
    const { data: competitorsData, error: ce } = await supabase.from('competitors').select('*').eq('competition_id', compId).order('created_at', { ascending: true });
    if (ce) throw ce;
    return Promise.all((competitorsData || []).map(async (competitor) => {
      const { data: catches, error: catchError } = await supabase.from('catches').select('*').eq('competitor_id', competitor.id).order('weight', { ascending: false });
      if (catchError) throw catchError;
      return { ...competitor, catches: catches.map(c => c.weight) };
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
      setCompetitionId(comp.id);
      setTitle(comp.title);
      const built = await buildCompetitors(comp.id);
      setCompetitors(built);
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
      setArchivedCompetition(comp);
      const built = await buildCompetitors(comp.id);
      setArchivedCompetitors(built);
      setShowArchived(true);
      setShowCompetitionList(false);
    } catch (err) { console.error('Archív betöltési hiba:', err); }
    finally { setLoading(false); }
  };

  const archiveCompetition = async () => {
    if (!competitionId) return;
    if (!window.confirm('Biztosan lezárod és áthelyezed a "Korábbi Versenyek" közé?')) return;
    try {
      const { error } = await supabase.from('competitions').update({ archived: true }).eq('id', competitionId);
      if (error) throw error;
      await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const unarchiveCompetition = async (compId) => {
    try {
      const { error } = await supabase.from('competitions').update({ archived: false }).eq('id', compId);
      if (error) throw error;
      setShowArchived(false);
      setArchivedCompetition(null);
      await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const createNewCompetition = async () => {
    try {
      const now = new Date();
      const dateStr = now.getFullYear() + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + String(now.getDate()).padStart(2,'0');
      const { data, error } = await supabase.from('competitions').insert([{ title: 'Horgászverseny - ' + dateStr, archived: false }]).select();
      if (error) throw error;
      setCompetitionId(data[0].id);
      setTitle(data[0].title);
      setCompetitors([]);
      await loadCompetitions();
      setShowCompetitionList(false);
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const deleteCompetition = async (compId) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a versenyt? Ez nem visszavonható!')) return;
    try {
      const { error } = await supabase.from('competitions').delete().eq('id', compId);
      if (error) throw error;
      await loadCompetitions();
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const saveTitle = async (newTitle) => {
    if (!competitionId) return;
    try {
      const { error } = await supabase.from('competitions').update({ title: newTitle }).eq('id', competitionId);
      if (error) throw error;
      setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, title: newTitle } : c));
    } catch (err) { console.error('Cím mentési hiba:', err); }
  };

  const addCompetitor = async () => {
    if (!newName.trim() || competitors.length >= 45 || !competitionId) return;
    try {
      const { data, error } = await supabase.from('competitors').insert([{ competition_id: competitionId, name: newName.trim() }]).select();
      if (error) throw error;
      setCompetitors(prev => [...prev, { ...data[0], catches: [] }]);
      setNewName('');
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const confirmDeleteCompetitor = (id, name) => setDeleteConfirm({ id, name });

  const executeDeleteCompetitor = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase.from('competitors').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      setCompetitors(prev => prev.filter(c => c.id !== deleteConfirm.id));
    } catch (err) { alert('Hiba: ' + err.message); }
    finally { setDeleteConfirm(null); }
  };

  const addWeight = async (competitorId) => {
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) { alert('Adj meg érvényes súlyt grammban'); return; }
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      let newCatches = [...competitor.catches, weight];
      if (newCatches.length > 5) {
        const minWeight = Math.min(...newCatches);
        const { data: catchesToDelete } = await supabase.from('catches').select('*').eq('competitor_id', competitorId).eq('weight', minWeight).limit(1);
        if (catchesToDelete && catchesToDelete.length > 0) await supabase.from('catches').delete().eq('id', catchesToDelete[0].id);
        newCatches = newCatches.filter(w => w !== minWeight);
      }
      await supabase.from('catches').insert([{ competitor_id: competitorId, weight }]);
      newCatches.sort((a, b) => b - a);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: newCatches } : c));
      setWeightInput('');
      setEditingId(null);
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const removeCatch = async (competitorId, catchIndex) => {
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      const weightToRemove = competitor.catches[catchIndex];
      const { data: catchesToDelete } = await supabase.from('catches').select('*').eq('competitor_id', competitorId).eq('weight', weightToRemove).limit(1);
      if (catchesToDelete && catchesToDelete.length > 0) await supabase.from('catches').delete().eq('id', catchesToDelete[0].id);
      setCompetitors(prev => prev.map(c => c.id === competitorId ? { ...c, catches: c.catches.filter((_, i) => i !== catchIndex) } : c));
    } catch (err) { alert('Hiba: ' + err.message); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title, url });
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 3000); });
    } else alert('Másold ki a böngésző címsorából az URL-t!');
  };

  const results = useMemo(() => {
    const withScores = competitors.map(c => ({
      ...c,
      totalWeight: c.catches.reduce((sum, w) => sum + w, 0),
      fishCount: c.catches.length,
      biggestFish: c.catches.length > 0 ? Math.max(...c.catches) : 0
    }));
    return {
      with5Fish: withScores.filter(c => c.fishCount === 5).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with4Fish: withScores.filter(c => c.fishCount === 4).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with3Fish: withScores.filter(c => c.fishCount === 3).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      biggestFishList: withScores.filter(c => c.biggestFish > 0).sort((a, b) => b.biggestFish - a.biggestFish).slice(0, 5)
    };
  }, [competitors]);

  const archivedResults = useMemo(() => {
    const withScores = archivedCompetitors.map(c => ({
      ...c,
      totalWeight: c.catches.reduce((sum, w) => sum + w, 0),
      fishCount: c.catches.length,
      biggestFish: c.catches.length > 0 ? Math.max(...c.catches) : 0
    }));
    return {
      with5Fish: withScores.filter(c => c.fishCount === 5).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with4Fish: withScores.filter(c => c.fishCount === 4).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with3Fish: withScores.filter(c => c.fishCount === 3).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      biggestFishList: withScores.filter(c => c.biggestFish > 0).sort((a, b) => b.biggestFish - a.biggestFish).slice(0, 5)
    };
  }, [archivedCompetitors]);

  const activeCompetitions = competitions.filter(c => !c.archived);
  const archivedList = competitions.filter(c => c.archived);

  const placeStyle = (i) => i === 0
    ? 'flex justify-between items-center p-3 rounded bg-yellow-100 border-2 border-yellow-400'
    : i === 1 ? 'flex justify-between items-center p-3 rounded bg-gray-100 border-2 border-gray-400'
    : i === 2 ? 'flex justify-between items-center p-3 rounded bg-orange-100 border-2 border-orange-400'
    : 'flex justify-between items-center p-3 rounded bg-gray-50';

  const ResultsBlock = ({ res }) => (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" />5 halat fogottak (Top 6)</h3>
        {res.with5Fish.length > 0
          ? <div className="space-y-2">{res.with5Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-green-700 text-lg">{c.totalWeight} g</span></div>))}</div>
          : <p className="text-gray-400 text-center py-4">Még nincs 5 halat fogott versenyző</p>}
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-gray-400" />4 halat fogottak (Top 6)</h3>
        {res.with4Fish.length > 0
          ? <div className="space-y-2">{res.with4Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-blue-700 text-lg">{c.totalWeight} g</span></div>))}</div>
          : <p className="text-gray-400 text-center py-4">Még nincs 4 halat fogott versenyző</p>}
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2"><Trophy className="w-6 h-6" />3 halat fogottak (Top 6)</h3>
        {res.with3Fish.length > 0
          ? <div className="space-y-2">{res.with3Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-purple-700 text-lg">{c.totalWeight} g</span></div>))}</div>
          : <p className="text-gray-400 text-center py-4">Még nincs 3 halat fogott versenyző</p>}
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2"><Fish className="w-6 h-6 text-red-500" />Legnagyobb hal (Top 5)</h3>
        {res.biggestFishList.length > 0
          ? <div className="space-y-2">{res.biggestFishList.map((c, i) => (<div key={c.id} className={i===0?'flex justify-between items-center p-3 rounded bg-red-100 border-2 border-red-400':'flex justify-between items-center p-3 rounded bg-gray-50'}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-red-700 text-lg">{c.biggestFish} g</span></div>))}</div>
          : <p className="text-gray-400 text-center py-4">Még nincs fogott hal</p>}
      </div>
    </div>
  );

  // ── ARCHÍV NÉZET ─────────────────────────────────────────────────────
  if (showArchived && archivedCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-lg shadow-xl mb-4">
            <div className="flex items-center gap-3"><Archive className="w-8 h-8" /><h1 className="text-3xl font-bold">{archivedCompetition.title}</h1></div>
            <p className="mt-1 text-gray-300 text-sm">Korábbi verseny — Lezárt eredmények</p>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setShowArchived(false); setArchivedCompetition(null); }} className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-semibold shadow-md">← Vissza</button>
            {user && <button onClick={() => unarchiveCompetition(archivedCompetition.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center gap-2 shadow-md"><RefreshCw className="w-4 h-4" />Visszaállítás Aktuálisba</button>}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyzők és Fogások</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold">Név</th>
                    <th className="px-4 py-3 text-center font-semibold">Db</th>
                    {[1,2,3,4,5].map(n => <th key={n} className="px-4 py-3 text-center font-semibold">{n}. hal (g)</th>)}
                    <th className="px-4 py-3 text-center font-semibold">Összsúly (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedCompetitors.map((c, idx) => {
                    const total = c.catches.reduce((s, w) => s + w, 0);
                    return (
                      <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                        <td className="px-4 py-3 text-center"><span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{c.catches.length}</span></td>
                        {[0,1,2,3,4].map(i => <td key={i} className="px-4 py-3 text-center">{c.catches[i] ? <span className="font-semibold text-green-700">{c.catches[i]} g</span> : <span className="text-gray-300">-</span>}</td>)}
                        <td className="px-4 py-3 text-center"><span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">{total} g</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <ResultsBlock res={archivedResults} />
        </div>
      </div>
    );
  }

  // ── VERSENY LISTA NÉZET ──────────────────────────────────────────────
  if (showCompetitionList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FolderOpen className="w-8 h-8 text-blue-600" />Versenyek</h2>
              <button onClick={() => setShowCompetitionList(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            {user && <button onClick={createNewCompetition} className="w-full mb-6 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"><PlusCircle className="w-6 h-6" />Új Verseny Indítása</button>}
            <h3 className="text-base font-bold text-green-700 mb-2 flex items-center gap-2"><Fish className="w-4 h-4" />Aktuális Versenyek</h3>
            <div className="space-y-3 mb-6">
              {activeCompetitions.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nincs aktív verseny</p>}
              {activeCompetitions.map(comp => {
                const d = new Date(comp.created_at);
                const ds = d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
                const isActive = comp.id === competitionId;
                return (
                  <div key={comp.id} className={isActive ? 'border-2 rounded-lg p-4 flex justify-between items-center border-green-500 bg-green-50' : 'border-2 rounded-lg p-4 flex justify-between items-center border-gray-200'}>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">{comp.title}</h3>
                      <p className="text-gray-500 text-sm">{ds}</p>
                      {isActive && <span className="inline-block mt-1 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">Aktuális</span>}
                    </div>
                    <div className="flex gap-2">
                      {!isActive && <button onClick={() => loadCompetition(comp.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Megnyitás</button>}
                      {user && <button onClick={() => deleteCompetition(comp.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Törlés</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <h3 className="text-base font-bold text-gray-600 mb-2 flex items-center gap-2"><Archive className="w-4 h-4" />Korábbi Versenyek</h3>
            <div className="space-y-3">
              {archivedList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Még nincsenek lezárt versenyek</p>}
              {archivedList.map(comp => {
                const d = new Date(comp.created_at);
                const ds = d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
                return (
                  <div key={comp.id} className="border-2 rounded-lg p-4 flex justify-between items-center border-gray-200 bg-gray-50">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-700">{comp.title}</h3>
                      <p className="text-gray-400 text-sm">{ds}</p>
                      <span className="inline-block mt-1 bg-gray-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold">Lezárt</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadArchivedCompetition(comp.id)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">Megtekintés</button>
                      {user && <button onClick={() => deleteCompetition(comp.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Törlés</button>}
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-2xl text-gray-600">Betöltés...</div>
    </div>
  );

  // ── FŐ NÉZET ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Share toast */}
        {showShareToast && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />Link másolva a vágólapra!
          </div>
        )}

        {/* Versenyző törlés megerősítő modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div>
                <h2 className="text-lg font-bold text-gray-800">Versenyző törlése</h2>
              </div>
              <p className="text-gray-600 mb-2">Biztosan törlöd ezt a versenyzőt?</p>
              <p className="text-red-700 font-bold text-center bg-red-50 rounded-lg py-2 px-3 mb-3">„{deleteConfirm.name}"</p>
              <p className="text-gray-500 text-xs mb-5 text-center">Az összes fogásával együtt törlődik!<br/>Ez a művelet <strong>nem visszavonható</strong>.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">Mégse</button>
                <button onClick={executeDeleteCompetitor} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />Törlés
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fejléc */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg shadow-xl mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Fish className="w-10 h-10" />
              {user
                ? <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); saveTitle(e.target.value); }} className="text-4xl font-bold bg-transparent border-b-2 border-transparent hover:border-white focus:border-white focus:outline-none text-white flex-1" placeholder="Verseny címe..." />
                : <h1 className="text-4xl font-bold">{title}</h1>}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button onClick={() => setShowCompetitionList(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4">
                <FolderOpen className="w-5 h-5" /><span className="font-semibold">Versenyek</span>
              </button>
              <button onClick={handleShare} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4">
                <Share2 className="w-5 h-5" /><span className="font-semibold">Megosztás</span>
              </button>
              <button onClick={() => loadCompetition(competitionId)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
                <RefreshCw className="w-6 h-6" />
              </button>
              {user && (
                <button onClick={archiveCompetition} className="p-2 bg-amber-500 bg-opacity-90 rounded-lg hover:bg-opacity-100 flex items-center gap-2 px-4">
                  <Archive className="w-5 h-5" /><span className="font-semibold">Lezárás</span>
                </button>
              )}
              {user
                ? <button onClick={handleLogout} className="p-2 bg-red-500 bg-opacity-80 rounded-lg hover:bg-opacity-100 flex items-center gap-2 px-4"><LogOut className="w-5 h-5" /><span className="font-semibold">Kilépés</span></button>
                : <button onClick={() => setShowLoginModal(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4"><Lock className="w-5 h-5" /><span className="font-semibold">Admin</span></button>}
            </div>
          </div>
          <p className="mt-2 text-green-100">45 versenyző • 5 hal • Összsúly alapján{user && <span> • Admin: {user.email}</span>}</p>
        </div>

        {/* Login Modal */}
        {showLoginModal && !user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Bejelentkezés</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email cím</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="admin@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jelszó</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="••••••••" />
                </div>
                {loginError && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">{loginError}</div>}
                <button onClick={handleLogin} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400">
                  {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Látogatószámláló - csak adminnak */}
        {user && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
              👁️ Látogatók Statisztikája
              <button onClick={loadPageViews} className="ml-auto px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />Frissítés
              </button>
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{pageViews.today}</p>
                <p className="text-xs text-blue-500 font-semibold mt-1">Mai látogatás</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{pageViews.week}</p>
                <p className="text-xs text-green-500 font-semibold mt-1">Elmúlt 7 nap</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">{pageViews.total}</p>
                <p className="text-xs text-purple-500 font-semibold mt-1">Összes látogatás</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Eszköz szerinti bontás</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">📱 {pageViews.mobil}</p>
                  <p className="text-xs text-orange-500 font-semibold mt-1">Mobil látogatás</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pageViews.total > 0 ? Math.round((pageViews.mobil / pageViews.total) * 100) : 0}%</p>
                </div>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">💻 {pageViews.pc}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-1">PC látogatás</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pageViews.total > 0 ? Math.round((pageViews.pc / pageViews.total) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versenyző hozzáadás */}
        {user && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyző Hozzáadása</h2>
            <div className="flex gap-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCompetitor()} placeholder="Versenyző neve..." className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" disabled={competitors.length >= 45} />
              <button onClick={addCompetitor} disabled={competitors.length >= 45} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 font-semibold">
                <Plus className="w-5 h-5" />Hozzáad ({competitors.length}/45)
              </button>
            </div>
          </div>
        )}

        {/* Eredmény elrejtés/megjelenítés - csak adminnak */}
        {user && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">Eredmény táblázatok vezérlése</h2>
              <button onClick={toggleAll}
                className={resultsVisible.all ? 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2 text-sm' : 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 text-sm'}>
                {resultsVisible.all ? <><EyeOff className="w-4 h-4" />Mindent elrejt</> : <><Eye className="w-4 h-4" />Mindent mutat</>}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'fish5', label: '5 halat fogottak' },
                { key: 'fish4', label: '4 halat fogottak' },
                { key: 'fish3', label: '3 halat fogottak' },
                { key: 'biggest', label: 'Legnagyobb hal' },
              ].map(({ key, label }) => (
                <div key={key} className={resultsVisible[key] ? 'flex items-center justify-between p-2 rounded-lg border-2 border-green-200 bg-green-50' : 'flex items-center justify-between p-2 rounded-lg border-2 border-gray-200 bg-gray-50'}>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <button onClick={() => toggleOne(key)}
                    className={resultsVisible[key] ? 'px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center gap-1' : 'px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1'}>
                    {resultsVisible[key] ? <><EyeOff className="w-3 h-3" />Elrejt</> : <><Eye className="w-3 h-3" />Mutat</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Versenyzők táblázat */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyzők és Fogások</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold">Név</th>
                  <th className="px-4 py-3 text-center font-semibold">Db</th>
                  {[1,2,3,4,5].map(n => <th key={n} className="px-4 py-3 text-center font-semibold">{n}. hal (g)</th>)}
                  <th className="px-4 py-3 text-center font-semibold">Összsúly (g)</th>
                  {user && <React.Fragment>
                    <th className="px-4 py-3 text-center font-semibold">Súly bevitel</th>
                    <th className="px-4 py-3 text-center font-semibold">Művelet</th>
                  </React.Fragment>}
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, idx) => {
                  const total = c.catches.reduce((s, w) => s + w, 0);
                  return (
                    <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-center"><span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{c.catches.length}</span></td>
                      {[0,1,2,3,4].map(i => (
                        <td key={i} className="px-4 py-3 text-center">
                          {c.catches[i] ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-semibold text-green-700">{c.catches[i]} g</span>
                              {user && <button onClick={() => removeCatch(c.id, i)} className="text-red-500 hover:text-red-700 ml-1">×</button>}
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center"><span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">{total} g</span></td>
                      {user && <React.Fragment>
                        <td className="px-4 py-3">
                          {editingId === c.id
                            ? <div className="flex gap-2">
                                <input type="number" step="1" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addWeight(c.id)} placeholder="gramm" className="w-24 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none" autoFocus />
                                <button onClick={() => addWeight(c.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold">OK</button>
                                <button onClick={() => { setEditingId(null); setWeightInput(''); }} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-semibold">✕</button>
                              </div>
                            : <button onClick={() => setEditingId(c.id)} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold">Bevitel</button>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => confirmDeleteCompetitor(c.id, c.name)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                        </td>
                      </React.Fragment>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {competitors.length === 0 && <div className="text-center py-12 text-gray-400"><Fish className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">Még nincsenek versenyzők.</p></div>}
          </div>
        </div>

        {/* Eredmény táblázatok - admin mindig látja, felhasználó csak ha engedélyezett */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 5 halat fogottak */}
          {(user || resultsVisible.fish5) ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {user && !resultsVisible.fish5 && (
                <div className="flex items-center gap-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                  <EyeOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-semibold">Látogatók elől elrejtve</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" />5 halat fogottak (Top 6)</h3>
              {results.with5Fish.length > 0
                ? <div className="space-y-2">{results.with5Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-green-700 text-lg">{c.totalWeight} g</span></div>))}</div>
                : <p className="text-gray-400 text-center py-4">Még nincs 5 halat fogott versenyző</p>}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
              <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-bold text-gray-400">5 halat fogottak</p>
              <p className="text-sm text-gray-300">Eredmény hamarosan</p>
            </div>
          )}

          {/* 4 halat fogottak */}
          {(user || resultsVisible.fish4) ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {user && !resultsVisible.fish4 && (
                <div className="flex items-center gap-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                  <EyeOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-semibold">Látogatók elől elrejtve</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-gray-400" />4 halat fogottak (Top 6)</h3>
              {results.with4Fish.length > 0
                ? <div className="space-y-2">{results.with4Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-blue-700 text-lg">{c.totalWeight} g</span></div>))}</div>
                : <p className="text-gray-400 text-center py-4">Még nincs 4 halat fogott versenyző</p>}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
              <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-bold text-gray-400">4 halat fogottak</p>
              <p className="text-sm text-gray-300">Eredmény hamarosan</p>
            </div>
          )}

          {/* 3 halat fogottak */}
          {(user || resultsVisible.fish3) ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {user && !resultsVisible.fish3 && (
                <div className="flex items-center gap-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                  <EyeOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-semibold">Látogatók elől elrejtve</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2"><Trophy className="w-6 h-6" />3 halat fogottak (Top 6)</h3>
              {results.with3Fish.length > 0
                ? <div className="space-y-2">{results.with3Fish.map((c, i) => (<div key={c.id} className={placeStyle(i)}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-purple-700 text-lg">{c.totalWeight} g</span></div>))}</div>
                : <p className="text-gray-400 text-center py-4">Még nincs 3 halat fogott versenyző</p>}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
              <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-bold text-gray-400">3 halat fogottak</p>
              <p className="text-sm text-gray-300">Eredmény hamarosan</p>
            </div>
          )}

          {/* Legnagyobb hal */}
          {(user || resultsVisible.biggest) ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {user && !resultsVisible.biggest && (
                <div className="flex items-center gap-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                  <EyeOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-semibold">Látogatók elől elrejtve</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2"><Fish className="w-6 h-6 text-red-500" />Legnagyobb hal (Top 5)</h3>
              {results.biggestFishList.length > 0
                ? <div className="space-y-2">{results.biggestFishList.map((c, i) => (<div key={c.id} className={i===0?'flex justify-between items-center p-3 rounded bg-red-100 border-2 border-red-400':'flex justify-between items-center p-3 rounded bg-gray-50'}><span className="font-semibold"><span className="text-2xl mr-2">{i+1}.</span>{c.name}</span><span className="font-bold text-red-700 text-lg">{c.biggestFish} g</span></div>))}</div>
                : <p className="text-gray-400 text-center py-4">Még nincs fogott hal</p>}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
              <EyeOff className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-bold text-gray-400">Legnagyobb hal</p>
              <p className="text-sm text-gray-300">Eredmény hamarosan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

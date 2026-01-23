import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Trophy, Fish, RefreshCw, LogOut, FolderOpen, PlusCircle, Lock } from 'lucide-react';

// ⚠️ FONTOS: Cseréld ki ezeket a saját Supabase adataidra!
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
  const [competitions, setCompetitions] = useState([]);
  const [title, setTitle] = useState('Horgászverseny');
  const [competitors, setCompetitors] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [competitionId, setCompetitionId] = useState(null);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => { authListener?.subscription?.unsubscribe(); };
  }, []);

  // Keresd meg és CSERÉLD LE ezt a részt az 1. RÉSZBEN:

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      // Mindig töltse be a versenyeket (bejelentkezve vagy anélkül)
      await loadCompetitions();
    } catch (error) {
      console.error('Auth hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // NE töltse újra a versenyeket kijelentkezéskor!
      // await loadCompetitions(); <- EZT TÖRÖLD
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
    }
  };

  const loadCompetitions = async () => {
    // Ha nincs verseny, ne próbáljon betölteni
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCompetitions(data || []);
      if (data && data.length > 0) await loadCompetition(data[0].id);
    } catch (error) {
      console.error('Versenyek betöltési hiba:', error);
    }
  };

  const createNewCompetition = async () => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
      const { data, error } = await supabase.from('competitions').insert([{ title: `Horgászverseny - ${dateStr}` }]).select();
      if (error) throw error;
      setCompetitionId(data[0].id);
      setTitle(data[0].title);
      setCompetitors([]);
      await loadCompetitions();
      setShowCompetitionList(false);
    } catch (error) {
      alert('Hiba: ' + error.message);
    }
  };

  const loadCompetition = async (compId) => {
    try {
      setLoading(true);
      const { data: comp, error: compError } = await supabase.from('competitions').select('*').eq('id', compId).single();
      if (compError) throw compError;
      setCompetitionId(comp.id);
      setTitle(comp.title);
      const { data: competitorsData, error: comptsError } = await supabase.from('competitors').select('*').eq('competition_id', comp.id).order('created_at', { ascending: true });
      if (comptsError) throw comptsError;
      const competitorsWithCatches = await Promise.all(
        (competitorsData || []).map(async (competitor) => {
          const { data: catches, error: catchError } = await supabase.from('catches').select('*').eq('competitor_id', competitor.id).order('weight', { ascending: false });
          if (catchError) throw catchError;
          return { ...competitor, catches: catches.map(c => c.weight) };
        })
      );
      setCompetitors(competitorsWithCatches);
      setShowCompetitionList(false);
    } catch (error) {
      console.error('Betöltési hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCompetition = async (compId) => {
    if (!confirm('Biztosan törölni szeretnéd?')) return;
    try {
      const { error } = await supabase.from('competitions').delete().eq('id', compId);
      if (error) throw error;
      await loadCompetitions();
      if (compId === competitionId) {
        const remaining = competitions.filter(c => c.id !== compId);
        if (remaining.length > 0) await loadCompetition(remaining[0].id);
        else await createNewCompetition();
      }
    } catch (error) {
      alert('Hiba: ' + error.message);
    }
  };

  const saveTitle = async (newTitle) => {
    if (!competitionId) return;
    try {
      const { error } = await supabase.from('competitions').update({ title: newTitle }).eq('id', competitionId);
      if (error) throw error;
      setCompetitions(competitions.map(c => c.id === competitionId ? { ...c, title: newTitle } : c));
    } catch (error) {
      console.error('Cím mentési hiba:', error);
    }
  };

  const addCompetitor = async () => {
    if (newName.trim() && competitors.length < 45 && competitionId) {
      try {
        const { data, error } = await supabase.from('competitors').insert([{ competition_id: competitionId, name: newName.trim() }]).select();
        if (error) throw error;
        setCompetitors([...competitors, { ...data[0], catches: [] }]);
        setNewName('');
      } catch (error) {
        alert('Hiba: ' + error.message);
      }
    }
  };

  const deleteCompetitor = async (id) => {
    try {
      const { error } = await supabase.from('competitors').delete().eq('id', id);
      if (error) throw error;
      setCompetitors(competitors.filter(c => c.id !== id));
    } catch (error) {
      alert('Hiba: ' + error.message);
    }
  };

  const addWeight = async (competitorId) => {
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) {
      alert('Adj meg érvényes súlyt grammban!');
      return;
    }
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      let newCatches = [...competitor.catches, weight];
      if (newCatches.length > 5) {
        const minWeight = Math.min(...newCatches);
        const { data: catchesToDelete } = await supabase.from('catches').select('*').eq('competitor_id', competitorId).eq('weight', minWeight).limit(1);
        if (catchesToDelete && catchesToDelete.length > 0) {
          await supabase.from('catches').delete().eq('id', catchesToDelete[0].id);
        }
        newCatches = newCatches.filter(w => w !== minWeight);
      }
      await supabase.from('catches').insert([{ competitor_id: competitorId, weight: weight }]);
      newCatches.sort((a, b) => b - a);
      setCompetitors(competitors.map(c => c.id === competitorId ? { ...c, catches: newCatches } : c));
      setWeightInput('');
      setEditingId(null);
    } catch (error) {
      alert('Hiba: ' + error.message);
    }
  };

  const removeCatch = async (competitorId, catchIndex) => {
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      const weightToRemove = competitor.catches[catchIndex];
      const { data: catchesToDelete } = await supabase.from('catches').select('*').eq('competitor_id', competitorId).eq('weight', weightToRemove).limit(1);
      if (catchesToDelete && catchesToDelete.length > 0) {
        await supabase.from('catches').delete().eq('id', catchesToDelete[0].id);
      }
      setCompetitors(competitors.map(c => {
        if (c.id === competitorId) {
          return { ...c, catches: c.catches.filter((_, i) => i !== catchIndex) };
        }
        return c;
      }));
    } catch (error) {
      alert('Hiba: ' + error.message);
    }
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  // === IDE JÖN AZ 1. RÉSZ UTÁN ===

  if (showCompetitionList && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-blue-600" />
                Mentett Versenyek
              </h2>
              <button onClick={() => setShowCompetitionList(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <button onClick={createNewCompetition} className="w-full mb-6 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2">
              <PlusCircle className="w-6 h-6" />
              Új Verseny Indítása
            </button>
            <div className="space-y-3">
              {competitions.map((comp) => {
                const date = new Date(comp.created_at);
                const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                const isActive = comp.id === competitionId;
                return (
                  <div key={comp.id} className={`border-2 rounded-lg p-4 flex justify-between items-center ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">{comp.title}</h3>
                      <p className="text-gray-600 text-sm">{dateStr}</p>
                      {isActive && <span className="inline-block mt-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Aktív</span>}
                    </div>
                    <div className="flex gap-2">
                      {!isActive && <button onClick={() => loadCompetition(comp.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Betöltés</button>}
                      <button onClick={() => deleteCompetition(comp.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Törlés</button>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Fish className="w-10 h-10" />
                {user ? (
                <>
                  <button onClick={() => setShowCompetitionList(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4">
                    <FolderOpen className="w-5 h-5" />
                    <span className="font-semibold">Versenyek</span>
                  </button>
                  <button onClick={() => loadCompetition(competitionId)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
                    <RefreshCw className="w-6 h-6" />
                  </button>
                  <button onClick={handleLogout} className="p-2 bg-red-500 bg-opacity-80 rounded-lg hover:bg-opacity-100 flex items-center gap-2 px-4">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Kilépés</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowLoginModal(true)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4">
                    <Lock className="w-5 h-5" />
                    <span className="font-semibold">Admin</span>
                  </button>
                  <button onClick={() => loadCompetition(competitionId)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </>
              )}
                <>
                  <button onClick={() => { const e = prompt('Email:'); const p = prompt('Jelszó:'); if (e && p) { setEmail(e); setPassword(p); handleLogin({ preventDefault: () => {} }); }}} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 flex items-center gap-2 px-4">
                    <Lock className="w-5 h-5" />
                    <span className="font-semibold">Admin</span>
                  </button>
                  <button onClick={() => loadCompetition(competitionId)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-green-100">
            45 versenyző • 5 hal • Összsúly alapján
            {user && <span> • Admin: {user.email}</span>}
          </p>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyző Hozzáadása</h2>
            <div className="flex gap-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCompetitor()} placeholder="Versenyző neve..." className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" disabled={competitors.length >= 45} />
              <button onClick={addCompetitor} disabled={competitors.length >= 45} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 font-semibold">
                <Plus className="w-5 h-5" />
                Hozzáad ({competitors.length}/45)
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyzők és Fogások</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold">Név</th>
                  <th className="px-4 py-3 text-center font-semibold">Db</th>
                  <th className="px-4 py-3 text-center font-semibold">1. hal (g)</th>
                  <th className="px-4 py-3 text-center font-semibold">2. hal (g)</th>
                  <th className="px-4 py-3 text-center font-semibold">3. hal (g)</th>
                  <th className="px-4 py-3 text-center font-semibold">4. hal (g)</th>
                  <th className="px-4 py-3 text-center font-semibold">5. hal (g)</th>
                  <th className="px-4 py-3 text-center font-semibold">Összsúly (g)</th>
                  {user && (
                    <>
                      <th className="px-4 py-3 text-center font-semibold">Súly bevitel</th>
                      <th className="px-4 py-3 text-center font-semibold">Művelet</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {competitors.map((competitor, index) => {
                  const totalWeight = competitor.catches.reduce((sum, w) => sum + w, 0);
                  return (
                    <tr key={competitor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{competitor.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{competitor.catches.length}</span>
                      </td>
                      {[0, 1, 2, 3, 4].map(i => (
                        <td key={i} className="px-4 py-3 text-center">
                          {competitor.catches[i] ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-semibold text-green-700">{competitor.catches[i]} g</span>
                              {user && <button onClick={() => removeCatch(competitor.id, i)} className="text-red-500 hover:text-red-700 ml-1">×</button>}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">{totalWeight} g</span>
                      </td>
                      {user && (
                        <>
                          <td className="px-4 py-3">
                            {editingId === competitor.id ? (
                              <div className="flex gap-2">
                                <input type="number" step="1" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addWeight(competitor.id)} placeholder="gramm" className="w-24 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none" autoFocus />
                                <button onClick={() => addWeight(competitor.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold">OK</button>
                                <button onClick={() => { setEditingId(null); setWeightInput(''); }} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-semibold">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setEditingId(competitor.id)} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold">Bevitel</button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => deleteCompetitor(competitor.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {competitors.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Fish className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Még nincsenek versenyzők.</p>
              </div>
            )}
          </div>
        </div>
        {/* Eredmények */}
{/* === IDE JÖN A 2. RÉSZ UTÁN === */}
 {/* Bejelentkezési Modal */}
        {showLoginModal && !user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Bejelentkezés</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email cím</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jelszó</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {loginError && (
                  <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    {loginError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                </button>
              </form>
            </div>
          </div>
        )}
       <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              5 halat fogottak (Top 6)
            </h3>
            {results.with5Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with5Fish.map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center p-3 rounded ${i === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : i === 1 ? 'bg-gray-100 border-2 border-gray-400' : i === 2 ? 'bg-orange-100 border-2 border-orange-400' : 'bg-gray-50'}`}>
                    <span className="font-semibold"><span className="text-2xl mr-2">{i + 1}.</span>{c.name}</span>
                    <span className="font-bold text-green-700 text-lg">{c.totalWeight} g</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 5 halat fogott versenyző</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gray-400" />
              4 halat fogottak (Top 6)
            </h3>
            {results.with4Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with4Fish.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded bg-gray-50">
                    <span className="font-semibold"><span className="text-2xl mr-2">{i + 1}.</span>{c.name}</span>
                    <span className="font-bold text-blue-700 text-lg">{c.totalWeight} g</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 4 halat fogott versenyző</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-bronze-400" />
              3 halat fogottak (Top 6)
            </h3>
            {results.with3Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with3Fish.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded bg-gray-50">
                    <span className="font-semibold"><span className="text-2xl mr-2">{i + 1}.</span>{c.name}</span>
                    <span className="font-bold text-purple-700 text-lg">{c.totalWeight} g</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 3 halat fogott versenyző</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
              <Fish className="w-6 h-6 text-red-500" />
              Legnagyobb hal (Top 5)
            </h3>
            {results.biggestFishList.length > 0 ? (
              <div className="space-y-2">
                {results.biggestFishList.map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center p-3 rounded ${i === 0 ? 'bg-red-100 border-2 border-red-400' : 'bg-gray-50'}`}>
                    <span className="font-semibold"><span className="text-2xl mr-2">{i + 1}.</span>{c.name}</span>
                    <span className="font-bold text-red-700 text-lg">{c.biggestFish} g</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs fogott hal</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Trash2, Plus, Trophy, Fish, RefreshCw,
  LogOut, FolderOpen, PlusCircle, Lock
} from 'lucide-react';

const supabaseUrl = 'https://sskzueeefjcuqtuesojm.supabase.co';
const supabaseKey = 'sb_publishable_8iZhmXZCwGJpkJaoEm7cZg_3WFhQwUa';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FishingCompetition() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showCompetitionList, setShowCompetitionList] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState(null);
  const [title, setTitle] = useState('Horgászverseny');

  const [competitors, setCompetitors] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  /* ================= AUTH ================= */

  useEffect(() => {
    checkUser();
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data?.session?.user ?? null);
    await loadCompetitions();
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      setUser(data.user);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      await loadCompetitions();
    } catch {
      setLoginError('Hibás email vagy jelszó!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  /* ================= DATA ================= */

  const loadCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    setCompetitions(data || []);
    if (data?.length) loadCompetition(data[0].id);
  };

  const loadCompetition = async (id) => {
    setCompetitionId(id);

    const { data: comp } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    setTitle(comp.title);

    const { data: comps } = await supabase
      .from('competitors')
      .select('*')
      .eq('competition_id', id)
      .order('created_at');

    const withCatches = await Promise.all(
      (comps || []).map(async c => {
        const { data } = await supabase
          .from('catches')
          .select('*')
          .eq('competitor_id', c.id)
          .order('weight', { ascending: false });
        return { ...c, catches: data.map(d => d.weight) };
      })
    );

    setCompetitors(withCatches);
    setShowCompetitionList(false);
  };

  /* ================= UI ================= */

  const results = useMemo(() => {
    const s = competitors.map(c => ({
      ...c,
      totalWeight: c.catches.reduce((a, b) => a + b, 0),
      fishCount: c.catches.length,
      biggestFish: c.catches.length ? Math.max(...c.catches) : 0
    }));
    return {
      with5Fish: s.filter(c => c.fishCount === 5).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with4Fish: s.filter(c => c.fishCount === 4).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      with3Fish: s.filter(c => c.fishCount === 3).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6),
      biggestFishList: s.filter(c => c.biggestFish > 0).sort((a, b) => b.biggestFish - a.biggestFish).slice(0, 5)
    };
  }, [competitors]);

  if (loading) return <div className="p-10 text-center">Betöltés…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg shadow-xl mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Fish className="w-10 h-10" />
            <span className="text-2xl font-bold">{title}</span>
          </div>

          {user ? (
            <div className="flex gap-2">
              <button onClick={() => setShowCompetitionList(true)} className="px-4 py-2 bg-white/20 rounded">Versenyek</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 rounded">Kilépés</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-white/20 rounded flex gap-2">
              <Lock /> Admin
            </button>
          )}
        </div>

        {/* ===== LOGIN MODAL ===== */}
        {showLoginModal && !user && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg w-80 space-y-4">
              <h2 className="text-xl font-bold">Admin belépés</h2>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />

              <input
                type="password"
                placeholder="Jelszó"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />

              {loginError && <div className="text-red-600">{loginError}</div>}

              <button className="w-full bg-green-600 text-white py-2 rounded">
                Bejelentkezés
              </button>
            </form>
          </div>
        )}

        {/* ===== RESULTS (readonly works too) ===== */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold mb-3">5 hal – Top 6</h3>
            {results.with5Fish.map((c, i) => (
              <div key={c.id}>{i + 1}. {c.name} – {c.totalWeight} g</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

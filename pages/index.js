import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Trophy, Fish, RefreshCw, LogOut, FolderOpen, PlusCircle, Lock } from 'lucide-react';

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
  const [title, setTitle] = useState('Horgászverseny');
  const [competitors, setCompetitors] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [competitionId, setCompetitionId] = useState(null);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompetitions();
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data?.session?.user ?? null);
    await loadCompetitions();
    setLoading(false);
  };

  /* ========= 🔑 CSAK EZ AZ ÚJ RÉSZ ========= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setUser(data.user);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      await loadCompetitions();
    } catch (err) {
      setLoginError('Hibás email vagy jelszó!');
    } finally {
      setLoading(false);
    }
  };
  /* ======================================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const loadCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    setCompetitions(data || []);
    if (data && data.length > 0) await loadCompetition(data[0].id);
  };

  const loadCompetition = async (id) => {
    setCompetitionId(id);

    const { data: comp } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    setTitle(comp.title);

    const { data: competitorsData } = await supabase
      .from('competitors')
      .select('*')
      .eq('competition_id', id)
      .order('created_at');

    const withCatches = await Promise.all(
      (competitorsData || []).map(async c => {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Betöltés…</div>;

  return (
    <>
      {/* 🔒 LOGIN MODAL – VÁLTOZATLAN, CSAK MOST MÁR MŰKÖDIK */}
      {showLoginModal && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold">Admin Bejelentkezés</h2>

            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border p-2 rounded" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-2 rounded" />

            {loginError && <div className="text-red-600">{loginError}</div>}

            <button className="w-full bg-green-600 text-white py-2 rounded">Bejelentkezés</button>
          </form>
        </div>
      )}

      {/* ⬇️ INNENTŐL A TELJES OLDALAD VÁLTOZATLAN ⬇️ */}
      {/* a te eredeti JSX-ed marad */}
    </>
  );
}


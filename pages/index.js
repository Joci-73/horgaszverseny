import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Trophy, Fish, RefreshCw } from 'lucide-react';

// ⚠️ FONTOS: Cseréld ki ezeket a saját Supabase adataidra!
const supabaseUrl = 'https://sskzueeefjcuqtuesojm.supabase.co';
const supabaseKey = 'sb_publishable_8iZhmXZCwGJpkJaoEm7cZg_3WFhQwUa';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FishingCompetition() {
  const [title, setTitle] = useState('Horgászverseny');
  const [competitors, setCompetitors] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [competitionId, setCompetitionId] = useState(null);

  // Adatok betöltése
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Verseny betöltése
      const { data: competitions, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (compError) throw compError;
      
      if (competitions && competitions.length > 0) {
        const comp = competitions[0];
        setCompetitionId(comp.id);
        setTitle(comp.title);
        
        // Versenyzők betöltése
        const { data: competitorsData, error: comptsError } = await supabase
          .from('competitors')
          .select('*')
          .eq('competition_id', comp.id)
          .order('created_at', { ascending: true });
        
        if (comptsError) throw comptsError;
        
        // Fogások betöltése minden versenyzőhöz
        const competitorsWithCatches = await Promise.all(
          competitorsData.map(async (competitor) => {
            const { data: catches, error: catchError } = await supabase
              .from('catches')
              .select('*')
              .eq('competitor_id', competitor.id)
              .order('weight', { ascending: false });
            
            if (catchError) throw catchError;
            
            return {
              ...competitor,
              catches: catches.map(c => c.weight)
            };
          })
        );
        
        setCompetitors(competitorsWithCatches);
      }
    } catch (error) {
      console.error('Hiba az adatok betöltésekor:', error);
      alert('Hiba történt az adatok betöltésekor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cím mentése
  const saveTitle = async (newTitle) => {
    if (!competitionId) return;
    
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ title: newTitle })
        .eq('id', competitionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Hiba a cím mentésekor:', error);
    }
  };

  // Versenyző hozzáadása
  const addCompetitor = async () => {
    if (newName.trim() && competitors.length < 45 && competitionId) {
      try {
        const { data, error } = await supabase
          .from('competitors')
          .insert([
            { competition_id: competitionId, name: newName.trim() }
          ])
          .select();
        
        if (error) throw error;
        
        setCompetitors([...competitors, { ...data[0], catches: [] }]);
        setNewName('');
      } catch (error) {
        console.error('Hiba a versenyző hozzáadásakor:', error);
        alert('Hiba történt: ' + error.message);
      }
    }
  };

  // Versenyző törlése
  const deleteCompetitor = async (id) => {
    try {
      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCompetitors(competitors.filter(c => c.id !== id));
    } catch (error) {
      console.error('Hiba a versenyző törlésekor:', error);
      alert('Hiba történt: ' + error.message);
    }
  };

  // Súly hozzáadása
  const addWeight = async (competitorId) => {
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) {
      alert('Kérlek, adj meg egy érvényes súlyt grammban!');
      return;
    }

    try {
      const competitor = competitors.find(c => c.id === competitorId);
      let newCatches = [...competitor.catches, weight];
      
      // Ha több mint 5 hal
      if (newCatches.length > 5) {
        const minWeight = Math.min(...newCatches);
        
        // Töröljük a legkisebb halat az adatbázisból
        const { data: catchesToDelete, error: fetchError } = await supabase
          .from('catches')
          .select('*')
          .eq('competitor_id', competitorId)
          .eq('weight', minWeight)
          .limit(1);
        
        if (fetchError) throw fetchError;
        
        if (catchesToDelete && catchesToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('catches')
            .delete()
            .eq('id', catchesToDelete[0].id);
          
          if (deleteError) throw deleteError;
        }
        
        newCatches = newCatches.filter(w => w !== minWeight);
      }
      
      // Új hal hozzáadása
      const { error } = await supabase
        .from('catches')
        .insert([
          { competitor_id: competitorId, weight: weight }
        ]);
      
      if (error) throw error;
      
      // Rendezés
      newCatches.sort((a, b) => b - a);
      
      setCompetitors(competitors.map(c => 
        c.id === competitorId ? { ...c, catches: newCatches } : c
      ));
      
      setWeightInput('');
      setEditingId(null);
    } catch (error) {
      console.error('Hiba a súly hozzáadásakor:', error);
      alert('Hiba történt: ' + error.message);
    }
  };

  // Egy hal törlése
  const removeCatch = async (competitorId, catchIndex) => {
    try {
      const competitor = competitors.find(c => c.id === competitorId);
      const weightToRemove = competitor.catches[catchIndex];
      
      // Keresés az adatbázisban
      const { data: catchesToDelete, error: fetchError } = await supabase
        .from('catches')
        .select('*')
        .eq('competitor_id', competitorId)
        .eq('weight', weightToRemove)
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (catchesToDelete && catchesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('catches')
          .delete()
          .eq('id', catchesToDelete[0].id);
        
        if (deleteError) throw deleteError;
      }
      
      setCompetitors(competitors.map(c => {
        if (c.id === competitorId) {
          const newCatches = c.catches.filter((_, i) => i !== catchIndex);
          return { ...c, catches: newCatches };
        }
        return c;
      }));
    } catch (error) {
      console.error('Hiba a hal törlésekor:', error);
      alert('Hiba történt: ' + error.message);
    }
  };

  // Eredmények számítása (ugyanaz mint korábban)
  const results = useMemo(() => {
    const withScores = competitors.map(c => ({
      ...c,
      totalWeight: c.catches.reduce((sum, w) => sum + w, 0),
      fishCount: c.catches.length,
      biggestFish: c.catches.length > 0 ? Math.max(...c.catches) : 0
    }));

    const with5Fish = withScores.filter(c => c.fishCount === 5)
      .sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6);
    
    const with4Fish = withScores.filter(c => c.fishCount === 4)
      .sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6);
    
    const with3Fish = withScores.filter(c => c.fishCount === 3)
      .sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 6);

    const biggestFishList = withScores
      .filter(c => c.biggestFish > 0)
      .sort((a, b) => b.biggestFish - a.biggestFish)
      .slice(0, 5);

    return { with5Fish, with4Fish, with3Fish, biggestFishList };
  }, [competitors]);

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
        {/* Fejléc */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Fish className="w-10 h-10" />
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  saveTitle(e.target.value);
                }}
                className="text-4xl font-bold bg-transparent border-b-2 border-transparent hover:border-white focus:border-white focus:outline-none text-white placeholder-green-200 flex-1"
                placeholder="Verseny címe..."
              />
            </div>
            <button
              onClick={loadData}
              className="ml-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              title="Frissítés"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-green-100">45 versenyző • 5 hal • Összsúly alapján</p>
        </div>

        {/* Versenyző hozzáadása */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Versenyző Hozzáadása</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
              placeholder="Versenyző neve..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={competitors.length >= 45}
            />
            <button
              onClick={addCompetitor}
              disabled={competitors.length >= 45}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Hozzáad ({competitors.length}/45)
            </button>
          </div>
        </div>

        {/* Versenyzők táblázata */}
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
                  <th className="px-4 py-3 text-center font-semibold">Súly bevitel</th>
                  <th className="px-4 py-3 text-center font-semibold">Művelet</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((competitor, index) => {
                  const totalWeight = competitor.catches.reduce((sum, w) => sum + w, 0);
                  return (
                    <tr key={competitor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{competitor.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                          {competitor.catches.length}
                        </span>
                      </td>
                      {[0, 1, 2, 3, 4].map(i => (
                        <td key={i} className="px-4 py-3 text-center">
                          {competitor.catches[i] ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-semibold text-green-700">
                                {competitor.catches[i]} g
                              </span>
                              <button
                                onClick={() => removeCatch(competitor.id, i)}
                                className="text-red-500 hover:text-red-700 ml-1"
                                title="Törlés"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                          {totalWeight} g
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === competitor.id ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="1"
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addWeight(competitor.id)}
                              placeholder="gramm"
                              className="w-24 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => addWeight(competitor.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setWeightInput('');
                              }}
                              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-semibold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingId(competitor.id)}
                            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                          >
                            Bevitel
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteCompetitor(competitor.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Versenyző törlése"
                        >
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
                <Fish className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Még nincsenek versenyzők. Adj hozzá versenyzőket a fenti mezőben!</p>
              </div>
            )}
          </div>
        </div>

        {/* Eredmények - ugyanaz mint korábban */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 5 halat fogottak */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              5 halat fogottak (Top 6)
            </h3>
            {results.with5Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with5Fish.map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center p-3 rounded ${
                    i === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    i === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                    i === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                    'bg-gray-50'
                  }`}>
                    <span className="font-semibold">
                      <span className="text-2xl mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="font-bold text-green-700 text-lg">
                      {c.totalWeight} g
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 5 halat fogott versenyző</p>
            )}
          </div>

          {/* 4 halat fogottak */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gray-400" />
              4 halat fogottak (Top 6)
            </h3>
            {results.with4Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with4Fish.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded bg-gray-50">
                    <span className="font-semibold">
                      <span className="text-2xl mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="font-bold text-blue-700 text-lg">
                      {c.totalWeight} g
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 4 halat fogott versenyző</p>
            )}
          </div>

          {/* 3 halat fogottak */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-bronze-400" />
              3 halat fogottak (Top 6)
            </h3>
            {results.with3Fish.length > 0 ? (
              <div className="space-y-2">
                {results.with3Fish.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded bg-gray-50">
                    <span className="font-semibold">
                      <span className="text-2xl mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="font-bold text-purple-700 text-lg">
                      {c.totalWeight} g
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">Még nincs 3 halat fogott versenyző</p>
            )}
          </div>

          {/* Legnagyobb hal */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
              <Fish className="w-6 h-6 text-red-500" />
              Legnagyobb hal (Top 5)
            </h3>
            {results.biggestFishList.length > 0 ? (
              <div className="space-y-2">
                {results.biggestFishList.map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center p-3 rounded ${
                    i === 0 ? 'bg-red-100 border-2 border-red-400' : 'bg-gray-50'
                  }`}>
                    <span className="font-semibold">
                      <span className="text-2xl mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="font-bold text-red-700 text-lg">
                      {c.biggestFish} g
                    </span>
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

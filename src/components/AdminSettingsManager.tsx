'use client';

import React, { useState } from 'react';
import { Building, Category, MaintenanceTeam } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Building2, Tag, Users, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  initialBuildings: Building[];
  initialCategories: Category[];
  initialTeams: MaintenanceTeam[];
}

export function AdminSettingsManager({
  initialBuildings,
  initialCategories,
  initialTeams,
}: Props) {
  const [activeTab, setActiveTab] = useState<'buildings' | 'categories' | 'teams'>('buildings');
  const [buildings, setBuildings] = useState(initialBuildings);
  const [categories, setCategories] = useState(initialCategories);
  const [teams, setTeams] = useState(initialTeams);

  // New building form state
  const [newBldName, setNewBldName] = useState('');
  const [newBldCode, setNewBldCode] = useState('');
  const [newBldDesc, setNewBldDesc] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert({
          name: newBldName.trim(),
          code: newBldCode.trim().toUpperCase(),
          description: newBldDesc.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setBuildings((prev) => [...prev, data]);
      setNewBldName('');
      setNewBldCode('');
      setNewBldDesc('');
      setMsg({ text: 'Campus building added successfully!', type: 'success' });
      router.refresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to add building', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCatName.trim(),
          description: newCatDesc.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) => [...prev, data]);
      setNewCatName('');
      setNewCatDesc('');
      setMsg({ text: 'Issue category added successfully!', type: 'success' });
      router.refresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to add category', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from('maintenance_teams')
        .insert({
          name: newTeamName.trim(),
          contact_email: newTeamEmail.trim() || null,
          description: newTeamDesc.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setTeams((prev) => [...prev, data]);
      setNewTeamName('');
      setNewTeamEmail('');
      setNewTeamDesc('');
      setMsg({ text: 'Maintenance team added successfully!', type: 'success' });
      router.refresh();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to add team', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('buildings');
            setMsg(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'buildings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Campus Buildings ({buildings.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('categories');
            setMsg(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Issue Categories ({categories.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('teams');
            setMsg(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Maintenance Teams ({teams.length})
        </button>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tab 1: Buildings */}
      {activeTab === 'buildings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {buildings.map((b) => (
                <div key={b.id} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{b.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                    </div>
                    {b.description && (
                      <p className="text-xs text-slate-500 mt-1">{b.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <form
              onSubmit={handleAddBuilding}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Campus Building
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Building Name</label>
                <input
                  type="text"
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  placeholder="e.g. Biomedical Research Wing"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Code / Abbreviation</label>
                <input
                  type="text"
                  value={newBldCode}
                  onChange={(e) => setNewBldCode(e.target.value)}
                  placeholder="e.g. BRW"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 uppercase"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newBldDesc}
                  onChange={(e) => setNewBldDesc(e.target.value)}
                  placeholder="e.g. Research labs, animal vivarium, conference suites"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Building'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {categories.map((c) => (
                <div key={c.id} className="p-4">
                  <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                  {c.description && (
                    <p className="text-xs text-slate-500 mt-1">{c.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <form
              onSubmit={handleAddCategory}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Category
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Heating, Ventilation & AC (HVAC)"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Thermostat control, chillers, duct air circulation"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Teams */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {teams.map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    {t.contact_email && (
                      <span className="text-xs text-indigo-600 font-mono">
                        {t.contact_email}
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <form
              onSubmit={handleAddTeam}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Maintenance Team
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Grounds & Landscape Crew"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Dispatch Email</label>
                <input
                  type="email"
                  value={newTeamEmail}
                  onChange={(e) => setNewTeamEmail(e.target.value)}
                  placeholder="e.g. grounds@campusfix.edu"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Walkways, outdoor lighting, lawn sprinkler irrigation"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Maintenance Team'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

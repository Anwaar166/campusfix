'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2, Edit3, X, Save } from 'lucide-react';
import { IssueWithCounts } from '@/types/database';

interface Props {
  issue: IssueWithCounts;
}

export function IssueReporterActions({ issue }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [roomLocation, setRoomLocation] = useState(issue.room_location);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this open issue? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('issues').delete().eq('id', issue.id);
      if (error) throw error;
      router.push('/issues');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to delete issue:', err);
      alert('Could not delete issue. Note: only open issues can be deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('issues')
        .update({
          title: title.trim(),
          description: description.trim(),
          room_location: roomLocation.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', issue.id);

      if (error) throw error;
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to edit issue:', err);
      alert('Could not update issue.');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3 mb-6"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            Edit Your Open Issue
          </h4>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Room / Precise Location</label>
          <input
            type="text"
            value={roomLocation}
            onChange={(e) => setRoomLocation(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Edit Report
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Report
      </button>
    </div>
  );
}

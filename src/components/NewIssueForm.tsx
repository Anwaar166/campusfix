'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building, Category, IssueUrgency } from '@/types/database';
import { DuplicateDetector } from './DuplicateDetector';
import {
  Send,
  AlertCircle,
  MapPin,
  Building2,
  Tag,
  Flame,
  FileText,
  Sparkles,
} from 'lucide-react';

interface Props {
  buildings: Building[];
  categories: Category[];
  currentUserId: string;
}

export function NewIssueForm({ buildings, categories, currentUserId }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'IT & Wi-Fi');
  const [building, setBuilding] = useState(buildings[0]?.name || 'Main Academic Library');
  const [roomLocation, setRoomLocation] = useState('');
  const [urgency, setUrgency] = useState<IssueUrgency>('Medium');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a clear, descriptive issue title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe what is broken or malfunctioning.');
      return;
    }
    if (!roomLocation.trim()) {
      setErrorMsg('Please enter the room number, floor, or specific campus spot.');
      return;
    }

    setLoading(true);

    try {
      // 1. Insert into issues table
      const { data: newIssue, error: issueError } = await supabase
        .from('issues')
        .insert({
          created_by: currentUserId,
          title: title.trim(),
          description: description.trim(),
          category,
          building,
          room_location: roomLocation.trim(),
          urgency,
          status: 'Open',
        })
        .select()
        .single();

      if (issueError) throw issueError;

      // 2. Insert initial timeline update
      await supabase.from('issue_updates').insert({
        issue_id: newIssue.id,
        author_id: currentUserId,
        update_type: 'created',
        message: `Issue reported with ${urgency} urgency by campus reporter.`,
        old_value: null,
        new_value: 'Open',
        is_internal: false,
      });

      // 3. Send in-app confirmation notification
      await supabase.from('notifications').insert({
        user_id: currentUserId,
        issue_id: newIssue.id,
        title: 'Issue Submitted',
        message: `Your report "${title.trim()}" is now registered and queued for triage.`,
        is_read: false,
      });

      router.push(`/issues/${newIssue.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to submit issue:', err);
      setErrorMsg(err.message || 'Failed to submit issue. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Submission Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Building and Category Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Building */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Campus Building <span className="text-rose-500">*</span>
          </label>
          <select
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            required
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-600" />
            Issue Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Room or Precise Location */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-indigo-600" />
          Room Number or Precise Location <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={roomLocation}
          onChange={(e) => setRoomLocation(e.target.value)}
          placeholder="e.g. 2nd Floor Quiet Zone Desk 14, or Biochem Lab 204 near sink"
          className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-600" />
          Issue Title / Summary <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Overhead projector displays intermittent purple discoloration"
          className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          maxLength={150}
          required
        />
        <div className="text-[11px] text-slate-500 flex justify-between">
          <span>Brief summary of the issue</span>
          <span>{title.length}/150</span>
        </div>
      </div>

      {/* Live Duplicate Detector Alert */}
      <DuplicateDetector building={building} category={category} title={title} />

      {/* Urgency Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-indigo-600" />
          Urgency Level <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { level: 'Low', desc: 'Cosmetic or minor inconvenience' },
            { level: 'Medium', desc: 'Normal classroom or office fault' },
            { level: 'High', desc: 'Disrupts instruction or heavy traffic' },
            { level: 'Critical', desc: 'Safety hazard or immediate risk' },
          ].map((item) => (
            <button
              type="button"
              key={item.level}
              onClick={() => setUrgency(item.level as IssueUrgency)}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgency === item.level
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">{item.level}</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-600" />
          Detailed Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe symptoms, when you noticed it, any error messages, or safety implications..."
          className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Submitting Request...' : 'Submit Maintenance Request'}
        </button>
      </div>
    </form>
  );
}

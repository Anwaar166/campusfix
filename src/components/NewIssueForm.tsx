'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';
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
  Mic,
  MicOff,
} from 'lucide-react';

interface Props {
  buildings: Building[];
  categories: Category[];
  currentUserId: string;
}

export function NewIssueForm({ buildings, categories, currentUserId }: Props) {
  const { t, language } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'IT & Wi-Fi');
  const [building, setBuilding] = useState(buildings[0]?.name || 'Main Academic Library');
  const [roomLocation, setRoomLocation] = useState('');
  const [urgency, setUrgency] = useState<IssueUrgency>('Medium');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voice Speech-to-Text State (Groq Whisper)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoiceDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'description.webm');
          formData.append('language', language === 'ur' ? 'ur' : 'en');

          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to transcribe');

          if (data.text) {
            setDescription((prev) => (prev ? `${prev}\n${data.text}` : data.text));
          }
        } catch (err: any) {
          console.error('Whisper voice dictation error:', err);
          setErrorMsg(`Voice dictation: ${err?.message || 'Failed to transcribe audio'}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setErrorMsg('Could not access microphone. Please grant browser microphone permission.');
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

      // 4. Trigger n8n Automation Webhook (non-blocking)
      fetch('/api/webhooks/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_issue',
          data: {
            issueId: newIssue.id,
            title: newIssue.title,
            category: newIssue.category,
            building: newIssue.building,
            roomLocation: newIssue.room_location,
            urgency: newIssue.urgency,
            createdBy: currentUserId,
          },
        }),
      }).catch((err) => console.warn('n8n new_issue dispatch error:', err));

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
            {t('issues.building_label', 'Campus Building')} <span className="text-rose-500">*</span>
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
            {t('issues.category_label', 'Issue Category')} <span className="text-rose-500">*</span>
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
          {t('issues.location_label', 'Room Number or Precise Location')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={roomLocation}
          onChange={(e) => setRoomLocation(e.target.value)}
          placeholder={t('issues.location_placeholder', 'e.g. 2nd Floor Quiet Zone Desk 14, or Biochem Lab 204 near sink')}
          className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-600" />
          {t('issues.title_label', 'Issue Title / Summary')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('issues.title_placeholder', 'e.g. Overhead projector displays intermittent purple discoloration')}
          className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          maxLength={150}
          required
        />
        <div className="text-[11px] text-slate-500 flex justify-between">
          <span>{language === 'ur' ? 'مسئلے کا مختصر خلاصہ' : 'Brief summary of the issue'}</span>
          <span>{title.length}/150</span>
        </div>
      </div>

      {/* Live Duplicate Detector Alert */}
      <DuplicateDetector building={building} category={category} title={title} />

      {/* Urgency Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-indigo-600" />
          {t('issues.urgency_label', 'Urgency Level')} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              level: 'Low',
              label: t('urgency.low', 'Low'),
              desc: language === 'ur' ? 'معمولی یا ظاہری نوعیت کا مسئلہ' : 'Cosmetic or minor inconvenience',
            },
            {
              level: 'Medium',
              label: t('urgency.medium', 'Medium'),
              desc: language === 'ur' ? 'کلاس روم یا دفتر کی معمول کی خرابی' : 'Normal classroom or office fault',
            },
            {
              level: 'High',
              label: t('urgency.high', 'High'),
              desc: language === 'ur' ? 'تعلیمی سرگرمیوں یا آمدورفت میں رکاوٹ' : 'Disrupts instruction or heavy traffic',
            },
            {
              level: 'Critical',
              label: t('urgency.critical', 'Critical'),
              desc: language === 'ur' ? 'سنگین خطرہ یا فوری حفاظتی مسئلہ' : 'Safety hazard or immediate risk',
            },
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
              <div className="text-xs font-bold text-slate-900">{item.label}</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0D9488]" />
            {t('issues.desc_label', 'Detailed Description')} <span className="text-rose-500">*</span>
          </label>

          <button
            type="button"
            onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
            disabled={isTranscribing}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                : 'bg-teal-50 text-[#0D9488] border border-teal-200 hover:bg-teal-100'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-3.5 h-3.5" /> {language === 'ur' ? 'ڈکٹیشن روکیں' : 'Stop Dictation'}
              </>
            ) : isTranscribing ? (
              <>
                <Mic className="w-3.5 h-3.5 animate-spin" /> {language === 'ur' ? 'آواز تبدیل ہو رہی ہے...' : 'Transcribing...'}
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" /> {t('issues.voice_dictate', 'Dictate with Voice (Whisper)')}
              </>
            )}
          </button>
        </div>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('issues.desc_placeholder', 'Please describe symptoms, when you noticed it, any error messages, or safety implications...')}
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
          {t('common.cancel', 'Cancel')}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {loading
            ? (language === 'ur' ? 'شکایت جمع ہو رہی ہے...' : 'Submitting Request...')
            : t('issues.submit_report', 'Submit Maintenance Request')}
        </button>
      </div>
    </form>
  );
}

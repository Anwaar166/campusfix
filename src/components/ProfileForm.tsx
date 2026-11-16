'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User, Mail, Building, IdCard, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  profile: Profile;
}

export function ProfileForm({ profile }: Props) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [department, setDepartment] = useState(profile.department || '');
  const [studentStaffId, setStudentStaffId] = useState(profile.student_staff_id || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          department: department.trim() || null,
          student_staff_id: studentStaffId.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Badge notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Assigned Account Role</div>
            <div className="text-[11px] text-slate-500">
              Role permissions are enforced via PostgreSQL database Row Level Security.
            </div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
          {profile.role}
        </span>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            Display Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Email (Readonly) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-indigo-600" />
            Campus Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 bg-slate-100 text-slate-500 cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-400">Email is linked to your campus auth account.</p>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-600" />
            Academic Department / Unit
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science, Biological Sciences, Facilities"
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Student / Staff ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <IdCard className="w-4 h-4 text-indigo-600" />
            Student or Staff ID Card Number (Optional)
          </label>
          <input
            type="text"
            value={studentStaffId}
            onChange={(e) => setStudentStaffId(e.target.value)}
            placeholder="e.g. STU-984321 or FAC-1104"
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}

import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488] animate-pulse">
        <LayoutDashboard className="w-6 h-6 animate-spin [animation-duration:3s]" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-slate-800 text-sm">Loading Your Dashboard...</h3>
        <p className="text-xs text-slate-400 mt-0.5">Fetching assigned issues and live ticket progress</p>
      </div>
    </div>
  );
}

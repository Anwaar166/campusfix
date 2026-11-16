import React from 'react';
import { Wrench } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-900 p-6 select-none">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Brand Logo Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0D9488] flex items-center justify-center text-white shadow-xl shadow-teal-500/20 animate-pulse">
            <Wrench className="w-8 h-8 text-white animate-spin [animation-duration:4s]" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        </div>

        {/* Brand Text */}
        <div className="text-center space-y-1">
          <div className="font-black text-2xl tracking-tight text-[#102A43]">
            Campus<span className="text-[#0D9488]">Fix</span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Loading Campus Portal...
          </p>
        </div>

        {/* Smooth Loader Bar */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
          <div className="w-full h-full bg-gradient-to-r from-[#102A43] via-[#0D9488] to-teal-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

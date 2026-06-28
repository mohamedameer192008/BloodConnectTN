import React from 'react';
import { Droplet, Heart, Phone, Mail, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 text-slate-500 py-10 mt-16 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand description */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-primary text-white font-black text-sm shadow-xs shrink-0">
              +
            </div>
            <div>
              <span className="font-sans text-sm font-extrabold tracking-tight text-slate-800 leading-none block">
                BloodConnect <span className="text-primary">TN</span>
              </span>
              <span className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
                Emergency Blood Finder
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            A state-wide voluntary network connecting people seeking blood with compatible donors across Tamil Nadu. Connecting lives during critical emergency hours.
          </p>
        </div>

        {/* Resources & Quick Info */}
        <div className="space-y-3 text-xs">
          <h4 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-[11px]">Helpful Resources</h4>
          <ul className="space-y-2 text-slate-500">
            <li>
              <span className="font-bold text-slate-700">Donation Interval:</span> Every 90 days for safe red cell extraction.
            </li>
            <li>
              <span className="font-bold text-slate-700">Who Can Donate:</span> Healthy adults weighing 45kg+, aged 18 to 65.
            </li>
            <li>
              <span className="font-bold text-slate-700">Tamil Nadu Network:</span> Connecting Chennai, Coimbatore, Madurai, Trichy, and all adjacent districts.
            </li>
          </ul>
        </div>

        {/* Disclaimer / Notice */}
        <div className="space-y-3 text-xs">
          <h4 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span>Important Disclaimer</span>
          </h4>
          <p className="text-slate-500 leading-relaxed">
            This platform is an emergency coordinator database. While we verify accounts, users must independently check medical reports and seek professional guidance from licensed doctors and blood bank personnel.
          </p>
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>© 2026 Tamil Nadu Blood Finder Network</span>
            <span className="flex items-center gap-1">
              Made for <Heart className="h-3 w-3 text-primary fill-primary" /> humanity
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

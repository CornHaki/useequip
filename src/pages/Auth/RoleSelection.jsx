import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Building2 } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-5 sm:p-8 animate-fadeIn">
      <div className="max-w-4xl w-full space-y-10 sm:space-y-12">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center shadow-lg mb-6"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-textMain">UseEquip <span className="text-accent">Campus OS</span></h1>
          <p className="text-textMain/80 text-lg max-w-xl mx-auto">Accountable equipment sharing and lab management platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button onClick={() => navigate('/login/user')} className="p-7 sm:p-8 rounded-2xl bg-surface border border-slate-200 shadow-sm hover:border-accent/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-accent mb-4 group-hover:scale-105 transition-transform"><UserCheck className="w-7 h-7" /></div>
            <h2 className="text-xl font-bold mb-2">Register as User</h2>
            <p className="text-sm text-textMain/80">Sign in or create an account to find and request equipment.</p>
          </button>
          <button onClick={() => navigate('/login/admin')} className="p-7 sm:p-8 rounded-2xl bg-surface border border-slate-200 shadow-sm hover:border-accent/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-accent mb-4 group-hover:scale-105 transition-transform"><Building2 className="w-7 h-7" /></div>
            <h2 className="text-xl font-bold mb-2">Register as Admin</h2>
            <p className="text-sm text-textMain/80">Sign in or create an account to list equipment and manage requests.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login, registerAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!['user', 'admin'].includes(role)) {
      navigate('/');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await registerAccount(role, name, email, password, contactPhone, department);
        navigate(`/${role}-dashboard`);
      } else {
        await login(role, email, password);
        navigate(`/${role}-dashboard`);
      }
    } catch (loginError) {
      setError(loginError.code === 'auth/email-already-in-use'
        ? 'This email already has an account. Sign in using the role registered to it.'
        : loginError.message || 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 sm:p-8 animate-fadeIn">
      {/* Logo & Header */}
      <div className="text-center space-y-5 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center shadow-lg shadow-accent/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-textMain">
          UseEquip <span className="text-accent">Campus OS</span>
        </h1>
        <p className="text-textMain/80 text-lg max-w-xl mx-auto">
          Accountable equipment sharing and lab management platform.
        </p>
      </div>

      {/* Login Card */}
      <div key={role} className="role-transition-enter max-w-md w-full bg-surface p-6 sm:p-9 rounded-2xl border border-slate-200 shadow-lg">
        <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-textMain capitalize">{isRegistering ? `Create ${role} Account` : `${role} Sign In`}</h2>
          <p className="text-sm text-textMain/80 mt-1">
          {isRegistering
            ? role === 'admin' ? 'Create an account to list equipment and manage requests.' : 'Create an account to discover and request equipment.'
            : role === 'user' ? 'Student & Researcher Portal' : 'Equipment Owner Portal'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-secondary p-1" aria-label={`${role} account options`}>
            <button type="button" onClick={() => { setError(''); setIsRegistering(false); }} aria-pressed={!isRegistering} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${!isRegistering ? 'bg-surface text-accent shadow-sm' : 'text-textMain/70 hover:text-textMain'}`}>
              Sign In
            </button>
            <button type="button" onClick={() => { setError(''); setIsRegistering(true); }} aria-pressed={isRegistering} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${isRegistering ? 'bg-surface text-accent shadow-sm' : 'text-textMain/70 hover:text-textMain'}`}>
              Sign Up
            </button>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
        {isRegistering && (
          <div>
            <label className="block text-sm font-bold text-textMain mb-2">Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={event => setName(event.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-slate-200 focus:ring-2 focus:ring-accent focus:outline-none text-textMain font-medium transition-colors"
            />
          </div>
        )}
        {isRegistering && (
          <>
            <div>
              <label className="block text-sm font-bold text-textMain mb-2">Contact Phone <span className="font-medium text-textMain/60">(Optional)</span></label>
              <input
                type="tel"
                maxLength={40}
                autoComplete="tel"
                value={contactPhone}
                onChange={event => setContactPhone(event.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-slate-200 focus:ring-2 focus:ring-accent focus:outline-none text-textMain font-medium transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-textMain mb-2">Department / Institution <span className="font-medium text-textMain/60">(Optional)</span></label>
              <input
                type="text"
                maxLength={120}
                autoComplete="organization"
                value={department}
                onChange={event => setDepartment(event.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-slate-200 focus:ring-2 focus:ring-accent focus:outline-none text-textMain font-medium transition-colors"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-bold text-textMain mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-slate-200 focus:ring-2 focus:ring-accent focus:outline-none text-textMain font-medium transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-textMain mb-2">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-slate-200 focus:ring-2 focus:ring-accent focus:outline-none text-textMain font-medium transition-colors"
            />
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 rounded-xl bg-accent hover:bg-primary disabled:opacity-60 text-white font-bold shadow-sm transition-colors text-base">
            {isSubmitting ? 'Please wait…' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="w-full pt-4 text-sm font-medium text-textMain/80 hover:text-textMain transition-colors">
            ← Back to Role Selection
          </button>
        </form>
      </div>
    </div>
  );
}
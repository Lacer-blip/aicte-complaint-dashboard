import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { useSessionStore } from './session';
import { loginRequest } from '../api/http';
import { Role } from '../api/types';

const DEMO_ACCOUNTS = [
  { username: 'admin', label: 'Admin' },
  { username: 'rb_officer', label: 'RB Officer' },
  { username: 'pgrc_officer', label: 'PGRC Officer' },
  { username: 'management', label: 'Management' }
];

export const LoginPage: React.FC = () => {
  const loginWithToken = useSessionStore((s) => s.loginWithToken);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (user: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await loginRequest(user, pass);
      loginWithToken(
        data.access_token,
        {
          id: data.username,
          name: data.username,
          email: '',
          role: data.role as unknown as Role
        },
        data.expires_in
      );
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(username.trim(), password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF3FA] text-slate-900">
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-2 h-11 rounded-sm bg-gradient-to-b from-[#FF9933] via-white to-[#138808] border border-slate-300" />
          <div>
            <div className="text-sm font-bold text-slate-800">
              All India Council for Technical Education
            </div>
            <div className="text-xs text-slate-500">
              Integrated Institution Complaint Monitoring and Status Dashboard
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-[#DDE3EE] rounded-lg shadow-sm">
          <div className="bg-[#0B2447] text-white px-6 py-4 rounded-t-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h1 className="text-base font-bold">Official Sign In</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-[#DDE3EE] rounded px-3 py-2 text-sm"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#DDE3EE] rounded px-3 py-2 text-sm"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="text-xs text-[#B3261E] bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B2447] text-white text-sm font-bold rounded py-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-[#DDE3EE] p-6">
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">
              Demo accounts (synthetic data)
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  type="button"
                  disabled={loading}
                  onClick={() => signIn(a.username, 'demo123')}
                  className="flex-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded py-2"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 pb-6">
        SIH Prototype · All data shown is synthetic demonstration data
      </footer>
    </div>
  );
};
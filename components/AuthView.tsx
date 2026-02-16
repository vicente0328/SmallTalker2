
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { full_name: name } }
        });
        if (signUpError) throw signUpError;
        alert('회원가입 확인 메일을 확인해주세요.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        <h1 className="text-3xl font-bold text-indigo-600 mb-8 text-center">SmallTalker<span className="text-slate-300 font-light">.ai</span></h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm font-bold text-slate-400">
          {isLogin ? 'No account? Sign Up' : 'Have account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthView;

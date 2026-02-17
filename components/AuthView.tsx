
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// Detect in-app browsers that block Google OAuth
const isInAppBrowser = (): string | null => {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) return '카카오톡';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Line\//i.test(ua)) return 'LINE';
  if (/NAVER/i.test(ua)) return '네이버';
  if (/DaumApps/i.test(ua)) return '다음';
  if (/Twitter|X\//i.test(ua)) return 'X(Twitter)';
  // Generic WebView detection
  if (/wv\)/.test(ua) && /Android/.test(ua)) return '인앱 브라우저';
  return null;
};

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inAppName = isInAppBrowser();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-st-bg p-4">
      <div className="w-full max-w-md bg-st-card rounded-[2.5rem] shadow-xl p-8 border border-st-box">
        <h1 className="text-3xl font-bold text-st-ink mb-8 text-center">SmallTalker<span className="text-st-muted font-light">.ai</span></h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" className="w-full px-5 py-3 bg-st-bg border border-st-box rounded-2xl" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" className="w-full px-5 py-3 bg-st-bg border border-st-box rounded-2xl" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="w-full px-5 py-3 bg-st-bg border border-st-box rounded-2xl" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-st-red text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-st-blue text-white font-bold rounded-2xl hover:bg-st-blue/80 transition-all">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-st-box"></div>
          <span className="text-xs font-bold text-st-muted uppercase">or</span>
          <div className="flex-1 h-px bg-st-box"></div>
        </div>

        {inAppName ? (
          <div className="space-y-3">
            <div className="bg-st-card border-l-[3px] border-l-st-yellow rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-st-yellow shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-st-ink mb-1">
                    {inAppName}에서는 Google 로그인이 제한됩니다
                  </p>
                  <p className="text-xs text-st-muted leading-relaxed">
                    Google 보안 정책으로 인해 인앱 브라우저에서는 Google 로그인이 차단됩니다. 아래 방법으로 외부 브라우저에서 열어주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* App-specific instructions */}
            <div className="bg-st-bg border border-st-box rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-st-ink">외부 브라우저로 여는 방법</p>
              {inAppName === '카카오톡' ? (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-st-ink shrink-0">1.</span>
                  <p className="text-xs text-st-muted leading-relaxed">
                    우측 하단 <strong className="bg-st-box px-1.5 py-0.5 rounded text-st-ink">···</strong> 버튼을 탭한 후 <strong>"기본 브라우저로 열기"</strong>를 선택하세요.
                  </p>
                </div>
              ) : inAppName === 'Instagram' ? (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-st-ink shrink-0">1.</span>
                  <p className="text-xs text-st-muted leading-relaxed">
                    우측 상단 <strong className="bg-st-box px-1.5 py-0.5 rounded text-st-ink">···</strong> 버튼을 탭한 후 <strong>"브라우저에서 열기"</strong>를 선택하세요.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-st-ink shrink-0">1.</span>
                  <p className="text-xs text-st-muted leading-relaxed">
                    메뉴(<strong className="bg-st-box px-1.5 py-0.5 rounded text-st-ink">···</strong>)에서 <strong>"외부 브라우저로 열기"</strong>를 선택하세요.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-st-box"></div>
                <span className="text-[10px] text-st-muted">또는</span>
                <div className="flex-1 h-px bg-st-box"></div>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-3.5 bg-st-ink text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied ? '복사 완료!' : '링크 복사하여 브라우저에서 열기'}
            </button>
          </div>
        ) : (
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 bg-st-card border-2 border-st-box text-st-ink font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-st-box/50 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>
        )}

        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm font-bold text-st-muted">
          {isLogin ? 'No account? Sign Up' : 'Have account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthView;

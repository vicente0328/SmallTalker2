
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SettingViewProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onLogout?: () => void;
  onGoogleSync?: () => Promise<void>;
}

const SettingView: React.FC<SettingViewProps> = ({ user, onUpdateUser, onLogout, onGoogleSync }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({ ...user });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSaveProfile = () => {
    onUpdateUser(profileData);
    setIsEditingProfile(false);
  };

  const handleSync = async () => {
    setSyncError(null);
    if (onGoogleSync) {
      setIsSyncing(true);
      try {
        await onGoogleSync();
      } catch (err: any) {
        console.error("Sync Trigger Error:", err);
        setSyncError(err.message || "연동을 시작하는 중 오류가 발생했습니다.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  if (isEditingProfile) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center gap-2 mb-2">
            <button 
                onClick={() => setIsEditingProfile(false)} 
                className="text-indigo-600 flex items-center font-medium hover:underline"
            >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Settings
            </button>
        </div>

        <div className="flex flex-col items-center py-6 bg-white rounded-2xl shadow-sm border border-slate-200">
             <div className="relative group">
                <img 
                    src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" 
                    alt="User" 
                />
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">기본 정보</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">이름</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">회사/소속</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={profileData.company}
                                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">직책/역할</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={profileData.role}
                                onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex gap-3 pt-4">
            <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">취소</button>
            <button onClick={handleSaveProfile} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl">저장</button>
        </div>
      </div>
    );
  }

  const isProviderDisabledError = syncError?.includes('provider is not enabled');
  const isAccessDeniedError = syncError?.includes('access_denied') || syncError?.includes('403');
  const currentOrigin = window.location.origin;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <h2 className="text-3xl font-bold text-slate-900 px-1">Settings</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        <div onClick={() => setIsEditingProfile(true)} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors">
            <div className="flex items-center gap-4">
                <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm" alt={user.name} />
                <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{user.role} · {user.company}</p>
                </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>

        <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">External Services</h3>
            
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Redirect Info</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                    구글 연동 완료 후 현재 주소인 <code className="bg-white px-1 rounded border text-indigo-600 font-bold">{currentOrigin}</code>로 돌아옵니다.
                    만약 "Local Host" 에러가 발생한다면 Supabase 대시보드에서 이 주소를 <strong>Redirect URLs</strong>에 추가했는지 확인하세요.
                </p>
            </div>

            {syncError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm font-bold">연동 설정 오류</p>
                    </div>
                    <p className="text-xs text-red-500 leading-relaxed mb-3">
                        {isProviderDisabledError 
                            ? "Google 로그인 서비스가 Supabase 설정에서 활성화되어 있지 않습니다."
                            : isAccessDeniedError
                            ? "Google 인증 절차를 완료할 수 없습니다 (접근 차단됨)."
                            : syncError}
                    </p>
                    
                    {isProviderDisabledError && (
                        <div className="bg-white/60 p-3 rounded-xl border border-red-100 space-y-2">
                            <p className="text-[11px] font-bold text-slate-700">해결 방법:</p>
                            <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                                <li>Supabase Dashboard → Authentication → Providers 접속</li>
                                <li>Google 항목을 선택하고 'Enabled' 스위치를 켭니다.</li>
                                <li>Google Cloud Console에서 발급받은 Client ID와 Secret을 입력합니다.</li>
                                <li>하단의 'Save' 버튼을 눌러 설정을 저장하세요.</li>
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">Google Calendar</p>
                        <p className="text-[10px] text-slate-400">내 캘린더 일정과 동기화</p>
                    </div>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isSyncing ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'}`}
                >
                    {isSyncing ? '연결 중...' : '연동하기'}
                </button>
            </div>
        </div>

        <div onClick={onLogout} className="p-5 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-10V7a3 3 0 00-6 0v1" /></svg></div>
                <span className="font-bold text-red-500">Log Out</span>
            </div>
            <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </div>
  );
};

export default SettingView;

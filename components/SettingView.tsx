
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SettingViewProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => Promise<void> | void;
  onLogout?: () => void;
  onGoogleSync?: () => Promise<void>;
}

const SettingView: React.FC<SettingViewProps> = ({ user, onUpdateUser, onLogout, onGoogleSync }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({ ...user });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [businessInput, setBusinessInput] = useState(user.interests.business.join(', '));
  const [lifestyleInput, setLifestyleInput] = useState(user.interests.lifestyle.join(', '));

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    const updated: UserProfile = {
      ...profileData,
      interests: {
        business: businessInput.split(',').map(s => s.trim()).filter(s => s),
        lifestyle: lifestyleInput.split(',').map(s => s.trim()).filter(s => s),
      }
    };
    setIsSaving(true);
    try {
      await onUpdateUser(updated);
      setIsEditingProfile(false);
    } catch (e) {
      console.error("Profile save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = () => {
    alert('Google Calendar 연동 기능은 현재 준비 중입니다.\n빠른 시일 내에 제공할 예정이니 조금만 기다려 주세요!');
  };

  if (isEditingProfile) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center gap-2 mb-2">
            <button
                onClick={() => setIsEditingProfile(false)}
                className="text-st-ink flex items-center font-medium hover:underline"
            >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Settings
            </button>
        </div>

        <div className="flex flex-col items-center py-6 bg-st-card rounded-2xl shadow-sm border border-st-box">
             <div className="relative group">
                <img
                    src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-st-bg shadow-md"
                    alt="User"
                />
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box space-y-4">
                <h3 className="text-sm font-bold text-st-muted uppercase tracking-wider">기본 정보</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-st-muted mb-1">이름</label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-st-muted mb-1">회사/소속</label>
                            <input
                                type="text"
                                className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                                value={profileData.company}
                                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-st-muted mb-1">직책/역할</label>
                            <input
                                type="text"
                                className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                                value={profileData.role}
                                onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-st-muted mb-1">업종/산업</label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                            value={profileData.industry}
                            onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box space-y-4">
                <h3 className="text-sm font-bold text-st-muted uppercase tracking-wider">관심사</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-st-muted mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-st-muted"></span>
                            Business Interests
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                            value={businessInput}
                            onChange={(e) => setBusinessInput(e.target.value)}
                            placeholder="비즈니스 관심사 (쉼표로 구분)"
                        />
                        {businessInput && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {businessInput.split(',').map(s => s.trim()).filter(s => s).map((item, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-st-box text-st-ink text-xs font-medium rounded-lg">{item}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-st-muted mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-st-muted"></span>
                            Lifestyle Interests
                        </label>
                        <input
                            type="text"
                            className="w-full p-2.5 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all"
                            value={lifestyleInput}
                            onChange={(e) => setLifestyleInput(e.target.value)}
                            placeholder="라이프스타일 관심사 (쉼표로 구분)"
                        />
                        {lifestyleInput && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {lifestyleInput.split(',').map(s => s.trim()).filter(s => s).map((item, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-st-box text-st-ink text-xs font-medium rounded-lg">{item}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box space-y-3">
                <h3 className="text-sm font-bold text-st-muted uppercase tracking-wider">메모</h3>
                <textarea
                    className="w-full p-3 bg-st-bg border border-st-box rounded-xl focus:ring-2 focus:ring-st-muted outline-none transition-all min-h-[100px] text-sm"
                    value={profileData.memo || ''}
                    onChange={(e) => setProfileData({ ...profileData, memo: e.target.value })}
                    placeholder="자신에 대한 메모를 자유롭게 작성하세요 (예: 대화 시 참고할 자기소개, 최근 관심사 등)"
                />
            </div>
        </div>

        <div className="flex gap-3 pt-4">
            <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-st-box text-st-muted font-bold rounded-2xl" disabled={isSaving}>취소</button>
            <button onClick={handleSaveProfile} className="flex-1 py-4 bg-st-ink text-white font-bold rounded-2xl disabled:opacity-50" disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    );
  }

  const isProviderDisabledError = syncError?.includes('provider is not enabled');
  const isAccessDeniedError = syncError?.includes('access_denied') || syncError?.includes('403');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <h2 className="text-3xl font-bold text-st-ink px-1">Settings</h2>

      <div className="bg-st-card rounded-2xl shadow-sm border border-st-box divide-y divide-st-box overflow-hidden">
        <div onClick={() => setIsEditingProfile(true)} className="p-6 flex items-center justify-between hover:bg-st-box/30 cursor-pointer group transition-colors">
            <div className="flex items-center gap-4">
                <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover border-2 border-st-box shadow-sm" alt={user.name} />
                <div>
                    <h3 className="text-xl font-bold text-st-ink group-hover:text-st-ink transition-colors">{user.name}</h3>
                    <p className="text-sm text-st-muted font-medium">{user.role} · {user.company}</p>
                    {(user.interests.business.length > 0 || user.interests.lifestyle.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {user.interests.business.slice(0, 2).map(i => (
                                <span key={i} className="px-1.5 py-0.5 bg-st-box text-st-ink text-[10px] font-medium rounded">{i}</span>
                            ))}
                            {user.interests.lifestyle.slice(0, 2).map(i => (
                                <span key={i} className="px-1.5 py-0.5 bg-st-box text-st-ink text-[10px] font-medium rounded">{i}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <svg className="w-5 h-5 text-st-muted group-hover:text-st-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>

        <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-st-muted uppercase tracking-widest">External Services</h3>

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
                            <p className="text-[11px] font-bold text-st-ink">해결 방법:</p>
                            <ol className="text-[10px] text-st-muted space-y-1 list-decimal list-inside">
                                <li>Supabase Dashboard → Authentication → Providers 접속</li>
                                <li>Google 항목을 선택하고 'Enabled' 스위치를 켭니다.</li>
                                <li>Google Cloud Console에서 발급받은 Client ID와 Secret을 입력합니다.</li>
                                <li>하단의 'Save' 버튼을 눌러 설정을 저장하세요.</li>
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between p-4 bg-st-bg rounded-2xl border border-st-box">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-st-ink">Google Calendar</p>
                        <p className="text-[10px] text-st-muted">내 캘린더 일정과 동기화</p>
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-st-ink text-white shadow-sm hover:bg-st-muted"
                >
                    연동하기
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

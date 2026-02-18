
import React, { useState, useRef } from 'react';
import { Contact } from '../types';
import ContextualTip from './ContextualTip';
import Avatar from './Avatar';
import ChipGroup from './ChipGroup';

interface ContactListViewProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onAddContact?: (contact: Contact) => void;
  dismissedTips?: Set<string>;
  onDismissTip?: (key: string) => void;
}

// Parse vCard (.vcf) text into Contact objects
const parseVCard = (vcfText: string): Partial<Contact>[] => {
  const cards: Partial<Contact>[] = [];
  const blocks = vcfText.split(/(?=BEGIN:VCARD)/i).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let name = '';
    let phone = '';
    let email = '';
    let company = '';
    let role = '';

    for (const rawLine of lines) {
      // Handle folded lines (leading space/tab = continuation)
      const line = rawLine.replace(/^\s+/, '');
      const upper = line.toUpperCase();

      if (upper.startsWith('FN')) {
        name = line.substring(line.indexOf(':') + 1).trim();
      } else if (upper.startsWith('TEL')) {
        if (!phone) phone = line.substring(line.indexOf(':') + 1).trim();
      } else if (upper.startsWith('EMAIL')) {
        if (!email) email = line.substring(line.indexOf(':') + 1).trim();
      } else if (upper.startsWith('ORG')) {
        company = line.substring(line.indexOf(':') + 1).split(';')[0].trim();
      } else if (upper.startsWith('TITLE')) {
        role = line.substring(line.indexOf(':') + 1).trim();
      }
    }

    if (name) {
      cards.push({ name, phoneNumber: phone, email, company, role });
    }
  }

  return cards;
};

const ContactListView: React.FC<ContactListViewProps> = ({ contacts, onSelectContact, onAddContact, dismissedTips = new Set(), onDismissTip = () => {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formBusinessInterests, setFormBusinessInterests] = useState("");
  const [formLifestyleInterests, setFormLifestyleInterests] = useState("");
  const [formPersonality, setFormPersonality] = useState("");

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [formAgeRange, setFormAgeRange] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formHobby, setFormHobby] = useState("");
  const [formHobbyCustom, setFormHobbyCustom] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [formRelationshipCustom, setFormRelationshipCustom] = useState("");

  const AGE_OPTIONS = ['20대', '30대', '40대', '50대', '그 외'];
  const GENDER_OPTIONS = ['남성', '여성'];
  const HOBBY_OPTIONS = ['골프', '테니스', '위스키', '기타'];
  const RELATION_OPTIONS = ['비즈니스', '가족', '친구', '기타'];

  const vcfInputRef = useRef<HTMLInputElement>(null);

  const sortedContacts = [...contacts]
    .filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleImportFromDevice = async () => {
    const props = ['name', 'email', 'tel'];
    const opts = { multiple: false };

    try {
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        const contactSelection = await (navigator as any).contacts.select(props, opts);
        if (contactSelection.length > 0) {
          const deviceContact = contactSelection[0];
          setFormName(deviceContact.name?.[0] || "");
          setFormEmail(deviceContact.email?.[0] || "");
          setFormPhone(deviceContact.tel?.[0] || "");
          setIsModalOpen(true);
        }
      } else {
        // Fallback: show guide modal for .vcf import
        setIsGuideOpen(true);
      }
    } catch (err) {
      console.error("연락처 가져오기 실패:", err);
      setIsGuideOpen(true);
    }
  };

  const handleVcfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseVCard(text);
      if (parsed.length === 0) {
        alert("연락처를 찾을 수 없습니다. 올바른 .vcf 파일인지 확인해주세요.");
        return;
      }

      if (parsed.length === 1) {
        // Single contact: open modal with pre-filled data
        const c = parsed[0];
        setFormName(c.name || "");
        setFormCompany(c.company || "");
        setFormRole(c.role || "");
        setFormPhone(c.phoneNumber || "");
        setFormEmail(c.email || "");
        setFormTags("");
        setFormBusinessInterests("");
        setFormLifestyleInterests("");
        setFormPersonality("");
        setIsModalOpen(true);
      } else {
        // Multiple contacts: batch import
        let added = 0;
        for (const c of parsed) {
          if (!c.name || !onAddContact) continue;
          const newContact: Contact = {
            id: `c-${Date.now()}-${added}`,
            name: c.name,
            company: c.company?.trim() || "Unknown",
            role: c.role?.trim() || "Unknown",
            phoneNumber: c.phoneNumber || "",
            email: c.email || "",
            tags: [],
            interests: { business: [], lifestyle: [] },
            personality: "",
            contactFrequency: "Unknown",
            avatarUrl: '',
            relationshipType: "",
            meetingFrequency: "",
          };
          onAddContact(newContact);
          added++;
        }
        alert(`${added}명의 연락처를 가져왔습니다.`);
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleOpenModal = () => {
    setFormName("");
    setFormCompany("");
    setFormRole("");
    setFormPhone("");
    setFormEmail("");
    setFormTags("");
    setFormBusinessInterests("");
    setFormLifestyleInterests("");
    setFormPersonality("");
    setWizardStep(1);
    setFormAgeRange("");
    setFormGender("");
    setFormHobby("");
    setFormHobbyCustom("");
    setFormRelationship("");
    setFormRelationshipCustom("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName) return;

    const hobbyValue = formHobby === '기타' ? formHobbyCustom.trim() : formHobby;
    const relationValue = formRelationship === '기타' ? formRelationshipCustom.trim() : formRelationship;
    const enrichTags = [formAgeRange, formGender, relationValue].filter(Boolean);
    const enrichPersonality = [formAgeRange, formGender].filter(Boolean).join(', ');

    const newContact: Contact = {
        id: `c-${Date.now()}`,
        name: formName,
        company: formCompany.trim() || "Unknown",
        role: formRole.trim() || "Unknown",
        phoneNumber: formPhone,
        email: formEmail,
        tags: [...formTags.split(',').map(s => s.trim()).filter(s => s), ...enrichTags],
        interests: {
            business: formBusinessInterests.split(',').map(s => s.trim()).filter(s => s),
            lifestyle: [...formLifestyleInterests.split(',').map(s => s.trim()).filter(s => s), ...(hobbyValue ? [hobbyValue] : [])],
        },
        personality: enrichPersonality || formPersonality,
        contactFrequency: "Unknown",
        avatarUrl: '',
        relationshipType: relationValue || "",
        meetingFrequency: "",
    };

    if (onAddContact) onAddContact(newContact);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Hidden file input for vCard fallback */}
      <input
        ref={vcfInputRef}
        type="file"
        accept=".vcf,text/vcard"
        className="hidden"
        onChange={handleVcfFileChange}
      />

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold text-st-ink">Contacts</h2>
          <ContextualTip tipKey="contacts-info" message="연락처에 관심사와 성격을 기록할수록 AI 스몰토크 가이드가 더 정확해집니다." position="bottom" dismissedTips={dismissedTips} onDismiss={onDismissTip} />
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleImportFromDevice}
                className="flex items-center gap-1.5 px-3 py-2 bg-st-bg text-st-muted rounded-xl text-xs font-bold hover:bg-st-box/50 transition-all"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                가져오기
            </button>
            <button
                onClick={handleOpenModal}
                className={`inline-flex items-center gap-1.5 px-4 py-2 bg-st-blue text-white text-xs font-bold rounded-xl hover:bg-st-blue/80 transition-all shadow-md active:scale-95${contacts.length < 3 ? ' onboard-glow ring-2 ring-st-blue/30' : ''}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                추가하기
            </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-st-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-st-box/60 text-st-ink placeholder-st-muted focus:outline-none focus:ring-2 focus:ring-st-muted text-base transition-shadow"
            placeholder="Search contacts..."
        />
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-st-bg rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-st-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-st-ink mb-1">아직 등록된 연락처가 없습니다</h3>
          <p className="text-sm text-st-muted mb-5 leading-relaxed">
            자주 만나는 분들을 등록하면<br/>AI가 대화 맥락을 기억합니다.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-st-blue text-white text-sm font-bold rounded-xl hover:bg-st-blue/80 transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              직접 추가
            </button>
            <button
              onClick={handleImportFromDevice}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-st-bg text-st-muted text-sm font-bold rounded-xl hover:bg-st-box/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              가져오기
            </button>
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-st-box/50 overflow-hidden">
        {sortedContacts.length > 0 ? (
            sortedContacts.map((contact) => (
                <div key={contact.id} onClick={() => onSelectContact(contact)} className="p-4 flex items-center gap-4 hover:bg-st-box/30 cursor-pointer transition-colors group">
                    <Avatar src={contact.avatarUrl} name={contact.name} size={48} className="border-2 border-transparent group-hover:border-st-muted transition-all" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-st-ink truncate group-hover:text-st-ink transition-colors">{contact.name}</h3>
                        <p className="text-xs truncate">
                          <span className={contact.company && contact.company !== 'Unknown' ? 'text-st-muted' : 'text-st-muted italic'}>{contact.company && contact.company !== 'Unknown' ? contact.company : '회사/소속'}</span>
                          {' · '}
                          <span className={contact.role && contact.role !== 'Unknown' ? 'text-st-muted' : 'text-st-muted italic'}>{contact.role && contact.role !== 'Unknown' ? contact.role : '직책'}</span>
                        </p>
                    </div>
                    <svg className="w-5 h-5 text-st-muted group-hover:text-st-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            ))
        ) : (
            <div className="p-12 text-center text-st-muted">검색 결과가 없습니다.</div>
        )}
      </div>
      )}

      {/* Import Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-st-ink">연락처 가져오기</h3>
              <button onClick={() => setIsGuideOpen(false)} className="text-st-muted hover:text-st-ink">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-st-bg rounded-xl p-4">
                <p className="text-sm font-bold text-st-ink mb-2">vCard 파일(.vcf)로 가져오기</p>
                <ol className="text-sm text-st-ink space-y-2 list-decimal list-inside">
                  <li><strong>연락처 앱</strong>을 열어주세요</li>
                  <li>가져올 연락처를 선택 후 <strong>"연락처 공유"</strong>를 탭하세요</li>
                  <li><strong>"파일에 저장"</strong>을 선택하세요</li>
                  <li>아래 버튼을 눌러 저장한 <strong>.vcf 파일</strong>을 선택하세요</li>
                </ol>
              </div>

              <button
                onClick={() => { setIsGuideOpen(false); vcfInputRef.current?.click(); }}
                className="w-full py-3 bg-st-blue text-white font-bold rounded-xl hover:bg-st-blue/80 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                .vcf 파일 선택하기
              </button>

              <div className="bg-st-bg rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-st-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-st-muted leading-relaxed">
                    추후 Native App 출시 시, 시스템 연락처에서 바로 가져올 수 있는 더욱 편리한 연동 기능이 업데이트될 예정입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4 animate-fade-in">
            <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Header: back + step dots + close */}
                <div className="flex items-center justify-between mb-5">
                  {wizardStep > 1 ? (
                    <button onClick={() => setWizardStep(wizardStep - 1)} className="p-1 text-st-muted hover:text-st-ink transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  ) : <div className="w-7" />}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === wizardStep ? 'w-6 bg-st-blue' : s < wizardStep ? 'w-1.5 bg-st-ink' : 'w-1.5 bg-st-box'}`} />
                    ))}
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 text-st-muted hover:text-st-ink transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Step 1: Who */}
                {wizardStep === 1 && (
                  <div className="animate-fade-in space-y-4">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-st-ink">어떤 분을 등록하시나요?</h3>
                      <p className="text-sm text-st-muted mt-1">이름만 알려주셔도 괜찮아요.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-st-muted uppercase mb-1">이름 *</label>
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="홍길동" autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-st-muted uppercase mb-1">회사</label>
                        <input type="text" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="(주)회사명" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-st-muted uppercase mb-1">직함</label>
                        <input type="text" value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="직함" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      disabled={!formName.trim()}
                      className={`w-full py-3 font-bold rounded-xl transition-all ${
                        formName.trim()
                          ? 'bg-st-blue text-white hover:bg-st-blue/80'
                          : 'bg-st-box text-st-muted cursor-not-allowed'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                )}

                {/* Step 2: Contact info */}
                {wizardStep === 2 && (
                  <div className="animate-fade-in space-y-4">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-st-ink">연락처를 알고 계시면 알려주세요.</h3>
                      <p className="text-sm text-st-muted mt-1">나중에 추가하셔도 됩니다.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-st-muted uppercase mb-1">전화번호</label>
                      <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="010-0000-0000" autoFocus />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-st-muted uppercase mb-1">이메일</label>
                      <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="example@mail.com" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="w-full py-3 bg-st-blue text-white font-bold rounded-xl hover:bg-st-blue/80 transition-all"
                    >
                      다음
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="w-full py-2 text-st-muted font-semibold text-sm hover:text-st-ink transition-colors"
                    >
                      건너뛰기
                    </button>
                  </div>
                )}

                {/* Step 3: Get to know them */}
                {wizardStep === 3 && (
                  <div className="animate-fade-in space-y-4">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-st-ink">이 분에 대해 더 알려주실래요?</h3>
                      <p className="text-sm text-st-muted mt-1">AI가 맞춤 대화 주제를 준비하는 데 도움이 돼요.</p>
                    </div>

                    <ChipGroup
                      label="연령대"
                      options={AGE_OPTIONS}
                      selected={formAgeRange}
                      onSelect={(v) => setFormAgeRange(v)}
                    />

                    <ChipGroup
                      label="성별"
                      options={GENDER_OPTIONS}
                      selected={formGender}
                      onSelect={(v) => setFormGender(v)}
                    />

                    <ChipGroup
                      label="관심사 / 취미"
                      options={HOBBY_OPTIONS}
                      selected={formHobby}
                      onSelect={(v) => { setFormHobby(v); if (v !== '기타') setFormHobbyCustom(''); }}
                      customValue={formHobbyCustom}
                      onCustomChange={(v) => setFormHobbyCustom(v)}
                      customPlaceholder="취미를 직접 입력해주세요"
                    />

                    <ChipGroup
                      label="나와의 관계"
                      options={RELATION_OPTIONS}
                      selected={formRelationship}
                      onSelect={(v) => { setFormRelationship(v); if (v !== '기타') setFormRelationshipCustom(''); }}
                      customValue={formRelationshipCustom}
                      onCustomChange={(v) => setFormRelationshipCustom(v)}
                      customPlaceholder="관계를 직접 입력해주세요"
                    />

                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      className="w-full py-3 bg-st-blue text-white font-bold rounded-xl hover:bg-st-blue/80 transition-all"
                    >
                      저장하기
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormAgeRange(""); setFormGender(""); setFormHobby(""); setFormRelationship(""); handleSubmit(); }}
                      className="w-full py-2 text-st-muted font-semibold text-sm hover:text-st-ink transition-colors"
                    >
                      건너뛰기
                    </button>
                  </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ContactListView;


import React, { useState, useRef } from 'react';
import { Contact } from '../types';

interface ContactListViewProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onAddContact?: (contact: Contact) => void;
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

const ContactListView: React.FC<ContactListViewProps> = ({ contacts, onSelectContact, onAddContact }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        // Fallback: open file picker for .vcf
        vcfInputRef.current?.click();
      }
    } catch (err) {
      console.error("연락처 가져오기 실패:", err);
      // Fallback on error as well
      vcfInputRef.current?.click();
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
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`,
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
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newContact: Contact = {
        id: `c-${Date.now()}`,
        name: formName,
        company: formCompany.trim() || "Unknown",
        role: formRole.trim() || "Unknown",
        phoneNumber: formPhone,
        email: formEmail,
        tags: formTags.split(',').map(s => s.trim()).filter(s => s),
        interests: {
            business: formBusinessInterests.split(',').map(s => s.trim()).filter(s => s),
            lifestyle: formLifestyleInterests.split(',').map(s => s.trim()).filter(s => s),
        },
        personality: formPersonality,
        contactFrequency: "Unknown",
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=random`
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
        <h2 className="text-3xl font-bold text-slate-900">Contacts</h2>
        <div className="flex gap-2">
            <button
                onClick={handleImportFromDevice}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm text-xs font-bold hover:bg-slate-50 transition-all"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                가져오기
            </button>
            <button
                onClick={handleOpenModal}
                className="p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-all"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-slate-200/60 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base transition-shadow"
            placeholder="Search contacts..."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {sortedContacts.length > 0 ? (
            sortedContacts.map((contact) => (
                <div key={contact.id} onClick={() => onSelectContact(contact)} className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <img src={contact.avatarUrl} alt={contact.name} className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-100 transition-all" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{contact.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{contact.company} · {contact.role}</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            ))
        ) : (
            <div className="p-12 text-center text-slate-400">검색 결과가 없습니다.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">New Contact</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name *</label>
                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="홍길동" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                            <input type="text" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="(주)회사명" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                        <input type="text" value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="직함" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                            <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="010-0000-0000" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="example@mail.com" />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">취소</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95">추가하기</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ContactListView;

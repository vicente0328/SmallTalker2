import React, { useRef } from 'react';

// Muted pastel palette for default avatars (soft, non-distracting)
const INITIAL_COLORS: { bg: string; text: string }[] = [
  { bg: '#D6E4F0', text: '#4A6FA5' },  // soft blue
  { bg: '#E0D4E8', text: '#7B5EA7' },  // soft purple
  { bg: '#D4EDDA', text: '#5A9A6E' },  // soft green
  { bg: '#FDE8CD', text: '#B8863E' },  // soft amber
  { bg: '#F5D5D5', text: '#B85C5C' },  // soft rose
  { bg: '#E8E8ED', text: '#8E8E93' },  // soft gray
];

function getColorForName(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function getInitial(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function resizeImage(file: File, maxSize: number = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d')!;
        // Center crop
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  editable?: boolean;
  onChangePhoto?: (dataUrl: string) => void;
}

export default function Avatar({ src, name, size = 40, className = '', editable = false, onChangePhoto }: AvatarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChangePhoto) return;
    try {
      const dataUrl = await resizeImage(file);
      onChangePhoto(dataUrl);
    } catch { /* ignore */ }
    e.target.value = '';
  };

  const handleClick = () => {
    if (editable && fileRef.current) fileRef.current.click();
  };

  const sizeStyle = { width: size, height: size, minWidth: size, minHeight: size };
  const fontSize = Math.max(12, Math.round(size * 0.42));

  const hasImage = src && src.length > 0;

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${editable ? 'cursor-pointer' : ''} ${className}`}
      style={sizeStyle}
      onClick={handleClick}
    >
      {hasImage ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ fontSize, backgroundColor: getColorForName(name).bg }}
        >
          <span className="font-semibold leading-none" style={{ color: getColorForName(name).text }}>{getInitial(name)}</span>
        </div>
      )}

      {editable && (
        <>
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}

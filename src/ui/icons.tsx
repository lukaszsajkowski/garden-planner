import type { ReactNode } from 'react';

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const LeafIcon = () => (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20c0-8 6-14 16-16-1 10-7 16-15 16" />
    <path d="M4 20l9-9" />
  </svg>
);
export const CursorIcon = () => <Icon size={22}><path d="M5 3l14 8-6 2-2 6z" /></Icon>;
export const FolderIcon = () => <Icon><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>;
export const DownloadIcon = () => <Icon><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></Icon>;
export const ImageIcon = () => <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></Icon>;

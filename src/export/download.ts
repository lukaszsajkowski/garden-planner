let lastUrl: string | null = null;

/** Tworzy URL do pobrania; poprzedni zwalnia po 30 s (link w komunikacie może jeszcze być kliknięty). */
export function makeDownload(blob: Blob, name: string): { url: string; name: string } {
  if (lastUrl) {
    const old = lastUrl;
    setTimeout(() => {
      try {
        URL.revokeObjectURL(old);
      } catch {
        /* już zwolniony */
      }
    }, 30_000);
  }
  lastUrl = URL.createObjectURL(blob);
  return { url: lastUrl, name };
}

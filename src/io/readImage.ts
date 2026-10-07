const MAX_SIDE = 2400;
const MAX_BYTES = 1_500_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('read'));
    fr.readAsDataURL(file);
  });
}

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/** Wczytuje obraz; duże pliki pomniejsza do 2400 px i zapisuje jako JPEG 0,86 na białym tle (PRD F-6.1). */
export async function readImageFile(file: File): Promise<{ src: string; aspect: number }> {
  const dataUrl = await readAsDataUrl(file);
  const img = await decode(dataUrl);
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) throw new Error('decode');
  const k = Math.min(1, MAX_SIDE / Math.max(nw, nh));
  let src = dataUrl;
  if (k < 1 || file.size > MAX_BYTES) {
    try {
      const c = document.createElement('canvas');
      c.width = Math.round(nw * k);
      c.height = Math.round(nh * k);
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        src = c.toDataURL('image/jpeg', 0.86);
      }
    } catch {
      /* zostaje oryginał */
    }
  }
  return { src, aspect: nh / nw };
}

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { SupportedLanguage } from './civicLogic';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

let activeAudio: HTMLAudioElement | null = null;

export async function speakCivicText(
  text: string,
  language: SupportedLanguage = 'en',
  onStateChange?: (isSpeaking: boolean) => void
): Promise<void> {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    onStateChange?.(true);

    const response = await fetch('/api/civic/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        activeAudio = audio;
        audio.onended = () => onStateChange?.(false);
        audio.onerror = () => onStateChange?.(false);
        await audio.play();
        return;
      }
    }

    // Fallback to browser Web Speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        bn: 'bn-IN',
        te: 'te-IN',
      };
      utterance.lang = langMap[language] || 'en-IN';
      utterance.rate = 0.95;
      utterance.onend = () => onStateChange?.(false);
      utterance.onerror = () => onStateChange?.(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => onStateChange?.(false), 1200);
    }
  } catch {
    onStateChange?.(false);
  }
}

export function stopCivicSpeech(onStateChange?: (isSpeaking: boolean) => void): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  onStateChange?.(false);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function extractAsciiFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('latin1');
    const raw = textDecoder.decode(bytes);
    const matches = raw.match(/\(([^()]{2,200})\)/g);
    if (!matches) return '';
    const cleaned = matches
      .map((m) => m.slice(1, -1).trim())
      .filter((m) => m.length > 2 && /[a-zA-Z0-9]/.test(m) && !/^[\x00-\x1F\x7F-\x9F]+$/.test(m))
      .slice(0, 400)
      .join(' ');
    return cleaned.slice(0, 8000);
  } catch {
    return '';
  }
}

/**
 * Downscales and compresses user-uploaded camera photos so oversized (10MB+)
 * smartphone images never exceed Express JSON body limits or stall on slow rural 3G/4G networks.
 * Also parses multi-page PDF notices with multi-tier worker and binary fallback.
 */
export function processUploadedImageFile(
  file: File
): Promise<{ dataUrl: string; mimeType: string; extractedText?: string }> {
  return new Promise((resolve, reject) => {
    // 1. Handle PDF Documents
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      (async () => {
        try {
          const buf = await file.arrayBuffer();
          const base64Pdf = arrayBufferToBase64(buf);
          const rawPdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;

          let extractedText = '';
          let previewDataUrl = '';

          try {
            const pdf = await pdfjsLib.getDocument({
              data: new Uint8Array(buf),
              useSystemFonts: true,
            }).promise;

            const numPages = Math.min(pdf.numPages || 1, 6);
            for (let p = 1; p <= numPages; p++) {
              try {
                const page = await pdf.getPage(p);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .filter(Boolean)
                  .join(' ');
                if (pageText.trim()) {
                  extractedText += (extractedText ? '\n\n' : '') + pageText;
                }
              } catch (pageErr) {
                console.warn(`PDF page ${p} extraction skipped:`, pageErr);
              }
            }

            // Render Page 1 preview for display
            try {
              const page1 = await pdf.getPage(1);
              const base = page1.getViewport({ scale: 1 });
              const scale = Math.min(1.5, 1200 / Math.max(base.width, base.height));
              const viewport = page1.getViewport({ scale });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                await (page1.render({ canvasContext: ctx, viewport } as any) as any).promise;
                previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              }
            } catch (renderErr) {
              console.warn('PDF canvas render skipped:', renderErr);
            }
          } catch (pdfJsErr) {
            console.warn('PDF.js worker/parse fallback triggered:', pdfJsErr);
            extractedText = extractAsciiFromPdfBuffer(buf);
          }

          if (!extractedText.trim()) {
            extractedText = extractAsciiFromPdfBuffer(buf);
          }

          resolve({
            dataUrl: previewDataUrl || rawPdfDataUrl,
            mimeType: previewDataUrl ? 'image/jpeg' : 'application/pdf',
            extractedText: extractedText.trim().slice(0, 8000),
          });
        } catch (err: any) {
          console.error('PDF parsing failure:', err);
          const name = err?.name;
          if (name === 'PasswordException') reject(new Error('This PDF is password-protected.'));
          else if (name === 'InvalidPDFException') reject(new Error('This file is not a valid PDF.'));
          else reject(new Error(`Could not read PDF: ${err?.message || 'unknown error'}`));
        }
      })();
      return;
    }
    // 2. Handle Image Uploads (PNG, JPG, WEBP)
    if (!file.type.startsWith('image/')) {
      reject(new Error('Unsupported file format. Please upload a valid image or PDF document.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      const img = new Image();
      img.onerror = () => resolve({ dataUrl: resultStr, mimeType: file.type || 'image/jpeg' });
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: resultStr, mimeType: file.type || 'image/jpeg' });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl: compressedDataUrl, mimeType: 'image/jpeg' });
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a realistic base64 PNG image on a canvas for 1-tap demo inspection
 * so users (and automated tests) can test multimodal Gemini Flash image analysis
 * even if they don't have a local camera photo handy.
 */
export function createSampleDocumentImageBase64(title: string, subtitle: string, refCode: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#F5EFE2';
  ctx.fillRect(0, 0, 640, 400);

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 604, 364);

  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('PUBLIC GAZETTE & STATUTORY NOTIFICATION RECORD', 38, 54);

  ctx.fillStyle = '#B43E1C';
  ctx.font = '13px monospace';
  ctx.fillText(`REF NO: ${refCode} · DATE: ${new Date().toISOString().slice(0, 10)}`, 38, 80);

  ctx.strokeStyle = '#D4CBB4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(38, 95);
  ctx.lineTo(602, 95);
  ctx.stroke();

  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title.slice(0, 46), 38, 135);

  ctx.fillStyle = '#292524';
  ctx.font = '14px sans-serif';
  const words = subtitle.split(' ');
  let line = '';
  let y = 175;
  for (const w of words) {
    if ((line + w).length > 68) {
      ctx.fillText(line, 38, y);
      line = w + ' ';
      y += 24;
    } else {
      line += w + ' ';
    }
  }
  if (line) ctx.fillText(line, 38, y);

  ctx.strokeStyle = '#14532D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(520, 300, 45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#14532D';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('VERIFIED SEAL', 478, 298);
  ctx.fillText('GOVT REGISTRY', 478, 314);

  return canvas.toDataURL('image/png');
}

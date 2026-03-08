/**
 * ocr.js – Tesseract.js Integration für Text-Erkennung aus Bildern
 * Tesseract.js wird lazy via CDN geladen, um den initialen Seitenlade zu beschleunigen.
 */

const OCR = (() => {
  const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let tesseractLoaded = false;

  function loadTesseract() {
    if (tesseractLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TESSERACT_CDN;
      script.onload = () => { tesseractLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Tesseract.js konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Führt OCR auf einem Bild aus.
   * @param {string|HTMLImageElement|HTMLCanvasElement} imageSource
   * @param {function} onProgress - Callback mit Fortschrittswert 0-100
   * @returns {Promise<string>} Erkannter Text
   */
  async function recognize(imageSource, onProgress) {
    await loadTesseract();

    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    try {
      const { data: { text } } = await worker.recognize(imageSource);
      return text.trim();
    } finally {
      await worker.terminate();
    }
  }

  return { recognize, loadTesseract };
})();

window.OCR = OCR;

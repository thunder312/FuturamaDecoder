/**
 * ocr.js – Tesseract.js Integration (persistent worker for live scanning)
 */

const OCR = (() => {
  const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let tesseractLoaded = false;
  let persistentWorker = null;
  let workerBusy = false;

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

  async function getWorker() {
    await loadTesseract();
    if (!persistentWorker) {
      persistentWorker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    }
    return persistentWorker;
  }

  /**
   * Führt OCR auf einem Bild aus (mit optionalem Fortschritts-Callback).
   * @param {string|HTMLImageElement|HTMLCanvasElement} imageSource
   * @param {function|null} onProgress
   * @returns {Promise<string>}
   */
  async function recognize(imageSource, onProgress) {
    await loadTesseract();

    // Für Fortschritts-Anzeige (z.B. Foto-Tab): eigener Worker mit Logger
    if (onProgress) {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
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

    // Für Live-Scan: persistenter Worker, kein paralleler Aufruf
    if (workerBusy) return null;
    workerBusy = true;
    try {
      const worker = await getWorker();
      const { data: { text } } = await worker.recognize(imageSource);
      return text.trim();
    } finally {
      workerBusy = false;
    }
  }

  async function terminate() {
    if (persistentWorker) {
      await persistentWorker.terminate();
      persistentWorker = null;
    }
  }

  return { recognize, loadTesseract, terminate };
})();

window.OCR = OCR;

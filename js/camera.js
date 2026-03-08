/**
 * camera.js – Kamera-Verwaltung via getUserMedia + Live-Scan
 */

const Camera = (() => {
  let stream = null;
  let liveScanTimer = null;
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');

  async function start() {
    if (stream) return;
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width:  { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    }).catch(err => {
      if (err.name === 'NotAllowedError')  throw new Error('Kamerazugriff verweigert. Bitte Berechtigung erteilen.');
      if (err.name === 'NotFoundError')    throw new Error('Keine Kamera gefunden.');
      throw new Error('Kamera konnte nicht gestartet werden: ' + err.message);
    });
    video.srcObject = stream;
    await video.play();
  }

  function stop() {
    stopLiveScan();
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      video.srcObject = null;
    }
  }

  /**
   * Nimmt ein Standbild aus dem Videostream.
   * @param {number} [quality=0.92]
   * @returns {{ dataUrl: string, imageData: ImageData }}
   */
  function capture(quality = 0.92) {
    const w = video.videoWidth  || 640;
    const h = video.videoHeight || 480;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return {
      dataUrl:   canvas.toDataURL('image/jpeg', quality),
      imageData: ctx.getImageData(0, 0, w, h)
    };
  }

  /**
   * Startet kontinuierlichen Scan-Modus (wie Google Lens).
   * @param {function} onResult - Callback(text: string|null, error: string|null)
   * @param {number}   [intervalMs=2000]
   */
  function startLiveScan(onResult, intervalMs = 2000) {
    stopLiveScan();
    let scanning = false;

    async function scan() {
      if (scanning || !stream) return;
      scanning = true;
      try {
        const { dataUrl } = capture(0.85);
        const text = await OCR.recognize(dataUrl, null);
        onResult(text || null, null);
      } catch (err) {
        onResult(null, err.message);
      } finally {
        scanning = false;
      }
    }

    scan(); // sofort erster Scan
    liveScanTimer = setInterval(scan, intervalMs);
  }

  function stopLiveScan() {
    if (liveScanTimer) {
      clearInterval(liveScanTimer);
      liveScanTimer = null;
    }
  }

  function isActive()   { return stream !== null; }
  function isScanning() { return liveScanTimer !== null; }

  return { start, stop, capture, startLiveScan, stopLiveScan, isActive, isScanning };
})();

window.Camera = Camera;

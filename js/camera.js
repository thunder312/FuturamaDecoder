/**
 * camera.js – Kamera-Verwaltung via getUserMedia
 */

const Camera = (() => {
  let stream = null;
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');

  async function start() {
    if (stream) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Rückkamera bevorzugen
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      return true;
    } catch (err) {
      console.error('Kamera-Fehler:', err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Kamerazugriff verweigert. Bitte Berechtigung erteilen.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('Keine Kamera gefunden.');
      }
      throw new Error('Kamera konnte nicht gestartet werden: ' + err.message);
    }
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      video.srcObject = null;
    }
  }

  /**
   * Nimmt ein Standbild aus dem Videostream und gibt es als ImageData zurück.
   * @returns {{ dataUrl: string, imageData: ImageData }}
   */
  function capture() {
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      imageData: ctx.getImageData(0, 0, w, h)
    };
  }

  function isActive() { return stream !== null; }

  return { start, stop, capture, isActive };
})();

window.Camera = Camera;

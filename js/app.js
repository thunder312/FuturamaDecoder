/**
 * app.js – Haupt-Controller: UI-Events, Tab-Switching, Koordination
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab-Navigation ──────────────────────────────────────────────────────
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      if (target !== 'camera' && Camera.isActive()) {
        Camera.stop();
        resetCameraUI();
      }
      if (target === 'reference') renderReferenceGrid();
    });
  });

  // ── Text-Tab ────────────────────────────────────────────────────────────
  const textInput      = document.getElementById('textInput');
  const textOutput     = document.getElementById('textOutput');
  const dirLatinToAlien = document.getElementById('dirLatinToAlien');
  const dirAlienToLatin = document.getElementById('dirAlienToLatin');
  const copyBtn        = document.getElementById('copyBtn');

  let direction = 'latin-to-alien';

  function translateText() {
    const input = textInput.value;
    if (!input.trim()) { textOutput.innerHTML = ''; return; }
    if (direction === 'latin-to-alien') {
      const alienText = Translator.latinToAlien(input);
      textOutput.innerHTML = Translator.renderAlienHTML(alienText, 'svg');
    } else {
      textOutput.textContent = Translator.alienToLatin(input);
    }
  }

  textInput.addEventListener('input', translateText);

  dirLatinToAlien.addEventListener('click', () => {
    direction = 'latin-to-alien';
    dirLatinToAlien.classList.add('active');
    dirAlienToLatin.classList.remove('active');
    textInput.placeholder = 'Lateinischen Text eingeben…';
    translateText();
  });

  dirAlienToLatin.addEventListener('click', () => {
    direction = 'alien-to-latin';
    dirAlienToLatin.classList.add('active');
    dirLatinToAlien.classList.remove('active');
    textInput.placeholder = 'Alien-Text (Unicode PUA) eingeben…';
    translateText();
  });

  copyBtn.addEventListener('click', async () => {
    const text = textOutput.textContent || textOutput.innerText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = '✓ Kopiert!';
      setTimeout(() => { copyBtn.textContent = 'Kopieren'; }, 1500);
    } catch {
      copyBtn.textContent = 'Fehler';
    }
  });

  // ── Kamera-Tab ──────────────────────────────────────────────────────────
  const startCameraBtn     = document.getElementById('startCameraBtn');
  const liveScanBtn        = document.getElementById('liveScanBtn');
  const captureBtn         = document.getElementById('captureBtn');
  const stopCameraBtn      = document.getElementById('stopCameraBtn');
  const cameraResult       = document.getElementById('cameraResult');
  const liveResultOverlay  = document.getElementById('liveResultOverlay');
  const liveResultLatin    = document.getElementById('liveResultLatin');
  const liveResultAlien    = document.getElementById('liveResultAlien');
  const scanIndicator      = document.getElementById('scanIndicator');
  const scanHint           = document.getElementById('scanHint');

  let liveScanActive = false;

  function resetCameraUI() {
    startCameraBtn.classList.remove('hidden');
    liveScanBtn.classList.add('hidden');
    captureBtn.classList.add('hidden');
    stopCameraBtn.classList.add('hidden');
    cameraResult.classList.add('hidden');
    liveResultOverlay.classList.add('hidden');
    scanIndicator.classList.add('hidden');
    scanHint.textContent = 'Kamera auf Text richten';
    liveScanBtn.textContent = '🔴 Live-Scan';
    liveScanBtn.classList.remove('active-scan');
    liveScanActive = false;
  }

  startCameraBtn.addEventListener('click', async () => {
    try {
      await Camera.start();
      startCameraBtn.classList.add('hidden');
      liveScanBtn.classList.remove('hidden');
      captureBtn.classList.remove('hidden');
      stopCameraBtn.classList.remove('hidden');
    } catch (err) {
      showError(cameraResult, err.message);
      cameraResult.classList.remove('hidden');
    }
  });

  stopCameraBtn.addEventListener('click', () => {
    Camera.stop();
    OCR.terminate();
    resetCameraUI();
  });

  // Live-Scan Toggle
  liveScanBtn.addEventListener('click', () => {
    if (liveScanActive) {
      Camera.stopLiveScan();
      liveScanActive = false;
      liveScanBtn.textContent = '🔴 Live-Scan';
      liveScanBtn.classList.remove('active-scan');
      scanIndicator.classList.add('hidden');
      scanHint.textContent = 'Kamera auf Text richten';
    } else {
      liveScanActive = true;
      liveScanBtn.textContent = '⏹ Live-Scan stoppen';
      liveScanBtn.classList.add('active-scan');
      scanIndicator.classList.remove('hidden');
      liveResultOverlay.classList.add('hidden');
      scanHint.textContent = '';

      Camera.startLiveScan((text, err) => {
        scanIndicator.classList.add('hidden');
        if (err) {
          liveResultOverlay.classList.add('hidden');
          return;
        }
        if (!text) {
          liveResultOverlay.classList.add('hidden');
          scanHint.textContent = 'Kein Text erkannt…';
          return;
        }
        const clean = text.replace(/[^a-zA-Z0-9 \n.,!?'-]/g, '').trim();
        if (!clean) {
          liveResultOverlay.classList.add('hidden');
          return;
        }
        const alienText = Translator.latinToAlien(clean);
        liveResultLatin.textContent = clean;
        liveResultAlien.innerHTML   = Translator.renderAlienHTML(alienText, 'svg');
        liveResultOverlay.classList.remove('hidden');
        scanHint.textContent = '';

        // Kurz Scan-Indicator wieder zeigen
        setTimeout(() => {
          if (liveScanActive) scanIndicator.classList.remove('hidden');
        }, 1800);
      }, 2500);
    }
  });

  // Einmaliger Capture-Scan
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled  = true;
    captureBtn.textContent = '⏳ OCR…';
    cameraResult.classList.remove('hidden');
    cameraResult.innerHTML = '<p class="dim">Erkenne Text…</p>';

    try {
      const { dataUrl } = Camera.capture();
      const text = await OCR.recognize(dataUrl, null);
      if (!text) {
        cameraResult.innerHTML = '<p class="dim">Kein Text erkannt.</p>';
      } else {
        showTranslationResult(cameraResult, text);
      }
    } catch (err) {
      showError(cameraResult, err.message);
    } finally {
      captureBtn.disabled  = false;
      captureBtn.textContent = '📸 Einmal scannen';
    }
  });

  // ── Foto-Tab ────────────────────────────────────────────────────────────
  const photoInput   = document.getElementById('photoInput');
  const uploadArea   = document.getElementById('uploadArea');
  const photoPreview = document.getElementById('photoPreview');
  const previewImg   = document.getElementById('previewImg');
  const analyzeBtn   = document.getElementById('analyzeBtn');
  const ocrProgress  = document.getElementById('ocrProgress');
  const progressFill = ocrProgress.querySelector('.progress-fill');
  const progressLabel = ocrProgress.querySelector('.progress-label');
  const photoResult  = document.getElementById('photoResult');

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    previewImg.src = URL.createObjectURL(file);
    uploadArea.classList.add('hidden');
    photoPreview.classList.remove('hidden');
    photoResult.classList.add('hidden');
    ocrProgress.classList.add('hidden');
  });

  analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.disabled = true;
    ocrProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressLabel.textContent = 'OCR: 0%';
    photoResult.classList.add('hidden');

    try {
      const text = await OCR.recognize(previewImg, (pct) => {
        progressFill.style.width = pct + '%';
        progressLabel.textContent = `OCR: ${pct}%`;
      });
      ocrProgress.classList.add('hidden');
      photoResult.classList.remove('hidden');
      if (!text) {
        photoResult.innerHTML = '<p class="dim">Kein Text erkannt.</p>';
      } else {
        showTranslationResult(photoResult, text);
      }
    } catch (err) {
      ocrProgress.classList.add('hidden');
      photoResult.classList.remove('hidden');
      showError(photoResult, err.message);
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // Neues Foto
  const newPhotoBtn = document.createElement('button');
  newPhotoBtn.className = 'btn-secondary';
  newPhotoBtn.textContent = '↩ Neues Foto';
  newPhotoBtn.style.marginTop = '8px';
  newPhotoBtn.addEventListener('click', () => {
    uploadArea.classList.remove('hidden');
    photoPreview.classList.add('hidden');
    photoResult.classList.add('hidden');
    photoInput.value = '';
  });
  photoPreview.appendChild(newPhotoBtn);

  // ── Referenz-Grid ───────────────────────────────────────────────────────
  let referenceRendered = false;

  function renderReferenceGrid() {
    if (referenceRendered) return;
    referenceRendered = true;
    const grid = document.getElementById('referenceGrid');
    const { ALIEN_MAP, ALPHABET_META } = window.AlienAlphabet;

    grid.innerHTML = ALPHABET_META.map(({ latin, svgFile, description }) => `
      <div class="ref-card" title="${description}" onclick="insertChar('${latin}')">
        <img class="ref-alien-img" src="assets/alien-chars/${svgFile}"
             alt="${latin}" onerror="this.outerHTML='<span class=ref-alien>${ALIEN_MAP[latin]}</span>'" />
        <span class="ref-latin">${latin}</span>
      </div>
    `).join('');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function showTranslationResult(container, latinText) {
    const clean = latinText.replace(/\s+/g, ' ').trim();
    const alienText = Translator.latinToAlien(clean);
    container.innerHTML = `
      <p class="result-latin"><strong>Erkannt:</strong> ${escapeHtml(clean)}</p>
      <div class="result-alien">${Translator.renderAlienHTML(alienText, 'svg')}</div>
    `;
  }

  function showError(container, message) {
    container.classList.remove('hidden');
    container.innerHTML = `<p style="color:var(--red)">⚠️ ${escapeHtml(message)}</p>`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
});

function insertChar(latin) {
  const textInput = document.getElementById('textInput');
  textInput.value += latin;
  textInput.dispatchEvent(new Event('input'));
  document.querySelector('[data-tab="text"]').click();
}

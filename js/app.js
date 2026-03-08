/**
 * app.js – Haupt-Controller: UI-Events, Tab-Switching, Koordination
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab-Navigation ──────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      // Kamera stoppen wenn Tab gewechselt
      if (target !== 'camera' && Camera.isActive()) {
        Camera.stop();
        updateCameraUI(false);
      }

      // Referenztabelle beim ersten Öffnen rendern
      if (target === 'reference') renderReferenceGrid();
    });
  });

  // ── Text-Tab ────────────────────────────────────────────────────────────
  const textInput = document.getElementById('textInput');
  const textOutput = document.getElementById('textOutput');
  const dirLatinToAlien = document.getElementById('dirLatinToAlien');
  const dirAlienToLatin = document.getElementById('dirAlienToLatin');
  const copyBtn = document.getElementById('copyBtn');

  let direction = 'latin-to-alien';

  function translateText() {
    const input = textInput.value;
    if (!input.trim()) { textOutput.innerHTML = ''; return; }

    if (direction === 'latin-to-alien') {
      const alienText = Translator.latinToAlien(input);
      textOutput.innerHTML = Translator.renderAlienHTML(alienText, 'svg');
    } else {
      // Alien → Latin: Eingabe als PUA-Codepoints interpretieren
      const latinText = Translator.alienToLatin(input);
      textOutput.textContent = latinText;
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
  const startCameraBtn = document.getElementById('startCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const cameraResult = document.getElementById('cameraResult');

  function updateCameraUI(active) {
    startCameraBtn.classList.toggle('hidden', active);
    captureBtn.classList.toggle('hidden', !active);
    stopCameraBtn.classList.toggle('hidden', !active);
  }

  startCameraBtn.addEventListener('click', async () => {
    try {
      await Camera.start();
      updateCameraUI(true);
    } catch (err) {
      showError(cameraResult, err.message);
    }
  });

  stopCameraBtn.addEventListener('click', () => {
    Camera.stop();
    updateCameraUI(false);
    cameraResult.classList.add('hidden');
  });

  captureBtn.addEventListener('click', async () => {
    const { dataUrl } = Camera.capture();
    captureBtn.disabled = true;
    captureBtn.textContent = '⏳ OCR…';
    cameraResult.classList.remove('hidden');
    cameraResult.innerHTML = '<p style="color:var(--text-dim)">Erkenne Text…</p>';

    try {
      const text = await OCR.recognize(dataUrl, null);
      if (!text) {
        cameraResult.innerHTML = '<p style="color:var(--text-dim)">Kein Text erkannt.</p>';
      } else {
        showTranslationResult(cameraResult, text);
      }
    } catch (err) {
      showError(cameraResult, err.message);
    } finally {
      captureBtn.disabled = false;
      captureBtn.textContent = '📸 Aufnehmen';
    }
  });

  // ── Foto-Tab ────────────────────────────────────────────────────────────
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const previewImg = document.getElementById('previewImg');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const ocrProgress = document.getElementById('ocrProgress');
  const progressFill = ocrProgress.querySelector('.progress-fill');
  const progressLabel = ocrProgress.querySelector('.progress-label');
  const photoResult = document.getElementById('photoResult');

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    photoPreview.classList.remove('hidden');
    photoResult.classList.add('hidden');
    ocrProgress.classList.add('hidden');
  });

  analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.disabled = true;
    ocrProgress.classList.remove('hidden');
    photoResult.classList.add('hidden');

    try {
      const text = await OCR.recognize(previewImg, (pct) => {
        progressFill.style.width = pct + '%';
        progressLabel.textContent = `OCR: ${pct}%`;
      });

      ocrProgress.classList.add('hidden');

      if (!text) {
        photoResult.classList.remove('hidden');
        photoResult.innerHTML = '<p style="color:var(--text-dim)">Kein Text erkannt.</p>';
      } else {
        photoResult.classList.remove('hidden');
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

  // ── Referenz-Grid ───────────────────────────────────────────────────────
  let referenceRendered = false;

  function renderReferenceGrid() {
    if (referenceRendered) return;
    referenceRendered = true;
    const grid = document.getElementById('referenceGrid');
    const { ALIEN_MAP, ALPHABET_META } = window.AlienAlphabet;

    grid.innerHTML = ALPHABET_META.map(({ latin, svgFile, description }) => `
      <div class="ref-card" title="${description}" onclick="insertChar('${latin}')">
        <img class="ref-alien" src="assets/alien-chars/${svgFile}"
             alt="${latin}" onerror="this.outerHTML='<span class=ref-alien>${ALIEN_MAP[latin]}</span>'" />
        <span class="ref-latin">${latin}</span>
      </div>
    `).join('');
  }

  // ── Hilfsfunktionen ─────────────────────────────────────────────────────

  function showTranslationResult(container, latinText) {
    const alienText = Translator.latinToAlien(latinText);
    container.innerHTML = `
      <p class="result-latin"><strong>Erkannt:</strong> ${escapeHtml(latinText)}</p>
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

  // Service Worker registrieren
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
});

// Global: Zeichen aus Referenztabelle in Texteingabe einfügen
function insertChar(latin) {
  const textInput = document.getElementById('textInput');
  textInput.value += latin;
  textInput.dispatchEvent(new Event('input'));
  // Zum Text-Tab wechseln
  document.querySelector('[data-tab="text"]').click();
}

/**
 * translator.js – Kernlogik für Latin ↔ Alienese Übersetzung
 */

const Translator = (() => {
  const { ALIEN_MAP, LATIN_MAP } = window.AlienAlphabet;

  /**
   * Übersetzt lateinischen Text in Alienese.
   * Nicht-alphabetische Zeichen werden unverändert übernommen.
   * @param {string} text
   * @returns {string}
   */
  function latinToAlien(text) {
    return text.toUpperCase().split('').map(char => {
      return ALIEN_MAP[char] ?? char;
    }).join('');
  }

  /**
   * Übersetzt Alienese-Text zurück in Lateinisch.
   * @param {string} text
   * @returns {string}
   */
  function alienToLatin(text) {
    return [...text].map(char => {
      return LATIN_MAP[char] ?? char;
    }).join('').toLowerCase();
  }

  /**
   * Rendert Text als HTML mit SVG-Fallback (für Browser ohne Custom Font).
   * Gibt einen Array von Spans zurück, einen pro Zeichen.
   * @param {string} alienText - Bereits übersetzer Alien-Text
   * @param {'font'|'svg'} mode
   * @returns {string} HTML-String
   */
  function renderAlienHTML(alienText, mode = 'font') {
    if (mode === 'font') {
      // Custom Font-Modus: einfach den Text in ein span mit Font-Klasse
      return `<span class="alien-font">${alienText}</span>`;
    }

    // SVG-Fallback-Modus
    return [...alienText].map(char => {
      const latinChar = LATIN_MAP[char];
      if (latinChar) {
        return `<img class="alien-char-img"
                     src="assets/alien-chars/${latinChar.toLowerCase()}.svg"
                     alt="${latinChar}"
                     title="${latinChar}"
                     onerror="this.style.display='none';this.nextSibling.style.display='inline'">
                <span class="alien-char-fallback" style="display:none">${char}</span>`;
      }
      return `<span class="alien-space">${char}</span>`;
    }).join('');
  }

  return { latinToAlien, alienToLatin, renderAlienHTML };
})();

window.Translator = Translator;

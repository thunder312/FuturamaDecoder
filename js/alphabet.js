/**
 * Futurama Alienese (Alien Language 1)
 * Einfaches Substitutions-Chiffre: Jeder lateinische Buchstabe
 * wird durch ein entsprechendes Alien-Unicode-Zeichen dargestellt.
 *
 * Da es keinen offiziellen Unicode-Block für Alienese gibt,
 * verwenden wir entweder:
 *   A) Einen Custom Font (futurama-alienese.woff2) mit PUA-Codepoints
 *   B) SVG-Sprites pro Buchstabe
 *   C) Provisorisch: Unicode-Lookalikes für die Referenztabelle
 *
 * Die Mapping-Schlüssel sind Großbuchstaben A-Z.
 * Die Werte sind Unicode Private Use Area Codepoints (E000–E019)
 * die vom Custom Font gemappt werden.
 *
 * Quelle der Zuordnung: https://futurama.fandom.com/wiki/Alienese
 */

const ALIEN_MAP = {
  A: '\uE000', B: '\uE001', C: '\uE002', D: '\uE003',
  E: '\uE004', F: '\uE005', G: '\uE006', H: '\uE007',
  I: '\uE008', J: '\uE009', K: '\uE00A', L: '\uE00B',
  M: '\uE00C', N: '\uE00D', O: '\uE00E', P: '\uE00F',
  Q: '\uE010', R: '\uE011', S: '\uE012', T: '\uE013',
  U: '\uE014', V: '\uE015', W: '\uE016', X: '\uE017',
  Y: '\uE018', Z: '\uE019'
};

// Umgekehrtes Mapping: Alien-Zeichen → lateinischer Buchstabe
const LATIN_MAP = Object.fromEntries(
  Object.entries(ALIEN_MAP).map(([lat, ali]) => [ali, lat])
);

// Anzeige-Mapping mit SVG-Referenzen (Fallback ohne Custom Font)
// Jeder Eintrag: { latin, svgFile, description }
const ALPHABET_META = [
  { latin: 'A', svgFile: 'a.svg', description: 'Kreisähnlich mit Querbalken' },
  { latin: 'B', svgFile: 'b.svg', description: 'Zwei Halbkreise' },
  { latin: 'C', svgFile: 'c.svg', description: 'Offener Bogen' },
  { latin: 'D', svgFile: 'd.svg', description: 'Senkrechter Strich mit Bogen' },
  { latin: 'E', svgFile: 'e.svg', description: 'Dreifach-Querstriche' },
  { latin: 'F', svgFile: 'f.svg', description: 'Zweifach-Querstriche' },
  { latin: 'G', svgFile: 'g.svg', description: 'Bogen mit Einzug' },
  { latin: 'H', svgFile: 'h.svg', description: 'Doppel-Senkrechte' },
  { latin: 'I', svgFile: 'i.svg', description: 'Einfacher Strich' },
  { latin: 'J', svgFile: 'j.svg', description: 'Haken' },
  { latin: 'K', svgFile: 'k.svg', description: 'Schrägstriche' },
  { latin: 'L', svgFile: 'l.svg', description: 'L-Form' },
  { latin: 'M', svgFile: 'm.svg', description: 'Wellenform' },
  { latin: 'N', svgFile: 'n.svg', description: 'Zick-Zack' },
  { latin: 'O', svgFile: 'o.svg', description: 'Kreis' },
  { latin: 'P', svgFile: 'p.svg', description: 'Halbkreis oben' },
  { latin: 'Q', svgFile: 'q.svg', description: 'Kreis mit Strich' },
  { latin: 'R', svgFile: 'r.svg', description: 'Bogen mit Bein' },
  { latin: 'S', svgFile: 's.svg', description: 'S-Kurve' },
  { latin: 'T', svgFile: 't.svg', description: 'T-Form' },
  { latin: 'U', svgFile: 'u.svg', description: 'U-Form' },
  { latin: 'V', svgFile: 'v.svg', description: 'V-Form' },
  { latin: 'W', svgFile: 'w.svg', description: 'Doppel-V' },
  { latin: 'X', svgFile: 'x.svg', description: 'Kreuzform' },
  { latin: 'Y', svgFile: 'y.svg', description: 'Gabel' },
  { latin: 'Z', svgFile: 'z.svg', description: 'Z-Form' },
];

// Exportiere für andere Module
window.AlienAlphabet = { ALIEN_MAP, LATIN_MAP, ALPHABET_META };

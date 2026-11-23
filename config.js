/*
 * SenserScan – Konfiguration
 * ---------------------------------------------------------------
 * Hier stehen alle fachlichen Einstellungen, die ohne Programmier-
 * kenntnisse geändert werden können:
 *   - Typen der Potenzialflächen
 *   - Klassen (Name, Farbe, Beschreibung)
 *   - Regeln für die automatische Klassifizierung
 *   - Gebiete und Hintergrundkarten
 *
 * Nach einer Änderung die Seite neu laden. Läuft die App als
 * installierte PWA, ggf. zweimal neu laden (Offline-Cache).
 * Der Maßnahmenkatalog steht in data/massnahmen.json.
 */
window.SENSERSCAN_CONFIG = {
  version: '0.1.0',

  // Angaben für die Info-Seite
  info: {
    werkzeug: 'Claude Code',
    modell: 'Claude Opus 5.5 (claude-opus-5-5)',
    datum: '23.11.2026'
  },

  // Typen der Potenzialflächen. Schlüssel (links) nicht ändern,
  // wenn schon Flächen erfasst sind; Bezeichnungen frei änderbar.
  typen: {
    parkplatz:    { de: 'Parkplatz',   nl: 'Parkeerplaats' },
    brache:       { de: 'Brache',      nl: 'Braakliggend terrein' },
    bauluecke:    { de: 'Baulücke',    nl: 'Lege kavel' },
    flachdach:    { de: 'Flachdach',   nl: 'Plat dak' },
    innenhof:     { de: 'Innenhof',    nl: 'Binnenhof' },
    strassenraum: { de: 'Straßenraum', nl: 'Straatruimte' },
    gruenflaeche: { de: 'Grünfläche',  nl: 'Groenvoorziening' }
  },

  // Klassen mit Farbe (Karte und Legende) und Kurzbeschreibung.
  // Die Reihenfolge hier ist die Reihenfolge in Legende und Liste.
  klassen: {
    gruen_sichern: {
      farbe: '#1a7f37',
      name: { de: 'Grün sichern', nl: 'Groen behouden' },
      beschreibung: {
        de: 'Bestehende Grünfläche erhalten und klimatisch qualifizieren, keine Bebauung.',
        nl: 'Bestaand groen behouden en klimaatbestendig versterken, geen bebouwing.'
      }
    },
    verdichten_auflagen: {
      farbe: '#e8590c',
      name: { de: 'Verdichten mit Auflagen', nl: 'Verdichten onder voorwaarden' },
      beschreibung: {
        de: 'Hohes Baupotenzial bei hohem Wasser- oder Hitzerisiko: Bauen nur mit Auflagen zur Klimavorsorge.',
        nl: 'Hoge bouwpotentie bij hoog water- of hitterisico: bouwen alleen onder voorwaarden voor klimaatadaptatie.'
      }
    },
    bauen_entsiegeln: {
      farbe: '#7b3fbf',
      name: { de: 'Bauen und entsiegeln', nl: 'Bouwen en ontharden' },
      beschreibung: {
        de: 'Hohes Baupotenzial: bauliche Verdichtung, verbunden mit Entsiegelung und Begrünung.',
        nl: 'Hoge bouwpotentie: verdichting, gekoppeld aan ontharding en vergroening.'
      }
    },
    gruen_aufwerten: {
      farbe: '#8cc63f',
      name: { de: 'Grün aufwerten', nl: 'Groen opwaarderen' },
      beschreibung: {
        de: 'Geringes Baupotenzial: Fläche für Grün, Wasser und Aufenthalt aufwerten.',
        nl: 'Lage bouwpotentie: vlak opwaarderen voor groen, water en verblijf.'
      }
    }
  },

  // Regeln für die automatische Klassifizierung.
  // Sie werden von oben nach unten geprüft; die ERSTE zutreffende
  // Regel bestimmt die Klasse. Verfügbare Werte einer Fläche f:
  //   f.typ    – Typ-Schlüssel (siehe "typen", z. B. 'gruenflaeche')
  //   f.bau    – Baupotenzial 1–5
  //   f.gruen  – Grünpotenzial 1–5
  //   f.wasser – Risiko Wasser 1–5
  //   f.hitze  – Risiko Hitze 1–5
  regeln: [
    // a) Typ = Grünfläche -> Grün sichern
    { klasse: 'gruen_sichern',       wenn: f => f.typ === 'gruenflaeche' },
    // b) Baupotenzial >= 4 und (Wasser >= 4 oder Hitze >= 4) -> Verdichten mit Auflagen
    { klasse: 'verdichten_auflagen', wenn: f => f.bau >= 4 && (f.wasser >= 4 || f.hitze >= 4) },
    // c) Baupotenzial >= 4 -> Bauen und entsiegeln
    { klasse: 'bauen_entsiegeln',    wenn: f => f.bau >= 4 },
    // d) sonst -> Grün aufwerten
    { klasse: 'gruen_aufwerten',     wenn: f => true }
  ],

  // Gebietsgrenzen (GeoJSON in WGS84)
  gebiete: {
    datei: 'data/vaals_gebiete_wgs84.geojson',
    planungsgebietId: 2,
    analyseraumId: 4,
    namen: {
      2: { de: 'Planungsgebiet Selzerbeek', nl: 'Plangebied Selzerbeek' },
      4: { de: 'Analyseraum Kernbereich Vaals', nl: 'Analysegebied kern Vaals' }
    },
    stilPlanung: { color: '#0b7285', weight: 3, fillColor: '#0b7285', fillOpacity: 0.06 },
    stilAnalyse: { color: '#343a40', weight: 2, dashArray: '8 6', fill: false }
  },

  // Hintergrundkarten.
  // Luftbild: PDOK WMTS, laut GetCapabilities (abgerufen 23.11.2026):
  //   Layer "Actueel_orthoHR", TileMatrixSet "EPSG:3857",
  //   TileMatrix-IDs "00"–"21" (zweistellig, daher {tm}), image/jpeg.
  karten: {
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxNativeZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    },
    luftbild: {
      url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{tm}/{x}/{y}.jpeg',
      maxNativeZoom: 21,
      attribution: 'Luchtfoto: <a href="https://www.pdok.nl/">PDOK</a> / Beeldmateriaal Nederland'
    }
  },

  // Startansicht, solange die Gebiete noch laden
  start: { center: [50.7762, 6.0215], zoom: 16 }
};

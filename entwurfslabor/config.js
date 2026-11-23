/*
 * Vaals Entwurfslabor – Konfiguration
 * ---------------------------------------------------------------
 * Alle fachlichen Werte stehen hier und können ohne Programmier-
 * kenntnisse geändert werden. Danach die Seite neu laden.
 *
 *  - belaege:    Abflussbeiwert psi, Speichervermögen (mm) und
 *                Versiegelungsfaktor je Belagsart, jeweils mit Quelle.
 *                Solange "geprueft: false" gilt, zeigt die App
 *                "Annahme – prüfen".
 *  - szenarien:  Flächenbilanz (m²) und Startwerte der Regler.
 *                Solange "platzhalter: true" gilt, zeigt die App die
 *                Werte als "Platzhalter". Echte Werte aus QGIS
 *                eintragen, "quelle" ergänzen, "platzhalter: false".
 *
 * Hinweis: Was in der App geändert wird (Flächenbilanz, Regler, Namen,
 * Platzhalter, unter "Einstellungen" auch Menüfarbe und Kennwerte),
 * merkt sich der Browser und lässt sich dort als .json exportieren und
 * wieder importieren. Sobald sich hier etwas unter "szenarien" ändert,
 * startet die App wieder mit den Werten aus dieser Datei.
 */
window.ENTWURFSLABOR_CONFIG = {
  version: '0.2.0',

  // Leitfarbe von Kopfzeile und Bedienelementen (Wasserblau)
  menuFarbe: '#1971c2',

  // Planungsgebiet Selzerbeek
  gebiet: {
    name: { de: 'Planungsgebiet Selzerbeek', nl: 'Plangebied Selzerbeek' },
    flaeche_m2: 203454,
    quelle: 'Fläche aus QGIS (Vorgabe); Grenze: data/vaals_gebiete_wgs84.geojson, id 2 (Shapefile Lehrstuhl, EPSG 25832, umprojiziert nach WGS84)',
    // Außenring [Länge, Breite] in WGS84, kopiert aus vaals_gebiete_wgs84.geojson (id 2)
    polygon: [[6.0236076, 50.7735914], [6.0198054, 50.774525], [6.0174253, 50.7752913], [6.0177027, 50.7756375],
              [6.0176705, 50.776143], [6.01717, 50.7766139], [6.0181392, 50.7771811], [6.0198239, 50.7788291],
              [6.0259175, 50.7762317], [6.0237269, 50.7735662], [6.0236076, 50.7735914]]
  },

  // Bemessungsregen und Richtwerte
  regen: {
    mm: 70,
    dauer_h: 1,
    quelle: 'Richtwert 70 mm in 1 h (Vorgabe aus der Aufgabenstellung)'
  },
  richtwerte: {
    deltaV_m3: 0,          // Retentionsbilanz: Speicher mindestens so groß wie der Abfluss
    baumkronen_prozent: 30, // Ziel Baumkronenanteil
    quelle: 'Ziel 30 % Baumkronenanteil und ΔV ≥ 0: Vorgabe aus der Aufgabenstellung'
  },

  // Erlaubte Abweichung der Summe von der Gebietsfläche (m², Rundung)
  summenToleranz_m2: 1,

  // Belagsarten. Schlüssel (links) nicht ändern; Reihenfolge = Tabelle.
  //   psi          Abflussbeiwert (0–1)
  //   speicher_mm  zusätzlicher Rückhalteraum in mm (= l/m²), der nicht
  //                schon im psi steckt – sonst zählt er doppelt
  //   versiegelung Faktor für den Versiegelungsgrad (1 = voll, 0 = offen)
  //   dach / gruendach  Zuordnung für den Regler "Anteil begrünter Dachflächen"
  // Startwerte nicht an den Normtexten geprüft. Vor Verwendung prüfen, auch
  // gegen die Neufassung DWA-A 138-1. In der App unter "Einstellungen" änderbar.
  belaege: {
    dach_konv: {
      name: { de: 'Dach konventionell', nl: 'Dak conventioneel' },
      farbe: '#a0522d', dach: true,
      psi: 0.9, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Flachdach, Schrägdach 0,9–1,0',
      speicher_mm: 0, speicherQuelle: 'kein zusätzlicher Rückhalteraum (Benetzung steckt in ψ)',
      versiegelung: 1, versiegelungQuelle: 'vollversiegelt',
      geprueft: false
    },
    gruendach_ext: {
      name: { de: 'Gründach extensiv', nl: 'Groendak extensief' },
      farbe: '#7fd1b9', dach: true, gruendach: true,
      psi: 0.5, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Gründach, Aufbau < 10 cm',
      speicher_mm: 0, speicherQuelle: 'Rückhalt im Substrat steckt in ψ',
      versiegelung: 1, versiegelungQuelle: 'überbaut (Gebäude)',
      geprueft: false
    },
    retentionsdach: {
      name: { de: 'Retentionsgründach', nl: 'Retentiegroendak' },
      farbe: '#20a39e', dach: true, gruendach: true,
      psi: 0.3, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Gründach, Aufbau ≥ 10 cm',
      speicher_mm: 50, speicherQuelle: 'Retentionsraum unter dem Substrat mit Drossel; Herstellerangaben etwa 40–100 mm',
      versiegelung: 1, versiegelungQuelle: 'überbaut (Gebäude)',
      geprueft: false
    },
    asphalt: {
      name: { de: 'Asphalt/Beton', nl: 'Asfalt/beton' },
      farbe: '#495057',
      psi: 0.9, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Betonfläche, Schwarzdecke',
      speicher_mm: 0, speicherQuelle: 'kein Rückhalteraum',
      versiegelung: 1, versiegelungQuelle: 'vollversiegelt',
      geprueft: false
    },
    pflaster: {
      name: { de: 'Pflaster', nl: 'Bestrating' },
      farbe: '#adb5bd',
      psi: 0.75, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Pflaster mit dichten Fugen',
      speicher_mm: 0, speicherQuelle: 'kein Rückhalteraum',
      versiegelung: 1, versiegelungQuelle: 'vollversiegelt',
      geprueft: false
    },
    durchlaessig: {
      name: { de: 'wasserdurchlässiger Belag', nl: 'Waterdoorlatende verharding' },
      farbe: '#e0c068',
      psi: 0.25, psiQuelle: 'DWA-A 138 (2005), Tab. 2, ψm: Verbundsteine mit Fugen, Sickersteine',
      speicher_mm: 0, speicherQuelle: 'Rückhalt im Unterbau steckt in ψ',
      versiegelung: 0.5, versiegelungQuelle: 'teilversiegelt, Faktor 0,5 (Annahme)',
      geprueft: false
    },
    rasen: {
      name: { de: 'Rasen/Garten', nl: 'Gazon/tuin' },
      farbe: '#9bd45a',
      psi: 0.2, psiQuelle: 'DIN 1986-100:2016-12, Tab. 9: Rasen, Gärten (flach 0,1); 0,2 wegen Hanglage',
      speicher_mm: 0, speicherQuelle: 'Rückhalt im Boden steckt in ψ',
      versiegelung: 0, versiegelungQuelle: 'unversiegelt',
      geprueft: false
    },
    mulde: {
      name: { de: 'Retentionsmulde/Wasserfläche', nl: 'Retentiewadi/waterpartij' },
      farbe: '#339af0',
      psi: 1.0, psiQuelle: 'Regen fällt direkt in den Speicher',
      speicher_mm: 300, speicherQuelle: 'Einstau 30 cm (DWA-A 138: Mulden höchstens 30 cm Einstau)',
      versiegelung: 0, versiegelungQuelle: 'unversiegelt',
      geprueft: false
    },
    aue: {
      name: { de: 'Bachaue/Natur', nl: 'Beekdal/natuur' },
      farbe: '#2b6e3f',
      psi: 0.1, psiQuelle: 'DIN 1986-100:2016-12, Tab. 9: natürliche, flache Fläche (Größenordnung)',
      speicher_mm: 0, speicherQuelle: 'Rückhalt der Aue über den Regler „Retentionsvolumen der Aue“ (m³)',
      versiegelung: 0, versiegelungQuelle: 'unversiegelt',
      geprueft: false
    }
  },

  // Wohin die Regler Flächen umbuchen
  massnahmen: {
    dachbegruenungZiel: 'gruendach_ext', // zusätzlich begrünte Dächer werden zu ...
    entsiegelungVon: 'asphalt',          // Parkplätze liegen in ...
    entsiegelungZiel: 'durchlaessig'     // entsiegelte Parkplätze werden zu ...
  },

  // Regler: Bereich und Schrittweite
  regler: {
    dachGruenAnteil: { min: 0, max: 100,    step: 1,    einheit: '%' },
    parkEntsiegelt:  { min: 0, max: 100,    step: 5,    einheit: '%' },
    baeume:          { min: 0, max: 800,    step: 10,   einheit: 'Stk.' },
    kronenflaeche:   { min: 10, max: 150,   step: 5,    einheit: 'm²',
                       quelle: 'Startwert 50 m²: Baum 2. Ordnung, Kronendurchmesser etwa 8 m (Annahme)' },
    aueVolumen:      { min: 0, max: 20000,  step: 250,  einheit: 'm³' },
    neubauBgf:       { min: 0, max: 250000, step: 500,  einheit: 'm²' },
    wohnenAnteil:    { min: 0, max: 100,    step: 5,    einheit: '%' },
    bgfJeWe:         { min: 40, max: 200,   step: 5,    einheit: 'm²' }
  },

  // Szenarien. Reihenfolge = Umschalter.
  //   referenz: true  -> Vergleichsbasis der Ampel
  //   flaechen: m² je Belagsart (Summe = Gebietsfläche)
  //             oder 'bestand' = Kopie der Bestandsbilanz
  //   parkplaetze_m2: davon Parkplätze (liegen in Asphalt/Beton)
  //   baumkronen_m2:  vorhandene Baumkronen (Überlagerung, nicht in der Summe)
  //   regler.dachGruenAnteil: null = wie in der Flächenbilanz
  szenarien: [
    {
      id: 'bestand',
      name: { de: 'Bestand', nl: 'Bestaand' },
      referenz: true,
      platzhalter: true,
      quelle: 'PLATZHALTER – runde Zahlen, keine Messwerte. Aus QGIS ersetzen.',
      flaechen: {
        dach_konv: 18000,
        gruendach_ext: 1000,
        retentionsdach: 0,
        asphalt: 32000,
        pflaster: 14000,
        durchlaessig: 3000,
        rasen: 60000,
        mulde: 2000,
        aue: 73454
      },
      parkplaetze_m2: 12000,
      baumkronen_m2: 25000,
      regler: {
        dachGruenAnteil: null, parkEntsiegelt: 0, baeume: 0, kronenflaeche: 50,
        aueVolumen: 0, neubauBgf: 0, wohnenAnteil: 70, bgfJeWe: 95
      }
    },
    {
      id: 'a',
      name: { de: 'Variante A', nl: 'Variant A' },
      platzhalter: true,
      quelle: 'PLATZHALTER – Kopie des Bestands. Flächenbilanz des Entwurfs eintragen (z. B. neue Dächer).',
      flaechen: 'bestand',
      regler: {
        dachGruenAnteil: 50, parkEntsiegelt: 30, baeume: 150, kronenflaeche: 50,
        aueVolumen: 3000, neubauBgf: 40000, wohnenAnteil: 70, bgfJeWe: 95
      }
    },
    {
      id: 'b',
      name: { de: 'Variante B', nl: 'Variant B' },
      platzhalter: true,
      quelle: 'PLATZHALTER – Kopie des Bestands. Flächenbilanz des Entwurfs eintragen (z. B. neue Dächer).',
      flaechen: 'bestand',
      regler: {
        dachGruenAnteil: 80, parkEntsiegelt: 70, baeume: 350, kronenflaeche: 60,
        aueVolumen: 8000, neubauBgf: 60000, wohnenAnteil: 80, bgfJeWe: 90
      }
    }
  ],

  // Import der Potenzialflächen aus SenserScan (GeoJSON-Export der anderen App)
  senserscan: {
    typParkplatz: 'parkplatz', // Typ-Schlüssel für "Parkplatzfläche übernehmen"
    typFlachdach: 'flachdach'  // Typ-Schlüssel für den Hinweis am Dach-Regler
  },

  // Übersichtskarte aus zwei amtlichen Hintergrundkarten, übereinander gelegt.
  // Jede ist außerhalb ihres Landes durchsichtig; so ist auch der Teil jenseits
  // des Senserbachs (Deutschland) zu sehen.
  //  1. NL: BRT-Achtergrondkaart (PDOK/Kadaster). GetCapabilities
  //     https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0 (abgerufen 23.11.2026):
  //     TileMatrixSet "EPSG:3857", TileMatrix "00"–"19" (zweistellig, daher {tm}), URL .../{tm}/{x}/{y}.png
  //  2. DE: basemap.de Web Raster (BKG), CC BY 4.0. GetCapabilities
  //     https://sgx.geodatenzentrum.de/wmts_basemapde/1.0.0/WMTSCapabilities.xml (abgerufen 23.11.2026):
  //     TileMatrixSet "GLOBAL_WEBMERCATOR", TileMatrix "00"–"19", URL .../{tm}/{y}/{x}.png (erst Zeile, dann Spalte)
  // Alternative OpenStreetMap (in manchen Browsern/Netzen mit "Access blocked" gesperrt):
  //   { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  //     attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' }
  karte: {
    maxZoom: 19,
    ebenen: [
      {
        url: 'https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{tm}/{x}/{y}.png',
        attribution: 'Kaart: <a href="https://www.pdok.nl/">PDOK</a> / © Kadaster'
      },
      {
        url: 'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{tm}/{y}/{x}.png',
        attribution: '© <a href="https://basemap.de/">GeoBasis-DE / BKG</a> (2026) CC BY 4.0'
      }
    ]
  }
};

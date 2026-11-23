/*
 * Klima Chancen – Konfiguration
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
 * Der Maßnahmenkatalog steht in data/massnahmen.js, die Analyse
 * des Plangebiets in data/analyse.js.
 *
 * Menüfarbe, Klassen (Name, Farbe, Beschreibung) und Schwellenwerte
 * lassen sich auch in der App unter "Einstellungen" ändern, dort können
 * auch eigene Flächentypen ergänzt werden. Die Werte hier sind dann der
 * Standard ("Standard wiederherstellen").
 */
window.SENSERSCAN_CONFIG = {
  version: '0.4.1',

  // Farbe von Kopfzeile und Bedienelementen (Vaals-Rot, wie vaals.nl)
  menuFarbe: '#e10a17',

  // Typen der Potenzialflächen. Schlüssel (links) nicht ändern,
  // wenn schon Flächen erfasst sind; Bezeichnungen frei änderbar.
  // Eigene Typen aus den Einstellungen kommen hinten dazu.
  typen: {
    parkplatz:    { de: 'Parkplatz',    nl: 'Parkeerplaats' },
    brache:       { de: 'Brache',       nl: 'Braakliggend terrein' },
    bauluecke:    { de: 'Baulücke',     nl: 'Lege kavel' },
    flachdach:    { de: 'Flachdach',    nl: 'Plat dak' },
    satteldach:   { de: 'Satteldach',   nl: 'Zadeldak' },
    innenhof:     { de: 'Innenhof',     nl: 'Binnenhof' },
    wohnbau:      { de: 'Wohnbau',      nl: 'Woningbouw' },
    industriebau: { de: 'Industriebau', nl: 'Industriegebouw' },
    strassenraum: { de: 'Straßenraum',  nl: 'Straatruimte' },
    gruenflaeche: { de: 'Grünfläche',   nl: 'Groenvoorziening' },
    sport:        { de: 'Sport',        nl: 'Sport' },
    spielflaeche: { de: 'Spielfläche',  nl: 'Speelplek' }
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

  // Schwellenwerte: ab diesem Wert (1–5) gilt ein Wert als "hoch".
  // In den Regeln unten als s.bau, s.wasser, s.hitze verwendet.
  schwellen: { bau: 4, wasser: 4, hitze: 4 },

  // Regeln für die automatische Klassifizierung.
  // Sie werden von oben nach unten geprüft; die ERSTE zutreffende
  // Regel bestimmt die Klasse. Verfügbare Werte einer Fläche f:
  //   f.typ    – Typ-Schlüssel (siehe "typen", z. B. 'gruenflaeche')
  //   f.bau    – Baupotenzial 1–5
  //   f.gruen  – Grünpotenzial 1–5
  //   f.wasser – Risiko Wasser 1–5
  //   f.hitze  – Risiko Hitze 1–5
  // "text" beschreibt die Regel in den Einstellungen; {bau}, {wasser}
  // und {hitze} werden durch die Schwellenwerte ersetzt.
  regeln: [
    // a) Typ = Grünfläche -> Grün sichern
    { klasse: 'gruen_sichern',
      text: { de: 'Typ Grünfläche', nl: 'Type groenvoorziening' },
      wenn: (f, s) => f.typ === 'gruenflaeche' },
    // b) Baupotenzial >= 4 und (Wasser >= 4 oder Hitze >= 4) -> Verdichten mit Auflagen
    { klasse: 'verdichten_auflagen',
      text: { de: 'Bau ≥ {bau} und (Wasser ≥ {wasser} oder Hitze ≥ {hitze})', nl: 'Bouw ≥ {bau} en (water ≥ {wasser} of hitte ≥ {hitze})' },
      wenn: (f, s) => f.bau >= s.bau && (f.wasser >= s.wasser || f.hitze >= s.hitze) },
    // c) Baupotenzial >= 4 -> Bauen und entsiegeln
    { klasse: 'bauen_entsiegeln',
      text: { de: 'Bau ≥ {bau}', nl: 'Bouw ≥ {bau}' },
      wenn: (f, s) => f.bau >= s.bau },
    // d) sonst -> Grün aufwerten
    { klasse: 'gruen_aufwerten',
      text: { de: 'alle übrigen Flächen', nl: 'alle overige locaties' },
      wenn: (f, s) => true }
  ],

  // Gebietsgrenzen (GeoJSON in WGS84) stehen in data/gebiete.js
  // (Kopie von data/vaals_gebiete_wgs84.geojson als Skript)
  gebiete: {
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
  // Karte: zwei amtliche Karten übereinander, jede ist außerhalb ihres Landes
  //   durchsichtig – zusammen decken sie beide Seiten der Grenze ab.
  //   OpenStreetMap (tile.openstreetmap.org) wird nicht genutzt: Die Server
  //   liefern "Access blocked", wenn der Browser keinen Referer mitschickt.
  //   NL: BRT-Achtergrondkaart (Kadaster), laut GetCapabilities
  //     (https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0, abgerufen 23.11.2026):
  //     Layer "standaard" (auch "grijs", "pastel"), TileMatrixSet "EPSG:3857",
  //     TileMatrix-IDs "00"–"19" (zweistellig, daher {tm}), image/png.
  //   DE: basemap.de Web Raster (BKG), laut GetCapabilities
  //     (https://sgx.geodatenzentrum.de/wmts_basemapde/1.0.0/WMTSCapabilities.xml,
  //     abgerufen 23.11.2026): Layer "de_basemapde_web_raster_farbe" (auch "_grau"),
  //     TileMatrixSet "GLOBAL_WEBMERCATOR", TileMatrix-IDs "00"–"19", image/png,
  //     Reihenfolge {TileMatrix}/{TileRow}/{TileCol} = {tm}/{y}/{x}, Lizenz CC BY 4.0.
  // Grundstücke: graue Karte mit Flurstücksgrenzen (sichtbar ab Zoomstufe 17).
  //   NL: Kadastrale kaart (Kadaster), laut GetCapabilities
  //     (https://service.pdok.nl/kadaster/kadastralekaart/wmts/v5_0, abgerufen 23.11.2026):
  //     Layer "Kadastralekaart", TileMatrixSet "EPSG:3857", TileMatrix-IDs "00"–"22".
  //   DE: ALKIS NRW (Geobasis NRW) als WMS, Layer "adv_alkis_flurstuecke",
  //     sichtbar bis Maßstab 1:5501, Lizenz Datenlizenz Deutschland – Zero 2.0.
  //   Einträge mit "wms" werden als WMS geladen, die übrigen als Kacheln.
  // Luftbild: PDOK WMTS, laut GetCapabilities (abgerufen 23.11.2026):
  //   Layer "Actueel_orthoHR", TileMatrixSet "EPSG:3857",
  //   TileMatrix-IDs "00"–"21" (zweistellig, daher {tm}), image/jpeg.
  //   Deckt nur die Niederlande ab; östlich der Grenze bleibt es weiß.
  karten: {
    karte: [
      {
        url: 'https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{tm}/{x}/{y}.png',
        maxNativeZoom: 19,
        attribution: 'Kaart: <a href="https://www.pdok.nl/">PDOK</a> / © Kadaster'
      },
      {
        url: 'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{tm}/{y}/{x}.png',
        maxNativeZoom: 19,
        attribution: 'Karte: © <a href="https://basemap.de/">GeoBasis-DE / BKG</a> (2026) CC BY 4.0'
      }
    ],
    grundstuecke: [
      {
        url: 'https://service.pdok.nl/kadaster/brt-achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{tm}/{x}/{y}.png',
        maxNativeZoom: 19,
        attribution: 'Kaart: <a href="https://www.pdok.nl/">PDOK</a> / © Kadaster'
      },
      {
        url: 'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_grau/default/GLOBAL_WEBMERCATOR/{tm}/{y}/{x}.png',
        maxNativeZoom: 19,
        attribution: 'Karte: © <a href="https://basemap.de/">GeoBasis-DE / BKG</a> (2026) CC BY 4.0'
      },
      {
        url: 'https://service.pdok.nl/kadaster/brk-kadastrale-kaart/wmts/v5_0/Kadastralekaart/EPSG:3857/{tm}/{x}/{y}.png',
        minZoom: 17,
        maxNativeZoom: 21,
        attribution: 'Kaart: <a href="https://www.pdok.nl/">PDOK</a> / © Kadaster'   // gleicher Text wie oben, erscheint nur einmal
      },
      {
        wms: 'https://www.wms.nrw.de/geobasis/wms_nw_alkis',
        layers: 'adv_alkis_flurstuecke',
        minZoom: 17,
        attribution: 'Flurstücke: © <a href="https://www.bezreg-koeln.nrw.de/geobasis-nrw">Geobasis NRW</a>, dl-de/zero-2-0'
      }
    ],
    luftbild: {
      url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{tm}/{x}/{y}.jpeg',
      maxNativeZoom: 21,
      attribution: 'Luchtfoto: <a href="https://www.pdok.nl/">PDOK</a> / Beeldmateriaal Nederland'
    }
  },

  // Startansicht, solange die Gebiete noch laden
  start: { center: [50.7762, 6.0215], zoom: 16 }
};

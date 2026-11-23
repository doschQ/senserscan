/*
 * Klima Chancen – App-Logik
 * KI-generiert (Claude Code, Claude Opus 5.5), Prototyp.
 * Fachliche Einstellungen: config.js · Texte: i18n.js · Katalog: data/massnahmen.json
 */
(function () {
  'use strict';

  const CFG = window.SENSERSCAN_CONFIG;
  const I18N = window.SENSERSCAN_I18N;

  // ================================================================
  // Hilfsfunktionen
  // ================================================================
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  function storageGet(k) { try { return localStorage.getItem('senserscan.' + k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem('senserscan.' + k, v); } catch (e) { /* egal */ } }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ================================================================
  // Sprache
  // ================================================================
  let lang = storageGet('lang') === 'nl' ? 'nl' : 'de';

  function t(key, vars) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.de[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  // Objekt {de, nl} in aktueller Sprache
  function tx(obj) { return obj ? (obj[lang] || obj.de || '') : ''; }

  function fmtNum(v, digits) {
    return Number(v).toLocaleString(lang === 'nl' ? 'nl-NL' : 'de-DE',
      { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  }
  function fmtM2(v) { return fmtNum(Math.round(v)) + ' m²'; }

  function applyStaticTexts() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
      el.title = t(el.dataset.i18nAria);
    });
    $('#btn-lang').textContent = lang === 'de' ? 'NL' : 'DE';
  }

  // ================================================================
  // Toast
  // ================================================================
  let toastTimer = null;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 3500);
  }

  // ================================================================
  // Karte und Hintergrundkarten
  // ================================================================
  const map = L.map('map', {
    center: CFG.start.center,
    zoom: CFG.start.zoom,
    maxZoom: 21,
    zoomSnap: 0.5,
    zoomControl: false
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

  const basemaps = {
    osm: L.tileLayer(CFG.karten.osm.url, {
      maxZoom: 21,
      maxNativeZoom: CFG.karten.osm.maxNativeZoom,
      attribution: CFG.karten.osm.attribution
    }),
    luftbild: L.tileLayer(CFG.karten.luftbild.url, {
      maxZoom: 21,
      maxNativeZoom: CFG.karten.luftbild.maxNativeZoom,
      attribution: CFG.karten.luftbild.attribution,
      // PDOK-TileMatrix-IDs sind zweistellig: 00 … 21
      tm: data => String(data.z).padStart(2, '0')
    })
  };
  let basemapAktiv = null;

  // Wenn das Luftbild nicht lädt, zurück zu OSM – die App läuft weiter.
  const lbStatus = { ok: 0, err: 0, gewarnt: false };
  basemaps.luftbild.on('tileload', () => { lbStatus.ok++; });
  basemaps.luftbild.on('tileerror', () => {
    lbStatus.err++;
    if (!lbStatus.gewarnt && lbStatus.ok === 0 && lbStatus.err >= 3 && basemapAktiv === 'luftbild') {
      lbStatus.gewarnt = true;
      toast(t('luftbildFehler'), 5000);
      setBasemap('osm');
    }
  });

  function setBasemap(name, leise) {
    if (!basemaps[name] || name === basemapAktiv) return;
    if (basemapAktiv) map.removeLayer(basemaps[basemapAktiv]);
    basemaps[name].addTo(map).bringToBack();
    basemapAktiv = name;
    storageSet('basemap', name);
    $$('.basemap-switch button').forEach(b => b.classList.toggle('active', b.dataset.basemap === name));
    if (name === 'luftbild') {
      lbStatus.ok = 0; lbStatus.err = 0; lbStatus.gewarnt = false;
      if (!leise) toast(t('luftbildHinweis'));
    }
  }

  // ================================================================
  // Gebiete (Analyseraum, Planungsgebiet)
  // ================================================================
  let gebieteGeoJSON = null;
  let planungsBounds = null;
  const gebieteLayer = L.layerGroup().addTo(map);

  function gebietName(f) {
    const id = f.properties && f.properties.id;
    return tx(CFG.gebiete.namen[id]) || (f.properties && f.properties.name) || '';
  }

  function renderGebiete() {
    gebieteLayer.clearLayers();
    if (!gebieteGeoJSON) return;
    // Analyseraum zuerst (unten), Planungsgebiet oben
    const feats = gebieteGeoJSON.features.slice().sort((a, b) =>
      (a.properties.id === CFG.gebiete.planungsgebietId) - (b.properties.id === CFG.gebiete.planungsgebietId));
    feats.forEach(f => {
      const istPlan = f.properties.id === CFG.gebiete.planungsgebietId;
      const layer = L.geoJSON(f, {
        interactive: false,
        style: istPlan ? CFG.gebiete.stilPlanung : CFG.gebiete.stilAnalyse
      }).addTo(gebieteLayer);
      const b = layer.getBounds();
      // Planungsgebiet: Beschriftung über der Nordspitze (Flächen darin bleiben frei);
      // Analyseraum: innen am Nordrand
      const pos = istPlan
        ? nordpunkt(f.geometry)
        : L.latLng(b.getNorth() - (b.getNorth() - b.getSouth()) * 0.07, b.getCenter().lng);
      const ha = f.properties.flaeche_ha ? ' · ' + fmtNum(f.properties.flaeche_ha, 2) + ' ha' : '';
      L.marker(pos, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'gebiet-label' + (istPlan ? ' oben' : ' analyse'),
          html: '<span>' + esc(gebietName(f) + ha) + '</span>',
          iconSize: null
        })
      }).addTo(gebieteLayer);
      if (istPlan) planungsBounds = b;
    });
  }

  async function ladeGebiete() {
    try {
      const res = await fetch(CFG.gebiete.datei);
      if (!res.ok) throw new Error(res.status);
      gebieteGeoJSON = await res.json();
      renderGebiete();
      zoomPlanungsgebiet();
    } catch (e) {
      console.error(e);
      toast(t('gebieteFehler'), 5000);
    }
  }

  function zoomPlanungsgebiet() {
    if (planungsBounds) map.fitBounds(planungsBounds, { padding: [24, 24] });
  }

  // ================================================================
  // Legende
  // ================================================================
  function renderLegende() {
    const offen = storageGet('legende') !== 'zu';
    const plan = tx(CFG.gebiete.namen[CFG.gebiete.planungsgebietId]);
    const analyse = tx(CFG.gebiete.namen[CFG.gebiete.analyseraumId]);
    let html = '<button type="button" class="legende-toggle" aria-expanded="' + offen + '">' +
      esc(t('legende')) + ' ' + (offen ? '▾' : '▸') + '</button>';
    if (offen) {
      html += '<ul>';
      Object.keys(CFG.klassen).forEach(k => {
        const kl = CFG.klassen[k];
        html += '<li><span class="swatch" style="--c:' + kl.farbe + '"></span>' + esc(tx(kl.name)) + '</li>';
      });
      html += '<li><hr style="width:100%"></li>' +
        '<li><span class="swatch swatch--plan"></span>' + esc(plan) + '</li>' +
        '<li><span class="swatch swatch--analyse"></span>' + esc(analyse) + '</li></ul>';
    }
    const el = $('#legende');
    el.innerHTML = html;
    $('.legende-toggle', el).addEventListener('click', () => {
      storageSet('legende', offen ? 'zu' : 'offen');
      renderLegende();
    });
  }

  // ================================================================
  // Flächenberechnung (sphärisch, Erdradius WGS84 – wie Turf.js)
  // ================================================================
  const R_ERDE = 6378137;
  const rad = d => d * Math.PI / 180;
  const round7 = v => Math.round(v * 1e7) / 1e7;

  function ringArea(c) {
    let a = 0;
    for (let i = 0; i < c.length - 1; i++) {
      a += rad(c[i + 1][0] - c[i][0]) * (2 + Math.sin(rad(c[i][1])) + Math.sin(rad(c[i + 1][1])));
    }
    return Math.abs(a * R_ERDE * R_ERDE / 2);
  }
  function polyArea(rings) { return rings.reduce((s, r, i) => s + (i === 0 ? 1 : -1) * ringArea(r), 0); }
  function geomArea(g) {
    if (g.type === 'Polygon') return polyArea(g.coordinates);
    if (g.type === 'MultiPolygon') return g.coordinates.reduce((s, p) => s + polyArea(p), 0);
    return 0;
  }

  // ================================================================
  // Klassifizierung (Regeln aus config.js)
  // ================================================================
  function klasseVon(f) {
    for (const r of CFG.regeln) {
      try { if (r.wenn(f)) return r.klasse; } catch (e) { console.warn('Regel fehlerhaft:', r, e); }
    }
    return null;
  }
  function klasseInfo(k) {
    return CFG.klassen[k] || { farbe: '#868e96', name: { de: '–', nl: '–' }, beschreibung: {} };
  }
  // dunkle oder helle Schrift je nach Hintergrundfarbe
  function inkFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 160 ? '#18201d' : '#ffffff';
  }
  function badgeKlasse(k) {
    const kl = klasseInfo(k);
    return '<span class="badge" style="--c:' + kl.farbe + ';--ci:' + inkFor(kl.farbe) + '">' + esc(tx(kl.name)) + '</span>';
  }
  function typName(key) { return tx(CFG.typen[key]) || key || '–'; }
  function titel(f) { return f.beispiel ? t('beispielErsetzen') + ' ' + f.nr : typName(f.typ) + ' #' + f.nr; }
  function groesseText(f) {
    if (f.geometry.type === 'Point') {
      return t('ohneFlaeche') + (f.gps_genauigkeit_m != null ? ' · ' + t('gpsGenauigkeit', { m: f.gps_genauigkeit_m }) : '');
    }
    return fmtM2(geomArea(f.geometry));
  }

  // ================================================================
  // Lokale Datenbank (IndexedDB)
  // ================================================================
  let dbPromise = null;
  function openDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) { reject(new Error('IndexedDB nicht verfügbar')); return; }
        const req = indexedDB.open('senserscan', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('flaechen')) db.createObjectStore('flaechen', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }
  function idb(store, mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tr = db.transaction(store, mode);
      const req = fn(tr.objectStore(store));
      tr.oncomplete = () => resolve(req ? req.result : undefined);
      tr.onerror = () => reject(tr.error);
      tr.onabort = () => reject(tr.error);
    }));
  }
  const dbAlle = () => idb('flaechen', 'readonly', s => s.getAll());
  const dbSpeichern = list => idb('flaechen', 'readwrite', s => { list.forEach(f => s.put(f)); });
  const dbLoeschen = id => idb('flaechen', 'readwrite', s => s.delete(id));
  const metaGet = k => idb('meta', 'readonly', s => s.get(k));
  const metaSet = (k, v) => idb('meta', 'readwrite', s => s.put(v, k));

  async function persistieren(list) {
    try { await dbSpeichern(list); } catch (e) { console.error(e); toast(t('speicherFehler'), 6000); }
  }

  // ================================================================
  // Datenbestand und Kartenlayer der Potenzialflächen
  // ================================================================
  let flaechen = [];
  let auswahlId = null;
  const byId = id => flaechen.find(f => f.id === id);
  const neueId = () => 'f-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const naechsteNr = () => flaechen.reduce((m, f) => Math.max(m, f.nr || 0), 0) + 1;

  const flaechenLayer = L.featureGroup().addTo(map);

  function renderFlaechen() {
    flaechenLayer.clearLayers();
    flaechen.forEach(f => {
      const kl = klasseInfo(klasseVon(f));
      const sel = f.id === auswahlId;
      let layer;
      if (f.geometry.type === 'Point') {
        const c = f.geometry.coordinates;
        layer = L.circleMarker([c[1], c[0]], {
          radius: sel ? 13 : 10, color: sel ? '#111' : '#fff', weight: 3, fillColor: kl.farbe, fillOpacity: 1
        });
      } else {
        const tiefe = f.geometry.type === 'Polygon' ? 1 : 2;
        layer = L.polygon(L.GeoJSON.coordsToLatLngs(f.geometry.coordinates, tiefe), {
          color: sel ? '#111' : kl.farbe, weight: sel ? 4 : 3, fillColor: kl.farbe, fillOpacity: 0.45
        });
      }
      layer.on('click', () => { if (!zeichnen) openSteckbrief(f.id); });
      layer.addTo(flaechenLayer);
      // Beispielflächen: Schild über dem nördlichsten Punkt, damit die Fläche sichtbar bleibt
      if (f.beispiel) {
        L.marker(nordpunkt(f.geometry), {
          keyboard: false,
          icon: L.divIcon({ className: 'beispiel-label', html: '<span>' + esc(t('beispielErsetzen')) + '</span>', iconSize: null })
        }).on('click', () => { if (!zeichnen) openSteckbrief(f.id); }).addTo(flaechenLayer);
      }
    });
  }

  function nordpunkt(g) {
    if (g.type === 'Point') return L.latLng(g.coordinates[1], g.coordinates[0]);
    const ringe = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]);
    let best = ringe[0][0];
    ringe.forEach(r => r.forEach(c => { if (c[1] > best[1]) best = c; }));
    return L.latLng(best[1], best[0]);
  }

  async function ladeFlaechen() {
    try {
      flaechen = (await dbAlle()) || [];
    } catch (e) {
      console.error(e);
      flaechen = [];
      toast(t('speicherFehler'), 6000);
    }
    await ladeBeispiele();
    renderFlaechen();
  }

  // Beim allerersten Start die Beispielflächen übernehmen (danach nie wieder,
  // auch wenn sie gelöscht wurden).
  async function ladeBeispiele() {
    let geladen = false;
    try { geladen = !!(await metaGet('beispieleGeladen')); } catch (e) { /* ohne DB trotzdem zeigen */ }
    if (geladen) return;
    try {
      const res = await fetch('data/beispielflaechen.geojson');
      if (!res.ok) throw new Error(res.status);
      const gj = await res.json();
      const jetzt = new Date().toISOString();
      const neu = [];
      gj.features.forEach(ft => {
        const p = ft.properties;
        if (byId(p.id)) return;
        const rec = {
          id: p.id,
          nr: flaechen.some(f => f.nr === p.nr) ? naechsteNr() : p.nr,
          typ: p.typ, bau: p.bau, gruen: p.gruen, wasser: p.wasser, hitze: p.hitze,
          notiz: p.notiz || '',
          foto: null,
          geometry: ft.geometry,
          flaeche_m2: Math.round(geomArea(ft.geometry) * 10) / 10,
          gps_genauigkeit_m: null,
          beispiel: true,
          erstellt: p.erstellt || jetzt,
          geaendert: jetzt
        };
        flaechen.push(rec);
        neu.push(rec);
      });
      await persistieren(neu);
      await metaSet('beispieleGeladen', true);
    } catch (e) {
      console.error(e);
    }
  }

  // Karte so ausrichten, dass die Geometrie neben/über dem Panel sichtbar ist
  function zeigeGeometrie(geom) {
    const b = L.geoJSON(geom).getBounds();
    const size = map.getSize();
    const panel = $('#panel');
    const breit = window.innerWidth >= 768;
    const unten = !panel.hidden && !breit ? Math.min(panel.offsetHeight, size.y * 0.7) : 0;
    const rechts = !panel.hidden && breit ? panel.offsetWidth + 24 : 0;
    map.fitBounds(b, { paddingTopLeft: [24, 64], paddingBottomRight: [24 + rechts, 24 + unten], maxZoom: 19 });
  }

  // ================================================================
  // Panel (Bottom Sheet)
  // ================================================================
  let panelOnClose = null;
  let ansicht = null;   // Funktion, die das offene Panel neu zeichnet (Sprachwechsel)

  function oeffnePanel(title, html, onClose) {
    if (panelOnClose) { const fn = panelOnClose; panelOnClose = null; fn(); }
    $('#panel-title').textContent = title;
    const body = $('#panel-body');
    body.innerHTML = '<div class="view">' + html + '</div>';
    body.scrollTop = 0;
    $('#panel').hidden = false;
    document.body.classList.add('panel-open');
    panelOnClose = onClose || null;
    ansicht = null;
    return $('.view', body);
  }
  function schliessePanel() {
    $('#panel').hidden = true;
    document.body.classList.remove('panel-open');
    ansicht = null;
    if (panelOnClose) { const fn = panelOnClose; panelOnClose = null; fn(); }
  }

  // ================================================================
  // Polygon zeichnen (Leaflet-Geoman)
  // ================================================================
  let zeichnen = false;

  function zeichnenStart() {
    schliessePanel();
    zeichnen = true;
    document.body.classList.add('drawing');
    $('#bottombar').hidden = true;
    $('#drawbar').hidden = false;
    $('#draw-hint').hidden = false;
    map.pm.setLang(lang);
    map.pm.enableDraw('Polygon', {
      snappable: false,
      tooltips: false,
      templineStyle: { color: '#e8590c', weight: 3 },
      hintlineStyle: { color: '#e8590c', dashArray: [5, 5] },
      pathOptions: { color: '#e8590c', fillColor: '#e8590c', fillOpacity: 0.3 }
    });
  }
  function zeichnenEnde() {
    zeichnen = false;
    document.body.classList.remove('drawing');
    $('#bottombar').hidden = false;
    $('#drawbar').hidden = true;
    $('#draw-hint').hidden = true;
  }
  function zeichnenFertig() {
    const d = map.pm.Draw.Polygon;
    const n = d && d._layer ? d._layer.getLatLngs().length : 0;
    if (n < 3) { toast(t('mind3')); return; }
    d._finishShape();   // löst 'pm:create' aus
  }
  function zeichnenPunktZurueck() {
    const d = map.pm.Draw.Polygon;
    const n = d && d._markers ? d._markers.length : 0;
    if (n > 1) d._removeLastVertex();
    else if (n === 1) { map.pm.disableDraw(); zeichnenStart(); }
  }
  function zeichnenAbbrechen() {
    map.pm.disableDraw();
    zeichnenEnde();
  }
  map.on('pm:create', e => {
    const geom = e.layer.toGeoJSON().geometry;
    map.removeLayer(e.layer);
    zeichnenEnde();
    oeffneFormular({ geometry: geom });
  });

  // ================================================================
  // GPS-Punkt
  // ================================================================
  function gpsPunkt() {
    if (!window.isSecureContext) { gpsProblem(t('gpsUnsicher')); return; }
    if (!('geolocation' in navigator)) { gpsProblem(t('gpsNichtDa')); return; }
    toast(t('gpsSuche'), 20000);
    navigator.geolocation.getCurrentPosition(pos => {
      $('#toast').hidden = true;
      const c = pos.coords;
      oeffneFormular({
        geometry: { type: 'Point', coordinates: [round7(c.longitude), round7(c.latitude)] },
        gps_genauigkeit_m: Math.round(c.accuracy)
      });
    }, err => {
      $('#toast').hidden = true;
      gpsProblem(t('gpsFehler', { msg: err.message || err.code }));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
  }
  // Ersatz, wenn GPS nicht geht: Punkt in der Kartenmitte
  function gpsProblem(msg) {
    const v = oeffnePanel(t('gpsTitel'), '<p>' + esc(msg) + '</p>' +
      '<div class="btn-row"><button type="button" class="btn btn--primary" id="gps-mitte">' + esc(t('kartenmitte')) + '</button></div>');
    $('#gps-mitte', v).addEventListener('click', () => {
      const c = map.getCenter();
      oeffneFormular({ geometry: { type: 'Point', coordinates: [round7(c.lng), round7(c.lat)] } });
    });
  }

  // ================================================================
  // Formular: erfassen und bearbeiten
  // ================================================================
  let entwurfLayer = null;

  function zeigeEntwurf(geom, farbe) {
    entfernEntwurf();
    const c = farbe || '#e8590c';
    entwurfLayer = geom.type === 'Point'
      ? L.circleMarker([geom.coordinates[1], geom.coordinates[0]], { interactive: false, radius: 12, color: '#111', weight: 3, fillColor: c, fillOpacity: 1 })
      : L.geoJSON(geom, { interactive: false, style: { color: c, weight: 3, dashArray: '6 4', fillColor: c, fillOpacity: 0.3 } });
    entwurfLayer.addTo(map);
  }
  function entfernEntwurf() {
    if (entwurfLayer) { map.removeLayer(entwurfLayer); entwurfLayer = null; }
  }

  function oeffneFormular(daten) {
    const draft = Object.assign({ typ: null, bau: 3, gruen: 3, wasser: 3, hitze: 3, notiz: '', foto: null }, daten);
    renderFormular(draft);
    zeigeGeometrie(draft.geometry);
  }

  function renderFormular(d) {
    const typen = Object.keys(CFG.typen).map(k =>
      '<button type="button" data-typ="' + k + '" aria-pressed="false">' + esc(typName(k)) + '</button>').join('');
    const seg = feld => '<div class="seg" role="group" aria-label="' + esc(t(feld)) + '">' +
      [1, 2, 3, 4, 5].map(v => '<button type="button" data-feld="' + feld + '" data-wert="' + v + '" aria-pressed="false">' + v + '</button>').join('') +
      '</div>';
    const html =
      '<div class="klasse-preview" id="klasse-preview"></div>' +
      '<p class="muted">' + esc(t('groesse')) + ': ' + esc(groesseText(d)) + '</p>' +
      '<div class="field"><span class="label">' + esc(t('typ')) + '</span><div class="chips" id="typ-chips">' + typen + '</div></div>' +
      '<p class="muted">' + esc(t('skala')) + '</p>' +
      ['bau', 'gruen', 'wasser', 'hitze'].map(f =>
        '<div class="field"><span class="label">' + esc(t(f)) + '</span>' + seg(f) + '</div>').join('') +
      '<div class="field"><label for="notiz">' + esc(t('notiz')) + '</label>' +
      '<textarea id="notiz" maxlength="2000">' + esc(d.notiz) + '</textarea></div>' +
      '<div class="field"><span class="label">' + esc(t('foto')) + '</span><div id="foto-box"></div></div>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn" id="f-abbrechen">' + esc(t('abbrechen')) + '</button>' +
      '<button type="button" class="btn btn--primary" id="f-speichern">' + esc(t('speichern')) + '</button></div>';

    const v = oeffnePanel(d.id ? t('bearbeitenTitel') : t('neueFlaeche'), html, entfernEntwurf);
    ansicht = () => renderFormular(d);

    const update = () => {
      $$('#typ-chips button', v).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.typ === d.typ)));
      $$('.seg button', v).forEach(b => b.setAttribute('aria-pressed', String(d[b.dataset.feld] === Number(b.dataset.wert))));
      $('#klasse-preview', v).innerHTML = d.typ
        ? esc(t('klasse')) + ': ' + badgeKlasse(klasseVon(d))
        : esc(t('typWaehlen'));
      $('#f-speichern', v).disabled = !d.typ;
      zeigeEntwurf(d.geometry, d.typ ? klasseInfo(klasseVon(d)).farbe : null);
    };
    v.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.typ) { d.typ = b.dataset.typ; update(); }
      else if (b.dataset.feld) { d[b.dataset.feld] = Number(b.dataset.wert); update(); }
    });
    $('#notiz', v).addEventListener('input', e => { d.notiz = e.target.value; });
    $('#f-abbrechen', v).addEventListener('click', () => { schliessePanel(); if (d.id) openSteckbrief(d.id); });
    $('#f-speichern', v).addEventListener('click', () => speichern(d));
    renderFotoBox(v, d);
    update();
  }

  function renderFotoBox(root, d) {
    const box = $('#foto-box', root);
    box.innerHTML = (d.foto ? '<img class="foto-preview" src="' + d.foto + '" alt="">' : '') +
      '<div class="btn-row" style="margin-top:0">' +
      '<label class="btn btn-file">' + esc(t('fotoWaehlen')) + '<input type="file" accept="image/*"></label>' +
      (d.foto ? '<button type="button" class="btn btn--danger" id="foto-weg">' + esc(t('fotoEntfernen')) + '</button>' : '') +
      '</div>';
    $('input[type=file]', box).addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try { d.foto = await bildVerkleinern(file); } catch (err) { toast(t('fotoFehler')); }
      renderFotoBox(root, d);
    });
    const weg = $('#foto-weg', box);
    if (weg) weg.addEventListener('click', () => { d.foto = null; renderFotoBox(root, d); });
  }

  // Foto auf max. 1280 px verkleinern, als JPEG-Data-URL speichern
  function bildVerkleinern(file, max = 1280, q = 0.8) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild nicht lesbar')); };
      img.src = url;
    });
  }

  async function speichern(d) {
    if (!d.typ) return;
    const jetzt = new Date().toISOString();
    const rec = {
      id: d.id || neueId(),
      nr: d.nr || naechsteNr(),
      typ: d.typ,
      bau: d.bau, gruen: d.gruen, wasser: d.wasser, hitze: d.hitze,
      notiz: (d.notiz || '').trim(),
      foto: d.foto || null,
      geometry: d.geometry,
      flaeche_m2: Math.round(geomArea(d.geometry) * 10) / 10,
      gps_genauigkeit_m: d.gps_genauigkeit_m != null ? d.gps_genauigkeit_m : null,
      beispiel: !!d.beispiel,
      erstellt: d.erstellt || jetzt,
      geaendert: jetzt
    };
    const i = flaechen.findIndex(f => f.id === rec.id);
    if (i >= 0) flaechen[i] = rec; else flaechen.push(rec);
    await persistieren([rec]);
    openSteckbrief(rec.id);
    toast(t('gespeichert'));
  }

  async function loeschen(id) {
    if (!window.confirm(t('loeschenFrage'))) return;
    flaechen = flaechen.filter(f => f.id !== id);
    try { await dbLoeschen(id); } catch (e) { console.error(e); toast(t('speicherFehler'), 6000); }
    schliessePanel();
    renderFlaechen();
    toast(t('geloescht'));
  }

  // ================================================================
  // Klimacheck (Katalog: data/massnahmen.json)
  // ================================================================
  let katalog = null;   // null = lädt noch, false = Fehler

  async function ladeKatalog() {
    try {
      const res = await fetch('data/massnahmen.json');
      if (!res.ok) throw new Error(res.status);
      katalog = await res.json();
    } catch (e) {
      console.error(e);
      katalog = false;
    }
    if (ansicht) ansicht();
  }

  function risikoErhoeht(f, r, ab) { return (f[r] || 0) >= (ab != null ? ab : katalog.schwelle); }

  // Passt ein Katalogeintrag zu Typ, Klasse und Risiko der Fläche?
  function passt(e, f, k) {
    const typOk = !e.typen || !e.typen.length || e.typen.includes('alle') || e.typen.includes(f.typ);
    const klasseOk = !e.klassen || !e.klassen.length || e.klassen.includes(k);
    const risikoOk = !e.risiko || !e.risiko.length || e.risiko.some(r => risikoErhoeht(f, r, e.ab));
    return typOk && klasseOk && risikoOk;
  }
  // Begründung, warum ein Eintrag erscheint (z. B. "Risiko Wasser 5")
  function grund(e, f) {
    const r = (e.risiko || []).filter(x => risikoErhoeht(f, x, e.ab)).map(x => t(x) + ' ' + f[x]);
    return esc(e.id) + (r.length ? ' · ' + esc(r.join(', ')) : '');
  }

  function klimacheckHTML(f) {
    if (katalog === null) return '';
    if (katalog === false) return '<h3>' + esc(t('klimacheck')) + '</h3><p class="muted">' + esc(t('katalogFehler')) + '</p>';
    const k = klasseVon(f);
    const leer = '<p class="muted">' + esc(t('keineEintraege')) + '</p>';
    let h = '<h3>' + esc(t('klimacheck')) + '</h3>' +
      '<div class="entwurf">' + esc(tx(katalog.status)) + '</div>' +
      '<h4>' + esc(t('richtwerte')) + '</h4><div class="richtwerte">' +
      katalog.richtwerte.map(r => {
        const rel = risikoErhoeht(f, r.risiko);
        return '<div class="richtwert' + (rel ? ' relevant' : '') + '"><strong>' + esc(r.wert) + '</strong>' +
          esc(tx(r.text)) + (rel ? '<br><span class="tag">' + esc(t('relevant')) + '</span>' : '') + '</div>';
      }).join('') +
      '</div><p class="muted">' + esc(tx(katalog.quelle_richtwerte)) + '</p>';

    const anf = katalog.anforderungen.filter(e => passt(e, f, k));
    h += '<h4>' + esc(t('anforderungen')) + '</h4>' + (anf.length ? anf.map(e =>
      '<div class="anforderung">' + esc(tx(e.text)) + '<br><small>' + grund(e, f) + '</small></div>').join('') : leer);

    ['quartier', 'gebaeude', 'freiraum'].forEach(ebene => {
      const m = katalog.massnahmen.filter(e => e.ebene === ebene && passt(e, f, k));
      h += '<h4>' + esc(t('massnahmen')) + ' · ' + esc(t('ebene_' + ebene)) + '</h4>' + (m.length ? m.map(e =>
        '<div class="massnahme"><strong>' + esc(tx(e.titel)) + '</strong>' + esc(tx(e.text)) +
        '<br><small>' + grund(e, f) + '</small></div>').join('') : leer);
    });
    return h;
  }

  // ================================================================
  // Steckbrief
  // ================================================================
  function ratingsHTML(f) {
    return ['bau', 'gruen', 'wasser', 'hitze'].map(k =>
      '<div class="rating"><span>' + esc(t(k)) + '</span>' +
      '<span class="rating-bar' + (k === 'wasser' || k === 'hitze' ? ' risk' : '') + '">' +
      [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= f[k] ? 'on' : '') + '"></i>').join('') +
      '</span><strong>' + f[k] + '</strong></div>').join('');
  }

  function openSteckbrief(id) {
    const f = byId(id);
    if (!f) return;
    const k = klasseVon(f);
    const html =
      '<div class="sb-head">' + badgeKlasse(k) +
      (f.beispiel ? '<span class="badge badge--beispiel">' + esc(t('beispielErsetzen')) + '</span>' : '') + '</div>' +
      '<p class="muted">' + esc(tx(klasseInfo(k).beschreibung)) + '</p>' +
      '<dl class="facts"><dt>' + esc(t('typ')) + '</dt><dd>' + esc(typName(f.typ)) + '</dd>' +
      '<dt>' + esc(t('groesse')) + '</dt><dd>' + esc(groesseText(f)) + '</dd></dl>' +
      '<h3>' + esc(t('bewertung')) + '</h3>' + ratingsHTML(f) +
      (f.notiz ? '<h3>' + esc(t('notiz')) + '</h3><p>' + esc(f.notiz).replace(/\n/g, '<br>') + '</p>' : '') +
      (f.foto ? '<img class="foto-sb" src="' + f.foto + '" alt="' + esc(t('foto')) + '">' : '') +
      klimacheckHTML(f) +
      '<div class="btn-row">' +
      '<button type="button" class="btn" id="sb-karte">' + esc(t('aufKarte')) + '</button>' +
      '<button type="button" class="btn" id="sb-edit">' + esc(t('bearbeiten')) + '</button>' +
      '<button type="button" class="btn btn--danger" id="sb-del">' + esc(t('loeschen')) + '</button></div>';

    const v = oeffnePanel(titel(f), html, () => { auswahlId = null; renderFlaechen(); });
    ansicht = () => openSteckbrief(id);
    auswahlId = id;
    renderFlaechen();
    $('#sb-karte', v).addEventListener('click', () => zeigeGeometrie(f.geometry));
    $('#sb-edit', v).addEventListener('click', () => oeffneFormular(Object.assign({}, f)));
    $('#sb-del', v).addEventListener('click', () => loeschen(id));
  }

  // ================================================================
  // Liste mit Filter und Statistik
  // ================================================================
  let filterKlasse = 'alle';
  const sortiert = () => flaechen.slice().sort((a, b) => a.nr - b.nr);
  const m2Von = f => geomArea(f.geometry);

  function openListe() {
    const klassen = Object.keys(CFG.klassen);
    const stat = {};
    klassen.forEach(k => { stat[k] = { n: 0, m2: 0 }; });
    flaechen.forEach(f => {
      const k = klasseVon(f);
      if (!stat[k]) stat[k] = { n: 0, m2: 0 };
      stat[k].n++;
      stat[k].m2 += m2Von(f);
    });
    const summeN = flaechen.length;
    const summeM2 = flaechen.reduce((s, f) => s + m2Von(f), 0);
    const hatPunkte = flaechen.some(f => f.geometry.type === 'Point');
    const chip = (k, label, n, farbe) => '<button type="button" data-filter="' + k + '" aria-pressed="' + (filterKlasse === k) + '">' +
      (farbe ? '<span class="dot" style="--c:' + farbe + '"></span>' : '') + esc(label) + ' (' + n + ')</button>';

    const liste = sortiert().filter(f => filterKlasse === 'alle' || klasseVon(f) === filterKlasse);

    const html =
      '<table class="stat"><thead><tr><th>' + esc(t('klasse')) + '</th><th class="num">' + esc(t('anzahl')) +
      '</th><th class="num">m²</th></tr></thead><tbody>' +
      klassen.map(k => '<tr><td><span class="dot" style="--c:' + CFG.klassen[k].farbe + '"></span> ' + esc(tx(CFG.klassen[k].name)) +
        '</td><td class="num">' + stat[k].n + '</td><td class="num">' + fmtNum(Math.round(stat[k].m2)) + '</td></tr>').join('') +
      '</tbody><tfoot><tr><td>' + esc(t('summe')) + '</td><td class="num">' + summeN + '</td><td class="num">' +
      fmtNum(Math.round(summeM2)) + '</td></tr></tfoot></table>' +
      (hatPunkte ? '<p class="muted">' + esc(t('punkteHinweis')) + '</p>' : '') +
      '<div class="chips filter">' + chip('alle', t('alle'), summeN) +
      klassen.map(k => chip(k, tx(CFG.klassen[k].name), stat[k].n, CFG.klassen[k].farbe)).join('') + '</div>' +
      (liste.length ? '<ul class="items">' + liste.map(f => {
        const kl = klasseInfo(klasseVon(f));
        return '<li><button type="button" data-id="' + esc(f.id) + '"><span class="dot" style="--c:' + kl.farbe + '"></span>' +
          '<span class="main"><strong>' + esc(titel(f)) + '</strong><span>' + esc(tx(kl.name)) + ' · ' + esc(typName(f.typ)) + '</span></span>' +
          '<span class="area">' + (f.geometry.type === 'Point' ? esc(t('punkt')) : esc(fmtM2(m2Von(f)))) + '</span></button></li>';
      }).join('') + '</ul>' : '<p class="muted">' + esc(t('leer')) + '</p>') +
      '<h3>' + esc(t('daten')) + '</h3>' +
      '<div class="btn-row"><button type="button" class="btn" id="ex-geojson">' + esc(t('exportGeojson')) + '</button>' +
      '<button type="button" class="btn" id="ex-csv">' + esc(t('exportCsv')) + '</button></div>' +
      '<div class="btn-row"><label class="btn btn-file">' + esc(t('importGeojson')) +
      '<input type="file" id="im-geojson" accept=".geojson,.json,application/geo+json,application/json"></label></div>';

    const v = oeffnePanel(t('listeTitel') + ' (' + summeN + ')', html);
    ansicht = openListe;
    v.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.filter) { filterKlasse = b.dataset.filter; openListe(); }
      else if (b.dataset.id) { const f = byId(b.dataset.id); openSteckbrief(f.id); zeigeGeometrie(f.geometry); }
    });
    $('#ex-geojson', v).addEventListener('click', exportGeoJSON);
    $('#ex-csv', v).addEventListener('click', exportCSV);
    $('#im-geojson', v).addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) importGeoJSON(file);
    });
  }

  // ================================================================
  // Export (GeoJSON, CSV mit WKT) und Import (GeoJSON) – für QGIS
  // ================================================================
  function datumStempel() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function signedRing(c) {
    let s = 0;
    for (let i = 0; i < c.length - 1; i++) s += c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1];
    return s / 2;
  }
  // RFC 7946: Außenring gegen den Uhrzeigersinn, Löcher im Uhrzeigersinn; 7 Nachkommastellen (≈ 1 cm)
  function exportGeom(g) {
    const ring = (r, i) => {
      const rr = r.map(p => [round7(p[0]), round7(p[1])]);
      return (signedRing(rr) > 0) === (i === 0) ? rr : rr.reverse();
    };
    if (g.type === 'Point') return { type: 'Point', coordinates: [round7(g.coordinates[0]), round7(g.coordinates[1])] };
    if (g.type === 'Polygon') return { type: 'Polygon', coordinates: g.coordinates.map(ring) };
    return { type: 'MultiPolygon', coordinates: g.coordinates.map(p => p.map(ring)) };
  }
  // Flache Attribute (eine Spalte je Wert) für QGIS
  function exportProps(f) {
    const k = klasseVon(f);
    return {
      id: f.id,
      nr: f.nr,
      typ: f.typ,
      typ_name: typName(f.typ),
      klasse: k,
      klasse_name: tx(klasseInfo(k).name),
      bau: f.bau,
      gruen: f.gruen,
      wasser: f.wasser,
      hitze: f.hitze,
      flaeche_m2: Math.round(m2Von(f) * 10) / 10,
      notiz: f.notiz || '',
      foto: !!f.foto,
      gps_genauigkeit_m: f.gps_genauigkeit_m != null ? f.gps_genauigkeit_m : null,
      beispiel: !!f.beispiel,
      erstellt: f.erstellt || '',
      geaendert: f.geaendert || ''
    };
  }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(t('exportOk', { name: name }));
  }

  function exportGeoJSON() {
    if (!flaechen.length) { toast(t('exportLeer')); return; }
    const fc = {
      type: 'FeatureCollection',
      name: 'klimachancen_flaechen',
      features: sortiert().map(f => ({ type: 'Feature', properties: exportProps(f), geometry: exportGeom(f.geometry) }))
    };
    download('klimachancen_flaechen_' + datumStempel() + '.geojson', JSON.stringify(fc, null, 1), 'application/geo+json');
  }

  function wkt(g) {
    const p = c => c[0] + ' ' + c[1];
    const ring = r => '(' + r.map(p).join(', ') + ')';
    if (g.type === 'Point') return 'POINT (' + p(g.coordinates) + ')';
    if (g.type === 'Polygon') return 'POLYGON (' + g.coordinates.map(ring).join(', ') + ')';
    return 'MULTIPOLYGON (' + g.coordinates.map(pl => '(' + pl.map(ring).join(', ') + ')').join(', ') + ')';
  }
  function csvZelle(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function exportCSV() {
    if (!flaechen.length) { toast(t('exportLeer')); return; }
    const rows = sortiert().map(f => Object.assign(exportProps(f), { wkt: wkt(exportGeom(f.geometry)) }));
    const cols = Object.keys(rows[0]);
    const lines = [cols.join(',')].concat(rows.map(r => cols.map(c => csvZelle(r[c])).join(',')));
    download('klimachancen_flaechen_' + datumStempel() + '.csv', '﻿' + lines.join('\r\n') + '\r\n', 'text/csv;charset=utf-8');
  }

  function typAus(v) {
    if (v == null) return null;
    const s = String(v).trim().toLowerCase();
    if (CFG.typen[s]) return s;
    return Object.keys(CFG.typen).find(k =>
      ['de', 'nl'].some(l => CFG.typen[k][l] && CFG.typen[k][l].toLowerCase() === s)) || null;
  }
  const wert15 = v => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 3; };
  // nur Punkte/Polygone in WGS84 (Längengrad/Breitengrad)
  function geomOk(g) {
    if (!g || !Array.isArray(g.coordinates)) return false;
    let c;
    if (g.type === 'Point') c = g.coordinates;
    else if (g.type === 'Polygon') c = g.coordinates[0] && g.coordinates[0][0];
    else if (g.type === 'MultiPolygon') c = g.coordinates[0] && g.coordinates[0][0] && g.coordinates[0][0][0];
    return !!c && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
  }

  async function importGeoJSON(file) {
    let gj;
    try { gj = JSON.parse(await file.text()); } catch (e) { toast(t('importFehler'), 5000); return; }
    const feats = gj && gj.type === 'FeatureCollection' ? gj.features : (gj && gj.type === 'Feature' ? [gj] : null);
    if (!Array.isArray(feats)) { toast(t('importFehler'), 5000); return; }
    const jetzt = new Date().toISOString();
    const neu = [];
    let skip = 0;
    let nr = naechsteNr();
    feats.forEach(ft => {
      const g = ft && ft.geometry;
      if (!geomOk(g)) { skip++; return; }
      const p = ft.properties || {};
      const id = typeof p.id === 'string' && /^f-/.test(p.id) ? p.id : neueId();
      const alt = byId(id);
      const typ = typAus(p.typ) || typAus(p.typ_name);
      const rec = {
        id: id,
        nr: alt ? alt.nr : nr++,
        typ: typ || 'brache',
        bau: wert15(p.bau), gruen: wert15(p.gruen), wasser: wert15(p.wasser), hitze: wert15(p.hitze),
        notiz: (typ ? '' : '[Import: Typ unbekannt] ') + (p.notiz ? String(p.notiz) : ''),
        foto: alt ? alt.foto : null,
        geometry: { type: g.type, coordinates: g.coordinates },
        flaeche_m2: Math.round(geomArea(g) * 10) / 10,
        gps_genauigkeit_m: Number.isFinite(p.gps_genauigkeit_m) ? p.gps_genauigkeit_m : null,
        beispiel: p.beispiel === true || p.beispiel === 'true',
        erstellt: typeof p.erstellt === 'string' && p.erstellt ? p.erstellt : jetzt,
        geaendert: jetzt
      };
      const i = flaechen.findIndex(f => f.id === id);
      if (i >= 0) flaechen[i] = rec; else flaechen.push(rec);
      neu.push(rec);
    });
    await persistieren(neu);
    renderFlaechen();
    toast(t('importOk', { n: neu.length, skip: skip }), 5000);
    if (neu.length) map.fitBounds(L.geoJSON({ type: 'FeatureCollection', features: neu.map(f => ({ type: 'Feature', properties: {}, geometry: f.geometry })) }).getBounds(), { padding: [30, 30], maxZoom: 19 });
    openListe();
  }

  // ================================================================
  // Info-Seite
  // ================================================================
  function openInfo() {
    const liste = arr => '<ul class="plain">' + arr.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
    const html =
      '<h3>' + esc(t('quellenTitel')) + '</h3>' + liste(I18N[lang].quellen) +
      '<p class="muted">' + esc(t('version', { v: CFG.version })) + '</p>';
    oeffnePanel(t('infoTitel'), html);
    ansicht = openInfo;
  }

  // ================================================================
  // Sprache umschalten
  // ================================================================
  function setLang(l) {
    lang = l;
    storageSet('lang', l);
    applyStaticTexts();
    renderGebiete();
    renderLegende();
    renderFlaechen();
    if (zeichnen) map.pm.setLang(lang);
    if (ansicht) ansicht();
  }

  // ================================================================
  // Start
  // ================================================================
  function init() {
    applyStaticTexts();
    setBasemap(storageGet('basemap') === 'luftbild' ? 'luftbild' : 'osm', true);
    renderLegende();

    $$('.basemap-switch button').forEach(b => b.addEventListener('click', () => setBasemap(b.dataset.basemap)));
    $('#btn-lang').addEventListener('click', () => setLang(lang === 'de' ? 'nl' : 'de'));
    $('#btn-home').addEventListener('click', zoomPlanungsgebiet);
    $('#btn-zeichnen').addEventListener('click', zeichnenStart);
    $('#btn-gps').addEventListener('click', gpsPunkt);
    $('#btn-liste').addEventListener('click', openListe);
    $('#btn-info').addEventListener('click', openInfo);
    $('#btn-undo').addEventListener('click', zeichnenPunktZurueck);
    $('#btn-cancel').addEventListener('click', zeichnenAbbrechen);
    $('#btn-finish').addEventListener('click', zeichnenFertig);
    $('#panel-close').addEventListener('click', schliessePanel);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (zeichnen) zeichnenAbbrechen(); else schliessePanel();
    });

    window.addEventListener('offline', () => toast(t('offline'), 5000));

    // Service Worker: App-Oberfläche offline (nur über HTTPS oder localhost möglich)
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker:', e));
    }

    ladeGebiete();
    ladeFlaechen();
    ladeKatalog();
  }

  init();
})();

/*
 * SenserScan – App-Logik
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

  function setBasemap(name) {
    if (!basemaps[name] || name === basemapAktiv) return;
    if (basemapAktiv) map.removeLayer(basemaps[basemapAktiv]);
    basemaps[name].addTo(map).bringToBack();
    basemapAktiv = name;
    storageSet('basemap', name);
    $$('.basemap-switch button').forEach(b => b.classList.toggle('active', b.dataset.basemap === name));
    if (name === 'luftbild') {
      lbStatus.ok = 0; lbStatus.err = 0; lbStatus.gewarnt = false;
      toast(t('luftbildHinweis'));
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
      // Planungsgebiet: Beschriftung in der Mitte; Analyseraum: am Nordrand
      const pos = istPlan
        ? b.getCenter()
        : L.latLng(b.getNorth() - (b.getNorth() - b.getSouth()) * 0.07, b.getCenter().lng);
      const ha = f.properties.flaeche_ha ? ' · ' + fmtNum(f.properties.flaeche_ha, 2) + ' ha' : '';
      L.marker(pos, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'gebiet-label' + (istPlan ? '' : ' analyse'),
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
  // Sprache umschalten
  // ================================================================
  function setLang(l) {
    lang = l;
    storageSet('lang', l);
    applyStaticTexts();
    renderGebiete();
    renderLegende();
  }

  // ================================================================
  // Start
  // ================================================================
  function init() {
    applyStaticTexts();
    setBasemap(storageGet('basemap') === 'luftbild' ? 'luftbild' : 'osm');
    renderLegende();

    $$('.basemap-switch button').forEach(b => b.addEventListener('click', () => setBasemap(b.dataset.basemap)));
    $('#btn-lang').addEventListener('click', () => setLang(lang === 'de' ? 'nl' : 'de'));
    $('#btn-home').addEventListener('click', zoomPlanungsgebiet);

    window.addEventListener('offline', () => toast(t('offline'), 5000));

    ladeGebiete();
  }

  init();
})();

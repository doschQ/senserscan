/*
 * Vaals Entwurfslabor – Programmlogik
 * Fachliche Werte (Belagsarten, Szenarien, Regler) stehen in config.js.
 * Prototyp, KI-generiert (Claude Code, Claude Opus 5.5, 23.11.2026).
 */
(function () {
  'use strict';

  const CFG = window.ENTWURFSLABOR_CONFIG;
  const BELAEGE = CFG.belaege;
  const BK = Object.keys(BELAEGE);
  const A_GEBIET = CFG.gebiet.flaeche_m2;
  const H_REGEN = CFG.regen.mm / 1000; // m

  // ================================================================
  // Texte (DE/NL)
  // ================================================================
  const TEXTE = {
    de: {
      untertitel: '{gebiet} · {ha} ha · Szenario-Rechner',
      kennzahlen: 'Kennzahlen', regler: 'Regler', vergleich: 'Vergleich der Szenarien',
      bilanz: 'Flächenbilanz', karteTitel: 'Planungsgebiet',
      szenarioName: 'Name des Szenarios', zuruecksetzen: 'Alles zurücksetzen',
      pngExport: 'PNG für Folien', csvExport: 'CSV-Bilanz',
      platzhalter: 'Platzhalter', annahme: 'Annahme – prüfen',
      hinweisPlatzhalter: '<b>Platzhalter:</b> Die Flächenbilanzen sind keine Messwerte. Bestandswerte aus QGIS in config.js eintragen.',
      hinweisAnnahme: '<b>Annahme – prüfen:</b> ψ- und Speicherwerte sind Literatur-Startwerte (KI), nicht geprüft.',
      fuss: 'Prototyp · KI-generiert mit {werkzeug} ({modell}), {datum} · Platzhalter und Annahmen prüfen · Formeln unter „i“',
      thBelag: 'Belagsart', thGrund: 'Grundbilanz m²', thWirksam: 'nach Maßnahmen m²', thAnteil: 'Anteil',
      thPsi: 'ψ', thSpeicherMm: 'Speicher mm', thAbfluss: 'Abfluss m³ ({mm} mm)', thSpeicherM3: 'Speicher m³',
      zeileAue: 'Retentionsvolumen der Aue (Regler)',
      zeileSumme: 'Summe', zeilePsiM: 'ψm',
      zeilePark: 'davon Parkplätze (in Asphalt/Beton)', zeileParkInfo: 'nicht in der Summe · davon entsiegelt: {m2} m²',
      zeileKrone: 'Baumkronen (Überlagerung)', zeileKroneInfo: 'nicht in der Summe · Bestand + neue Bäume',
      summeOk: 'Summe stimmt',
      warnSumme: 'Summe der Flächenbilanz {ist} m², Gebietsfläche {soll} m² – Differenz {diff} m².',
      warnSummeFolge: 'Bitte die Flächenbilanz korrigieren; die Kennzahlen sind so nicht belastbar.',
      warnPark: 'Parkplätze ({p} m²) größer als Asphalt/Beton ({a} m²). Entsiegelt wird höchstens die Asphalt/Beton-Fläche.',
      warnZahl: 'Bitte eine Zahl ≥ 0 eingeben.',
      quelle: 'Quelle', configNeu: 'config.js wurde geändert – Startwerte geladen.',
      tabWarn: 'Summe stimmt nicht'
    },
    nl: {}
  };

  // ================================================================
  // Hilfsfunktionen
  // ================================================================
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tx = o => (o ? (o[state.sprache] || o.de || '') : '');
  function t(key, vars) {
    let s = (TEXTE[state.sprache] && TEXTE[state.sprache][key]) || TEXTE.de[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  const loc = () => (state.sprache === 'nl' ? 'nl-NL' : 'de-DE');
  function runden(n, d) { const f = Math.pow(10, d || 0); return Math.round(n * f) / f; }
  function zahl(n, d) {
    if (!Number.isFinite(n)) return '–';
    d = d || 0;
    return (runden(n, d) + 0).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  // mit Vorzeichen (echtes Minuszeichen)
  function zahlVz(n, d) {
    const r = runden(n, d || 0);
    return (r > 0 ? '+' : r < 0 ? '−' : '±') + zahl(Math.abs(r), d);
  }
  const prozent = (x, d) => zahl(x * 100, d == null ? 1 : d) + ' %';
  // Eingabe lesen: "18.000" und "18000" = 18000; Komma = Dezimaltrenner
  function leseZahl(s) {
    const r = String(s).trim().replace(/[\s .']/g, '').replace(',', '.');
    if (r === '') return 0;
    const n = Number(r);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }
  const summe = (keys, obj) => keys.reduce((s, k) => s + (obj[k] || 0), 0);

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('zeigen');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('zeigen'), 3200);
  }

  // ================================================================
  // Zustand (wird im Browser gemerkt; Änderung an config.js setzt zurück)
  // ================================================================
  const SPEICHER = 'vaals-entwurfslabor-v1';
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const FP = hash(JSON.stringify(CFG.szenarien));
  const REFERENZ = Math.max(0, CFG.szenarien.findIndex(s => s.referenz));

  function startSzenarien() {
    const bestand = CFG.szenarien[REFERENZ];
    return CFG.szenarien.map(s => {
      const basis = s.flaechen === 'bestand' ? bestand : s;
      const flaechen = {};
      BK.forEach(k => { flaechen[k] = +((basis.flaechen && basis.flaechen[k]) || 0); });
      const r = Object.assign({}, s.regler);
      return {
        name: null,
        flaechen: flaechen,
        parkplaetze_m2: +(s.parkplaetze_m2 != null ? s.parkplaetze_m2 : (basis.parkplaetze_m2 || 0)),
        baumkronen_m2: +(s.baumkronen_m2 != null ? s.baumkronen_m2 : (basis.baumkronen_m2 || 0)),
        regler: r
      };
    });
  }
  const istZahl = x => typeof x === 'number' && Number.isFinite(x);
  function mischen(start, g) {
    if (!g || typeof g !== 'object') return start;
    const m = JSON.parse(JSON.stringify(start));
    if (typeof g.name === 'string' && g.name.trim()) m.name = g.name.slice(0, 40);
    if (g.flaechen) BK.forEach(k => { if (istZahl(g.flaechen[k]) && g.flaechen[k] >= 0) m.flaechen[k] = g.flaechen[k]; });
    ['parkplaetze_m2', 'baumkronen_m2'].forEach(k => { if (istZahl(g[k]) && g[k] >= 0) m[k] = g[k]; });
    if (g.regler) Object.keys(m.regler).forEach(k => {
      if (istZahl(g.regler[k]) || (k === 'dachGruenAnteil' && g.regler[k] === null)) m.regler[k] = g.regler[k];
    });
    return m;
  }
  function laden() {
    let g = null;
    try { g = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); } catch (e) { g = null; }
    const s = { fp: FP, aktiv: 0, sprache: 'de', ansicht: 'wasser', szenarien: startSzenarien(), import: null, configNeu: false };
    if (g && typeof g === 'object') {
      if (g.sprache === 'nl') s.sprache = 'nl';
      if (typeof g.ansicht === 'string') s.ansicht = g.ansicht;
      if (g.import && Array.isArray(g.import.flaechen)) s.import = g.import;
      if (g.fp === FP && Array.isArray(g.szenarien) && g.szenarien.length === s.szenarien.length) {
        s.szenarien = s.szenarien.map((st, i) => mischen(st, g.szenarien[i]));
        s.aktiv = Math.min(Math.max(0, g.aktiv | 0), s.szenarien.length - 1);
      } else if (g.fp && g.fp !== FP) {
        s.configNeu = true;
      }
    }
    return s;
  }
  const state = laden();
  let speicherTimer = null;
  function speichernSpaeter() {
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(() => {
      try {
        localStorage.setItem(SPEICHER, JSON.stringify({
          fp: state.fp, aktiv: state.aktiv, sprache: state.sprache, ansicht: state.ansicht,
          szenarien: state.szenarien, import: state.import
        }));
      } catch (e) { /* privater Modus o. Ä. – dann eben ohne Speichern */ }
    }, 300);
  }

  const szName = i => state.szenarien[i].name || tx(CFG.szenarien[i].name);
  const aktivSz = () => state.szenarien[state.aktiv];
  const aktivCfg = () => CFG.szenarien[state.aktiv];
  const istReferenz = i => i === REFERENZ;

  // ================================================================
  // Rechenkern
  // ================================================================
  // Die Regler buchen Flächen innerhalb der Bilanz um; die Summe bleibt gleich.
  function rechne(sz) {
    const r = sz.regler;
    const M = CFG.massnahmen;
    const grund = sz.flaechen;
    const f = Object.assign({}, grund);
    const summeGrund = summe(BK, grund);

    // Dachbegrünung: Ziel-Anteil begrünter Dächer, nie unter dem Anteil der Grundbilanz
    const dachK = BK.filter(k => BELAEGE[k].dach);
    const gruenK = dachK.filter(k => BELAEGE[k].gruendach);
    const konvK = dachK.filter(k => !BELAEGE[k].gruendach);
    const dach = summe(dachK, grund);
    const gruen0 = summe(gruenK, grund);
    const dachAnteil0 = dach > 0 ? gruen0 / dach : 0;
    const dachAnteil = r.dachGruenAnteil == null ? dachAnteil0 : Math.max(dachAnteil0, r.dachGruenAnteil / 100);
    let offen = Math.max(0, dachAnteil * dach - gruen0);
    let dachNeuGruen = 0;
    konvK.forEach(k => {
      const x = Math.min(f[k], offen);
      f[k] -= x; f[M.dachbegruenungZiel] += x; offen -= x; dachNeuGruen += x;
    });

    // Entsiegelung der Parkplätze
    const parkMoeglich = Math.min(sz.parkplaetze_m2, grund[M.entsiegelungVon]);
    const entsiegelt = parkMoeglich * (r.parkEntsiegelt || 0) / 100;
    f[M.entsiegelungVon] -= entsiegelt;
    f[M.entsiegelungZiel] += entsiegelt;

    // Wasserbilanz bei Bemessungsregen
    const summeWirksam = summe(BK, f);
    const abflussJe = {}, speicherJe = {};
    BK.forEach(k => {
      abflussJe[k] = f[k] * BELAEGE[k].psi * H_REGEN;
      speicherJe[k] = f[k] * BELAEGE[k].speicher_mm / 1000;
    });
    const niederschlag = A_GEBIET * H_REGEN;
    const abfluss = summe(BK, abflussJe);
    const aue = r.aueVolumen || 0;
    const speicher = summe(BK, speicherJe) + aue;
    const deltaV = speicher - abfluss;
    const psiM = summeWirksam > 0 ? BK.reduce((s, k) => s + f[k] * BELAEGE[k].psi, 0) / summeWirksam : 0;
    const versiegelung = summeWirksam > 0 ? BK.reduce((s, k) => s + f[k] * BELAEGE[k].versiegelung, 0) / summeWirksam : 0;

    // Bäume
    const kroneNeu = (r.baeume || 0) * (r.kronenflaeche || 0);
    const krone = sz.baumkronen_m2 + kroneNeu;

    // Bauliche Dichte
    const bgf = r.neubauBgf || 0;
    const we = r.bgfJeWe > 0 ? Math.floor(bgf * (r.wohnenAnteil || 0) / 100 / r.bgfJeWe) : 0;

    return {
      flaechen: f, summeGrund: summeGrund, summeWirksam: summeWirksam,
      summeOk: Math.abs(summeGrund - A_GEBIET) <= CFG.summenToleranz_m2,
      parkZuGross: sz.parkplaetze_m2 > grund[M.entsiegelungVon] + 0.5,
      dach: dach, dachAnteil0: dachAnteil0, dachAnteil: dach > 0 ? dachAnteil : 0, dachNeuGruen: dachNeuGruen,
      entsiegelt: entsiegelt, abflussJe: abflussJe, speicherJe: speicherJe,
      niederschlag: niederschlag, abfluss: abfluss, aue: aue, speicher: speicher, deltaV: deltaV,
      psiM: psiM, versiegelung: versiegelung,
      kroneNeu: kroneNeu, krone: krone, kroneAnteil: krone / A_GEBIET,
      bgf: bgf, gfz: bgf / A_GEBIET, we: we
    };
  }

  // ================================================================
  // Ablauf: Aufbau (Struktur, Sprache, Szenario) und Aktualisierung (Zahlen)
  // ================================================================
  const AUFBAU = [];
  const UPDATE = [];
  let erg = [];
  function aktualisieren() {
    erg = state.szenarien.map(rechne);
    UPDATE.forEach(fn => fn());
    speichernSpaeter();
  }
  function neuAufbauen() {
    AUFBAU.forEach(fn => fn());
    aktualisieren();
  }

  // ================================================================
  // Kopf, Szenario-Umschalter, Hinweisband, Fuß
  // ================================================================
  AUFBAU.push(function kopf() {
    document.documentElement.lang = state.sprache;
    $('#untertitel').textContent = t('untertitel', { gebiet: tx(CFG.gebiet.name), ha: zahl(A_GEBIET / 10000, 2) });
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    const teile = [];
    if (CFG.szenarien.some(s => s.platzhalter)) teile.push(t('hinweisPlatzhalter'));
    if (BK.some(k => !BELAEGE[k].geprueft)) teile.push(t('hinweisAnnahme'));
    $('#hinweis').innerHTML = teile.join(' ');
    $('#fuss').textContent = t('fuss', CFG.info);
  });

  const nav = $('#szenarien');
  nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    state.aktiv = +b.dataset.i;
    neuAufbauen();
  });
  UPDATE.push(function tabs() {
    nav.innerHTML = state.szenarien.map((s, i) =>
      '<button type="button" role="tab" data-i="' + i + '" aria-selected="' + (i === state.aktiv) + '"' +
      (erg[i].summeOk ? '' : ' title="' + esc(t('tabWarn')) + '"') + '>' +
      (erg[i].summeOk ? '' : '<span class="warn">⚠ </span>') + esc(szName(i)) + '</button>').join('');
  });

  function warnungenHtml(i) {
    const e = erg[i], sz = state.szenarien[i];
    let h = '';
    if (!e.summeOk) {
      h += '<div class="warnung"><strong>⚠ ' + esc(t('warnSumme', {
        ist: zahl(e.summeGrund), soll: zahl(A_GEBIET), diff: zahlVz(e.summeGrund - A_GEBIET)
      })) + '</strong>' + esc(t('warnSummeFolge')) + '</div>';
    }
    if (e.parkZuGross) {
      h += '<div class="warnung">⚠ ' + esc(t('warnPark', {
        p: zahl(sz.parkplaetze_m2), a: zahl(sz.flaechen[CFG.massnahmen.entsiegelungVon])
      })) + '</div>';
    }
    return h;
  }

  // ================================================================
  // Flächenbilanz
  // ================================================================
  const tabelle = $('#bilanz');
  AUFBAU.push(function bilanzAufbau() {
    const sz = aktivSz(), c = aktivCfg();
    const ph = c.platzhalter ? ' class="platzhalter"' : '';
    const phBadge = c.platzhalter ? ' <span class="badge platzhalter">' + esc(t('platzhalter')) + '</span>' : '';
    const anBadge = BK.some(k => !BELAEGE[k].geprueft) ? ' <span class="badge annahme">' + esc(t('annahme')) + '</span>' : '';
    const feld = (name, wert) => '<input type="text" inputmode="decimal" autocomplete="off"' + ph +
      ' data-feld="' + name + '" value="' + esc(zahl(wert)) + '">';
    let h = '<thead><tr><th>' + esc(t('thBelag')) + '</th><th>' + esc(t('thGrund')) + phBadge + '</th><th>' +
      esc(t('thWirksam')) + '</th><th>' + esc(t('thAnteil')) + '</th><th>' + esc(t('thPsi')) + anBadge + '</th><th>' +
      esc(t('thSpeicherMm')) + '</th><th>' + esc(t('thAbfluss', { mm: CFG.regen.mm })) + '</th><th>' + esc(t('thSpeicherM3')) + '</th></tr></thead><tbody>';
    BK.forEach(k => {
      const b = BELAEGE[k], an = b.geprueft ? '' : ' class="annahme"';
      h += '<tr><td><span class="swatch" style="background:' + esc(b.farbe) + '"></span>' + esc(tx(b.name)) + '</td>' +
        '<td>' + feld('f:' + k, sz.flaechen[k]) + '</td>' +
        '<td data-z="w:' + k + '"></td><td data-z="a:' + k + '"></td>' +
        '<td' + an + ' title="' + esc(b.psiQuelle) + '">' + zahl(b.psi, 2) + '</td>' +
        '<td' + an + ' title="' + esc(b.speicherQuelle) + '">' + zahl(b.speicher_mm) + '</td>' +
        '<td data-z="q:' + k + '"></td><td data-z="s:' + k + '"></td></tr>';
    });
    h += '</tbody><tfoot>' +
      '<tr class="extra"><th>' + esc(t('zeileAue')) + '</th><td></td><td></td><td></td><td></td><td></td><td></td><td data-z="aue"></td></tr>' +
      '<tr class="summe"><th>' + esc(t('zeileSumme')) + '</th><td class="summe-grund" data-z="summeGrund"></td><td data-z="summeWirksam"></td>' +
      '<td data-z="summeAnteil"></td><td data-z="psiM"></td><td></td><td data-z="summeQ"></td><td data-z="summeS"></td></tr>' +
      '<tr class="extra"><th>' + esc(t('zeilePark')) + '</th><td>' + feld('parkplaetze_m2', sz.parkplaetze_m2) + '</td>' +
      '<td data-z="parkRest"></td><td colspan="5" style="text-align:left" data-z="parkInfo"></td></tr>' +
      '<tr class="extra"><th>' + esc(t('zeileKrone')) + '</th><td>' + feld('baumkronen_m2', sz.baumkronen_m2) + '</td>' +
      '<td data-z="krone"></td><td data-z="kroneAnteil"></td><td colspan="4" style="text-align:left">' + esc(t('zeileKroneInfo')) + '</td></tr>' +
      '</tfoot>';
    tabelle.innerHTML = h;
    $('#bilanz-unter').textContent = szName(state.aktiv);
    $('#bilanz-quelle').textContent = t('quelle') + ': ' + (c.quelle || '');
  });

  UPDATE.push(function bilanzUpdate() {
    const e = erg[state.aktiv], sz = aktivSz();
    const setz = (z, text, geaendert) => {
      const el = tabelle.querySelector('[data-z="' + z + '"]');
      if (!el) return;
      el.textContent = text;
      if (geaendert != null) el.classList.toggle('geaendert', geaendert);
    };
    BK.forEach(k => {
      setz('w:' + k, zahl(e.flaechen[k]), Math.abs(e.flaechen[k] - sz.flaechen[k]) >= 0.5);
      setz('a:' + k, e.summeWirksam > 0 ? prozent(e.flaechen[k] / e.summeWirksam) : '–');
      setz('q:' + k, zahl(e.abflussJe[k]));
      setz('s:' + k, zahl(e.speicherJe[k]));
    });
    setz('aue', zahl(e.aue));
    setz('summeGrund', (e.summeOk ? '✓ ' : '⚠ ') + zahl(e.summeGrund));
    tabelle.querySelector('tr.summe').classList.toggle('falsch', !e.summeOk);
    setz('summeWirksam', zahl(e.summeWirksam));
    setz('summeAnteil', '100 %');
    setz('psiM', zahl(e.psiM, 2));
    setz('summeQ', zahl(e.abfluss));
    setz('summeS', zahl(e.speicher));
    setz('parkRest', zahl(sz.parkplaetze_m2 - e.entsiegelt));
    setz('parkInfo', t('zeileParkInfo', { m2: zahl(e.entsiegelt) }));
    setz('krone', zahl(e.krone), e.kroneNeu > 0);
    setz('kroneAnteil', prozent(e.kroneAnteil));
    $('#bilanz-warnung').innerHTML = warnungenHtml(state.aktiv);
  });

  tabelle.addEventListener('input', ev => {
    const el = ev.target.closest('input[data-feld]');
    if (!el) return;
    const n = leseZahl(el.value);
    el.setCustomValidity(Number.isNaN(n) ? t('warnZahl') : '');
    el.style.borderColor = Number.isNaN(n) ? 'var(--rot)' : '';
    if (Number.isNaN(n)) return;
    const sz = aktivSz(), feld = el.dataset.feld;
    if (feld.startsWith('f:')) sz.flaechen[feld.slice(2)] = n; else sz[feld] = n;
    aktualisieren();
  });
  tabelle.addEventListener('change', ev => {
    const el = ev.target.closest('input[data-feld]');
    if (!el) return;
    const n = leseZahl(el.value);
    if (!Number.isNaN(n)) el.value = zahl(n, n % 1 ? 1 : 0);
  });

  // ================================================================
  // Start
  // ================================================================
  neuAufbauen();
  if (state.configNeu) toast(t('configNeu'));
})();

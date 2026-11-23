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
      szenarioName: 'Name des Szenarios',
      pngExport: 'PNG für Folien', csvExport: 'CSV-Bilanz',
      platzhalter: 'Platzhalter', annahme: 'Annahme – prüfen',
      hinweisPlatzhalter: '<b>Platzhalter:</b> Die Flächenbilanzen sind keine Messwerte. Bestandswerte aus QGIS in config.js eintragen.',
      hinweisAnnahme: '<b>Annahme – prüfen:</b> ψ- und Speicherwerte sind Literatur-Startwerte (KI), nicht geprüft.',
      fuss: 'Prototyp · KI-generiert mit {werkzeug} ({modell}), {datum} · Platzhalter und Annahmen prüfen · Formeln unter „i“',
      thBelag: 'Belagsart', thGrund: 'Grundbilanz m²', thWirksam: 'nach Maßnahmen m²', thAnteil: 'Anteil',
      thPsi: 'ψ', thSpeicherMm: 'Speicher mm', thAbfluss: 'Abfluss m³ ({mm} mm)', thSpeicherM3: 'Speicher m³',
      zeileAue: 'Retentionsvolumen der Aue (Regler)',
      zeileSumme: 'Summe',
      zeilePark: 'davon Parkplätze (in Asphalt/Beton)', zeileParkInfo: 'nicht in der Summe · davon entsiegelt: {m2} m²',
      zeileKrone: 'Baumkronen (Überlagerung)', zeileKroneInfo: 'nicht in der Summe · Bestand + neue Bäume',
      summeOk: 'Summe stimmt',
      warnSumme: 'Summe der Flächenbilanz {ist} m², Gebietsfläche {soll} m² – Differenz {diff} m².',
      warnSummeFolge: 'Bitte die Flächenbilanz korrigieren; die Kennzahlen sind so nicht belastbar.',
      warnPark: 'Parkplätze ({p} m²) größer als Asphalt/Beton ({a} m²). Entsiegelt wird höchstens die Asphalt/Beton-Fläche.',
      warnZahl: 'Bitte eine Zahl ≥ 0 eingeben.',
      quelle: 'Quelle', configNeu: 'config.js wurde geändert – Startwerte geladen.',
      tabWarn: 'Summe stimmt nicht',
      // Regler
      rDach: 'Anteil begrünter Dachflächen', rPark: 'Anteil entsiegelter Parkplätze', rBaeume: 'Neue Bäume',
      rKrone: 'Kronenfläche je Baum', rAue: 'Retentionsvolumen der Aue', rBgf: 'Neubau-BGF',
      rWohnen: 'Anteil Wohnen', rBgfWe: 'BGF je Wohneinheit',
      hDach: 'Flächenbilanz: {a0} von {dach} m² Dach begrünt · neu begrünt: {neu} m²',
      hDachLeer: 'Keine Dachflächen in der Flächenbilanz.',
      hPark: '{ent} m² von {p} m² Parkplätzen werden wasserdurchlässig',
      hBaeume: 'neue Baumkrone: {n} × {k} m² = {m2} m²',
      hAue: 'geht direkt in den Speicher',
      hBgf: 'GFZ {gfz}', hWohnen: '{wbgf} m² BGF Wohnen', hBgfWe: '{we} Wohneinheiten',
      gesperrt: 'Der Bestand ist die Referenz: Regler gesperrt. Bestandswerte in der Flächenbilanz bzw. in config.js ändern.',
      reglerFuss: 'Startwerte der Regler in den Varianten: Annahme – anpassen. Regler und Flächenbilanz sind nicht gekoppelt: Die Neubau-BGF ändert keine Flächen; neue Dächer gehören in die Flächenbilanz der Variante.',
      zuruecksetzen: 'Eingaben zurücksetzen', resetFrage: 'Alle Eingaben auf die Werte aus config.js zurücksetzen?',
      resetOk: 'Eingaben zurückgesetzt.',
      // Kennzahlen
      kDeltaV: 'Retentionsbilanz ΔV (Speicher − Abfluss)', kNiederschlag: 'Niederschlag {mm} mm in {h} h',
      kAbfluss: 'Abfluss Σ A·ψ·{m} m', kSpeicher: 'Speicher', kVersiegelung: 'Versiegelungsgrad',
      kPsiM: 'mittlerer Abflussbeiwert ψm', kKrone: 'Baumkronenanteil', kBgf: 'BGF (Neubau)', kGfz: 'GFZ', kWe: 'Wohneinheiten',
      ziel: 'Ziel {op} {wert}', ggBestand: '{diff} ggü. Bestand', pp: 'Pp.',
      aZiel: '✓ Ziel erreicht', aZielNicht: '✗ Ziel verfehlt', aBesser: '✓ besser', aSchlechter: '✗ schlechter',
      aBesserZiel: 'besser, Ziel verfehlt', aGleich: '= gleich', aReferenz: 'Referenz',
      ampelLegende: 'Ampel: grün = Ziel erreicht bzw. besser als Bestand · gelb = besser als Bestand, aber Ziel verfehlt, oder gleich · rot = schlechter als Bestand. Ohne Ampel: Niederschlag, BGF, GFZ, Wohneinheiten.',
      warnRefSumme: 'Die Flächenbilanz des Bestands stimmt nicht – der Vergleich mit dem Bestand ist unsicher.',
      kurzDeltaV: 'ΔV', kurzVers: 'Versiegelt', kurzPsi: 'ψm', kurzKrone: 'Krone',
      // Diagramm und Export
      aWasser: 'Wasser', aHitze: 'Hitze', aFlaechen: 'Flächen',
      tWasser: 'Wasserbilanz bei {mm} mm in {h} h', tHitze: 'Versiegelung, Abfluss und Baumkronen', tFlaechen: 'Flächenbilanz nach Maßnahmen',
      dNiederschlag: 'Niederschlag', dAbfluss: 'Abfluss', dSpeicher: 'Speicher', dDeltaV: 'ΔV = Speicher − Abfluss',
      dVersiegelung: 'Versiegelungsgrad', dPsi: 'mittl. Abflussbeiwert ψm × 100', dKrone: 'Baumkronenanteil',
      achseM3: 'm³', achseProzent: '%', achseFlaeche: 'Anteil an der Flächenbilanz (%)',
      zielKrone: 'Ziel Baumkronen {wert} %',
      exportUnter: '{gebiet} · {flaeche} m² · Stand {datum}',
      exportPlatzhalter: 'Enthält PLATZHALTER (Flächenbilanz) und ungeprüfte Annahmen (ψ, Speicher) – keine Messwerte.',
      exportAnnahme: 'Enthält ungeprüfte Annahmen (ψ, Speicher).',
      keinChart: 'Diagramm nicht verfügbar: Chart.js konnte nicht geladen werden (Internetverbindung?).',
      gespeichert: 'Gespeichert: {name}',
      csvTitel: 'Vaals Entwurfslabor – Flächenbilanz', csvStand: 'Stand', csvGebiet: 'Gebietsfläche m²',
      csvRegen: 'Bemessungsregen', csvRegenWert: '{mm} mm in {h} h', csvHinweis: 'Hinweis',
      csvSchluessel: 'Schlüssel', csvVers: 'Versiegelungsfaktor', csvStatus: 'Status Kennwerte', csvGeprueft: 'geprüft',
      csvStatusSz: 'Status Flächenbilanz', csvWerte: 'Werte', csvEinheit: 'Einheit', csvKennzahl: 'Kennzahl',
      csvQuellen: 'Quellen der Kennwerte', csvQuellePsi: 'Quelle ψ', csvQuelleSp: 'Quelle Speicher', csvQuelleVers: 'Quelle Versiegelung',
      // Karte und Import
      karteFehlt: 'Karte nicht verfügbar: Leaflet konnte nicht geladen werden (Internetverbindung?).',
      impLaden: 'SenserScan-Datei laden (.geojson)', impWeg: 'Import entfernen',
      impInfo: 'Potenzialflächen aus dem GeoJSON-Export von SenserScan. Gezählt werden Flächen, deren Mittelpunkt im Planungsgebiet liegt.',
      impStatus: '{datei}: {n} Flächen im Planungsgebiet',
      impAussen: 'außerhalb: {n}', impPunkte: 'Punkte ohne Fläche (übersprungen): {n}', impUngueltig: 'nicht lesbar (z. B. anderes Koordinatensystem): {n}',
      impTyp: 'Typ', impAnzahl: 'Anzahl',
      impParkAktiv: 'Parkplätze {m2} m² → „{name}“', impParkAlle: '→ alle Szenarien',
      impParkKeine: 'Keine Parkplätze im Planungsgebiet.',
      impParkOk: 'Parkplatzfläche {m2} m² übernommen: {namen}',
      impFehler: 'Datei nicht lesbar: kein GeoJSON.', impOk: '{n} Potenzialflächen im Planungsgebiet geladen.',
      hDachSenser: 'SenserScan: Flachdächer im Gebiet {m2} m²', nr: 'Nr.',
      // Info-Seite
      sprache: 'Sprache: Niederländisch', info: 'Info, Formeln, Annahmen', schliessen: 'Schließen',
      infoTitel: 'Über das Vaals Entwurfslabor',
      infoZweck: 'Szenario-Rechner zur Masterthesis „Klimaresilient und wassersensibel: Vaals am Senserbach“ (Stadtplanung, RWTH Aachen). Er zeigt, wie ein städtebaulich-freiraumplanerischer Entwurf für das Planungsgebiet Selzerbeek die Wasser- und Hitzeresilienz gegenüber dem Bestand verändert.',
      infoKiTitel: 'KI-Kennzeichnung',
      infoKi: 'Prototyp, erstellt mit <b>{werkzeug}</b>, Modell <b>{modell}</b>, am <b>{datum}</b>.',
      infoKiListe: '<ul><li><b>KI-generiert:</b> gesamter Programmcode; Startwerte für ψ, Speichervermögen und Versiegelungsfaktoren (aus dem Gedächtnis gesetzt, Normtexte nicht eingesehen); Platzhalter-Flächenbilanzen; Startwerte der Regler; niederländische Übersetzung (ungeprüft).</li><li><b>Nicht KI-generiert:</b> Gebietsgrenze und Gebietsfläche, Formel der Retentionsbilanz, Richtwerte 70 mm in 1 h und 30 % Baumkronenanteil (Vorgaben); Kartengrundlage: PDOK / © Kadaster (NL) und © GeoBasis-DE / BKG, basemap.de (DE).</li></ul>',
      infoFormelnTitel: 'Formeln',
      infoFormeln: '<div class="formel">A = {a} m² (Gebietsfläche) · h = {h} m ({mm} mm in {std} h)</div>' +
        '<div class="formel">Niederschlag N = A · h = {n} m³</div>' +
        '<div class="formel">Abfluss Q = Σ (Aᵢ · ψᵢ · h)</div>' +
        '<div class="formel">Speicher S = Σ (Aᵢ · sᵢ / 1000) + V<sub>Aue</sub></div>' +
        '<div class="formel">Retentionsbilanz ΔV = S − Q &nbsp;(ΔV ≥ 0: der Speicher nimmt den Abfluss auf)</div>' +
        '<div class="formel">ψm = Σ (Aᵢ · ψᵢ) / Σ Aᵢ</div>' +
        '<div class="formel">Versiegelungsgrad = Σ (Aᵢ · vᵢ) / Σ Aᵢ</div>' +
        '<div class="formel">Baumkronenanteil = (Baumkronen Bestand + n · k) / A &nbsp;(Ziel {ziel} %)</div>' +
        '<div class="formel">GFZ = BGF / A · Wohneinheiten = ⌊ BGF · Anteil Wohnen / BGF je WE ⌋</div>' +
        '<p>Aᵢ: Fläche der Belagsart i nach Maßnahmen (m²) · ψᵢ: Abflussbeiwert · sᵢ: Speichervermögen (mm) · vᵢ: Versiegelungsfaktor · V<sub>Aue</sub>: Retentionsvolumen der Aue (m³) · n: neue Bäume · k: Kronenfläche je Baum (m²). Σ Aᵢ ist gleich A, wenn die Summenprüfung stimmt. BGF und GFZ beziehen sich nur auf den Neubau.</p>',
      infoReglerTitel: 'Wie die Regler wirken',
      infoRegler: '<ul><li><b>Anteil begrünter Dachflächen:</b> Ziel-Anteil begrünter Dächer an allen Dächern. Er liegt nie unter dem Anteil der Flächenbilanz. Zusätzlich begrünte Fläche wechselt von „Dach konventionell“ zu „{ziel}“.</li>' +
        '<li><b>Anteil entsiegelter Parkplätze:</b> Dieser Anteil der Zeile „davon Parkplätze“ wechselt von „{von}“ zu „{nach}“.</li>' +
        '<li><b>Neue Bäume × Kronenfläche:</b> wird zu den Baumkronen addiert (Überlagerung, nicht in der Flächensumme, nicht in der Wasserbilanz).</li>' +
        '<li><b>Retentionsvolumen der Aue:</b> wird direkt zum Speicher addiert.</li>' +
        '<li><b>Neubau-BGF, Anteil Wohnen, BGF je WE:</b> ergeben GFZ und Wohneinheiten. Sie ändern die Flächenbilanz nicht.</li></ul>' +
        '<p>Die Regler buchen nur um; die Summe der Flächenbilanz bleibt gleich. Im Bestand sind sie gesperrt.</p>',
      infoAnnahmenTitel: 'Kennwerte je Belagsart (config.js)',
      infoAnnahmen: 'ψ enthält bereits den Rückhalt der Fläche selbst. Speichervermögen haben deshalb nur Flächen mit zusätzlichem Rückhalteraum (Mulde, Retentionsdach), sonst würde doppelt gezählt.',
      thStatus: 'Status', geprueft: 'geprüft',
      infoGrenzenTitel: 'Grenzen des Modells',
      infoGrenzen: '<ul><li>Eine Bilanz für das ganze Gebiet: keine Fließwege, kein Gefälle, kein Kanalnetz, keine zeitliche Verteilung des Regens.</li>' +
        '<li>Die ψ-Werte sind mittlere Abflussbeiwerte. Bei einem Starkregen von 70 mm in 1 h kann der Abfluss höher liegen, vor allem auf Rasen und in Hanglage.</li>' +
        '<li>Regler und Flächenbilanz sind nicht gekoppelt: Neue Gebäude müssen in der Flächenbilanz der Variante stehen.</li>' +
        '<li>Baumkronen gehen nicht in die Wasserbilanz ein. Bestands-BGF ist nicht enthalten.</li></ul>',
      infoTechnikTitel: 'Daten und Technik',
      infoTechnik: '<p>Alle fachlichen Werte stehen in <code>config.js</code>. Eingaben in der App merkt sich nur dieser Browser; ändert sich <code>config.js</code> unter „szenarien“, startet die App wieder mit den Werten der Datei. Bibliotheken: Chart.js 4.5.1, Leaflet 1.9.4 (jsDelivr, feste Versionen). Karte: BRT-Achtergrondkaart (PDOK / © Kadaster) für die Niederlande und basemap.de (© GeoBasis-DE / BKG, CC BY 4.0) für Deutschland.</p>'
    },
    nl: {
      untertitel: '{gebiet} · {ha} ha · scenariorekentool',
      kennzahlen: 'Kengetallen', regler: 'Schuifregelaars', vergleich: 'Vergelijking van de scenario’s',
      bilanz: 'Oppervlaktebalans', karteTitel: 'Plangebied',
      szenarioName: 'Naam van het scenario',
      pngExport: 'PNG voor dia’s', csvExport: 'CSV-balans',
      platzhalter: 'Plaatshouder', annahme: 'Aanname – controleren',
      hinweisPlatzhalter: '<b>Plaatshouder:</b> de oppervlaktebalansen zijn geen meetwaarden. Waarden van de bestaande situatie uit QGIS in config.js invullen.',
      hinweisAnnahme: '<b>Aanname – controleren:</b> ψ- en bergingswaarden zijn startwaarden uit de literatuur (AI), niet gecontroleerd.',
      fuss: 'Prototype · AI-gegenereerd met {werkzeug} ({modell}), {datum} · plaatshouders en aannames controleren · formules onder „i”',
      thBelag: 'Oppervlaktetype', thGrund: 'Basisbalans m²', thWirksam: 'na maatregelen m²', thAnteil: 'Aandeel',
      thPsi: 'ψ', thSpeicherMm: 'Berging mm', thAbfluss: 'Afvoer m³ ({mm} mm)', thSpeicherM3: 'Berging m³',
      zeileAue: 'Retentievolume beekdal (schuifregelaar)',
      zeileSumme: 'Totaal',
      zeilePark: 'waarvan parkeerplaatsen (in asfalt/beton)', zeileParkInfo: 'niet in het totaal · waarvan onthard: {m2} m²',
      zeileKrone: 'Boomkronen (overlay)', zeileKroneInfo: 'niet in het totaal · bestaand + nieuwe bomen',
      summeOk: 'Totaal klopt',
      warnSumme: 'Totaal van de oppervlaktebalans {ist} m², oppervlakte plangebied {soll} m² – verschil {diff} m².',
      warnSummeFolge: 'Corrigeer de oppervlaktebalans; zo zijn de kengetallen niet betrouwbaar.',
      warnPark: 'Parkeerplaatsen ({p} m²) groter dan asfalt/beton ({a} m²). Er wordt hooguit het asfalt/beton-oppervlak onthard.',
      warnZahl: 'Voer een getal ≥ 0 in.',
      quelle: 'Bron', configNeu: 'config.js is gewijzigd – startwaarden geladen.',
      tabWarn: 'Totaal klopt niet',
      rDach: 'Aandeel groene daken', rPark: 'Aandeel onthard parkeren', rBaeume: 'Nieuwe bomen',
      rKrone: 'Kroonoppervlak per boom', rAue: 'Retentievolume beekdal', rBgf: 'Nieuwbouw-BVO',
      rWohnen: 'Aandeel wonen', rBgfWe: 'BVO per woning',
      hDach: 'Oppervlaktebalans: {a0} van {dach} m² dak groen · nieuw vergroend: {neu} m²',
      hDachLeer: 'Geen daken in de oppervlaktebalans.',
      hPark: '{ent} m² van {p} m² parkeerplaatsen worden waterdoorlatend',
      hBaeume: 'nieuwe boomkroon: {n} × {k} m² = {m2} m²',
      hAue: 'telt direct mee als berging',
      hBgf: 'FSI {gfz}', hWohnen: '{wbgf} m² BVO wonen', hBgfWe: '{we} woningen',
      gesperrt: 'De bestaande situatie is de referentie: schuifregelaars vergrendeld. Waarden in de oppervlaktebalans of in config.js wijzigen.',
      reglerFuss: 'Startwaarden van de schuifregelaars in de varianten: aanname – aanpassen. Schuifregelaars en oppervlaktebalans zijn niet gekoppeld: de nieuwbouw-BVO verandert geen oppervlakken; nieuwe daken horen in de oppervlaktebalans van de variant.',
      zuruecksetzen: 'Invoer herstellen', resetFrage: 'Alle invoer terugzetten naar de waarden uit config.js?',
      resetOk: 'Invoer hersteld.',
      kDeltaV: 'Retentiebalans ΔV (berging − afvoer)', kNiederschlag: 'Neerslag {mm} mm in {h} uur',
      kAbfluss: 'Afvoer Σ A·ψ·{m} m', kSpeicher: 'Berging', kVersiegelung: 'Verhardingsgraad',
      kPsiM: 'gemiddelde afvoercoëfficiënt ψm', kKrone: 'Boomkroonbedekking', kBgf: 'BVO (nieuwbouw)', kGfz: 'FSI (GFZ)', kWe: 'Woningen',
      ziel: 'Doel {op} {wert}', ggBestand: '{diff} t.o.v. bestaand', pp: 'pp.',
      aZiel: '✓ doel gehaald', aZielNicht: '✗ doel niet gehaald', aBesser: '✓ beter', aSchlechter: '✗ slechter',
      aBesserZiel: 'beter, doel niet gehaald', aGleich: '= gelijk', aReferenz: 'Referentie',
      ampelLegende: 'Stoplicht: groen = doel gehaald of beter dan bestaand · geel = beter dan bestaand maar doel niet gehaald, of gelijk · rood = slechter dan bestaand. Zonder stoplicht: neerslag, BVO, FSI, woningen.',
      warnRefSumme: 'De oppervlaktebalans van de bestaande situatie klopt niet – de vergelijking is onzeker.',
      kurzDeltaV: 'ΔV', kurzVers: 'Verhard', kurzPsi: 'ψm', kurzKrone: 'Kroon',
      aWasser: 'Water', aHitze: 'Hitte', aFlaechen: 'Oppervlak',
      tWasser: 'Waterbalans bij {mm} mm in {h} uur', tHitze: 'Verharding, afvoer en boomkronen', tFlaechen: 'Oppervlaktebalans na maatregelen',
      dNiederschlag: 'Neerslag', dAbfluss: 'Afvoer', dSpeicher: 'Berging', dDeltaV: 'ΔV = berging − afvoer',
      dVersiegelung: 'Verhardingsgraad', dPsi: 'gem. afvoercoëfficiënt ψm × 100', dKrone: 'Boomkroonbedekking',
      achseM3: 'm³', achseProzent: '%', achseFlaeche: 'Aandeel in de oppervlaktebalans (%)',
      zielKrone: 'Doel boomkronen {wert} %',
      exportUnter: '{gebiet} · {flaeche} m² · stand {datum}',
      exportPlatzhalter: 'Bevat PLAATSHOUDERS (oppervlaktebalans) en niet-gecontroleerde aannames (ψ, berging) – geen meetwaarden.',
      exportAnnahme: 'Bevat niet-gecontroleerde aannames (ψ, berging).',
      keinChart: 'Grafiek niet beschikbaar: Chart.js kon niet worden geladen (internetverbinding?).',
      gespeichert: 'Opgeslagen: {name}',
      csvTitel: 'Vaals Entwurfslabor – oppervlaktebalans', csvStand: 'Stand', csvGebiet: 'Oppervlakte plangebied m²',
      csvRegen: 'Ontwerpbui', csvRegenWert: '{mm} mm in {h} uur', csvHinweis: 'Opmerking',
      csvSchluessel: 'Sleutel', csvVers: 'Verhardingsfactor', csvStatus: 'Status kengetallen', csvGeprueft: 'gecontroleerd',
      csvStatusSz: 'Status oppervlaktebalans', csvWerte: 'Waarden', csvEinheit: 'Eenheid', csvKennzahl: 'Kengetal',
      csvQuellen: 'Bronnen van de kengetallen', csvQuellePsi: 'Bron ψ', csvQuelleSp: 'Bron berging', csvQuelleVers: 'Bron verharding',
      karteFehlt: 'Kaart niet beschikbaar: Leaflet kon niet worden geladen (internetverbinding?).',
      impLaden: 'SenserScan-bestand laden (.geojson)', impWeg: 'Import verwijderen',
      impInfo: 'Potentiële locaties uit de GeoJSON-export van SenserScan. Meegeteld worden vlakken waarvan het middelpunt in het plangebied ligt.',
      impStatus: '{datei}: {n} vlakken in het plangebied',
      impAussen: 'buiten het gebied: {n}', impPunkte: 'punten zonder oppervlak (overgeslagen): {n}', impUngueltig: 'niet leesbaar (bijv. ander coördinatenstelsel): {n}',
      impTyp: 'Type', impAnzahl: 'Aantal',
      impParkAktiv: 'Parkeerplaatsen {m2} m² → „{name}”', impParkAlle: '→ alle scenario’s',
      impParkKeine: 'Geen parkeerplaatsen in het plangebied.',
      impParkOk: 'Parkeeroppervlak {m2} m² overgenomen: {namen}',
      impFehler: 'Bestand niet leesbaar: geen GeoJSON.', impOk: '{n} potentiële locaties in het plangebied geladen.',
      hDachSenser: 'SenserScan: platte daken in het gebied {m2} m²', nr: 'Nr.',
      sprache: 'Taal: Duits', info: 'Info, formules, aannames', schliessen: 'Sluiten',
      infoTitel: 'Over het Vaals Entwurfslabor',
      infoZweck: 'Scenariorekentool bij de masterthesis „Klimaresilient und wassersensibel: Vaals am Senserbach” (stedenbouw, RWTH Aachen). Het laat zien hoe een stedenbouwkundig en landschappelijk ontwerp voor het plangebied Selzerbeek de water- en hitterobuustheid verandert ten opzichte van de bestaande situatie.',
      infoKiTitel: 'AI-vermelding',
      infoKi: 'Prototype, gemaakt met <b>{werkzeug}</b>, model <b>{modell}</b>, op <b>{datum}</b>.',
      infoKiListe: '<ul><li><b>AI-gegenereerd:</b> alle programmacode; startwaarden voor ψ, bergingsvermogen en verhardingsfactoren (uit het geheugen, normteksten niet ingezien); plaatshouder-oppervlaktebalansen; startwaarden van de schuifregelaars; Nederlandse vertaling (niet gecontroleerd).</li><li><b>Niet AI-gegenereerd:</b> gebiedsgrens en oppervlakte, formule van de retentiebalans, richtwaarden 70 mm in 1 uur en 30 % boomkroonbedekking (opdracht); kaart: PDOK / © Kadaster (NL) en © GeoBasis-DE / BKG, basemap.de (DE).</li></ul>',
      infoFormelnTitel: 'Formules',
      infoFormeln: '<div class="formel">A = {a} m² (oppervlakte plangebied) · h = {h} m ({mm} mm in {std} uur)</div>' +
        '<div class="formel">Neerslag N = A · h = {n} m³</div>' +
        '<div class="formel">Afvoer Q = Σ (Aᵢ · ψᵢ · h)</div>' +
        '<div class="formel">Berging S = Σ (Aᵢ · sᵢ / 1000) + V<sub>beekdal</sub></div>' +
        '<div class="formel">Retentiebalans ΔV = S − Q &nbsp;(ΔV ≥ 0: de berging vangt de afvoer op)</div>' +
        '<div class="formel">ψm = Σ (Aᵢ · ψᵢ) / Σ Aᵢ</div>' +
        '<div class="formel">Verhardingsgraad = Σ (Aᵢ · vᵢ) / Σ Aᵢ</div>' +
        '<div class="formel">Boomkroonbedekking = (bestaande kronen + n · k) / A &nbsp;(doel {ziel} %)</div>' +
        '<div class="formel">FSI = BVO / A · woningen = ⌊ BVO · aandeel wonen / BVO per woning ⌋</div>' +
        '<p>Aᵢ: oppervlak van type i na maatregelen (m²) · ψᵢ: afvoercoëfficiënt · sᵢ: bergingsvermogen (mm) · vᵢ: verhardingsfactor · V<sub>beekdal</sub>: retentievolume beekdal (m³) · n: nieuwe bomen · k: kroonoppervlak per boom (m²). Σ Aᵢ is gelijk aan A als de totaalcontrole klopt. BVO en FSI gaan alleen over nieuwbouw.</p>',
      infoReglerTitel: 'Wat de schuifregelaars doen',
      infoRegler: '<ul><li><b>Aandeel groene daken:</b> doelaandeel groene daken van alle daken, nooit lager dan in de oppervlaktebalans. Extra groen dak gaat van „Dak conventioneel” naar „{ziel}”.</li>' +
        '<li><b>Aandeel onthard parkeren:</b> dit aandeel van de regel „waarvan parkeerplaatsen” gaat van „{von}” naar „{nach}”.</li>' +
        '<li><b>Nieuwe bomen × kroonoppervlak:</b> komt bij de boomkronen (overlay, niet in het totaal, niet in de waterbalans).</li>' +
        '<li><b>Retentievolume beekdal:</b> telt direct mee als berging.</li>' +
        '<li><b>Nieuwbouw-BVO, aandeel wonen, BVO per woning:</b> geven FSI en woningen. Ze veranderen de oppervlaktebalans niet.</li></ul>' +
        '<p>De schuifregelaars verschuiven alleen oppervlak; het totaal blijft gelijk. In de bestaande situatie zijn ze vergrendeld.</p>',
      infoAnnahmenTitel: 'Kengetallen per oppervlaktetype (config.js)',
      infoAnnahmen: 'ψ bevat al de berging van het oppervlak zelf. Alleen oppervlakken met extra bergingsruimte (wadi, retentiedak) hebben daarom een bergingsvermogen; anders telt het dubbel. Bronvermelding in het Duits.',
      thStatus: 'Status', geprueft: 'gecontroleerd',
      infoGrenzenTitel: 'Grenzen van het model',
      infoGrenzen: '<ul><li>Eén balans voor het hele gebied: geen stroombanen, geen hellingen, geen riolering, geen verloop van de bui in de tijd.</li>' +
        '<li>De ψ-waarden zijn gemiddelde afvoercoëfficiënten. Bij een bui van 70 mm in 1 uur kan de afvoer hoger zijn, vooral op gazon en op hellingen.</li>' +
        '<li>Schuifregelaars en oppervlaktebalans zijn niet gekoppeld: nieuwe gebouwen moeten in de oppervlaktebalans van de variant staan.</li>' +
        '<li>Boomkronen tellen niet mee in de waterbalans. Bestaande BVO is niet opgenomen.</li></ul>',
      infoTechnikTitel: 'Gegevens en techniek',
      infoTechnik: '<p>Alle vakinhoudelijke waarden staan in <code>config.js</code>. Invoer in de app wordt alleen in deze browser onthouden; verandert <code>config.js</code> onder „szenarien”, dan start de app weer met de waarden uit het bestand. Bibliotheken: Chart.js 4.5.1, Leaflet 1.9.4 (jsDelivr, vaste versies). Kaart: BRT-Achtergrondkaart (PDOK / © Kadaster) voor Nederland en basemap.de (© GeoBasis-DE / BKG, CC BY 4.0) voor Duitsland.</p>'
    }
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
      '<td data-z="parkRest"></td><td colspan="5" class="zeilen-info" data-z="parkInfo"></td></tr>' +
      '<tr class="extra"><th>' + esc(t('zeileKrone')) + '</th><td>' + feld('baumkronen_m2', sz.baumkronen_m2) + '</td>' +
      '<td data-z="krone"></td><td data-z="kroneAnteil"></td><td colspan="4" class="zeilen-info">' + esc(t('zeileKroneInfo')) + '</td></tr>' +
      '</tfoot>';
    tabelle.innerHTML = h;
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
    $('#bilanz-unter').textContent = szName(state.aktiv);
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
  // Regler
  // ================================================================
  const REGLER = [
    { k: 'dachGruenAnteil', label: 'rDach' },
    { k: 'parkEntsiegelt', label: 'rPark' },
    { k: 'baeume', label: 'rBaeume' },
    { k: 'kronenflaeche', label: 'rKrone' },
    { k: 'aueVolumen', label: 'rAue' },
    { k: 'neubauBgf', label: 'rBgf' },
    { k: 'wohnenAnteil', label: 'rWohnen' },
    { k: 'bgfJeWe', label: 'rBgfWe' }
  ];
  const reglerBox = $('#regler');
  // angezeigter Wert (Dach: wirksamer Anteil, nie unter der Flächenbilanz)
  function reglerWert(k) {
    if (k === 'dachGruenAnteil') return runden(erg[state.aktiv].dachAnteil * 100, 0);
    return aktivSz().regler[k];
  }
  AUFBAU.push(function reglerAufbau() {
    const gesperrt = istReferenz(state.aktiv);
    reglerBox.innerHTML = REGLER.map(R => {
      const d = CFG.regler[R.k];
      const dis = gesperrt ? ' disabled' : '';
      return '<div class="regler' + (gesperrt ? ' gesperrt' : '') + '" data-k="' + R.k + '">' +
        '<div class="regler-kopf"><label for="r-' + R.k + '">' + esc(t(R.label)) + '</label>' +
        '<span class="regler-wert"><input type="text" inputmode="numeric" autocomplete="off" data-zahl="' + R.k + '"' + dis +
        ' aria-label="' + esc(t(R.label)) + '"><span>' + esc(d.einheit) + '</span></span></div>' +
        '<input type="range" id="r-' + R.k + '" data-k="' + R.k + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '"' + dis + '>' +
        '<div class="regler-hilfe" data-hilfe="' + R.k + '"></div></div>';
    }).join('');
    const hinweis = $('#regler-gesperrt');
    hinweis.hidden = !gesperrt;
    hinweis.textContent = t('gesperrt');
    $('#regler-fuss').textContent = t('reglerFuss');
    $('#sz-name').value = szName(state.aktiv);
  });
  UPDATE.push(function reglerUpdate() {
    const e = erg[state.aktiv], r = aktivSz().regler;
    REGLER.forEach(R => {
      const v = reglerWert(R.k);
      const range = reglerBox.querySelector('input[type=range][data-k="' + R.k + '"]');
      const feld = reglerBox.querySelector('input[data-zahl="' + R.k + '"]');
      if (!range) return;
      if (R.k === 'dachGruenAnteil') range.min = Math.floor(e.dachAnteil0 * 100);
      if (document.activeElement !== range) range.value = v;
      if (document.activeElement !== feld) feld.value = zahl(v);
    });
    const hilfe = {
      dachGruenAnteil: (e.dach > 0 ? t('hDach', { a0: prozent(e.dachAnteil0, 0), dach: zahl(e.dach), neu: zahl(e.dachNeuGruen) }) : t('hDachLeer')) +
        (importSumme(CFG.senserscan.typFlachdach) > 0 ? ' · ' + t('hDachSenser', { m2: zahl(importSumme(CFG.senserscan.typFlachdach)) }) : ''),
      parkEntsiegelt: t('hPark', { ent: zahl(e.entsiegelt), p: zahl(aktivSz().parkplaetze_m2) }),
      baeume: t('hBaeume', { n: zahl(r.baeume), k: zahl(r.kronenflaeche), m2: zahl(e.kroneNeu) }),
      kronenflaeche: CFG.regler.kronenflaeche.quelle || '',
      aueVolumen: t('hAue'),
      neubauBgf: t('hBgf', { gfz: zahl(e.gfz, 2) }),
      wohnenAnteil: t('hWohnen', { wbgf: zahl(e.bgf * r.wohnenAnteil / 100) }),
      bgfJeWe: t('hBgfWe', { we: zahl(e.we) })
    };
    Object.keys(hilfe).forEach(k => {
      const el = reglerBox.querySelector('[data-hilfe="' + k + '"]');
      if (el) el.textContent = hilfe[k];
    });
  });
  function reglerSetzen(k, v) {
    const d = CFG.regler[k];
    if (!Number.isFinite(v)) return;
    aktivSz().regler[k] = Math.min(d.max, Math.max(d.min, v));
    aktualisieren();
  }
  reglerBox.addEventListener('input', ev => {
    const el = ev.target;
    if (el.type === 'range') {
      reglerSetzen(el.dataset.k, +el.value);
      const feld = reglerBox.querySelector('input[data-zahl="' + el.dataset.k + '"]');
      feld.value = zahl(reglerWert(el.dataset.k));
    } else if (el.dataset.zahl) {
      const n = leseZahl(el.value);
      el.style.borderColor = Number.isNaN(n) ? 'var(--rot)' : '';
      if (!Number.isNaN(n)) reglerSetzen(el.dataset.zahl, n);
    }
  });
  reglerBox.addEventListener('change', ev => {
    const el = ev.target;
    if (el.dataset.zahl) { el.style.borderColor = ''; el.value = zahl(reglerWert(el.dataset.zahl)); }
  });
  $('#sz-name').addEventListener('input', ev => {
    const v = ev.target.value.trim();
    aktivSz().name = v ? v.slice(0, 40) : null;
    aktualisieren();
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!window.confirm(t('resetFrage'))) return;
    state.szenarien = startSzenarien();
    neuAufbauen();
    toast(t('resetOk'));
  });

  // ================================================================
  // Kennzahlen und Ampel
  // ================================================================
  // besser: 'hoch' | 'niedrig' | null (keine Ampel); richtwert: Ziel (optional)
  const KPI = [
    { k: 'deltaV', label: 'kDeltaV', einheit: 'm³', d: 0, vz: true, besser: 'hoch', richtwert: CFG.richtwerte.deltaV_m3, op: '≥', breite: 'gross' },
    { k: 'niederschlag', label: 'kNiederschlag', einheit: 'm³', d: 0 },
    { k: 'abfluss', label: 'kAbfluss', einheit: 'm³', d: 0, besser: 'niedrig' },
    { k: 'speicher', label: 'kSpeicher', einheit: 'm³', d: 0, besser: 'hoch' },
    { k: 'psiM', label: 'kPsiM', einheit: '', d: 2, besser: 'niedrig' },
    { k: 'kroneAnteil', label: 'kKrone', einheit: '%', d: 1, faktor: 100, besser: 'hoch', richtwert: CFG.richtwerte.baumkronen_prozent, op: '≥' },
    { k: 'versiegelung', label: 'kVersiegelung', einheit: '%', d: 1, faktor: 100, besser: 'niedrig' },
    { k: 'bgf', label: 'kBgf', einheit: 'm²', d: 0, breite: 'drittel' },
    { k: 'gfz', label: 'kGfz', einheit: '', d: 2, breite: 'drittel' },
    { k: 'we', label: 'kWe', einheit: '', d: 0, breite: 'drittel' }
  ];
  const kpiWert = (kpi, e) => e[kpi.k] * (kpi.faktor || 1);

  // Ampel: Vergleich mit dem Bestand (auf Anzeigegenauigkeit gerundet) und dem Richtwert
  function ampel(kpi, i) {
    if (!kpi.besser) return null;
    const v = runden(kpiWert(kpi, erg[i]), kpi.d);
    const ref = runden(kpiWert(kpi, erg[REFERENZ]), kpi.d);
    const hoch = kpi.besser === 'hoch';
    const rw = kpi.richtwert == null ? null : (hoch ? v >= kpi.richtwert : v <= kpi.richtwert);
    if (istReferenz(i)) {
      if (rw === null) return { farbe: 'grau', text: t('aReferenz'), kachel: 'neutral' };
      return rw ? { farbe: 'gruen', text: t('aZiel') } : { farbe: 'rot', text: t('aZielNicht') };
    }
    const vgl = v === ref ? 0 : ((hoch ? v > ref : v < ref) ? 1 : -1);
    if (vgl < 0) return { farbe: 'rot', text: rw ? t('aSchlechter') + ' · ' + t('aZiel') : t('aSchlechter') };
    if (rw === true) return { farbe: 'gruen', text: t('aZiel') };
    if (rw === null && vgl > 0) return { farbe: 'gruen', text: t('aBesser') };
    if (rw === false && vgl > 0) return { farbe: 'gelb', text: t('aBesserZiel') };
    return { farbe: 'gelb', text: t('aGleich') };
  }

  function kpiTitel(kpi) {
    return t(kpi.label, { mm: CFG.regen.mm, h: CFG.regen.dauer_h, m: zahl(H_REGEN, 2) });
  }
  function kpiFormat(kpi, v) { return kpi.vz ? zahlVz(v, kpi.d) : zahl(v, kpi.d); }

  UPDATE.push(function kennzahlen() {
    const i = state.aktiv, e = erg[i];
    $('#kacheln').innerHTML = KPI.map(kpi => {
      const v = kpiWert(kpi, e);
      const a = ampel(kpi, i);
      let vergleich = '';
      if (a) vergleich += '<span class="pill ' + a.farbe + '">' + esc(a.text) + '</span>';
      if (!istReferenz(i)) {
        const diff = runden(v, kpi.d) - runden(kpiWert(kpi, erg[REFERENZ]), kpi.d);
        const einheit = kpi.einheit === '%' ? t('pp') : kpi.einheit;
        vergleich += '<span>' + esc(t('ggBestand', { diff: zahlVz(diff, kpi.d) + (einheit ? ' ' + einheit : '') })) + '</span>';
      }
      if (kpi.richtwert != null) {
        vergleich += '<span>' + esc(t('ziel', { op: kpi.op, wert: zahl(kpi.richtwert) + (kpi.einheit ? ' ' + kpi.einheit : '') })) + '</span>';
      }
      const klasse = 'kachel ' + (kpi.breite || '') + ' ' + (a ? (a.kachel || a.farbe) : 'neutral');
      return '<div class="' + klasse + '"><div class="k-titel">' + esc(kpiTitel(kpi)) + '</div>' +
        '<div class="k-wert">' + esc(kpiFormat(kpi, v)) + (kpi.einheit ? ' <span class="einheit">' + esc(kpi.einheit) + '</span>' : '') + '</div>' +
        (vergleich ? '<div class="k-vergleich">' + vergleich + '</div>' : '') + '</div>';
    }).join('');
    let w = warnungenHtml(i);
    if (!istReferenz(i) && !erg[REFERENZ].summeOk) w += '<div class="warnung">⚠ ' + esc(t('warnRefSumme')) + '</div>';
    $('#kz-warnung').innerHTML = w;
    const c = CFG.szenarien[i];
    $('#kz-unter').innerHTML = esc(szName(i)) + (c.platzhalter ? ' <span class="badge platzhalter">' + esc(t('platzhalter')) + '</span>' : '');
    $('#ampel-legende').textContent = t('ampelLegende');

    // Kurzanzeige (Handy)
    const kurz = [['deltaV', 'kurzDeltaV'], ['versiegelung', 'kurzVers'], ['psiM', 'kurzPsi'], ['kroneAnteil', 'kurzKrone']];
    $('#kurz').innerHTML = kurz.map(([k, l]) => {
      const kpi = KPI.find(x => x.k === k), a = ampel(kpi, i), v = kpiWert(kpi, e);
      const farbe = a ? ({ gruen: 'var(--gruen)', gelb: '#f08c00', rot: 'var(--rot)' }[a.farbe] || 'var(--grau)') : 'var(--grau)';
      return '<div style="border-left-color:' + farbe + '">' + esc(t(l)) + '<b>' + esc(kpiFormat(kpi, v)) + (kpi.einheit ? ' ' + esc(kpi.einheit) : '') + '</b></div>';
    }).join('');
  });

  // ================================================================
  // Diagramm (Chart.js) und PNG-Export
  // ================================================================
  const ANSICHTEN = ['wasser', 'hitze', 'flaechen'];
  if (!ANSICHTEN.includes(state.ansicht)) state.ansicht = 'wasser';
  const FARBEN = {
    niederschlag: '#91c8f6', abfluss: '#1864ab', speicher: '#2b8a3e', deltaV: '#7048e8',
    versiegelung: '#495057', psi: '#1864ab', krone: '#2b8a3e'
  };
  const SCHRIFT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const heute = () => new Date().toLocaleDateString(loc(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  function datumStempel() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  if (window.Chart) {
    Chart.defaults.font.family = SCHRIFT;
    Chart.register(
      { // weißer Hintergrund (sonst ist das PNG durchsichtig)
        id: 'hintergrund',
        beforeDraw(chart, args, o) {
          if (!o || !o.farbe) return;
          const c = chart.ctx; c.save(); c.fillStyle = o.farbe; c.fillRect(0, 0, chart.width, chart.height); c.restore();
        }
      },
      { // Zahlen an den Balken
        id: 'werte',
        afterDatasetsDraw(chart, args, o) {
          if (!o || !o.format || (!o.immer && chart.width < 620)) return;
          const c = chart.ctx; c.save();
          c.font = '600 ' + (o.groesse || 12) + 'px ' + SCHRIFT; c.fillStyle = '#17201c'; c.textAlign = 'center';
          chart.data.datasets.forEach((ds, di) => {
            const meta = chart.getDatasetMeta(di);
            if (meta.hidden) return;
            meta.data.forEach((bar, i) => {
              const v = ds.data[i];
              if (!Number.isFinite(v)) return;
              c.textBaseline = v < 0 ? 'top' : 'bottom';
              c.fillText(o.format(v, di), bar.x, bar.y + (v < 0 ? 4 : -4));
            });
          });
          c.restore();
        }
      },
      { // Ziellinie (z. B. Baumkronen 30 %)
        id: 'zielLinie',
        afterDatasetsDraw(chart, args, o) {
          if (!o || o.wert == null || !chart.scales.y) return;
          const y = chart.scales.y.getPixelForValue(o.wert), a = chart.chartArea, c = chart.ctx;
          c.save(); c.strokeStyle = FARBEN.krone; c.lineWidth = o.breite || 2; c.setLineDash([8, 5]);
          c.beginPath(); c.moveTo(a.left, y); c.lineTo(a.right, y); c.stroke();
          c.setLineDash([]); c.font = '700 ' + (o.groesse || 12) + 'px ' + SCHRIFT;
          c.textAlign = 'right'; c.textBaseline = 'bottom';
          const g = o.groesse || 12, w = c.measureText(o.text).width;
          c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(a.right - w - 10, y - g - 7, w + 10, g + 5);
          c.fillStyle = FARBEN.krone; c.fillText(o.text, a.right - 5, y - 4);
          c.restore();
        }
      }
    );
  }

  function diagrammTitel(ansicht) {
    return t({ wasser: 'tWasser', hitze: 'tHitze', flaechen: 'tFlaechen' }[ansicht], { mm: CFG.regen.mm, h: CFG.regen.dauer_h });
  }

  // Chart-Konfiguration für Bildschirm (gross = false) oder PNG (gross = true)
  function diagrammConfig(ansicht, gross) {
    const fs = gross ? 26 : 13;
    const labels = state.szenarien.map((s, i) => (erg[i].summeOk ? '' : '⚠ ') + szName(i));
    let datasets, yAchse, werte = null, ziel = null, gestapelt = false;

    if (ansicht === 'wasser') {
      datasets = [
        { label: t('dNiederschlag'), data: erg.map(e => e.niederschlag), backgroundColor: FARBEN.niederschlag },
        { label: t('dAbfluss'), data: erg.map(e => e.abfluss), backgroundColor: FARBEN.abfluss },
        { label: t('dSpeicher'), data: erg.map(e => e.speicher), backgroundColor: FARBEN.speicher },
        { label: t('dDeltaV'), data: erg.map(e => e.deltaV), backgroundColor: FARBEN.deltaV }
      ];
      yAchse = t('achseM3');
      werte = (v, di) => (di === 3 ? zahlVz(v) : zahl(v));
    } else if (ansicht === 'hitze') {
      datasets = [
        { label: t('dVersiegelung'), data: erg.map(e => e.versiegelung * 100), backgroundColor: FARBEN.versiegelung },
        { label: t('dPsi'), data: erg.map(e => e.psiM * 100), backgroundColor: FARBEN.psi },
        { label: t('dKrone'), data: erg.map(e => e.kroneAnteil * 100), backgroundColor: FARBEN.krone }
      ];
      yAchse = t('achseProzent');
      werte = v => zahl(v, 1);
      ziel = { wert: CFG.richtwerte.baumkronen_prozent, text: t('zielKrone', { wert: CFG.richtwerte.baumkronen_prozent }), groesse: fs, breite: gross ? 4 : 2 };
    } else {
      gestapelt = true;
      datasets = BK.map(k => ({
        label: tx(BELAEGE[k].name),
        data: erg.map(e => (e.summeWirksam > 0 ? e.flaechen[k] / e.summeWirksam * 100 : 0)),
        m2: erg.map(e => e.flaechen[k]),
        backgroundColor: BELAEGE[k].farbe
      }));
      yAchse = t('achseFlaeche');
    }

    const platzhalter = CFG.szenarien.some(s => s.platzhalter);
    const annahmen = BK.some(k => !BELAEGE[k].geprueft);
    const unter = [t('exportUnter', { gebiet: tx(CFG.gebiet.name), flaeche: zahl(A_GEBIET), datum: heute() })];
    if (platzhalter) unter.push(t('exportPlatzhalter')); else if (annahmen) unter.push(t('exportAnnahme'));

    return {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
        maintainAspectRatio: false,
        animation: gross ? false : { duration: 250 },
        layout: { padding: gross ? { left: 30, right: 40, top: 10, bottom: 20 } : { top: 6 } },
        scales: {
          x: { stacked: gestapelt, ticks: { font: { size: fs + 1, weight: '600' }, color: '#17201c' }, grid: { display: false } },
          y: {
            stacked: gestapelt,
            max: gestapelt ? 100 : undefined,
            grace: gestapelt ? 0 : '8%',
            title: { display: true, text: yAchse, font: { size: fs }, color: '#56625d' },
            ticks: { font: { size: fs }, color: '#56625d', callback: v => zahl(v) },
            grid: { color: c => (c.tick && c.tick.value === 0 ? '#17201c' : '#e3e8e5'), lineWidth: c => (c.tick && c.tick.value === 0 ? 2 : 1) }
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: fs }, color: '#17201c', boxWidth: gross ? 30 : 14, padding: gross ? 22 : 10 } },
          title: { display: gross, text: 'Vaals Entwurfslabor – ' + diagrammTitel(ansicht), font: { size: 40, weight: '700' }, color: '#0b5563', padding: { top: 10, bottom: 6 } },
          subtitle: { display: gross, text: unter, font: { size: 22 }, color: platzhalter ? '#b35c00' : '#56625d', padding: { bottom: 24 } },
          tooltip: {
            callbacks: {
              label: c => {
                const ds = c.dataset, v = c.raw;
                if (ds.m2) return ds.label + ': ' + zahl(v, 1) + ' % (' + zahl(ds.m2[c.dataIndex]) + ' m²)';
                return ds.label + ': ' + (ansicht === 'wasser' ? zahl(v) + ' m³' : zahl(v, 1) + ' %');
              }
            }
          },
          hintergrund: { farbe: '#ffffff' },
          werte: werte ? { format: werte, groesse: gross ? 22 : 12, immer: gross } : false,
          zielLinie: ziel || false
        }
      }
    };
  }

  const segment = $('#ansicht');
  AUFBAU.push(function ansichtAufbau() {
    segment.innerHTML = ANSICHTEN.map(a =>
      '<button type="button" data-a="' + a + '" aria-pressed="' + (a === state.ansicht) + '">' +
      esc(t({ wasser: 'aWasser', hitze: 'aHitze', flaechen: 'aFlaechen' }[a])) + '</button>').join('');
  });
  segment.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-a]');
    if (!b) return;
    state.ansicht = b.dataset.a;
    segment.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    aktualisieren();
  });

  let chart = null, chartSchluessel = '';
  UPDATE.push(function diagramm() {
    const box = $('.chart-box');
    if (!window.Chart) {
      box.innerHTML = '<p class="warnung">' + esc(t('keinChart')) + '</p>';
      return;
    }
    const cfg = diagrammConfig(state.ansicht, false);
    const schluessel = state.ansicht + '|' + state.sprache;
    if (chart && chartSchluessel === schluessel) {
      chart.data.labels = cfg.data.labels;
      cfg.data.datasets.forEach((ds, i) => { Object.assign(chart.data.datasets[i], { data: ds.data, label: ds.label, m2: ds.m2 }); });
      chart.update('none');
    } else {
      if (chart) chart.destroy();
      chart = new Chart($('#chart'), cfg);
      chartSchluessel = schluessel;
    }
  });

  function herunterladen(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(t('gespeichert', { name: name }));
  }

  // PNG im Folienformat 1920 × 1080, unabhängig von der Bildschirmgröße
  function pngBlob() {
    return new Promise((resolve, reject) => {
      if (!window.Chart) { reject(new Error(t('keinChart'))); return; }
      const box = document.createElement('div');
      box.className = 'export-box';
      const c = document.createElement('canvas');
      c.width = 1920; c.height = 1080;
      c.style.width = '1920px'; c.style.height = '1080px';
      box.appendChild(c);
      document.body.appendChild(box);
      const cfg = diagrammConfig(state.ansicht, true);
      Object.assign(cfg.options, { responsive: false, animation: false, devicePixelRatio: 1, events: [] });
      const ch = new Chart(c, cfg);
      c.toBlob(blob => {
        ch.destroy(); box.remove();
        if (blob) resolve(blob); else reject(new Error('PNG'));
      }, 'image/png');
    });
  }
  $('#btn-png').addEventListener('click', () => {
    pngBlob().then(
      blob => herunterladen(blob, 'vaals_entwurfslabor_' + state.ansicht + '_' + datumStempel() + '.png'),
      err => toast(err.message)
    );
  });

  // ================================================================
  // CSV-Export der Bilanz (Semikolon, Dezimalkomma – für Excel DE/NL)
  // ================================================================
  function csvText() {
    const zc = (n, d) => (Number.isFinite(n) ? runden(n, d || 0).toFixed(d || 0).replace('.', ',') : '');
    const q = s => { s = String(s == null ? '' : s); return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const n = state.szenarien.length, idx = [...Array(n).keys()];
    const rows = [];
    const platzhalter = CFG.szenarien.some(s => s.platzhalter);
    rows.push([t('csvTitel'), tx(CFG.gebiet.name)]);
    rows.push([t('csvStand'), datumStempel()]);
    rows.push([t('csvGebiet'), zc(A_GEBIET)]);
    rows.push([t('csvRegen'), t('csvRegenWert', { mm: CFG.regen.mm, h: CFG.regen.dauer_h })]);
    if (platzhalter) rows.push([t('csvHinweis'), t('exportPlatzhalter')]);
    else if (BK.some(k => !BELAEGE[k].geprueft)) rows.push([t('csvHinweis'), t('exportAnnahme')]);
    rows.push([]);

    // Flächenbilanz
    const kopf = [t('thBelag'), t('csvSchluessel'), t('thPsi'), t('thSpeicherMm'), t('csvVers'), t('csvStatus')];
    idx.forEach(i => kopf.push(szName(i) + ': ' + t('thGrund'), szName(i) + ': ' + t('thWirksam')));
    rows.push(kopf);
    BK.forEach(k => {
      const b = BELAEGE[k];
      const r = [tx(b.name), k, zc(b.psi, 2), zc(b.speicher_mm), zc(b.versiegelung, 2), b.geprueft ? t('csvGeprueft') : t('annahme')];
      idx.forEach(i => r.push(zc(state.szenarien[i].flaechen[k]), zc(erg[i].flaechen[k])));
      rows.push(r);
    });
    const zeile = (label, fnGrund, fnWirk) => {
      const r = [label, '', '', '', '', ''];
      idx.forEach(i => r.push(fnGrund(i), fnWirk(i)));
      rows.push(r);
    };
    zeile(t('zeileSumme'), i => zc(erg[i].summeGrund), i => zc(erg[i].summeWirksam));
    zeile(t('zeilePark'), i => zc(state.szenarien[i].parkplaetze_m2), i => zc(state.szenarien[i].parkplaetze_m2 - erg[i].entsiegelt));
    zeile(t('zeileKrone'), i => zc(state.szenarien[i].baumkronen_m2), i => zc(erg[i].krone));
    zeile(t('csvStatusSz'), i => (CFG.szenarien[i].platzhalter ? t('platzhalter') : t('csvWerte')), i => (erg[i].summeOk ? t('summeOk') : '⚠ ' + t('tabWarn')));
    rows.push([]);

    // Regler
    rows.push([t('regler'), t('csvEinheit')].concat(idx.map(szName)));
    REGLER.forEach(R => {
      rows.push([t(R.label), CFG.regler[R.k].einheit].concat(idx.map(i =>
        R.k === 'dachGruenAnteil' ? zc(erg[i].dachAnteil * 100, 1) : zc(state.szenarien[i].regler[R.k]))));
    });
    rows.push([]);

    // Kennzahlen
    rows.push([t('csvKennzahl'), t('csvEinheit')].concat(idx.map(szName)));
    KPI.forEach(kpi => rows.push([kpiTitel(kpi), kpi.einheit].concat(idx.map(i => zc(kpiWert(kpi, erg[i]), kpi.d)))));
    rows.push([]);

    // Quellen
    rows.push([t('csvQuellen'), t('csvQuellePsi'), t('csvQuelleSp'), t('csvQuelleVers')]);
    BK.forEach(k => rows.push([tx(BELAEGE[k].name), BELAEGE[k].psiQuelle, BELAEGE[k].speicherQuelle, BELAEGE[k].versiegelungQuelle]));
    rows.push([t('kKrone'), CFG.richtwerte.quelle]);
    rows.push([t('csvRegen'), CFG.regen.quelle]);
    idx.forEach(i => rows.push([szName(i), CFG.szenarien[i].quelle || '']));

    return '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n') + '\r\n';
  }
  $('#btn-csv').addEventListener('click', () => {
    herunterladen(new Blob([csvText()], { type: 'text/csv;charset=utf-8' }), 'vaals_entwurfslabor_bilanz_' + datumStempel() + '.csv');
  });

  // ================================================================
  // Übersichtskarte (Leaflet, Hintergrund laut config.js)
  // ================================================================
  let karte = null, importLayer = null;
  function karteStart() {
    if (!window.L) { $('#map').innerHTML = '<p class="warnung">' + esc(t('karteFehlt')) + '</p>'; return; }
    karte = L.map('map', { scrollWheelZoom: false });
    CFG.karte.ebenen.forEach(e => L.tileLayer(e.url, {
      maxZoom: CFG.karte.maxZoom, attribution: e.attribution,
      tm: d => String(d.z).padStart(2, '0') // zweistellige Zoomstufe ({tm}) für PDOK und basemap.de
    }).addTo(karte));
    const gebiet = L.polygon(CFG.gebiet.polygon.map(p => [p[1], p[0]]),
      { color: '#0b5563', weight: 3, fillColor: '#0b5563', fillOpacity: 0.08 }).addTo(karte);
    gebiet.bindTooltip(() => tx(CFG.gebiet.name) + ' · ' + zahl(A_GEBIET) + ' m²', { sticky: true });
    karte.fitBounds(gebiet.getBounds(), { padding: [12, 12] });
    importLayer = L.featureGroup().addTo(karte);
  }
  function importKarte() {
    if (!importLayer) return;
    importLayer.clearLayers();
    if (!state.import) return;
    state.import.flaechen.forEach(f => {
      L.geoJSON(f.geometry, { style: { color: '#e8590c', weight: 2, fillColor: '#e8590c', fillOpacity: 0.35 } })
        .bindTooltip(() => (f.nr != null ? t('nr') + ' ' + f.nr + ' · ' : '') + (f.typ_name || f.typ) + ' · ' + zahl(f.m2) + ' m²')
        .addTo(importLayer);
    });
  }

  // ================================================================
  // Import der Potenzialflächen aus SenserScan
  // ================================================================
  const rad = x => x * Math.PI / 180;
  // Fläche auf der Kugel (WGS84-Radius), wie in SenserScan
  function ringFlaeche(c) {
    let s = 0;
    for (let i = 0; i < c.length - 1; i++) s += rad(c[i + 1][0] - c[i][0]) * (2 + Math.sin(rad(c[i][1])) + Math.sin(rad(c[i + 1][1])));
    return Math.abs(s * 6378137 * 6378137 / 2);
  }
  function geomFlaeche(g) {
    const poly = p => ringFlaeche(p[0]) - p.slice(1).reduce((s, r) => s + ringFlaeche(r), 0);
    return g.type === 'Polygon' ? poly(g.coordinates) : g.coordinates.reduce((s, p) => s + poly(p), 0);
  }
  function imPolygon(pt, ring) {
    let innen = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) innen = !innen;
    }
    return innen;
  }
  function mittelpunkt(ring) {
    const n = ring.length - 1 || 1;
    let x = 0, y = 0;
    for (let i = 0; i < n; i++) { x += ring[i][0]; y += ring[i][1]; }
    return [x / n, y / n];
  }
  const istWgs84 = p => Array.isArray(p) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;

  function importieren(text, datei) {
    let gj = null;
    try { gj = JSON.parse(text); } catch (e) { gj = null; }
    const feats = gj && gj.type === 'FeatureCollection' ? gj.features : (gj && gj.type === 'Feature' ? [gj] : null);
    if (!Array.isArray(feats)) { toast(t('impFehler')); return; }
    const flaechen = [];
    let punkte = 0, aussen = 0, ungueltig = 0;
    feats.forEach(ft => {
      const g = ft && ft.geometry, p = (ft && ft.properties) || {};
      if (g && g.type === 'Point') { punkte++; return; }
      const ring = g && (g.type === 'Polygon' ? g.coordinates && g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates && g.coordinates[0] && g.coordinates[0][0] : null);
      if (!Array.isArray(ring) || ring.length < 4 || !ring.every(istWgs84)) { ungueltig++; return; }
      if (!imPolygon(mittelpunkt(ring), CFG.gebiet.polygon)) { aussen++; return; }
      const m2 = Number(p.flaeche_m2) > 0 ? Number(p.flaeche_m2) : geomFlaeche(g);
      flaechen.push({
        nr: p.nr != null ? p.nr : null,
        typ: String(p.typ || '?'),
        typ_name: p.typ_name ? String(p.typ_name) : null,
        m2: Math.round(m2 * 10) / 10,
        geometry: { type: g.type, coordinates: g.coordinates }
      });
    });
    state.import = { datei: String(datei || '').slice(0, 80), flaechen: flaechen, punkte: punkte, aussen: aussen, ungueltig: ungueltig };
    importKarte();
    aktualisieren();
    toast(t('impOk', { n: flaechen.length }));
  }
  function importSumme(typ) {
    return state.import ? state.import.flaechen.filter(f => f.typ === typ).reduce((s, f) => s + f.m2, 0) : 0;
  }

  const importBox = $('#import');
  UPDATE.push(function importAnzeige() {
    let h = '<div class="btn-reihe"><label class="btn hell datei-knopf">' + esc(t('impLaden')) +
      '<input type="file" accept=".geojson,.json,application/geo+json,application/json" data-imp="datei"></label>' +
      (state.import ? '<button type="button" class="btn klein" data-imp="weg">' + esc(t('impWeg')) + '</button>' : '') + '</div>' +
      '<p class="fussnote">' + esc(t('impInfo')) + '</p>';
    const im = state.import;
    if (im) {
      const neben = [];
      if (im.aussen) neben.push(t('impAussen', { n: im.aussen }));
      if (im.punkte) neben.push(t('impPunkte', { n: im.punkte }));
      if (im.ungueltig) neben.push(t('impUngueltig', { n: im.ungueltig }));
      h += '<p><b>' + esc(t('impStatus', { datei: im.datei, n: im.flaechen.length })) + '</b>' + (neben.length ? ' · ' + esc(neben.join(' · ')) : '') + '</p>';
      const typen = {};
      im.flaechen.forEach(f => {
        const x = typen[f.typ] || (typen[f.typ] = { name: f.typ_name || f.typ, n: 0, m2: 0 });
        x.n++; x.m2 += f.m2;
      });
      const keys = Object.keys(typen).sort((a, b) => typen[b].m2 - typen[a].m2);
      if (keys.length) {
        h += '<table><tr><th>' + esc(t('impTyp')) + '</th><th>' + esc(t('impAnzahl')) + '</th><th>m²</th></tr>' +
          keys.map(k => '<tr><td>' + esc(typen[k].name) + '</td><td>' + typen[k].n + '</td><td>' + zahl(typen[k].m2) + '</td></tr>').join('') +
          '<tr><th>' + esc(t('zeileSumme')) + '</th><th>' + im.flaechen.length + '</th><th>' + zahl(im.flaechen.reduce((s, f) => s + f.m2, 0)) + '</th></tr></table>';
      }
      const park = importSumme(CFG.senserscan.typParkplatz);
      h += park > 0
        ? '<div class="btn-reihe"><button type="button" class="btn" data-imp="park">' + esc(t('impParkAktiv', { m2: zahl(park), name: szName(state.aktiv) })) +
          '</button><button type="button" class="btn hell" data-imp="parkAlle">' + esc(t('impParkAlle')) + '</button></div>'
        : '<p class="fussnote">' + esc(t('impParkKeine')) + '</p>';
    }
    importBox.innerHTML = h;
  });
  importBox.addEventListener('change', ev => {
    const inp = ev.target.closest('input[data-imp="datei"]');
    if (!inp || !inp.files || !inp.files[0]) return;
    const datei = inp.files[0];
    datei.text().then(text => importieren(text, datei.name), () => toast(t('impFehler')));
  });
  importBox.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-imp]');
    if (!b) return;
    if (b.dataset.imp === 'weg') {
      state.import = null;
      importKarte();
      aktualisieren();
    } else {
      const park = Math.round(importSumme(CFG.senserscan.typParkplatz));
      const ziele = b.dataset.imp === 'parkAlle' ? state.szenarien.map((s, i) => i) : [state.aktiv];
      ziele.forEach(i => { state.szenarien[i].parkplaetze_m2 = park; });
      neuAufbauen();
      toast(t('impParkOk', { m2: zahl(park), namen: ziele.map(szName).join(', ') }));
    }
  });

  // ================================================================
  // Sprache und Info-Seite
  // ================================================================
  AUFBAU.push(function spracheKnopf() {
    const b = $('#btn-sprache');
    b.textContent = state.sprache === 'de' ? 'NL' : 'DE';
    b.setAttribute('aria-label', t('sprache'));
    b.title = t('sprache');
    $('#btn-info').setAttribute('aria-label', t('info'));
    $('#btn-info').title = t('info');
  });
  $('#btn-sprache').addEventListener('click', () => {
    state.sprache = state.sprache === 'de' ? 'nl' : 'de';
    neuAufbauen();
  });

  const dialog = $('#info');
  function infoHtml() {
    const M = CFG.massnahmen;
    const zeilen = BK.map(k => {
      const b = BELAEGE[k];
      return '<tr><td><span class="swatch" style="background:' + esc(b.farbe) + '"></span>' + esc(tx(b.name)) + '</td>' +
        '<td>' + zahl(b.psi, 2) + '</td><td>' + esc(b.psiQuelle) + '</td>' +
        '<td>' + zahl(b.speicher_mm) + '</td><td>' + esc(b.speicherQuelle) + '</td>' +
        '<td>' + zahl(b.versiegelung, 1) + '</td>' +
        '<td>' + (b.geprueft ? esc(t('geprueft')) : '<span class="badge annahme">' + esc(t('annahme')) + '</span>') + '</td></tr>';
    }).join('');
    return '<div class="info-kopf"><h2>' + esc(t('infoTitel')) + '</h2>' +
      '<form method="dialog"><button class="rund" type="submit" aria-label="' + esc(t('schliessen')) + '">✕</button></form></div>' +
      '<div class="info-inhalt">' +
      '<p>' + esc(t('infoZweck')) + '</p>' +
      '<h3>' + esc(t('infoKiTitel')) + '</h3>' +
      '<p>' + t('infoKi', { werkzeug: esc(CFG.info.werkzeug), modell: esc(CFG.info.modell), datum: esc(CFG.info.datum) }) + '</p>' + t('infoKiListe') +
      '<h3>' + esc(t('infoFormelnTitel')) + '</h3>' +
      t('infoFormeln', { a: zahl(A_GEBIET), h: zahl(H_REGEN, 3), mm: CFG.regen.mm, std: CFG.regen.dauer_h, n: zahl(A_GEBIET * H_REGEN), ziel: CFG.richtwerte.baumkronen_prozent }) +
      '<p class="fussnote">' + esc(CFG.regen.quelle) + ' · ' + esc(CFG.richtwerte.quelle) + '</p>' +
      '<h3>' + esc(t('infoReglerTitel')) + '</h3>' +
      t('infoRegler', { ziel: esc(tx(BELAEGE[M.dachbegruenungZiel].name)), von: esc(tx(BELAEGE[M.entsiegelungVon].name)), nach: esc(tx(BELAEGE[M.entsiegelungZiel].name)) }) +
      '<h3>' + esc(t('infoAnnahmenTitel')) + '</h3>' +
      '<p>' + esc(t('infoAnnahmen')) + '</p>' +
      '<div class="tabelle-scroll"><table><thead><tr><th>' + esc(t('thBelag')) + '</th><th>ψ</th><th>' + esc(t('quelle')) + '</th><th>' +
      esc(t('thSpeicherMm')) + '</th><th>' + esc(t('quelle')) + '</th><th>' + esc(t('csvVers')) + '</th><th>' + esc(t('thStatus')) + '</th></tr></thead>' +
      '<tbody>' + zeilen + '</tbody></table></div>' +
      '<p class="fussnote">' + esc(CFG.regler.kronenflaeche.quelle || '') + '</p>' +
      '<h3>' + esc(t('infoGrenzenTitel')) + '</h3>' + t('infoGrenzen') +
      '<h3>' + esc(t('infoTechnikTitel')) + '</h3>' + t('infoTechnik') +
      '</div>';
  }
  $('#btn-info').addEventListener('click', () => {
    dialog.innerHTML = infoHtml();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  });
  dialog.addEventListener('click', ev => { if (ev.target === dialog) dialog.close(); });

  // ================================================================
  // Start
  // ================================================================
  karteStart();
  importKarte();
  neuAufbauen();
  if (state.configNeu) toast(t('configNeu'));
})();

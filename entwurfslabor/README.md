# Vaals Entwurfslabor

Szenario-Rechner zur Masterthesis **„Klimaresilient und wassersensibel: Vaals am Senserbach“** (Stadtplanung, RWTH Aachen).
Er zeigt, wie ein städtebaulich-freiraumplanerischer Entwurf für das **Planungsgebiet Selzerbeek** (203.454 m², 20,35 ha, zwischen Maastrichterlaan und Senserbach) die Wasser- und Hitzeresilienz gegenüber dem Bestand verändert.

> **Prototyp, KI-generiert.** Erstellt mit Claude Code, Modell Claude Opus 5.5 (`claude-opus-5-5`), am 23.11.2026.
> Die Flächenbilanzen sind **Platzhalter**, die Kennwerte (ψ, Speicher) **Annahmen – prüfen**. Welche Teile KI-generiert sind, steht [unten](#ki-generierte-teile).

---

## Start

Kein Build-Schritt. Im Ordner `entwurfslabor` (oder im übergeordneten Ordner `STB_M`, dann mit `/entwurfslabor/` in der Adresse):

```powershell
python -m http.server 8081 --bind 0.0.0.0
```

- Laptop/Beamer: <http://localhost:8081/> (bzw. <http://localhost:8081/entwurfslabor/>, wenn der Server in `STB_M` läuft)
- Handy im selben WLAN: `http://<IP-des-Laptops>:8081/…` (IP mit `ipconfig`, „IPv4-Adresse“). Die Windows-Firewall muss Python im privaten Netzwerk erlauben.
- **Internet nötig** für Chart.js, Leaflet (per CDN) und die Hintergrundkarten (PDOK, basemap.de). Ohne Netz erscheint statt Diagramm und Karte ein Hinweis; Bilanz, Regler und Kennzahlen funktionieren weiter.
- `index.html` lädt `config.js` und `app.js` bei jedem Aufruf frisch. Änderungen an `config.js` wirken nach einem einfachen Neuladen.

---

## Bedienung

| Element | Funktion |
|---|---|
| **Bestand / Variante A / Variante B** | Szenario umschalten. Der Name ist im Feld „Name des Szenarios“ änderbar. |
| **+** (rechts neben den Szenarien) | neue Variante als Kopie des gewählten Szenarios („Variante C“, „Variante D“ …), bis zu fünf Varianten. **Variante entfernen** in der Szenario-Leiste löscht sie wieder (nicht beim Bestand). |
| **Szenario** (Leiste links) | Regler: Anteil begrünter Dachflächen, Anteil entsiegelter Parkplätze, neue Bäume × Kronenfläche, Retentionsvolumen der Aue, Neubau-BGF, Anteil Wohnen, BGF je Wohneinheit. Zahl auch direkt eintippen. Gilt auch für den Bestand; er bleibt die Vergleichsbasis der Ampel. |
| **Kennzahlen** | Niederschlag, Abfluss, Speicher, Retentionsbilanz ΔV, ψm, Versiegelungsgrad, Baumkronenanteil, BGF, GFZ, Wohneinheiten – mit Ampel und Differenz zum Bestand |
| **Vergleich der Szenarien** | Balkendiagramm aller drei Szenarien: **Wasser** (N, Q, S, ΔV), **Hitze** (Versiegelung, ψm, Baumkronen mit Ziellinie 30 %), **Flächen** (gestapelte Flächenbilanz) |
| Bild-Symbol | aktuelle Diagrammansicht als PNG für Folien, 1920 × 1080, weißer Hintergrund, mit Titel; solange Platzhalter oder ungeprüfte Kennwerte im Spiel sind, mit Hinweis im Untertitel |
| Tabellen-Symbol | CSV-Bilanz: Flächenbilanz, Regler, Kennzahlen und Quellen aller Szenarien. Semikolon und Dezimalkomma (Excel DE/NL), UTF-8. |
| **Flächenbilanz** | Grundbilanz je Belagsart (m², eintippbar, auch `18.000`), Fläche nach Maßnahmen, Abfluss und Speicher je Belagsart. **Summenprüfung:** weicht die Summe mehr als 1 m² von 203.454 m² ab, erscheint eine rote Warnung (auch im Umschalter ⚠). Haken **Platzhalter**: markiert die Werte dieses Szenarios schraffiert als Platzhalter. |
| **Planungsgebiet** | Karte (PDOK für NL, basemap.de für DE) mit der Gebietsgrenze und den importierten SenserScan-Flächen |
| **SenserScan-Datei laden** | siehe [Import](#import-aus-senserscan) |
| **NL / DE** | Sprache umschalten |
| Regler-Symbol (**Einstellungen**) | Menüfarbe (Standard Wasserblau), **Kennwerte je Belagsart** (ψ, Speicher mm, Versiegelungsfaktor, „geprüft“), **Daten exportieren/importieren** (.json), „Standard wiederherstellen“ |
| **i** | Info-Seite: Formeln, Wirkung der Regler, Kennwerte mit Quellen, Modellgrenzen, Quellen der Karten |
| **Eingaben zurücksetzen** | Flächenbilanzen, Regler und Namen auf die Werte aus `config.js`; selbst hinzugefügte Varianten entfallen |

**Layout:** Ab 900 px Breite steht die Szenario-Leiste mit den Reglern fest links (eigener Bildlauf); rechts Kennzahlen und Diagramm nebeneinander, darunter Flächenbilanz und Karte (ab 1500 px nebeneinander). Auf dem Handy liegt alles untereinander, die Kennzahlen als Zeilen (Titel links, Wert rechts); oben bleibt eine Kurzanzeige mit ΔV, Versiegelung, ψm und Baumkronen stehen.

Eingaben merkt sich nur der jeweilige Browser (localStorage). Ändert sich in `config.js` etwas unter `szenarien`, startet die App wieder mit den Werten der Datei.

### Ampel

| Farbe | Bedeutung |
|---|---|
| grün | Ziel erreicht (ΔV ≥ 0 m³, Baumkronen ≥ 30 %) bzw. bei Kennzahlen ohne Ziel: besser als der Bestand |
| gelb | besser als der Bestand, aber Ziel verfehlt – oder gleich wie der Bestand |
| rot | schlechter als der Bestand |

Im Bestand selbst: nur Abgleich mit dem Ziel. Ohne Ampel: Niederschlag, BGF, GFZ, Wohneinheiten. Neben der Farbe steht immer ein Text („✓ besser“, „✗ schlechter“ …).

---

## Werte eintragen

### In der App (Bestand und Varianten)

1. Szenario wählen, in der **Flächenbilanz** die m² eintippen (auch Parkplätze und Baumkronen). Die Summenprüfung zeigt, ob 203.454 m² erreicht sind.
2. Haken **Platzhalter** entfernen, sobald es echte Werte sind.
3. **Einstellungen → Exportieren (.json)** sichert alles (Flächenbilanzen, Regler, Namen, Platzhalter-Status, Kennwerte, Menüfarbe) als Datei. **Importieren** lädt sie wieder, z. B. auf dem Handy oder dem Beamer-Laptop.

### Dauerhaft in `config.js` (gilt dann auf allen Geräten)

Unter `szenarien`, Eintrag `id: 'bestand'`:

```js
platzhalter: false,                       // Markierung "Platzhalter" verschwindet
quelle: 'QGIS, Belagskartierung …, Stand …',
flaechen: { dach_konv: …, gruendach_ext: …, retentionsdach: …, asphalt: …, pflaster: …,
            durchlaessig: …, rasen: …, mulde: …, aue: … },   // Summe = 203.454
parkplaetze_m2: …,   // davon Parkplätze (liegen in Asphalt/Beton)
baumkronen_m2: …     // Baumkronen (Überlagerung, nicht in der Summe)
```

### Varianten A und B

- `flaechen: 'bestand'` übernimmt die Bestandsbilanz (Start). Für den Entwurf eine eigene Bilanz eintragen, **inklusive neuer Dächer**: Die Neubau-BGF ändert keine Flächen.
- `regler: { … }` sind die Startwerte der Regler.
- Weitere Varianten entstehen in der App mit **+**; sie werden im Browser gespeichert und mit dem .json-Export übertragen, nicht in `config.js`.

### Kennwerte je Belagsart

In der App unter **Einstellungen** änderbar (gilt dann in diesem Browser und wandert mit dem Export). Dauerhaft in `config.js` unter `belaege`: je Belagsart `psi`, `speicher_mm`, `versiegelung` mit Quellenfeldern. Nach der Prüfung `geprueft: true` setzen (oder in den Einstellungen den Haken „geprüft“); dann verschwindet „Annahme – prüfen“. Menüfarbe: `menuFarbe`. Weitere Einstellungen: `richtwerte`, `regen`, `massnahmen` (wohin die Regler umbuchen), `regler` (Bereiche).

---

## Formeln

A = 203.454 m² (Gebietsfläche), h = 0,07 m (70 mm in 1 h)

| Kennzahl | Formel |
|---|---|
| Niederschlag | N = A · h = 14.242 m³ |
| Abfluss | Q = Σ (Aᵢ · ψᵢ · h) |
| Speicher | S = Σ (Aᵢ · sᵢ / 1000) + V_Aue |
| Retentionsbilanz | ΔV = S − Q (ΔV ≥ 0: der Speicher nimmt den Abfluss auf) |
| mittlerer Abflussbeiwert | ψm = Σ (Aᵢ · ψᵢ) / Σ Aᵢ |
| Versiegelungsgrad | Σ (Aᵢ · vᵢ) / Σ Aᵢ |
| Baumkronenanteil | (Baumkronen Bestand + n · k) / A, Ziel 30 % |
| GFZ | BGF / A |
| Wohneinheiten | ⌊ BGF · Anteil Wohnen / BGF je WE ⌋ |

Aᵢ: Fläche der Belagsart i **nach Maßnahmen** · ψᵢ: Abflussbeiwert · sᵢ: Speichervermögen in mm · vᵢ: Versiegelungsfaktor · V_Aue: Retentionsvolumen der Aue · n: neue Bäume · k: Kronenfläche je Baum. BGF und GFZ beziehen sich nur auf den Neubau.

### Wie die Regler die Bilanz ändern

Die Regler buchen Flächen innerhalb der Bilanz um; die Summe bleibt gleich.

- **Anteil begrünter Dachflächen:** Ziel-Anteil begrünter Dächer (extensiv + Retention) an allen Dächern, nie unter dem Anteil der Grundbilanz. Zusätzliche Fläche: „Dach konventionell“ → „Gründach extensiv“.
- **Anteil entsiegelter Parkplätze:** dieser Anteil von „davon Parkplätze“: „Asphalt/Beton“ → „wasserdurchlässiger Belag“.
- **Neue Bäume × Kronenfläche:** zu den Baumkronen addiert (nicht in der Flächensumme, nicht in der Wasserbilanz).
- **Retentionsvolumen der Aue:** direkt zum Speicher addiert.
- **Neubau-BGF, Anteil Wohnen, BGF je WE:** nur GFZ und Wohneinheiten.

Zielbeläge sind in `config.js` unter `massnahmen` änderbar.

---

## Annahmen (Startwerte, alle „Annahme – prüfen“)

Die Werte hat Claude **aus dem Gedächtnis** gesetzt; die Normtexte wurden nicht eingesehen. Vor Verwendung in der Thesis prüfen, auch gegen die Neufassung DWA-A 138-1.

| Belagsart | ψ | Speicher mm | Versiegelung | Quelle (Startwert) |
|---|---|---|---|---|
| Dach konventionell | 0,90 | 0 | 1,0 | DWA-A 138 (2005), Tab. 2, ψm Flach-/Schrägdach |
| Gründach extensiv | 0,50 | 0 | 1,0 | DWA-A 138, Gründach < 10 cm; Rückhalt steckt in ψ |
| Retentionsgründach | 0,30 | 50 | 1,0 | DWA-A 138, Gründach ≥ 10 cm; 50 mm Retentionsraum (Herstellerangaben etwa 40–100 mm) |
| Asphalt/Beton | 0,90 | 0 | 1,0 | DWA-A 138, Betonfläche, Schwarzdecke |
| Pflaster | 0,75 | 0 | 1,0 | DWA-A 138, Pflaster mit dichten Fugen |
| wasserdurchlässiger Belag | 0,25 | 0 | 0,5 | DWA-A 138, Verbundsteine mit Fugen, Sickersteine; Faktor 0,5 teilversiegelt |
| Rasen/Garten | 0,20 | 0 | 0 | DIN 1986-100:2016-12, Tab. 9 (flach 0,1); 0,2 wegen Hanglage |
| Retentionsmulde/Wasserfläche | 1,00 | 300 | 0 | Regen fällt direkt in den Speicher; 30 cm Einstau (DWA-A 138) |
| Bachaue/Natur | 0,10 | 0 | 0 | DIN 1986-100, Tab. 9 (Größenordnung); Rückhalt der Aue über den Regler |

Weitere Annahmen: Kronenfläche je neuem Baum 50 m² (Baum 2. Ordnung, Ø etwa 8 m); Startwerte der Regler in Variante A und B.

**Doppelzählung vermeiden:** ψ enthält bereits den Rückhalt der Fläche selbst (Benetzung, Substrat, Boden). Speichervermögen haben deshalb nur Flächen mit *zusätzlichem* Rückhalteraum (Mulde, Retentionsdach).

**Platzhalter:** Bestand (runde Zahlen, Rest in Bachaue/Natur) sowie Varianten A/B (Kopie des Bestands). Sie erscheinen in der App schraffiert (Haken „Platzhalter“ in der Flächenbilanz) und im PNG- und CSV-Export mit Hinweis. Ohne Haken entfällt beides.

---

## Import aus SenserScan

**SenserScan-Datei laden** liest den GeoJSON-Export der anderen App (`senserscan_flaechen_JJJJ-MM-TT.geojson`, WGS84).

- Gezählt werden (Multi-)Polygone, deren Mittelpunkt im Planungsgebiet liegt. Punkte und Flächen außerhalb werden übersprungen und gezählt.
- Fläche: `flaeche_m2` aus dem Export, sonst auf der Kugel berechnet (wie in SenserScan).
- Anzeige: Karte und Tabelle „m² je Typ“.
- **Parkplätze → „Szenario“** bzw. **→ alle Szenarien** setzt die Zeile „davon Parkplätze“ auf die Summe der Flächen vom Typ `parkplatz`.
- Flachdächer (`flachdach`) erscheinen als Hinweis am Dach-Regler.
- Typ-Schlüssel in `config.js` unter `senserscan`.

Getestet mit den sechs Beispielflächen aus SenserScan im Exportformat (alle sechs liegen im Planungsgebiet), einem GPS-Punkt und einer Fläche außerhalb.

---

## Bekannte Grenzen

- Eine Bilanz für das ganze Gebiet: keine Fließwege, kein Gefälle, kein Kanalnetz, keine zeitliche Verteilung des Regens.
- ψ sind mittlere Abflussbeiwerte; bei 70 mm in 1 h kann der Abfluss höher liegen (Rasen, Hanglage).
- Regler und Flächenbilanz sind nicht gekoppelt (Neubau-BGF ändert keine Flächen).
- Baumkronen gehen nicht in die Wasserbilanz ein; Bestands-BGF ist nicht enthalten.
- Die niederländischen Texte sind maschinell übersetzt und ungeprüft.
- Die Quellenangaben in `config.js` sind nur auf Deutsch.

## Technik

- `index.html`, `app.js`, `config.js`, `style.css` – kein Build-Schritt
- [Chart.js](https://www.chartjs.org) 4.5.1 und [Leaflet](https://leafletjs.com) 1.9.4 per jsDelivr mit fester Version und Subresource Integrity
- Karte: zwei amtliche Hintergrundkarten übereinander, jede außerhalb ihres Landes durchsichtig: BRT-Achtergrondkaart (PDOK / © Kadaster) für die Niederlande und basemap.de Web Raster (© GeoBasis-DE / BKG 2026, CC BY 4.0) für Deutschland, damit auch der Teil jenseits des Senserbachs zu sehen ist. Vorher war OpenStreetMap eingestellt; das wurde in einem Browser mit „Access blocked“ gesperrt. OSM steht als Alternative in `config.js`.
- Getestet im Chromium-Browser bei 375 × 812 (Handy) und 1280 × 720 (Beamer): Summenprüfung, Regler → Kennzahlen, Ampel, PNG (1920 × 1080), CSV (UTF-8 mit BOM), SenserScan-Import, DE/NL, Einstellungen (Menüfarbe, Kennwerte, Export/Import .json). Safari/iOS und Excel selbst sind nicht getestet.

## KI-generierte Teile

In der App selbst steht keine KI-Kennzeichnung (auf Wunsch, wie in Klima Chancen); diese Liste dokumentiert sie.

KI-generiert (Claude Code, Claude Opus 5.5, 23.11.2026):

- gesamter Programmcode: `index.html`, `app.js`, `style.css`, `config.js`
- Startwerte für ψ, Speichervermögen und Versiegelungsfaktoren samt Quellenangaben (aus dem Gedächtnis, ungeprüft)
- Platzhalter-Flächenbilanzen (Bestand, Varianten A/B) und Startwerte der Regler
- Kronenfläche 50 m² je Baum
- Rechenregeln der Regler (Umbuchung der Flächen) und die Ampel-Logik
- Linien-Logo (Tropfen, Balken, Wellen; im Stil des Klima-Chancen-Logos)
- niederländische Übersetzung
- diese README

**Nicht** KI-generiert:

- Gebietsgrenze (Shapefile Lehrstuhl, EPSG 25832, umprojiziert nach WGS84) und Gebietsfläche 203.454 m²
- Formel der Retentionsbilanz ΔV = Speicher − Σ (Fläche · ψ · 0,07 m), Kennzahlenliste
- Richtwerte 70 mm in 1 h und 30 % Baumkronenanteil (Vorgaben)
- Kartengrundlagen: PDOK / © Kadaster (NL), © GeoBasis-DE / BKG (DE)

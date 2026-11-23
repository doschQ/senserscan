# Klima Chancen

*(Repository und Web-Adresse heißen weiterhin `senserscan`.)*

Mobile Web-App (PWA) zur Masterthesis **„Klimaresilient und wassersensibel: Vaals am Senserbach“** (Stadtplanung, RWTH Aachen).
Im Kernbereich von Vaals werden Potenzialflächen für **doppelte Innenentwicklung** erfasst und bewertet: bauliche Verdichtung bei gleichzeitiger Sicherung und Aufwertung von Grün. Für jede Fläche zeigt ein Steckbrief („Klimacheck“) Anforderungen und Maßnahmen.

> **Prototyp, KI-generiert.** Erstellt mit Claude Code, Modell Claude Opus 5.5 (`claude-opus-5-5`), am 23.11.2026.
> Welche Teile KI-generiert sind, steht [unten](#ki-generierte-teile).

---

## Start

### Online (empfohlen, auch fürs Handy)

**https://doschq.github.io/senserscan/**

Läuft über HTTPS, daher funktionieren dort GPS-Punkt und Offline-Start.
Als App installieren:

- **Android/Chrome:** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“
- **iPhone/Safari:** Teilen-Symbol → „Zum Home-Bildschirm“

### Lokal auf dem Laptop

Im Projektordner (Python 3 genügt, kein Build-Schritt):

```powershell
python -m http.server 8080 --bind 0.0.0.0
```

- Laptop: <http://localhost:8080>
- Handy im selben WLAN: `http://<IP-des-Laptops>:8080`. Die IP zeigt `ipconfig` unter „IPv4-Adresse“; am 23.11.2026 war es `192.168.0.196`.
  Beim ersten Start fragt die Windows-Firewall, ob Python im **privaten** Netzwerk erreichbar sein darf. Bitte erlauben.
  **Achtung:** Über `http://` im WLAN gehen auf dem Handy **kein GPS-Punkt und kein Offline-Start**. Browser erlauben beides nur über HTTPS oder `localhost`. Fürs Handy deshalb die Online-Adresse nutzen.

---

## Bedienung

| Element | Funktion |
|---|---|
| **Fläche** | Polygon zeichnen: Eckpunkte antippen. Mit **Punkt zurück** den letzten Punkt entfernen, mit **Fertig** schließen. |
| **GPS-Punkt** | Punkt an der aktuellen Position. Ohne GPS kann der Punkt in der Kartenmitte gesetzt werden. |
| Formular | Typ, Baupotenzial, Grünpotenzial, Risiko Wasser, Risiko Hitze (je 1–5), Notiz, Foto. Die Klasse wird live berechnet. |
| Fläche antippen | Öffnet den **Steckbrief** mit Klasse, Bewertung und **Klimacheck** (Richtwerte, Anforderungen, Maßnahmen je Ebene). Dort auch **Bearbeiten** und **Löschen**. |
| **Liste** | Alle Flächen, Filter nach Klasse, Anzahl und m² je Klasse, Export und Import |
| **Beispiele** | Sechs fiktive Beispielflächen einblenden bzw. wieder entfernen. Die App startet ohne Beispiele. |
| **Gebiet** | Zoomt auf das Planungsgebiet Selzerbeek |
| **Karte / Luftbild** | OpenStreetMap oder PDOK-Luftbild, auch während des Zeichnens umschaltbar. Ist PDOK nicht erreichbar, schaltet die App automatisch auf die Karte zurück. |
| **NL / DE** | Sprache umschalten |
| **Einstellungen** (Regler-Symbol) | Klassen (Name, Farbe, Beschreibung), Schwellenwerte der Regeln, Menüfarbe (Standard Vaals-Rot). Gilt sofort und wird nur in diesem Browser gespeichert; „Standard wiederherstellen“ setzt alles zurück. |
| **i** | Quellen und Versionsnummer |

### Daten speichern, exportieren, in QGIS öffnen

- Alle Flächen werden **nur lokal im Browser** gespeichert (IndexedDB). Wer die Browserdaten löscht, verliert sie. **Regelmäßig exportieren.**
- **Export GeoJSON:** `klimachancen_flaechen_JJJJ-MM-TT.geojson`, WGS84 (EPSG:4326) nach RFC 7946, eine Spalte je Attribut.
  In QGIS die Datei ins Kartenfenster ziehen. Sind Polygone **und** Punkte enthalten, fragt QGIS, welche Teil-Layer geladen werden sollen; beide auswählen.
- **Export CSV:** gleiche Attribute plus Spalte `wkt` mit der Geometrie. QGIS: *Layer → Layer hinzufügen → Getrennte Texte*, Geometrie „Well-Known Text (WKT)“, Feld `wkt`, KBS EPSG:4326.
- **Import GeoJSON:** Punkte und (Multi-)Polygone in WGS84. Eigene Exporte werden anhand der `id` aktualisiert statt verdoppelt. Features in anderen Koordinatensystemen (z. B. RD New) werden übersprungen.
- **Fotos** bleiben im Browser und sind nicht im Export enthalten. Das Feld `foto` zeigt nur, ob eines vorhanden ist.

**Attribute im Export:** `id, nr, typ, typ_name, klasse, klasse_name, bau, gruen, wasser, hitze, flaeche_m2, notiz, foto, gps_genauigkeit_m, beispiel, erstellt, geaendert`

---

## Anpassen

### In der App: Einstellungen

Name, Farbe und Beschreibung jeder Klasse, die Schwellenwerte („hoch ab“) für Baupotenzial, Risiko Wasser und Risiko Hitze sowie die Menüfarbe lassen sich direkt in der App ändern (Regler-Symbol oben).
Die Änderungen gelten nur im jeweiligen Browser. Die Werte in `config.js` sind der Standard.

### Regeln, Klassen, Farben, Typen → `config.js`

Die Regeln werden **von oben nach unten** geprüft; die erste zutreffende bestimmt die Klasse.
`s` sind die Schwellenwerte (`schwellen: { bau: 4, wasser: 4, hitze: 4 }`):

```js
regeln: [
  { klasse: 'gruen_sichern',       wenn: (f, s) => f.typ === 'gruenflaeche' },
  { klasse: 'verdichten_auflagen', wenn: (f, s) => f.bau >= s.bau && (f.wasser >= s.wasser || f.hitze >= s.hitze) },
  { klasse: 'bauen_entsiegeln',    wenn: (f, s) => f.bau >= s.bau },
  { klasse: 'gruen_aufwerten',     wenn: (f, s) => true }   // sonst
]
```

Verfügbar sind `f.typ`, `f.bau`, `f.gruen`, `f.wasser`, `f.hitze`. Jede Regel hat zusätzlich einen `text`, der in den Einstellungen angezeigt wird.
Namen, Farben und Kurzbeschreibungen der Klassen stehen unter `klassen`, die Flächentypen unter `typen`, die Menüfarbe unter `menuFarbe`.
Nach dem Speichern die Seite neu laden.

### Maßnahmenkatalog → `data/massnahmen.json` (Entwurf)

- `richtwerte`: die vier Richtwerte (70 mm in 1 h, 40 mm auf privatem Grund, ≤ 0,20 m auf der Straße, kühler Grünort ≤ 300 m)
- `anforderungen`: Anforderungen je Fläche
- `massnahmen`: je 5 Maßnahmen für die Ebenen `quartier`, `gebaeude`, `freiraum`

Wann ein Eintrag im Steckbrief erscheint:

| Feld | Bedeutung |
|---|---|
| `typen` | Typ-Schlüssel aus `config.js` oder `"alle"` |
| `klassen` | optional: nur für diese Klassen |
| `risiko` | `["wasser"]`, `["hitze"]`, beide oder `[]` (unabhängig vom Risiko) |
| `ab` | optional: ab welchem Risikowert (sonst `schwelle`, Standard 3) |

Texte immer auf Deutsch (`de`) und Niederländisch (`nl`) pflegen.
Der Katalog ist ein **KI-generierter Entwurf** und muss fachlich überarbeitet werden. Die Quellen der Richtwerte sind in der Thesis zu ergänzen.

### Weitere Dateien

- **Oberflächentexte DE/NL:** `i18n.js`
- **Beispielflächen:** `data/beispielflaechen.geojson`. Sie werden über den Menüpunkt „Beispiele“ geladen und wieder entfernt.
- **Gebiete:** `data/vaals_gebiete_wgs84.geojson`; Name, Stil und Planungsgebiet-ID in `config.js` unter `gebiete`
- **Offline-Cache:** `sw.js`. Wenn neue Dateien hinzukommen, in die Liste eintragen und `VERSION` erhöhen.
  Bei einer neuen App-Version die Endung `?v=…` von `style.css`, `config.js`, `i18n.js` und `app.js` in `index.html` **und** `sw.js` gleich anpassen, damit kein Gerät alte und neue Dateien mischt.

---

## Technik

- Kein Build-Schritt: `index.html`, `app.js`, `style.css`, `config.js`, `i18n.js`, `sw.js`, `manifest.json`, `data/`, `icons/`
- [Leaflet](https://leafletjs.com) 1.9.4 und [Leaflet-Geoman free](https://geoman.io) 2.17.0, per jsDelivr-CDN mit fester Version und Subresource Integrity
- **PDOK-Luftbild:** Die Einstellungen stammen aus der WMTS-GetCapabilities (`https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0`, abgerufen 23.11.2026):
  - Layer `Actueel_orthoHR` (Luchtfoto Actueel Ortho 8 cm RGB)
  - TileMatrixSet `EPSG:3857`
  - TileMatrix-IDs `00`–`21`, zweistellig
  - Format `image/jpeg`
  - Das Luftbild deckt nur niederländisches Gebiet ab; östlich der Grenze erscheinen weiße Kacheln.
- **Flächenberechnung** auf der Kugel (WGS84-Radius, wie Turf.js). Abweichung zu QGIS (Ellipsoid) unter 0,5 %.
- **Offline:**
  - Der Service Worker speichert App-Dateien und Bibliotheken. Eigene Dateien holt er zuerst vom Server und greift nur ohne Netz auf den Cache zurück.
  - Kartenkacheln werden nicht gespeichert; offline erscheinen Gebiete und Flächen auf grauem Grund.
- Getestet im Chromium-Browser bei 390 × 844 und 1280 × 800: Zeichnen, Bewerten, Klassen, Steckbrief, Liste, Export/Import, Offline-Start, Ausfall des PDOK-Luftbilds.
  Der Export wurde gegen RFC 7946 geprüft. In QGIS selbst wurde er nicht geöffnet (dort nicht installiert). Safari/iOS ist nicht getestet.

## Bekannte Grenzen

- Geometrien lassen sich nachträglich nicht verschieben; dafür die Fläche löschen und neu zeichnen.
- Fotos sind nicht im Export enthalten.
- Daten liegen nur auf dem jeweiligen Gerät; zwischen Geräten per Export/Import austauschen.
- Die niederländischen Texte sind maschinell übersetzt und ungeprüft.

## KI-generierte Teile

KI-generiert (Claude Code, Claude Opus 5.5, 23.11.2026):

- gesamter Programmcode: `index.html`, `app.js`, `style.css`, `config.js`, `i18n.js`, `sw.js`, `manifest.json`
- Umsetzung der Klassifikationsregeln in `config.js` (die Regeln selbst stammen aus der Aufgabenstellung)
- Maßnahmenkatalog und Anforderungen in `data/massnahmen.json` (**Entwurf**)
- sechs Beispielflächen in `data/beispielflaechen.geojson` (Lage und Bewertung fiktiv, als „Beispiel“ gekennzeichnet)
- niederländische Übersetzung aller Texte
- App-Icons in `icons/`
- diese README

**Nicht** KI-generiert:

- Gebietsgrenzen in `data/vaals_gebiete_wgs84.geojson` (Shapefile Lehrstuhl, EPSG:25832, umprojiziert nach WGS84)
- Klassifikationsregeln a–d und Richtwerte (Vorgabe aus der Aufgabenstellung)
- Kartengrundlagen: © OpenStreetMap-Mitwirkende; Luftbild: PDOK / Beeldmateriaal Nederland

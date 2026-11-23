# Klima Wandel Stadt – Startseite

Startseite für das Projekt **Klima Wandel Stadt – Vaals klimaresilient planen**. Sie dient auf dem Handy als Home-Bildschirm: eine Kachel pro App, Uhr und Datum in der Leiste unten, Info-Knopf links.

Aus der Startseite geöffnet, zeigen Klima Chancen und das Entwurfslabor links oben einen Pfeil **‹** zurück zur Startseite. Direkt aufgerufen (z. B. über GitHub Pages) fehlt der Pfeil.

## Aufbau der Website

```
(Startverzeichnis der Domain)
├── index.html, manifest.json, sw.js, .htaccess, icons/   ← Startseite
├── klima-chancen/                                        ← Klima Chancen
└── entwurfslabor/                                        ← Vaals Entwurfslabor
```

Im Projektordner liegt Klima Chancen weiter im Hauptordner (GitHub Pages bleibt unverändert). Den Ordner oben stellt das Skript zusammen.

## Auf Strato veröffentlichen

1. **Paket erstellen:** `strato-paket.cmd` im Projektordner doppelklicken. Es entsteht der Ordner `strato-upload` (wird bei jedem Lauf neu angelegt, nicht in Git).
2. **SSL aktivieren:** im Strato-Kundenlogin das SSL-Zertifikat für die Domain einschalten. Ohne HTTPS gibt es kein GPS, keinen Offline-Betrieb und kein sauberes „Zum Home-Bildschirm“. Die `.htaccess` leitet danach jeden Aufruf auf HTTPS um.
3. **SFTP-Zugang anlegen:** Kundenlogin → „Datenbanken und Webspace“ → „SFTP & SSH“. Dort stehen Server, Benutzername und Passwort; Port 22.
4. **Hochladen mit FileZilla:** mit diesen Daten verbinden (Protokoll SFTP). Den **Inhalt** von `strato-upload` (nicht den Ordner selbst) in das Verzeichnis ziehen, auf das die Domain zeigt. Damit `.htaccess` sichtbar ist: Menü „Server“ → „Auflistung versteckter Dateien erzwingen“.
5. **Testen:** `https://deine-domain/` auf dem Handy öffnen.

Bei späteren Änderungen: Skript erneut starten und den Inhalt wieder hochladen (vorhandene Dateien überschreiben).

Meldet der Browser „zu viele Weiterleitungen“, den HTTPS-Block in `startseite/.htaccess` löschen, das Paket neu erstellen und hochladen.

## Daten

- Jede App speichert ihre Eingaben **nur im Browser des Geräts** (Klima Chancen: IndexedDB `senserscan` und `localStorage` `senserscan.*`; Entwurfslabor: `localStorage` `vaals-entwurfslabor-v1`). Der Strato-Server speichert nichts; er liefert nur Dateien aus.
- Der Speicher gehört zur Adresse. Was auf `doschq.github.io` oder lokal (`file://`) eingegeben wurde, erscheint auf der Strato-Domain **nicht**. Umziehen per Export in der alten und Import in der neuen Adresse (Klima Chancen: GeoJSON).
- iPhone: Eine Web-App auf dem Home-Bildschirm hat einen eigenen Speicher, getrennt von Safari. Daher nur die Startseite zum Home-Bildschirm hinzufügen und die Apps immer von dort öffnen. Safari löscht Websitedaten nach 7 Nutzungstagen ohne Besuch der Seite; eine Web-App auf dem Home-Bildschirm zählt nur ihre eigenen Nutzungstage, ihre Daten bleiben daher in der Regel erhalten.

## Neue App hinzufügen

1. App als eigenen Unterordner anlegen.
2. In `startseite/index.html` eine Kachel (`<a class="platz kanal" …>`) kopieren; Link, Farbe (`--farbe` als R, G, B), Symbol, Name und Zweck anpassen und dafür einen leeren Platz (`<span class="platz leer">`) löschen.
3. In `strato-paket.cmd` eine Zeile `robocopy` für den neuen Ordner ergänzen und ihn bei Klima Chancen unter `/XD` ausschließen.
4. Für den Pfeil zurück: im Kopf der App einen Link anlegen und ihn zeigen, wenn `sessionStorage.getItem('kws.start')` gesetzt ist (siehe Klima Chancen, `app.js`, Abschnitt „Pfeil zurück zur Startseite“).

Ändert sich eine Datei der Startseite, in `startseite/sw.js` die `VERSION` erhöhen (`startseite-v2` …), damit Geräte die neue Fassung offline vorhalten.

## Getestet

Chromium bei 375 × 812, 844 × 390 und 1280 × 800 über einen lokalen Server mit dem Inhalt von `strato-upload`: Kacheln, Info-Blatt, Wechsel in beide Apps und zurück, kein Pfeil bei direktem Aufruf, beide Service Worker nebeneinander, Start der Startseite und von Klima Chancen ohne Server (offline). Nicht getestet: echter Strato-Webspace (`.htaccess`), Safari/iOS.

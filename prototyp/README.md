# Prototyp Akt III – Das Grab (WebXR)

Läuft direkt im **Browser der Meta Quest**, ohne App-Store und ohne Installation.
Gebaut mit three.js (lokal in `lib/`) und WebXR. Alle Klänge werden zur Laufzeit erzeugt, es gibt keine Audiodateien.

## Inhalt

| Abschnitt | Szenen aus dem Drehbuch | Was passiert |
|---|---|---|
| Beerdigung | 3.0 | Blick aus der Lahd-Nische in den Graben, gesichtslose Trauernde am Rand, Lehmziegel werden Reihe für Reihe gesetzt (Muslim 966), Erde fällt dumpf auf die Ziegel, Dunkelheit, die Schritte entfernen sich, Stille |
| Weg A | 3A – 3A.3 | Aufsetzen, zwei Präsenzen als Licht ohne Quelle, Befragung, das Grab weitet sich bis zum Horizont, Tor aus Licht, der Gefährte (gute Taten) |
| Übergang | – | Grau, Atemzug, „Und der ungläubige Diener …“ |
| Weg B | 3B – 3B.4 | Zwei Flächen tieferer Dunkelheit, „Hāh hāh, lā adrī“, Öffnung zur Glut, das Grab wird eng (überspringbar), der Gefährte (schlechte Taten), an der Oberfläche fliegen die Vögel auf, aber der Mensch hört nichts |

Dauer: ca. 10 Minuten für den ganzen Akt. Abschnitte lassen sich auf der Startseite einzeln wählen.

## Steuerung

| Quest | Bildschirm | Funktion |
|---|---|---|
| Trigger / Pinch (Daumen + Zeigefinger) | Klick / Leertaste | Text weiterschalten |
| Seitentaste (Grip) gedrückt halten | Taste K gedrückt halten | Die enge Szene überspringen |
| Kopf bewegen | Maus ziehen | Umsehen |

**Empfehlung:** Im Sitzen erleben, mit Kopfhörern.

## Auf die Quest bringen

WebXR funktioniert nur über **HTTPS** (oder `localhost`). Drei Wege:

### Weg 1: Netlify Drop (am schnellsten, ca. 1 Minute)
1. Am PC <https://app.netlify.com/drop> öffnen.
2. Den Ordner `prototyp` in das Fenster ziehen.
3. Du bekommst eine HTTPS-Adresse wie `https://irgendwas.netlify.app`.
4. In der Quest den **Browser** öffnen, die Adresse eingeben und auf **„In VR starten“** tippen.

### Weg 2: GitHub Pages
1. Im Repository: **Settings → Pages → Build and deployment**
2. Source: **Deploy from a branch**, Branch: `claude/vr-video-jenseits-islam-uqruap` (oder `main` nach dem Mergen), Ordner: `/ (root)`
3. Nach ca. 1 Minute ist der Prototyp erreichbar unter
   `https://<dein-github-name>.github.io/Akhira-Vr/prototyp/`
   (Bei privaten Repositories ist GitHub Pages nur mit einem bezahlten GitHub-Plan verfügbar.)

### Weg 3: Lokal mit USB-Kabel (für Entwickler)
```bash
cd prototyp
python3 -m http.server 8000
adb reverse tcp:8000 tcp:8000     # Quest per USB, Entwicklermodus aktiv
```
Dann in der Quest `http://localhost:8000` öffnen.

## Am PC testen

```bash
cd prototyp
python3 -m http.server 8000
```
Dann `http://localhost:8000` öffnen und **„Am Bildschirm ansehen“** wählen.
Mit `?speed=3` an der Adresse läuft alles dreimal so schnell (nur zum Testen).

## Splat-Test (`splat-test.html`)

Prüft, ob die Quest fotorealistische 3D-Welten (Gaussian Splats) flüssig darstellt – Grundlage für den Plan, Orte mit dem Handy zu scannen oder per KI (z. B. Marble von World Labs) zu erzeugen.

- **Generierte Testwelt** mit 200.000 bis 2 Millionen Punkten, um die Grenze der Quest zu finden.
- **Datei vom Gerät** laden: `.ply`, `.spz`, `.splat`, `.ksplat`, `.sog` (Export aus Scaniverse, Polycam, Marble usw.).
- **Adresse (URL)** einer Splat-Datei laden (der Server muss CORS erlauben).
- Bildrate wird oben links angezeigt (in VR als kleine Tafel).

**Messwerte Quest 3 (26.11.2026, generierte Testwelt):** 200.000 Punkte ≈ 90 Bilder/s · 500.000 ≈ 53 · 2 Millionen ≈ 10 (fast hängend). Zielwert pro Szene daher **etwa 300.000 Punkte**, höchstens 500.000 bei sonst einfacher Szene.

Steuerung in VR: linker Stick gehen, rechter Stick drehen (30°-Schritte) und Höhe, A/X Welt umdrehen (viele Scans stehen kopfüber), B/Y zurück zum Start.

Technik: three.js 0.180 und Spark 2.4.0 (`lib/three-0.180`, `lib/spark-2.4.0`, beide MIT-Lizenz). Antialiasing ist bewusst aus (Empfehlung von Spark, vermeidet einen bekannten Hänger der Quest).

## Was dieser Prototyp (noch) nicht hat

- **Keine Stimmen und keine Rezitation.** Texte erscheinen als Tafeln. Eine Platzhalter-Vorlesestimme (Browser-Sprachausgabe) kann auf der Startseite eingeschaltet werden, nur zum Testen des Timings.
- **Keine Erinnerungsbilder** (Wudūʾ, Gebet usw. aus 3A.3/3B.3), sie kommen in der Produktion.
- **Einfache Grafik.** Es geht um Raum, Licht, Ton und Timing, nicht um das endgültige Aussehen.
- **Texte ungeprüft.** Alle arabischen Texte und Übersetzungen sind Entwurf (siehe `drehbuch/GELEHRTEN-PRUEFUNG.md`).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit Hinweis, Abschnittswahl, Start-Buttons |
| `js/main.js` | Ablauf der Szenen, Steuerung, Render-Loop |
| `js/world.js` | Grab, Himmel, Präsenzen, Gefährte, Friedhof |
| `js/texte.js` | Alle Texte (Arabisch, Deutsch, Quelle). Hier werden Korrekturen des Gelehrten eingetragen. |
| `js/audio.js` | Prozeduraler Raumklang (Wind, Erde, Schritte, Glut …) |
| `js/textpanel.js` | Schwebende Texttafeln in VR |
| `textures/` | Erde, Lehmziegel, Gras als PBR-Texturen (Farbe, Relief, Rauheit), erzeugt mit `tools/make_textures.py` |
| `lib/` | three.js 0.160.0 (MIT-Lizenz) |
| `fonts/` | Noto Naskh Arabic (SIL Open Font License) |

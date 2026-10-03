# Teken naar 3D · 3dindeklas

Een browsertool om een afbeelding over te trekken en de tekening als een plat 3D-model met dikte te exporteren. Huisstijl: Quicksand, paars `#4c325b`, turquoise `#5ab3b1` en geel `#fbbd30`.

## Gebruiken

Open `index.html`, `dist/index.html` of de meegeleverde `Teken-naar-3D.html` in een recente browser. Het gebouwde bestand bevat alle code, fonts en het logo en werkt ook zonder internet.

1. Kies **Nieuw** om een leeg ontwerp te beginnen, of klik op **Voorbeeld** voor een sterhanger die direct ook in 3D verschijnt.
2. Laad een PNG, JPG, WebP, GIF of BMP in. De afbeelding is alleen een overtrekvoorbeeld en wordt niet meegeprint.
3. Teken met pen, stift of potlood. Een stylus geeft bij potlood drukgevoelige lijnen. Met muis en touch wordt de druk gesimuleerd. De tools maken gesloten vectorcontouren; potlood gebruikt een gladde contour in plaats van een korrelige textuur, zodat het printbaar blijft.
4. Kies **Vullen** en klik binnen een gesloten ruimte. Klik op een bestaande vorm om deze opnieuw te kleuren.
5. Kies **Selecteer**, klik op een onderdeel en sleep om het te verplaatsen. De onderdelenlijst biedt kleurwijziging en verwijderen.
6. Stel breedte en dikte in millimeters in. De hoogte schaalt evenredig mee. De 3D-weergave gebruikt dezelfde vorm en maatvoering als de export.
7. Download STL of het OBJ-pakket. Het ZIP-pakket bevat een `.obj`, `.mtl` en kleuren-`.png`; bewaar die in dezelfde map en importeer in millimeters.
8. Sla je project als `.trace3d.json` op. Dit bewaart onderdelen, kleuren, afmetingen en de voorbeeldafbeelding. Open dit bestand om verder te werken.

De tekening en foto worden lokaal verwerkt. Geen accounts, uploads naar een server of analytics. Er is geen automatische opslag: gebruik **Project opslaan** voordat je sluit.

## Navigatie

- Muis, touch en stylus: tekenen.
- Twee vingers: zoomen en het canvas verplaatsen. Op iPhone/iPad wordt vingerinvoer rechtstreeks via Touch Events verwerkt; muis en stylus gebruiken Pointer Events.
- Muiswiel of `+` / `−`: zoomen. Klik op het percentage om de weergave terug te zetten.
- Spatie + slepen, of de middelste muisknop: canvas verplaatsen.
- Ctrl/⌘+Z: ongedaan maken. Ctrl/⌘+Shift+Z: opnieuw.
- Delete/Backspace: geselecteerd onderdeel verwijderen.
- P / M / B / F / E / V: pen / stift / potlood / vullen / gum / selecteer.
- De gum verwijdert hele onderdelen; gedeeltelijk uitgummen is een mogelijke vervolgstap.

## Printmodel en beperkingen

Het resultaat is **2,5D**: de getekende vorm wordt recht geëxtrudeerd tot één ingestelde dikte. Het programma reconstrueert geen volledig ruimtelijk object uit een foto.

STL voegt overlappende vormen samen tot één gesloten oppervlak en behoudt gaten. Losstaande vormen blijven afzonderlijke gesloten printonderdelen; de app meldt dit. Ook bij een gesloten mesh kunnen heel dunne lijnen of kleine openingen problemen geven bij een specifieke printer. Controleer laagvoorbeeld en afmetingen in je slicer. Breedte: 10–250 mm, dikte: 0,6–20 mm. Pas deze aan jouw printer aan.

STL bevat geen kleuren. OBJ bevat materiaalgegevens en een kleurtextuur; kleuren maken je printer niet automatisch geschikt voor meerkleurig printen. Alle onderdelen hebben in v0.1 dezelfde dikte. De referentieafbeelding wordt proportioneel gecentreerd; verplaatsen/roteren van de referentie is nog niet beschikbaar. Vullen gebruikt een raster van 640 × 640 om gesloten ruimtes te vinden en zet deze om naar vectorcontouren; dit is bedoeld voor tekenwerk, niet voor precisie-CAD.

Projectlimieten: 300 onderdelen, 150.000 geïmporteerde punten, afbeelding max. 20 MB (lokaal verkleind tot max. 1600 px) en projectbestand max. 18 MB. Geïmporteerde projectdata wordt gecontroleerd en tekst wordt niet als HTML weergegeven.

## Ontwikkeling

Benodigd: Node.js 22.12+ en npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Gebruik bij ontwikkeling `http://localhost:4173/app.html`; dit laadt de broncode via Vite.

`npm run build` maakt een zelfstandige HTML-app in `dist/index.html` en werkt ook `index.html` in de repository bij. Commit de bijgewerkte `index.html` mee, zodat Pages met publiceren vanaf de branch eveneens de volledige app serveert. Geen externe CDN-verzoeken. De afhankelijkheden en exacte versies staan in `package-lock.json`.

### Structuur

- `src/app.js`: invoer, tekenwerkplek, onderdelen, historie, projecten en 3D-voorbeeld.
- `src/geometry.js`: vectorcontouren, booleaanse samenvoeging, vullen, extrusie en exports.
- `src/style.css`: huisstijl en responsive indeling.
- `app.html`: HTML-sjabloon voor ontwikkeling; `index.html` is de gebouwde app.
- `scripts/build.mjs`: bundelen en alle assets in één HTML-bestand opnemen.
- `tests/geometry.test.mjs`: maatvoering, gesloten mesh, positieve volumes, gaten, overlap, losse vormen, lijnen, materiaal- en textuurcoördinatenexport en begrensd vullen.

De OBJ-export gebruikt dezelfde gesloten geometrie als STL. Kleuren op het bovenvlak worden met een PNG-textuur vastgelegd. Dit voorkomt open mesh-randen op kleurgrenzen.

Bibliotheken: Three.js (MIT), perfect-freehand (MIT), clipper-lib (BSL-1.0), JSZip (MIT/GPL-3.0 dual), esbuild (MIT) en Vite (MIT). Quicksand: SIL Open Font License. Merk/logo: 3dindeklas.

## GitHub Pages

Deze code is gereed voor een eigen repository, bijvoorbeeld `3dindeklas/Trace3D`.

1. Plaats de broncode in de gewenste repository en push naar `main`.
2. Kies in **Settings → Pages → Build and deployment** de bron **GitHub Actions**.
3. De meegeleverde workflow `.github/workflows/pages.yml` controleert de geometrie, bouwt de app en publiceert alleen `dist`.
4. De app gebruikt ingesloten assets en werkt onder een repositorypad zoals `https://3dindeklas.github.io/Trace3D/`.

De workflow gebruikt geen tokens of geheimen in de broncode. GitHub Pages krijgt alleen de beperkte deploymentrechten die in de workflow staan. GitHub-hosting is pas actief na het koppelen en publiceren van een repository.

## Mogelijke volgende uitbreidingen

- Hoogte per onderdeel en een verbindende onderplaat.
- Gedeeltelijk uitgummen, hoekpunten bewerken en geometrische tekentools.
- Verplaatsen en roteren van de referentieafbeelding.
- SVG-import/export en 3MF voor meerkleurige workflows.

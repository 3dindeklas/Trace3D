# Teken naar 3D · 3dindeklas

Een browsertool om een afbeelding over te trekken en de tekening als een plat 3D-model met dikte te exporteren. Huisstijl: Quicksand, paars `#4c325b`, turquoise `#5ab3b1` en geel `#fbbd30`.

## Gebruiken

Open `index.html`, `dist/index.html` of de meegeleverde `Teken-naar-3D.html` in een recente browser. Het gebouwde bestand bevat alle code, fonts en het logo en werkt ook zonder internet.

1. Kies **Nieuw** om een leeg ontwerp te beginnen, of klik op **Voorbeeld** voor een sterhanger die direct ook in 3D verschijnt.
2. Laad een PNG, JPG, WebP, GIF of BMP in. De afbeelding is alleen een overtrekvoorbeeld en wordt niet meegeprint.
3. Teken met pen, stift of potlood. Een stylus geeft bij potlood drukgevoelige lijnen. Met muis en touch wordt de druk gesimuleerd. De tools maken gesloten vectorcontouren; potlood gebruikt een gladde contour in plaats van een korrelige textuur, zodat het printbaar blijft.
4. Kies **Vullen** en klik binnen een gesloten ruimte. Klik op een bestaande vorm om deze opnieuw te kleuren.
5. Kies **Selecteer**, klik op een onderdeel en sleep om het te verplaatsen. De onderdelenlijst biedt kleurwijziging en verwijderen.
6. Stel de breedte en standaardhoogte in millimeters in. Kies een laag om de hoogte vanaf het printbed aan te passen (0,6–20 mm). Vink lagen aan en kies **Groeperen** om ze samen te verplaatsen. Klik op een groepskop voor de hele groep, of op een laagregel om die laag apart te bewerken. De 3D-weergave gebruikt dezelfde kleurvolumes en maatvoering als OBJ.
7. Download STL of het OBJ-pakket. Het OBJ-pakket bevat `.obj` en `.mtl`; pak het uit en houd deze bestanden in dezelfde map. OBJ bevat kleurmaterialen én RGB-vertexkleuren, geen PNG-textuur. Controleer de importkleuren en wijs de gewenste filamenten toe in je slicer.
8. Gebruik **Rechthoek**, **Cirkel** of **Rechte lijn** voor basisvormen. **Vormen vullen** kiest tussen een volle vorm en een rand. Houd Shift ingedrukt voor een vierkant, cirkel of een lijn in stappen van 45 graden. **Eindpunten verbinden** trekt nabijgelegen eindpunten samen. Selecteer een nieuw getekende penlijn en kies **Lijn sluiten** om de opening te dichten.
9. Met het oog verberg je een laag; verborgen lagen tellen niet mee voor de 3D-preview of export. Met het slot bescherm je een laag tegen verplaatsen, kleuren, hoogtewijzigingen en verwijderen. De pijlen veranderen de echte teken- en kleurvolgorde. Een groep verplaatst in de stapel als geheel.
10. Sla je project als `.trace3d.json` op. Dit bewaart lagen, kleuren, laaghoogtes, groepen, afmetingen en de voorbeeldafbeelding. Projectformaat v3 bewaart ook zichtbaarheid, vergrendeling en lijneindpunten en blijft compatibel met v1/v2-bestanden. Open het bestand om verder te werken.
11. De taal volgt de eerste ondersteunde taal van de browser: Nederlands, Engels, Duits of Frans. De taalkiezer onderaan biedt een handmatige keuze die op dit apparaat onthouden wordt; **Automatisch** herstelt browserdetectie. Andere browsertalen vallen terug op Engels. Namen en eigen projectinhoud worden niet vertaald.

De tekening en foto worden lokaal verwerkt. Geen accounts, uploads naar een server of analytics. Wijzigingen worden automatisch op dit apparaat opgeslagen in IndexedDB, inclusief de referentieafbeelding. Bij terugkeer wordt het laatste ontwerp hersteld. De status boven de werkplek geeft aan of het opslaan is gelukt; gebruik **Project opslaan** voor een eigen backupbestand. De herstelkopie hoort bij deze browser en dit websiteadres. Het wissen van browsergegevens verwijdert hem. Beschadigde hersteldata blijft behouden tot je de kopie downloadt of expliciet verwijdert. In browsers die opslag blokkeren blijft tekenen/exporteren beschikbaar en wordt gemeld dat je het project moet downloaden.

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

STL bevat geen kleuren. OBJ bevat echte kleurmaterialen en afzonderlijke niet-overlappende materiaalvolumes; de ondersteuning van OBJ/MTL-kleuren verschilt per slicer en versie. Bij import als één object blijven de onderdelen uitgelijnd. Kies bij import eventuele kleurherkenning en wijs de filamenten in de slicer toe. Kleuren maken je printer niet automatisch geschikt voor meerkleurig printen.

Iedere laag loopt vanaf z=0 tot de ingestelde hoogte. In overlappende volumes bepaalt de laatst getekende laag het materiaal; een hogere eerdere laag blijft erboven zichtbaar. Groeperen verandert de geometrie of stapelvolgorde niet. De standaardhoogte geldt voor lagen zonder eigen hoogte, bestaande eigen hoogtes blijven behouden. Bij verbergen schaalt de ingestelde modelbreedte over de zichtbare geometrie. Vergrendelde lagen worden wel geprint. Als een lid van een groep vergrendeld is, wordt die groep niet versleept of in de stapel verplaatst. De preview toont materiaalvolumes zonder kleurtextuur en gebruikt neutraal licht. Manifold verzorgt de gesloten 3D-unie voor STL, inclusief reliëf en gaten. De referentieafbeelding wordt proportioneel gecentreerd; verplaatsen/roteren van de referentie is nog niet beschikbaar. Vullen gebruikt een raster van 640 × 640 om gesloten ruimtes te vinden en zet deze om naar vectorcontouren; dit is bedoeld voor tekenwerk, niet voor precisie-CAD.

De sluit-hulp gebruikt de vastgelegde middenlijn van nieuwe lijnen; eerder opgeslagen v1/v2-lijnen zonder die informatie blijven zichtbaar en printbaar, maar kunnen niet automatisch met **Lijn sluiten** worden aangepast. Verlies van pointer capture of vensterfocus bewaart een getekende lijn. Expliciete touch-annulering en een tweede vinger tijdens tekenen breken de tijdelijke lijn af om onbedoelde strepen te voorkomen.

Projectlimieten: 300 onderdelen, 150.000 geïmporteerde punten, afbeelding max. 20 MB (lokaal verkleind tot max. 1600 px) en projectbestand max. 18 MB. Geïmporteerde projectdata wordt gecontroleerd en tekst wordt niet als HTML weergegeven.

## Ontwikkeling

Benodigd: Node.js 22.12+ en npm.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Gebruik bij ontwikkeling `http://localhost:4173/app.html`; dit laadt de broncode via Vite.

`npm run build` maakt een zelfstandige HTML-app in `dist/index.html` en werkt ook `index.html` in de repository bij. Commit de bijgewerkte `index.html` mee, zodat Pages met publiceren vanaf de branch eveneens de volledige app serveert. Geen externe CDN-verzoeken. De afhankelijkheden en exacte versies staan in `package-lock.json`.

### Structuur

- `src/app.js`: invoer, tekenwerkplek, onderdelen, historie, projecten en 3D-voorbeeld.
- `src/geometry.js`: vectorcontouren, vullen, Manifold-extrusie en materiaalvolume/exportfuncties.
- `src/drafts.js`: transactionele lokale herstelopslag in IndexedDB.
- `src/editor.js`: zichtbaarheid, bescherming, groepsvolgorde, basisvormen en eindpunthulp.
- `src/i18n.js` en `src/translations.js`: taaldetectie, opgeslagen voorkeur en alle UI-vertalingen.
- `src/style.css`: huisstijl en responsive indeling.
- `app.html`: HTML-sjabloon voor ontwikkeling; `index.html` is de gebouwde app.
- `scripts/build.mjs`: bundelen en alle assets in één HTML-bestand opnemen.
- `tests/editor-browser.test.mjs`: behoud van lijnen bij pointer-/focusverlies, basisvormen/sluiten/vullen, verborgen exportlagen, vergrendeling/volgorde, herstel van foto/groep/hoogte, beschadigde hersteldata en geblokkeerde opslag.
- `tests/editor.test.mjs`: laagfilters, bescherming/volgorde, snapping en vormgeometrie.
- `tests/browser.test.mjs`: taaldetectie, taalvoorkeur, groep/laaghoogtes, groepsverplaatsing, opslaan/heropenen en OBJ-downloads.
- `tests/i18n.test.mjs`: ondersteunde talen, fallback, vertaaldekking en placeholders.
- `tests/geometry.test.mjs`: maatvoering, gesloten mesh, positieve volumes, gaten, overlap, losse vormen, lijnen, materiaal- en textuurcoördinatenexport en begrensd vullen.

STL bevat de gesloten unie van alle volumes. OBJ bevatten gesloten materiaalvolumes die elkaar niet overlappen. De kleurvlakken in de preview komen rechtstreeks uit deze volumes; kleine kleurvlakken worden niet meer aan de kleur van een grote driehoek toegewezen. De gebouwde HTML bevat ook de Manifold-WASM-kern en werkt zonder CDN.

Bibliotheken: Three.js (MIT), perfect-freehand (MIT), clipper-lib (BSL-1.0), JSZip (MIT/GPL-3.0 dual), Manifold (Apache-2.0), esbuild (MIT) en Vite (MIT). Playwright is alleen een ontwikkelafhankelijkheid. Quicksand: SIL Open Font License. Merk/logo: 3dindeklas.

## GitHub Pages

Deze code is gereed voor een eigen repository, bijvoorbeeld `3dindeklas/Trace3D`.

1. Plaats de broncode in de gewenste repository en push naar `main`.
2. Kies in **Settings → Pages → Build and deployment** de bron **GitHub Actions**.
3. De meegeleverde workflow `.github/workflows/pages.yml` controleert de geometrie en talen, bouwt de app en voert browsercontroles uit. Pull requests worden alleen gecontroleerd; publiceren van `dist` gebeurt vanaf `main`.
4. De app gebruikt ingesloten assets en werkt onder een repositorypad zoals `https://3dindeklas.github.io/Trace3D/`.

De workflow gebruikt geen tokens of geheimen in de broncode. GitHub Pages krijgt alleen de beperkte deploymentrechten die in de workflow staan. GitHub-hosting is pas actief na het koppelen en publiceren van een repository.

## Validatie en slicercompatibiliteit

De tests controleren gesloten meshes, positieve volumes, gaten, overlap, kruisende lijnen met verschillende hoogtes, afzonderlijke gesloten kleurvolumes, OBJ-materialen. Browsercontroles testen alle vier talen, hoogtewijzigingen, groeperen, verplaatsen, undo/redo, projectcompatibiliteit, downloads en de mobiele indeling. De fysieke iPhone- en slicerimport blijven handmatig te controleren; de CI draait Chromium.

OBJ/MTL-kleuren volgen de importstructuren in de Bambu Studio-broncode. Versies en importinstellingen kunnen de weergave/toewijzing beïnvloeden. Controleer in de slicer of de kleurvolumes als delen van één object zijn geladen en wijs filamenten toe vóór het slicen.

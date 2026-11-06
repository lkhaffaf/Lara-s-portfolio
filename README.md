# Lara Al-Khaffaf — portfolio

A static site: no build step, no framework. Open `index.html` through any web server.

| File | What it holds |
| --- | --- |
| `app.js` | All content (projects, experience, skills) in the DATA section, plus routing and interactions |
| `styles.css` | Vellum design tokens and every style |
| `scenes.js` | The 3D viewers (Three.js, loaded only on pages that have a model) |
| `DESIGN.md` | Vellum, the design vocabulary. Read it before changing anything visual |
| `assets/img/` | Images extracted from the PDF portfolio |

## Edit text
Change the strings in the DATA section of `app.js`. Each project is one object; each chapter
lists its media in order.

## Add a 3D model from SketchUp
1. Export the model as `.glb` (SketchUp's glTF exporter extension, or Blender: import, then File → Export → glTF Binary).
2. Put it in `assets/models/`, e.g. `assets/models/house.glb`.
3. Add a media item to a chapter in `app.js`:
   ```js
   { model: 'glb', src: 'assets/models/house.glb', fallback: 'res-model', w: 'full', cap: 'SketchUp model of the proposal. Drag to turn.' }
   ```
The viewer centres the model, sits it on the ground and frames it automatically.

## Run it locally
From this folder: `python3 -m http.server 8000`, then open http://localhost:8000.
(Opening `index.html` directly from Finder won't load the 3D models; browsers block that.)

## Host it on GitHub Pages
1. In the repository on github.com: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main` and the folder to `/ (root)`, then **Save**.
3. After a minute or two the site is live at `https://<username>.github.io/<repository>/`.

Every later change pushed to `main` republishes the site automatically.

# School Vakantie Map

A small web app that renders a Leaflet map of Dutch provinces colored by upcoming school-holidays. Useful for visualizing which provinces have upcoming vacation periods and for testing accessibility-friendly color palettes.

**Tech stack**
- Vite + TypeScript
- Leaflet for mapping
- Tailwind CSS for styling
- GitHub Actions for build & Pages deployment

**Quick start**

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

Open `http://localhost:5173` (Vite default) to view the app.

**Build for production**

```bash
npm run build
npm run preview
```

**Deploy to GitHub Pages**

This repository includes a GitHub Actions workflow that builds and deploys the `dist` folder to GitHub Pages when commits are pushed to `main`.

- Make sure `vite.config.ts` `base` is set to `/school-vakantie-map/` or your pages path.
- Push to `main` and check the `Actions` tab for the deployment job.

**Repository layout**

```
index.html
package.json
src/
  main.ts       # app entry
  main.css      # styles
  geo/
    regions.geojson
scripts/
  fetch-geojson.js
.github/
  workflows/
    deploy.yml  # GitHub Actions deploy to Pages
CONTRIBUTING.md
README.md
```

**Contribution & code guidelines**

See `CONTRIBUTING.md` for development workflow, branch naming, PR guidelines, and accessibility requirements.

**Accessibility**

- Follow ARIA best-practices for interactive controls.
- Provide keyboard navigation and focus styles.
- Use high-contrast colors and offer a colorblind-friendly palette.

**Security / Snyk**

Follow the Snyk guidance in `CONTRIBUTING.md` when introducing new code or dependencies. Maintain a secure dependency set and address issues reported by Snyk.

**License**

This project inherits the repository license. By contributing you agree to license your contributions under the same terms.

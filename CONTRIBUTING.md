# Contributing to School Holidays Map

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the School Holidays Map project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions with other contributors.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Basic knowledge of TypeScript, Leaflet, and Tailwind CSS

### Setup Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/school-vakantie-map.git
cd school-vakantie-map
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Project Structure

```
src/
├── main.ts              # Application entry point and main logic
├── main.css             # Global styles and Tailwind configuration
├── geo/
│   └── regions.geojson  # Dutch provinces boundary data (GeoJSON)
scripts/
├── fetch-geojson.js     # Utility script for fetching GeoJSON data
```

## Development Workflow

### Creating a Feature Branch

1. Create a new branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test locally:
```bash
npm run dev
```

3. Build for production to verify:
```bash
npm run build
npm run preview
```

### Code Style

- Use TypeScript for all source files
- Follow existing code conventions in `src/main.ts`
- Format code using Tailwind CSS classes for styling
- Keep functions small and focused
- Add comments for complex logic

### Committing Changes

Write clear, descriptive commit messages:

```bash
git commit -m "feat: add colorblind-friendly palette toggle"
git commit -m "fix: resolve province click handler issue"
git commit -m "docs: update README with accessibility features"
```

Use conventional commit prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (no logic changes)
- `refactor:` - Code restructuring
- `perf:` - Performance improvements
- `test:` - Test-related changes

## Feature Development

### Adding a New Vacation Type Color

Edit the `colorForVacation()` function in `src/main.ts`:

```typescript
function colorForVacation(type?: string): string {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'newvacation': return '#yourcolor';
    // ... other cases
    default: return '#805ad5';
  }
}
```

### Adding UI Controls to Sidebar

The sidebar control is created in `createSidebarControl()` in `src/main.ts`:

1. Create DOM elements within the `onAdd` function
2. Register event listeners
3. Update the `updateSidebarList()` function if needed to refresh the control

### Working with Province Data

Province-level data is stored in these global maps:
- `lastProvinceNextVacation` - Next upcoming vacation per province
- `lastProvinceVacations` - All vacations per province

Access them in functions to render province-specific information.

## Testing

Before submitting a pull request:

1. Test in development mode:
```bash
npm run dev
```

2. Test the production build:
```bash
npm run build
npm run preview
```

3. Verify:
   - Map renders correctly
   - Legend toggles work
   - Date picker filters provinces
   - Sidebar displays correct data
   - No console errors

## Accessibility Requirements

All contributions must consider accessibility:

- Use semantic HTML (`<label>`, `<button>`, `<div role="...">`)
- Include ARIA attributes for screen readers
- Ensure keyboard navigation is supported
- Use high-contrast colors for visibility
- Test with keyboard-only navigation
- Provide text alternatives for visual elements

## Submitting a Pull Request

1. Push your branch to your fork:
```bash
git push origin feature/your-feature-name
```

2. Create a Pull Request on GitHub with:
   - Clear title describing the change
   - Description of what was changed and why
   - Reference any related issues (e.g., "Closes #42")
   - Screenshots/GIFs for UI changes

3. Ensure all checks pass:
   - No TypeScript errors
   - Project builds successfully
   - Changes are tested locally

### PR Review Process

- Maintainers will review your PR
- Address feedback and push additional commits
- PRs should be small and focused (easier to review)
- Once approved, the PR will be merged

## Data Sources

The project uses:
- **Provinces GeoJSON**: Custom-normalized boundaries in `src/geo/regions.geojson`
- **School Holidays API**: Rijksoverheid OpenData API
  - Endpoint: `https://opendata.rijksoverheid.nl/api/v1/infotypes/schoolholidays?output=json`

## Deployment

The project uses GitHub Actions for automated deployment to GitHub Pages:

1. Push to `main` branch triggers the workflow
2. Project is built and deployed to `https://yourusername.github.io/school-vakantie-map/`
3. Check workflow status in the "Actions" tab on GitHub

## Performance Considerations

- Minimize re-renders of the province layer group
- Cache computed province data where possible
- Use event delegation for list items when feasible
- Optimize GeoJSON file size

## Common Issues and Solutions

### Map not displaying
- Ensure `#map` div exists in `index.html`
- Check browser console for errors
- Verify Leaflet CSS is loaded

### Provinces not coloring correctly
- Check that province names in GeoJSON match the API region mappings
- Verify `normalize()` function produces correct keys
- Use the debug panel to inspect province vacation data

### API not returning data
- Check CORS proxy in development (`/api` endpoint)
- Verify API URL in `API_URL` constant
- Check browser Network tab for failed requests

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues/discussions before posting
- Be descriptive and include steps to reproduce for bugs

## License

This project is licensed under the MIT License — see the `LICENSE` file in this repository for the full text.

By contributing, you agree that your contributions will be licensed under the MIT License. Unless you and the
maintainers agree otherwise in writing, contributions submitted to this repository are licensed under the same
MIT terms as the project.

If you have questions about the licensing of your contribution or require a Contributor License Agreement (CLA)
or Developer Certificate of Origin (DCO), please contact the project maintainers before submitting your pull request.

---

Happy contributing! 🎉

## Automated Security Scans (Snyk)

This project includes security best-practices guidance and uses Snyk during development. Follow these steps when adding or changing code:

- Run Snyk code and package scans locally (if you have the Snyk CLI configured):
```bash
# install Snyk (optional)
npm install -g snyk
# run a quick code scan (SAST)
snyk code test
# run dependency/OSS scan
snyk test
```

- If your change introduces new first-party TypeScript/JavaScript code, run a `snyk_code_scan` as part of your local checks and address any flagged issues before opening a PR. See `.github/instructions/snyk_rules.instructions.md` for the project-specific guidance.

If you don't have Snyk installed, include a note in your PR describing why the change is low-risk and request that a maintainer run the scan during review.

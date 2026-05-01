# Deploy Guide

This Phaser/Vite game is a static web app. Run a production build, then upload the `dist` folder to any static hosting service.

## Build

```powershell
npm install
npm run build
```

Output:

```text
dist/
```

## Fastest Options

### Netlify Drop

Good for quick test play links.

1. Run `npm run build`.
2. Open Netlify Drop in a browser.
3. Drag the `dist` folder onto the page.
4. Share the generated URL.

### itch.io

Good if this will become a small playable prototype page.

1. Run `npm run build`.
2. Zip the contents of `dist`.
3. Create a new HTML game project.
4. Upload the ZIP.
5. Enable "This file will be played in the browser".

### GitHub Pages

Good if source code will also be shared or versioned on GitHub.

1. Create a GitHub repository.
2. Push this project.
3. Add a deploy workflow or use a static hosting service connected to the repository.

Note: If deploying under a repository subpath like `https://user.github.io/repo-name/`, Vite may need a `base` setting.

### Vercel / Cloudflare Pages

Good for continuous deployment from Git.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

## Current Build Artifact

The local production build is generated at:

```text
F:\Codex\2026-05-01\2d-wasd-ui-md\game\dist
```

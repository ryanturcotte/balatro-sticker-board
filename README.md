# Balatro Sticker Viewer

A simple, secure, and beautiful web app to view your Balatro Joker completionist progress.

## Features

- **Local Save Parsing**: Upload your `profile.jkr` directly in the browser. Your save file is processed locally and never uploaded to any server.
- **Sticker Visualization**: See exactly which Jokers have Gold, Orange, Purple, etc. stickers.
- **Completionist+ Tracking**: Track your progress towards 100% completion.

## Usage

1.  Open the [live site](https://your-username.github.io/balatro-sticker-viewer/).
2.  Click **Choose Save File**.
3.  Select your `profile.jkr` file.
    - **Windows**: `%AppData%/Balatro/`
    - **Mac**: `~/Library/Application Support/Balatro/`
4.  View your collection!

## Development

### Prerequisites
- Node.js (v18+)

### Setup
```bash
npm install
```

### Build
The project uses Rollup to bundle the parsing logic.
```bash
npm run build
```

### Run Locally
```bash
npx http-server .
```

## Deployment
This repository is configured for **GitHub Pages**.

1.  Push to the `main` or `master` branch.
2.  Go to **Settings > Pages** in your GitHub repository.
3.  Select **GitHub Actions** as the source.
4.  The workflow will automatically build and deploy the site.

## Credits
- **Parsing Logic**: Based on `balatro-save-loader` by WilsontheWolf.
- **Antigravity**: I gave Google Antigravity my save file and the balatro-save-loader source, and it made this pretty quickly for first commit, no editing needed of the site or immediate bugs.
- **Images**: https://balatrogame.fandom.com/

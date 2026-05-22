# 🎮 Vibeport

A beautiful, lightweight, and modern game launcher built with React, Vite, and Electron. It aggregates your games from Steam, GOG, Epic Games, EA App, Ubisoft Connect, Battle.net, and custom folders into one gorgeous unified library.

This project is a **spiritual fork** of the fantastic open-source Linux game launcher [Cartridges](https://github.com/kra-mo/cartridges) by Laura Kramolis (`kra-mo`), rebuilt from the ground up for a native Windows experience.

---

## ✨ Features

- 🚀 **Unified Library**: Automatically scans and lists games from all major launchers:
  - **Steam** (using local Steam library folders)
  - **GOG Galaxy** (via registry keys)
  - **Epic Games Launcher** (via local manifests)
  - **EA App** (via registry and local game lists)
  - **Ubisoft Connect** (via local registry manifests)
  - **Battle.net** (direct Protocol Buffers binary database decoding of `product.db`)
- 🎨 **Automatic Cover Art**: Instantly queries SteamGridDB in the background, downloading high-quality animated (`.webp`) and static covers for all imported and manual games.
- ⚡ **Direct Launcher Protocol**: Launches protocol-based games directly via system shell protocols (e.g. `battlenet://`, `steam://`, `goggalaxy://`) for maximum reliability.
- 💎 **Premium UI**: Sleek, fully responsive single-column modal sheets, built-in support for native Windows theme accent-color changes, and buttery-smooth micro-animations.

---

## 🛠️ Tech Stack

- **Core**: Electron, Node.js
- **Frontend**: React, Vite
- **Styling**: Vanilla CSS, Framer Motion
- **Parsing**: `protobufjs` (for Battle.net binary database decoding)

---

## ⚖️ License & Credits

This project is a **spiritual fork** of [Cartridges](https://github.com/kra-mo/cartridges) by Laura Kramolis (`kra-mo`). The application icon is a modified and fully optimized version of the original Cartridges branding.

- **License**: Licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See the [LICENSE](./LICENSE) file for the full text.
- **Copyleft**: As a derivative work under GPL-3.0, any distribution of this application must remain fully open-source with the Corresponding Source made available to all recipients under the GPL-3.0.

---

## 🚀 Recommended GitHub Deployment & Auto-Updates

Hosting this project on **GitHub** is highly recommended as it integrates seamlessly with `electron-builder` and `electron-updater` to provide fully automated background updates!

### 1. Configure Auto-Updates in the App
Install `electron-updater` as a dependency:
```bash
npm install electron-updater
```

Add the update checker in `electron/main.js`:
```javascript
import { autoUpdater } from 'electron-updater'

app.whenReady().then(() => {
  // ... window creation ...
  
  // Check for updates automatically on start
  autoUpdater.checkForUpdatesAndNotify()
})
```

Add the `publish` block inside `package.json` under your `"build"` configuration:
```json
  "build": {
    "appId": "com.vibeport.app",
    "productName": "Vibeport",
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "YOUR_REPOSITORY_NAME"
    },
    ...
  }
```

### 2. Fully Automated GitHub Actions (CI/CD)
To automate building and packaging your app, create a file named `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*' # Triggers build on tag push, e.g. v1.1.0

permissions:
  contents: write # Allows workflow to draft releases

jobs:
  release:
    runs-on: windows-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-size: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build and Publish Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run build -- --publish always
```

With this workflow active:
1. When you are ready to publish a new version, push a new version tag (e.g. `git tag v1.0.0 && git push origin v1.0.0`).
2. GitHub Actions will spin up a Windows runner, compile the assets, package the portable binary using `electron-builder`, and **create a draft release on GitHub** with the installer attached!
3. Once you publish the release, any installed clients will automatically download and apply the update in the background.

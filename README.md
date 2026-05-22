# 🎮 VibePort

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

## 📦 Releases & Auto-Updates

VibePort is configured with fully automated CI/CD and background auto-updates via GitHub Actions and `electron-updater`.

### How to Release a New Version

1. **Update Version**: Increment the `"version"` field in `package.json` (e.g., `"1.0.1"`).
2. **Commit Changes**: Commit the version bump to main:
   ```bash
   git add package.json
   git commit -m "bump: version 1.0.1"
   git push origin main
   ```
3. **Push a New Tag**: Create and push a tag matching the new version:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. **Publish Draft Release**:
   * Pushing the tag automatically triggers the **Build and Release** workflow on GitHub Actions.
   * GitHub Actions will build the production installer (`VibePort Setup 1.0.1.exe`) and upload it as a **Draft Release** under the [Releases](https://github.com/thisischrys/VibePort/releases) tab.
   * Open the draft release on GitHub, click **Edit**, and then click **Publish Release**.
5. **Auto-Update**: Once published, all installed clients will automatically detect the update on next launch, download it in the background, and seamlessly apply it when closed.


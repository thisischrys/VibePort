# 🎮 VibePort

A beautiful, lightweight, and modern game launcher built with React, Vite, and Electron. It aggregates your games from Steam, GOG, Epic Games, EA App, Ubisoft Connect, Battle.net, and custom folders into one gorgeous unified library.

<p align="left">
  <a href="https://github.com/thisischrys/VibePort/releases/latest/download/VibePort%20Setup.exe">
    <img src="https://img.shields.io/badge/Download-VibePort%20Setup-blueviolet?style=for-the-badge&logo=windows&logoColor=white" alt="Download VibePort" />
  </a>
  <a href="https://github.com/thisischrys/VibePort/releases/latest">
    <img src="https://img.shields.io/github/v/release/thisischrys/VibePort?style=for-the-badge&color=blue" alt="Latest Release" />
  </a>
</p>

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

## 📦 Development & Releases

For detailed instructions on how to run VibePort locally or release new versions with automated auto-updates, please refer to the [DEVELOPMENT.md](./DEVELOPMENT.md) guide.



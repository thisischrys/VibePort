# 🛠️ VibePort Development & Releases

This document contains instructions for running VibePort locally, building the application, and releasing new versions.

## 💻 Local Development

To run the application locally in development mode:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Dev Mode**:
   ```bash
   npm run dev
   ```

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
   git tag 1.0.1
   git push origin 1.0.1
   ```
4. **Publish Draft Release**:
   * Pushing the tag automatically triggers the **Build and Release** workflow on GitHub Actions.
   * GitHub Actions will build the production installer (`VibePort Setup 1.0.1.exe`) and upload it as a **Draft Release** under the [Releases](https://github.com/thisischrys/VibePort/releases) tab.
   * Open the draft release on GitHub, click **Edit**, and then click **Publish Release**.
5. **Auto-Update**: Once published, all installed clients will automatically detect the update on next launch, download it in the background, and seamlessly apply it when closed.

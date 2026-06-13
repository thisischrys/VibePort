# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Mouse Navigation Support**: Added support for mouse XButton1 (button 3 / Back) to navigate back from Details and Hidden views, and XButton2 (button 4 / Forward) to restore the previous view state (re-opening details or returning to Hidden Games).
- **Dynamic Cover Gradient Background**: Game info details screen now features a static background gradient dynamically generated from sampled cover art colors.
- **CI/CD Pipeline**: Configured GitHub Actions workflow for automated Vitest and Playwright test validation on push/PR.
- **Xbox Brand Integration**: Updated Xbox launcher brand icon with a clean SVG logo.

### Changed
- **Unified Transparent Titlebar**: Details slider now runs full-height behind a transparent window titlebar to avoid header color separation.
- **Fixed Button Highlight Cutoff**: Fixed right-edge hover highlights on collapsed sidebar toggle and details back buttons by dynamically resizing padding-left.
- **Hiding & Deletion Flow**: Hiding or deleting a game directly from its Details View now correctly triggers toast notifications and returns the user to the cover grid.
- **Test Mode Isolation**: Bypassed Electron single-instance locks and isolated test userData paths to allow local E2E validation parallel to running instances.

### Fixed
- **Keyboard Shortcut Conflicts**: Disabled all global keyboard shortcuts (except Escape) when any modal (Preferences, Shortcuts, About, Add, Edit) is open to prevent overlapping navigation actions.

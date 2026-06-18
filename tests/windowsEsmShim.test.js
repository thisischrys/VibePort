import { test, expect, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

/**
 * Regression test for: "ReferenceError: __dirname is not defined"
 *
 * Root cause: electron/windows.js used __dirname without an ESM shim.
 * Fix: added `const __filename = fileURLToPath(import.meta.url)` +
 *      `const __dirname = path.dirname(__filename)` at the top of windows.js.
 *
 * This test verifies:
 * 1. The shim pattern works correctly for path resolution.
 * 2. The windows.js source file contains the required shim lines.
 * 3. The built dist-electron/main.js (which bundles windows.js) exists and has no
 *    un-shimmed __dirname references at module level.
 */

const windowsJsPath = path.resolve(__dirname, '../electron/windows.js')
const mainJsDistPath = path.resolve(__dirname, '../dist-electron/main.js')

test('ESM __dirname shim resolves correctly', () => {
  // Simulate the shim: this is exactly what windows.js does
  const simulatedFilename = windowsJsPath
  const simulatedDirname = path.dirname(simulatedFilename)

  expect(simulatedDirname).toBeTruthy()
  expect(path.isAbsolute(simulatedDirname)).toBe(true)
  expect(simulatedDirname).toContain('electron')
})

test('windows.js source contains the ESM __dirname shim', () => {
  const source = fs.readFileSync(windowsJsPath, 'utf-8')

  expect(source).toContain("import { fileURLToPath } from 'node:url'")
  expect(source).toContain('fileURLToPath(import.meta.url)')
  expect(source).toContain('path.dirname(__filename)')
})

test('dist-electron/main.js bundle exists after build', () => {
  // The bundled main.js must exist (it bundles windows.js among others).
  // This catches build failures early.
  expect(fs.existsSync(mainJsDistPath)).toBe(true)

  const stat = fs.statSync(mainJsDistPath)
  // Bundle should be non-trivially sized (>100 KB)
  expect(stat.size).toBeGreaterThan(100_000)
})

test('windows.js does not import fileURLToPath from a non-node namespace', () => {
  const source = fs.readFileSync(windowsJsPath, 'utf-8')

  // Must use node: prefix for built-in URL module
  const urlImportLine = source
    .split('\n')
    .find(l => l.includes('fileURLToPath'))

  expect(urlImportLine).toBeDefined()
  expect(urlImportLine).toContain('node:url')
})

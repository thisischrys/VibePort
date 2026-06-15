import { test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

test('changelog contains entry for current package version', () => {
  const packagePath = path.resolve(__dirname, '../package.json')
  const changelogPath = path.resolve(__dirname, '../public/changelog.md')

  const pkgContent = fs.readFileSync(packagePath, 'utf-8')
  const pkg = JSON.parse(pkgContent)
  const version = pkg.version

  const changelog = fs.readFileSync(changelogPath, 'utf-8')

  expect(changelog).toContain(`# VibePort ${version}`)
})

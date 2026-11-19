#!/usr/bin/env node
// Commits and pushes the files a release bump changed, after a build was published.
//   node scripts/commit-publish.mjs <android|ios> [--dry-run]
// Message: "Publish Android 1.0.95" / "Publish iOS 1.0.95". Only the version files are committed
// (package.json, package-lock.json, plus the Xcode project for iOS), whatever else is staged.
// Called by the `store.hooks.afterBuildUpload` hook (reusable-dev-scripts.config.mjs) once an internal upload succeeded.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Fastlane runs this from store/fastlane, so everything is relative to the repo root, not the cwd.
const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const [platform, ...flags] = process.argv.slice(2)
const dryRun = flags.includes('--dry-run')

const labels = { android: 'Android', ios: 'iOS' }
const versionFiles = {
  android: ['package.json', 'package-lock.json'],
  ios: ['package.json', 'package-lock.json', 'ios/App/App.xcodeproj/project.pbxproj'],
}

if (!labels[platform]) {
  console.error('Usage: node scripts/commit-publish.mjs <android|ios> [--dry-run]')
  process.exit(2)
}

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8', cwd: repoRoot })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  return result
}

function gitOrFail(...args) {
  const result = git(...args)
  if (result.status !== 0) {
    console.error(`git ${args.join(' ')} failed:\n${result.stderr || result.stdout}`)
    console.error('The build was published; commit and push the version files yourself.')
    process.exit(1)
  }
  return result.stdout
}

const { version } = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
const message = `Publish ${labels[platform]} ${version}`

const changed = gitOrFail('status', '--porcelain', '--', ...versionFiles[platform])
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3))

if (!changed.length) {
  console.log(`No version files changed: nothing to commit for "${message}".`)
  process.exit(0)
}

if (dryRun) {
  console.log(`Would commit ${changed.join(', ')} as "${message}" and push.`)
  process.exit(0)
}

gitOrFail('add', '--', ...changed)
// The pathspec keeps anything else that is staged out of this commit.
gitOrFail('commit', '-m', message, '--', ...changed)
console.log(`Committed ${changed.join(', ')}: ${message}`)
gitOrFail('push')
console.log('Pushed.')

const leftover = gitOrFail('status', '--porcelain').trim()
if (leftover) {
  console.log(`Not included (other uncommitted changes):\n${leftover}`)
}

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { copyFile, cp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const LIGHT_SVG = resolve('public/opencode-mobile-client-logo-light.svg')
const DARK_SVG = resolve('public/opencode-mobile-client-logo-dark.svg')
const ASSETS_DIR = resolve('assets')
const PUBLIC_DIR = resolve('public')
const ICONS_DIR = resolve('icons')
const PUBLIC_ICONS_DIR = resolve('public/icons')
const DOCS_DIR = resolve('docs')
const ANDROID_RES = resolve('android/app/src/main/res')

const BG_LIGHT = '#f1ecec'
const BG_DARK = '#151515'

const ICON_SIZE = 1024
const SPLASH_SIZE = 2732
const APPLE_TOUCH_SIZE = 180
const SPLASH_LOGO_MAX = 640

const FOREGROUND_DENSITIES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

async function renderSvgOnBg(svgPath, targetSize, bgColor) {
  return sharp(readFileSync(svgPath))
    .resize(targetSize, targetSize, {
      fit: 'contain',
      background: bgColor,
      kernel: sharp.kernel.lanczos3,
    })
    .flatten({ background: bgColor })
    .png({ compressionLevel: 6 })
    .toBuffer()
}

async function renderSvgCenteredOnBg(svgPath, canvasSize, logoMaxDimension, bgColor) {
  const svg = readFileSync(svgPath)
  const meta = await sharp(svg).metadata()
  const svgWidth = meta.width ?? 360
  const svgHeight = meta.height ?? 380
  const logoScale = logoMaxDimension / Math.max(svgWidth, svgHeight)
  const logoWidth = Math.round(svgWidth * logoScale)
  const logoHeight = Math.round(svgHeight * logoScale)

  const logoBuffer = await sharp(svg)
    .resize(logoWidth, logoHeight, {
      fit: 'fill',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([{
      input: logoBuffer,
      top: Math.round((canvasSize - logoHeight) / 2),
      left: Math.round((canvasSize - logoWidth) / 2),
    }])
    .png({ compressionLevel: 6 })
    .toBuffer()
}

async function createSolidImage(width, height, color) {
  return sharp({
    create: { width, height, channels: 4, background: color },
  })
    .png({ compressionLevel: 6 })
    .toBuffer()
}

async function moveIconsToPublic() {
  if (existsSync(ICONS_DIR)) {
    rmSync(PUBLIC_ICONS_DIR, { recursive: true, force: true })
    ensureDir(PUBLIC_ICONS_DIR)
    await cp(ICONS_DIR, PUBLIC_ICONS_DIR, { recursive: true })
    rmSync(ICONS_DIR, { recursive: true, force: true })
    console.log('Moved icons/ → public/icons/')
  }
}

function fixManifestPaths() {
  const manifestPath = resolve(PUBLIC_DIR, 'manifest.webmanifest')
  if (!existsSync(manifestPath)) return

  let manifest = readFileSync(manifestPath, 'utf-8')
  const fixed = manifest.replace(/"\.\.\/icons\//g, '"./icons/')
  if (fixed !== manifest) {
    writeFile(manifestPath, fixed)
    console.log('Fixed ../icons/ → ./icons/ in manifest.webmanifest')
  }
}

async function generateCapacitorAssetsInputs() {
  ensureDir(ASSETS_DIR)

  console.log('assets/icon-only.png')
  await writeFile(
    resolve(ASSETS_DIR, 'icon-only.png'),
    await renderSvgOnBg(LIGHT_SVG, ICON_SIZE, BG_LIGHT),
  )

  console.log('assets/icon-background.png')
  await writeFile(
    resolve(ASSETS_DIR, 'icon-background.png'),
    await createSolidImage(ICON_SIZE, ICON_SIZE, BG_LIGHT),
  )

  console.log('assets/splash.png')
  await writeFile(
    resolve(ASSETS_DIR, 'splash.png'),
    await renderSvgCenteredOnBg(LIGHT_SVG, SPLASH_SIZE, SPLASH_LOGO_MAX, BG_LIGHT),
  )

  console.log('assets/splash-dark.png')
  await writeFile(
    resolve(ASSETS_DIR, 'splash-dark.png'),
    await renderSvgCenteredOnBg(DARK_SVG, SPLASH_SIZE, SPLASH_LOGO_MAX, BG_DARK),
  )
}

async function generateStandaloneAssets() {
  console.log('public/apple-touch-icon.png')
  await writeFile(
    resolve(PUBLIC_DIR, 'apple-touch-icon.png'),
    await renderSvgOnBg(LIGHT_SVG, APPLE_TOUCH_SIZE, BG_LIGHT),
  )
}

async function copyDocsAssets() {
  ensureDir(DOCS_DIR)
  const files = [
    'favicon.svg',
    'opencode-mobile-client-logo-dark.svg',
    'opencode-mobile-client-logo-light.svg',
  ]
  for (const file of files) {
    const src = resolve(PUBLIC_DIR, file)
    const dest = resolve(DOCS_DIR, file)
    await copyFile(src, dest)
    console.log(`docs/${file}`)
  }
}

async function generateAdaptiveIconForegrounds(svgPath) {
  const svg = readFileSync(svgPath)

  for (const [density, size] of Object.entries(FOREGROUND_DENSITIES)) {
    const outputPath = resolve(ANDROID_RES, `mipmap-${density}`, 'ic_launcher_foreground.png')
    if (!existsSync(resolve(ANDROID_RES, `mipmap-${density}`))) continue

    console.log(`mipmap-${density}/ic_launcher_foreground.png`)
    const image = await sharp(svg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 6 })
      .toBuffer()

    await writeFile(outputPath, image)
  }
}

async function main() {
  const isPostCap = process.argv.includes('--post-cap')

  if (isPostCap) {
    await moveIconsToPublic()
    fixManifestPaths()
    await generateAdaptiveIconForegrounds(LIGHT_SVG)
    return
  }

  await generateCapacitorAssetsInputs()
  await generateStandaloneAssets()
  await copyDocsAssets()

  await moveIconsToPublic()
  fixManifestPaths()

  console.log('✓ Done')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err))
  process.exitCode = 1
})

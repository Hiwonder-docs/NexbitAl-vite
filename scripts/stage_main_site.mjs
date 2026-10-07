import { access, mkdir, rm, cp, readdir, readFile, writeFile, unlink } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join, extname, basename } from 'path'
import { setTimeout as delay } from 'timers/promises'
import sharp from 'sharp'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = join(__dirname, '..')

const projectName = process.env.DOCS_PROJECT || 'NexbitAl'
const version = process.env.DOCS_VERSION || process.argv[2] || 'latest'

const validVersions = ['latest', 'standard']
if (!validVersions.includes(version) || projectName !== 'NexbitAl') {
  throw new Error('Expected NexbitAl with version latest or standard')
}

// Verify the build before replacing an existing version's artifacts.
const builtIndex = await readFile(join(repositoryRoot, 'docs/.vitepress/dist/index.html'), 'utf8')
const expectedBase = `/projects/${projectName}/en/${version}/`
if (!builtIndex.includes(expectedBase)) {
  throw new Error(`Build does not match ${expectedBase}; run npm run build:${version} first`)
}

const targetDir = join(repositoryRoot, 'projects', projectName, 'en', version)
await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })

await cp(
  join(repositoryRoot, 'docs/.vitepress/dist'),
  targetDir,
  { recursive: true }
)

await convertRasterImagesToWebp(targetDir)
await copyPdfAssets(targetDir)

console.log('Staged files to:', targetDir)

async function copyPdfAssets(targetDir) {
  const pdfSourceDir = join(repositoryRoot, 'content', version, '_static', 'shared', 'pdf')
  if (!await pathExists(pdfSourceDir)) {
    return
  }

  await cp(
    pdfSourceDir,
    join(targetDir, '_static', 'shared', 'pdf'),
    { recursive: true }
  )
}

async function walkFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(entryPath))
    } else if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

function isConvertibleRasterImage(filePath) {
  const extension = extname(filePath).toLowerCase()
  return extension === '.png' || extension === '.jpg' || extension === '.jpeg'
}

function isTextAsset(filePath) {
  const extension = extname(filePath).toLowerCase()
  return (
    extension === '.html' ||
    extension === '.js' ||
    extension === '.css' ||
    extension === '.json' ||
    extension === '.mjs' ||
    extension === '.txt' ||
    extension === '.xml' ||
    extension === '.svg' ||
    extension === '.md' ||
    extension === '.map'
  )
}

async function convertRasterImagesToWebp(rootDir) {
  const allFiles = await walkFiles(rootDir)
  const rasterFiles = allFiles.filter(isConvertibleRasterImage)
  const replacements = new Map()
  const imageCacheDir = join(repositoryRoot, 'docs/.vitepress/cache/webp')
  await mkdir(imageCacheDir, { recursive: true })

  for (const filePath of rasterFiles) {
    const metadata = await sharp(filePath).metadata()
    // WebP supports at most 16383 pixels in either dimension. Keep long diagrams intact.
    if ((metadata.width || 0) > 16383 || (metadata.height || 0) > 16383) {
      console.log(`Keeping oversized image as original: ${basename(filePath)}`)
      continue
    }
    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp')
    // Cache by source bytes and conversion settings; shared images keep the same quality.
    const sourceHash = createHash('sha256').update(await readFile(filePath)).digest('hex')
    const cachedPath = join(imageCacheDir, `${sourceHash}-q90-a100-e6.webp`)
    if (await pathExists(cachedPath)) {
      await cp(cachedPath, webpPath)
    } else {
      await sharp(filePath)
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toFile(webpPath)
      await cp(webpPath, cachedPath)
    }
    await unlink(filePath)
    replacements.set(basename(filePath), basename(webpPath))
  }

  const textFiles = allFiles.filter(isTextAsset)

  for (const filePath of textFiles) {
    let content = await readFile(filePath, 'utf8')
    let changed = false

    for (const [oldName, newName] of replacements) {
      if (content.includes(oldName)) {
        content = content.split(oldName).join(newName)
        changed = true
      }
    }

    if (changed) {
      await writeTextFileWithRetry(filePath, content)
    }
  }
}

async function writeTextFileWithRetry(filePath, content, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await writeFile(filePath, content)
      return
    } catch (error) {
      if (attempt === retries) {
        throw error
      }

      await delay(200 * (attempt + 1))
    }
  }
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

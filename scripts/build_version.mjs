import { access, mkdir, rm, cp, readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = join(__dirname, '..')

const version = process.argv[2]
if (!version) {
  console.error('Usage: node scripts/build_version.mjs <version>')
  console.error('Example: node scripts/build_version.mjs latest')
  process.exit(1)
}

const validVersions = ['latest', 'standard']
if (!validVersions.includes(version)) {
  console.error(`Invalid version: ${version}`)
  console.error(`Valid versions: ${validVersions.join(', ')}`)
  process.exit(1)
}

const contentDirName = version
const projectName = 'NexbitAl'
const docsBase = `/projects/${projectName}/en/${version}/`
const rootIndexPath = join(repositoryRoot, 'docs', 'index.md')

console.log(`\n========== Building ${version} ==========`)
console.log(`DOCS_BASE: ${docsBase}`)

// 1. Copy content to docs working directory
const contentDir = join(repositoryRoot, 'content', contentDirName)
const contentDocsDir = join(contentDir, 'docs')
const contentStaticDir = join(contentDir, '_static')
const versionRootIndexPath = join(contentDocsDir, 'index.md')
const docsDocsDir = join(repositoryRoot, 'docs', 'docs')
const docsStaticDir = join(repositoryRoot, 'docs', '_static')
const originalRootIndex = await readFile(rootIndexPath, 'utf8')
// Use the version's own entry page so both redirects stay in sync.
const rootRedirectIndex = await readFile(versionRootIndexPath, 'utf8')
await access(contentStaticDir)

try {
  await writeFile(rootIndexPath, rootRedirectIndex)

  console.log('\n[1/3] Copying content files...')
  await rm(docsDocsDir, { recursive: true, force: true })
  await rm(docsStaticDir, { recursive: true, force: true })
  if (await pathExists(contentDocsDir)) {
    await cp(contentDocsDir, docsDocsDir, { recursive: true })
  } else {
    await mkdir(docsDocsDir, { recursive: true })
    await cp(versionRootIndexPath, join(docsDocsDir, 'index.md'))
  }
  if (await pathExists(contentStaticDir)) {
    await cp(contentStaticDir, docsStaticDir, { recursive: true })
  } else {
    await mkdir(docsStaticDir, { recursive: true })
  }
  console.log('  Done.')

  // 2. Build with VitePress
  console.log('\n[2/3] Building with VitePress...')
  execSync('npx vitepress build docs', {
    stdio: 'inherit',
    cwd: repositoryRoot,
    env: { ...process.env, DOCS_BASE: docsBase, DOCS_VERSION: version }
  })
  console.log('  Done.')

  // 3. Stage to projects directory
  console.log('\n[3/3] Staging to projects directory...')
  execSync('node scripts/stage_main_site.mjs', {
    stdio: 'inherit',
    cwd: repositoryRoot,
    env: { ...process.env, DOCS_VERSION: version }
  })

  console.log(`\n========== ${version} build complete ==========\n`)
} finally {
  await writeFile(rootIndexPath, originalRootIndex)
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

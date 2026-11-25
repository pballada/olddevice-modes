// Checks every mode in modes/. Usage: npm run check (BASE_REF and BREAKING_OK come from CI).
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { parse } from 'acorn'
import { validateManifest } from './manifest.js'
import { loadScreen, fakeRoot } from './sandbox.js'

const RUNTIME = join(dirname(fileURLToPath(import.meta.url)), '..', 'runtime', 'runtime.js')

const JS_RULES = [
  [/XMLHttpRequest/, 'XMLHttpRequest'], [/\bfetch\s*\(/, 'fetch'], [/WebSocket/, 'WebSocket'],
  [/localStorage/, 'localStorage'], [/sessionStorage/, 'sessionStorage'], [/document\s*\.\s*cookie/, 'document.cookie'],
  [/\beval\s*\(/, 'eval'], [/\bFunction\s*\(/, 'Function('], [/\bimport\b/, 'import'], [/<script/i, '<script'], [/\bsrc\s*=/i, 'src='],
]
const CSS_RULES = [[/url\s*\(/i, 'url('], [/@import/i, '@import']]

const readJson = p => JSON.parse(readFileSync(p, 'utf8'))

function checkMode(root, id, sources) {
  const dir = join(root, 'modes', id)
  const errs = []
  const err = (file, msg) => errs.push(`${id}: ${file}: ${msg}`)
  let m
  try { m = readJson(join(dir, 'mode.json')) } catch { err('mode.json', 'invalid JSON'); return errs }
  for (const e of validateManifest(m, { folder: id, sources })) err('mode.json', e)

  const jsPath = join(dir, 'screen.js')
  if (!existsSync(jsPath)) { err('screen.js', 'missing'); return errs }
  const js = readFileSync(jsPath, 'utf8')
  try { parse(js, { ecmaVersion: 5 }) } catch (e) { err('screen.js', `not ES5 (${e.message})`); return errs }
  for (const [re, name] of JS_RULES) if (re.test(js)) err('screen.js', `uses ${name}`)
  const cssPath = join(dir, 'screen.css')
  if (existsSync(cssPath)) {
    const css = readFileSync(cssPath, 'utf8')
    for (const [re, name] of CSS_RULES) if (re.test(css)) err('screen.css', `uses ${name}`)
  }
  if (errs.length) return errs

  try {
    const ctx = loadScreen([RUNTIME, jsPath], { safari9: true, stubTimers: true })
    const ids = Object.keys(ctx.OD.modes)
    if (ids.length !== 1 || ids[0] !== id) { err('screen.js', `must register exactly one mode named "${id}"`); return errs }
    const dataPath = join(dir, 'example-data.json')
    const data = existsSync(dataPath) ? readJson(dataPath) : null
    const h = ctx.OD.startMode(id, fakeRoot(), m.example, data)
    if (data) h.update(data)
    h.stop()
  } catch (e) { err('screen.js', `example failed to render: ${e.message}`) }
  return errs
}

function compatErrors(root, baseRef, current) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  let baseIds
  try { baseIds = git('ls-tree', '--name-only', `${baseRef}:modes`).split('\n').filter(Boolean) } catch { return [] }
  const errs = []
  for (const id of baseIds) {
    if (!current.includes(id)) { errs.push(`${id}: removes this mode (add the breaking-ok label if intended)`); continue }
    let before, after
    try { before = JSON.parse(git('show', `${baseRef}:modes/${id}/mode.json`)); after = readJson(join(root, 'modes', id, 'mode.json')) } catch { continue }
    for (const s of before.settings || []) {
      const now = (after.settings || []).find(x => x.key === s.key)
      if (now && now.type !== s.type) errs.push(`${id}: mode.json: changes the type of ${s.key} (add the breaking-ok label if intended)`)
    }
  }
  return errs
}

export function runChecks({ root = '.', baseRef = null, breakingOk = false } = {}) {
  const sourcesPath = join(root, 'sources.json')
  const sources = existsSync(sourcesPath) ? readJson(sourcesPath) : {}
  const ids = existsSync(join(root, 'modes')) ? readdirSync(join(root, 'modes'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort() : []
  const errors = ids.flatMap(id => checkMode(root, id, sources))
  if (baseRef && !breakingOk) errors.push(...compatErrors(root, baseRef, ids))
  return { errors, count: ids.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, count } = runChecks({ root: '.', baseRef: process.env.BASE_REF || null, breakingOk: process.env.BREAKING_OK === 'true' })
  if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
  console.log(`All modes OK (${count})`)
}

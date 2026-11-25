import { test, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { runChecks } from '../tools/check.js'

const manifest = (id, extra = {}) => ({
  id, name: 'Test', description: 'A mode used by the checker tests.', settings: [], source: null, example: {}, ...extra,
})
const GOOD_JS = id => `OD.registerMode('${id}', { render: function (root) { root.innerHTML = 'ok'; return { stop: function () {} }; } });`

// Builds a temporary repo root with one mode folder.
function fixture(id, { json = manifest(id), js = GOOD_JS(id), css } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'odm-'))
  const dir = join(root, 'modes', id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'mode.json'), JSON.stringify(json))
  writeFileSync(join(dir, 'screen.js'), js)
  if (css !== undefined) writeFileSync(join(dir, 'screen.css'), css)
  return root
}
const errorsOf = (root, opts) => runChecks({ root, ...opts }).errors.join('\n')

test('the real modes pass', () => expect(runChecks({ root: '.' }).errors).toEqual([]))
test('fetch is rejected', () => expect(errorsOf(fixture('a', { js: GOOD_JS('a') + ' fetch("/x");' }))).toMatch(/a: screen\.js: uses fetch/))
test('localStorage is rejected', () => expect(errorsOf(fixture('a', { js: GOOD_JS('a') + ' localStorage.x = 1;' }))).toMatch(/uses localStorage/))
test('url( in css is rejected', () => expect(errorsOf(fixture('a', { css: '.m-a-x { background: url(https://evil.example/x.png); }' }))).toMatch(/a: screen\.css: uses url\(/))
test('@import in css is rejected', () => expect(errorsOf(fixture('a', { css: '@import "https://evil.example/a.css";' }))).toMatch(/uses @import/))
test('ES6 is rejected', () => expect(errorsOf(fixture('a', { js: GOOD_JS('a') + ' var f = () => 1;' }))).toMatch(/a: screen\.js: not ES5/))
test('a mode that throws on render is rejected', () => {
  expect(errorsOf(fixture('a', { js: "OD.registerMode('a', { render: function () { throw new Error('boom'); } });" }))).toMatch(/a: screen\.js: example failed to render: boom/)
})
test('registering under another id is rejected', () => expect(errorsOf(fixture('a', { js: GOOD_JS('b') }))).toMatch(/must register exactly one mode named "a"/))
test('id must match folder', () => expect(errorsOf(fixture('a', { json: manifest('b') }))).toMatch(/a: mode\.json: id must match folder/))
test('invalid JSON is reported', () => {
  const root = fixture('a'); writeFileSync(join(root, 'modes/a/mode.json'), '{nope')
  expect(errorsOf(root)).toMatch(/a: mode\.json: invalid JSON/)
})

test('changing a setting type or removing a mode needs breaking-ok', () => {
  const root = fixture('a', { json: manifest('a', { settings: [{ key: 'x', type: 'boolean', label: 'X', default: false }], example: { x: false } }) })
  cpSync(join(root, 'modes/a'), join(root, 'modes/gone'), { recursive: true })
  writeFileSync(join(root, 'modes/gone/mode.json'), JSON.stringify(manifest('gone')))
  writeFileSync(join(root, 'modes/gone/screen.js'), GOOD_JS('gone'))
  const git = c => execSync(`git -C ${root} ${c}`, { stdio: 'pipe' })
  git('init -q -b main'); git('add -A'); git('-c user.email=t@t -c user.name=t commit -qm base')
  writeFileSync(join(root, 'modes/a/mode.json'), JSON.stringify(manifest('a', { settings: [{ key: 'x', type: 'choice', label: 'X', default: 'y', options: [{ value: 'y', label: 'Y' }] }], example: { x: 'y' } })))
  execSync(`rm -rf ${join(root, 'modes/gone')}`)
  const errs = errorsOf(root, { baseRef: 'main' })
  expect(errs).toMatch(/a: mode\.json: changes the type of x/)
  expect(errs).toMatch(/gone: removes this mode/)
  expect(errorsOf(root, { baseRef: 'main', breakingOk: true })).toBe('')
})

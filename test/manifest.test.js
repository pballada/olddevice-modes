import { test, expect } from 'vitest'
import { validateManifest } from '../tools/manifest.js'

const clock = () => ({
  id: 'clock', name: 'Clock', description: 'A big wall clock, with an optional second time zone.',
  settings: [
    { key: 'hour12', type: 'boolean', label: '12-hour clock', default: false },
    { key: 'tz2', type: 'timezone', label: 'Second time zone', optional: true, default: null },
  ],
  source: null,
  example: { hour12: false, tz2: 'America/New_York' },
})
const errs = (m, opts = {}) => validateManifest(m, { folder: 'clock', sources: {}, ...opts })

test('a valid clock manifest has no errors', () => expect(errs(clock())).toEqual([]))
test('id must match the folder', () => expect(errs(clock(), { folder: 'other' }).join()).toMatch(/id must match folder/))
test('bad id characters', () => { const m = clock(); m.id = 'Clock!'; expect(errs(m, { folder: 'Clock!' }).join()).toMatch(/id/) })
test('unknown setting type', () => { const m = clock(); m.settings[0].type = 'color'; expect(errs(m).join()).toMatch(/unknown type "color"/) })
test('setting without default', () => { const m = clock(); delete m.settings[0].default; expect(errs(m).join()).toMatch(/needs a default/) })
test('duplicate keys', () => { const m = clock(); m.settings[1].key = 'hour12'; expect(errs(m).join()).toMatch(/duplicate/) })
test('missing name or description', () => { const m = clock(); delete m.name; expect(errs(m).join()).toMatch(/name/) })
test('source type must be offered', () => {
  const m = clock(); m.source = { type: 'rss', settings: [], refreshMinutes: 15 }
  expect(errs(m).join()).toMatch(/source "rss" is not offered/)
  expect(errs(m, { sources: { rss: {} } })).toEqual([])
})
test('source refreshMinutes range and settings keys', () => {
  const m = clock(); m.source = { type: 'rss', settings: ['nope'], refreshMinutes: 5 }
  const e = errs(m, { sources: { rss: {} } }).join()
  expect(e).toMatch(/refreshMinutes/)
  expect(e).toMatch(/unknown setting "nope"/)
})
test('example must be valid settings', () => { const m = clock(); m.example.tz2 = 'Mars/Base'; expect(errs(m).join()).toMatch(/example/) })
test('choice needs options, list needs of and maxItems ≤ 20, text maxLength ≤ 200', () => {
  const m = clock()
  m.settings.push({ key: 'a', type: 'choice', label: 'A', default: null, optional: true })
  m.settings.push({ key: 'b', type: 'list', label: 'B', default: null, optional: true, of: { type: 'url' }, maxItems: 50 })
  m.settings.push({ key: 'c', type: 'text', label: 'C', default: null, optional: true, maxLength: 500 })
  const e = errs(m).join()
  expect(e).toMatch(/a: choice needs options/)
  expect(e).toMatch(/b: maxItems/)
  expect(e).toMatch(/c: maxLength/)
})

test('url settings also need a numeric maxLength (blocks HTML in dashboard attributes)', () => {
  const m = clock()
  m.settings.push({ key: 'u', type: 'url', label: 'U', default: null, optional: true, maxLength: '"><img src=x onerror=alert(1)>' })
  expect(errs(m).join()).toMatch(/u: maxLength/)
})

test('number min, max and step must be finite numbers', () => {
  const m = clock()
  m.settings.push({ key: 'n', type: 'number', label: 'N', default: 1, min: '"><b>' })
  expect(errs(m).join()).toMatch(/n: min, max and step/)
})

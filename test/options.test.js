import { test, expect } from 'vitest'
import { checkOptions, normalizeOptions } from '../tools/options.js'

const CLOCK = [
  { key: 'hour12', type: 'boolean', label: '12-hour clock', default: false },
  { key: 'tz2', type: 'timezone', label: 'Second time zone', optional: true, default: null },
]
const s = (setting) => [{ key: 'v', label: 'Value', default: null, optional: true, ...setting }]
const bad = (settings, input) => { try { checkOptions(settings, input); return null } catch (e) { return e.message } }

test('boolean', () => expect(bad(CLOCK, { hour12: 'yes' })).toMatch(/^12-hour clock/))
test('choice', () => {
  const set = s({ type: 'choice', options: [{ value: 'c', label: 'Celsius' }, { value: 'f', label: 'Fahrenheit' }] })
  expect(bad(set, { v: 'k' })).toMatch(/^Value/)
  expect(checkOptions(set, { v: 'f' })).toEqual({ v: 'f' })
})
test('text length', () => {
  const set = s({ type: 'text', maxLength: 5 })
  expect(bad(set, { v: 'toolong' })).toMatch(/^Value/)
  expect(bad(set, { v: 3 })).toMatch(/^Value/)
})
test('url scheme and hosts', () => {
  expect(bad(s({ type: 'url' }), { v: 'javascript:alert(1)' })).toMatch(/^Value/)
  expect(bad(s({ type: 'url', hosts: ['icloud.com'] }), { v: 'https://evil.example/x' })).toMatch(/^Value/)
  expect(checkOptions(s({ type: 'url', hosts: ['icloud.com'] }), { v: 'https://www.icloud.com/sharedalbum/#B0' }).v).toBe('https://www.icloud.com/sharedalbum/#B0')
  expect(checkOptions(s({ type: 'url' }), { v: 'https://a.example/x' }).v).toBe('https://a.example/x')
})
test('number range', () => {
  const set = s({ type: 'number', min: 1, max: 10 })
  expect(bad(set, { v: 0 })).toMatch(/^Value/)
  expect(bad(set, { v: '5' })).toMatch(/^Value/)
  expect(checkOptions(set, { v: 10 })).toEqual({ v: 10 })
})
test('timezone', () => {
  expect(bad(CLOCK, { hour12: false, tz2: 'Mars/Base' })).toMatch(/^Second time zone/)
  expect(checkOptions(CLOCK, { hour12: false, tz2: 'Europe/Madrid' }).tz2).toBe('Europe/Madrid')
})
test('list', () => {
  const set = s({ type: 'list', of: { type: 'url' }, maxItems: 2 })
  expect(bad(set, { v: ['https://a.example', 'https://b.example', 'https://c.example'] })).toMatch(/^Value/)
  expect(bad(set, { v: ['ftp://a.example'] })).toMatch(/^Value/)
  expect(checkOptions(set, { v: ['https://a.example'] })).toEqual({ v: ['https://a.example'] })
})
test('unknown keys dropped, optional missing is null, required missing is an error', () => {
  expect(checkOptions(CLOCK, { hour12: true, foo: 1 })).toEqual({ hour12: true, tz2: null })
  expect(bad(CLOCK, {})).toMatch(/^12-hour clock/)
  expect(bad(CLOCK, null)).toBeTruthy()
})
test('normalizeOptions never throws and falls back to defaults', () => {
  expect(normalizeOptions(CLOCK, { hour12: 'yes' })).toEqual({ hour12: false, tz2: null })
  expect(normalizeOptions(CLOCK, null)).toEqual({ hour12: false, tz2: null })
  expect(normalizeOptions(CLOCK, { hour12: true, tz2: 'Mars/Base', x: 1 })).toEqual({ hour12: true, tz2: null })
})

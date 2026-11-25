import { test, expect } from 'vitest'
import { loadScreen, fakeRoot } from './helpers.js'

const od = () => loadScreen(['runtime/runtime.js']).OD

test('registerMode stores the mode', () => {
  const OD = od(), m = { render() {} }
  OD.registerMode('x', m)
  expect(OD.modes.x).toBe(m)
})

test('esc escapes HTML', () => {
  expect(od().esc('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  expect(od().esc(null)).toBe('')
})

test('startMode returns null for an unknown mode', () => {
  expect(od().startMode('missing', fakeRoot(), {}, null)).toBe(null)
})

test('startMode passes through and returns the handle', () => {
  const OD = od(), root = fakeRoot()
  OD.registerMode('x', { render: (r, o, d) => { r.innerHTML = 'a' + o.a + d; return { stop() {} } } })
  const h = OD.startMode('x', root, { a: 1 }, 2)
  expect(root.innerHTML).toBe('a12')
  expect(typeof h.stop).toBe('function')
  expect(typeof h.update).toBe('function')
})

test('startMode lets a render error through to the caller', () => {
  const OD = od()
  OD.registerMode('boom', { render() { throw new Error('nope') } })
  expect(() => OD.startMode('boom', fakeRoot(), {}, null)).toThrow('nope')
})

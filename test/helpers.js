import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Loads ES5 files into a fresh global that looks like an old browser page.
// safari9: no Intl, and toLocaleTimeString ignores its options (as Safari 9 does).
export function loadScreen(files, { safari9 = false } = {}) {
  const ctx = vm.createContext({
    console,
    setTimeout: (...a) => globalThis.setTimeout(...a),
    clearTimeout: (...a) => globalThis.clearTimeout(...a),
    setInterval: (...a) => globalThis.setInterval(...a),
    clearInterval: (...a) => globalThis.clearInterval(...a),
    navigator: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X)' },
    location: { host: 'example.test', search: '' },
    document: { getElementById: () => null, createTextNode: t => ({ nodeValue: t }) },
  })
  ctx.window = ctx
  if (safari9) vm.runInContext("Intl = undefined; Date.prototype.toLocaleTimeString = function () { return '3:05:00 PM' }", ctx)
  for (const f of files) vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: f })
  return ctx
}

export const fakeRoot = () => ({ innerHTML: '', style: {} })

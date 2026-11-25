import { TYPES, checkOptions } from './options.js'

const ID = /^[a-z0-9-]{1,30}$/

function settingErrors(s, path) {
  const e = []
  if (!s || typeof s !== 'object') return [`${path}: must be an object`]
  if (!TYPES.includes(s.type)) e.push(`${path}: unknown type "${s.type}"`)
  if (s.type === 'choice' && !(Array.isArray(s.options) && s.options.length && s.options.every(o => o && 'value' in o && typeof o.label === 'string'))) e.push(`${path}: choice needs options [{value, label}]`)
  if ((s.type === 'text' || s.type === 'url') && s.maxLength !== undefined && !(Number.isInteger(s.maxLength) && s.maxLength >= 1 && s.maxLength <= 200)) e.push(`${path}: maxLength must be 1–200`)
  if (s.type === 'url' && s.hosts !== undefined && !(Array.isArray(s.hosts) && s.hosts.every(h => typeof h === 'string'))) e.push(`${path}: hosts must be a list of host names`)
  if (s.type === 'number' && ['min', 'max', 'step'].some(k => s[k] !== undefined && typeof s[k] !== 'number')) e.push(`${path}: min, max and step must be numbers`)
  if (s.type === 'list') {
    if (!s.of || s.of.type === 'list') e.push(`${path}: list needs "of" (any type except list)`)
    else e.push(...settingErrors(s.of, `${path}.of`))
    if (!(Number.isInteger(s.maxItems) && s.maxItems >= 1 && s.maxItems <= 20)) e.push(`${path}: maxItems must be 1–20`)
  }
  return e
}

// Returns a list of problems; empty means the manifest is valid.
export function validateManifest(m, { folder, sources }) {
  if (!m || typeof m !== 'object') return ['mode.json must be an object']
  const e = []
  if (!ID.test(m.id || '')) e.push('id must be 1–30 lowercase letters, digits or dashes')
  if (m.id !== folder) e.push(`id must match folder ("${folder}")`)
  if (typeof m.name !== 'string' || !m.name.trim() || m.name.length > 40) e.push('name must be 1–40 characters')
  if (typeof m.description !== 'string' || m.description.length < 10 || m.description.length > 200) e.push('description must be 10–200 characters')
  if (!Array.isArray(m.settings)) return [...e, 'settings must be a list']
  const keys = new Set()
  for (const s of m.settings) {
    const key = s && s.key
    if (typeof key !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(key)) { e.push(`setting key "${key}" must be letters and digits`); continue }
    if (keys.has(key)) e.push(`${key}: duplicate key`)
    keys.add(key)
    if (typeof s.label !== 'string' || !s.label) e.push(`${key}: needs a label`)
    if (!('default' in s)) e.push(`${key}: needs a default (or optional: true with default: null)`)
    else if (s.default === null && !s.optional) e.push(`${key}: default null needs optional: true`)
    e.push(...settingErrors(s, key))
  }
  if (m.source !== null && m.source !== undefined) {
    const src = m.source
    if (!Object.hasOwn(sources, src.type)) e.push(`source "${src.type}" is not offered (see sources.json)`)
    if (!(Number.isInteger(src.refreshMinutes) && src.refreshMinutes >= 15 && src.refreshMinutes <= 360)) e.push('source.refreshMinutes must be 15–360')
    for (const k of src.settings || []) if (!keys.has(k)) e.push(`source uses unknown setting "${k}"`)
  }
  if (!e.length) {
    try { checkOptions(m.settings, m.example) } catch (err) { e.push(`example is not valid: ${err.message}`) }
    for (const s of m.settings) {
      if (s.default !== null) { try { checkOptions([{ ...s, optional: false }], { [s.key]: s.default }) } catch { e.push(`${s.key}: default is not a valid value`) } }
    }
  }
  return e
}

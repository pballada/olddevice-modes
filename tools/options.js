// Settings validation shared by the checker, the preview and the olddevice server. No dependencies.
export const TYPES = ['boolean', 'choice', 'text', 'url', 'number', 'timezone', 'list']

function validTimeZone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

// Returns true when `value` is acceptable for `s` (a setting or a list's `of`).
function valid(s, value) {
  switch (s.type) {
    case 'boolean': return typeof value === 'boolean'
    case 'choice': return (s.options || []).some(o => o.value === value)
    case 'text': return typeof value === 'string' && value.length <= (s.maxLength || 200)
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) &&
        (s.min === undefined || value >= s.min) && (s.max === undefined || value <= s.max)
    case 'timezone': return typeof value === 'string' && validTimeZone(value)
    case 'url': {
      if (typeof value !== 'string' || value.length > 2000) return false
      let u
      try { u = new URL(value) } catch { return false }
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
      return !s.hosts || s.hosts.some(h => u.hostname === h || u.hostname.endsWith('.' + h))
    }
    case 'list':
      return Array.isArray(value) && value.length <= (s.maxItems || 20) && value.every(v => valid(s.of || {}, v))
    default: return false
  }
}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

// Strict: throws Error("<label>: ...") on the first invalid value. Unknown keys are dropped.
export function checkOptions(settings, input) {
  if (!isObject(input)) throw new Error('Settings must be an object')
  const out = {}
  for (const s of settings) {
    const v = input[s.key]
    if (v === undefined || v === null) {
      if (!s.optional) throw new Error(`${s.label}: required`)
      out[s.key] = null
    } else if (!valid(s, v)) {
      throw new Error(`${s.label}: ${s.type === 'timezone' ? 'unknown time zone' : 'not a valid value'}`)
    } else out[s.key] = v
  }
  return out
}

// Lenient: never throws. Missing or invalid values get the setting's default.
export function normalizeOptions(settings, input) {
  const src = isObject(input) ? input : {}
  const out = {}
  for (const s of settings) {
    const v = src[s.key]
    out[s.key] = v !== undefined && v !== null && valid(s, v) ? v : s.default
  }
  return out
}

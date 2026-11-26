import { test, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadScreen, fakeRoot } from './helpers.js'

const load = id => loadScreen(['runtime/runtime.js', `modes/${id}/screen.js`], { safari9: true }).OD
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const example = id => json(`modes/${id}/mode.json`).example
const data = id => json(`modes/${id}/example-data.json`)
const draw = (id, options, d) => { const root = fakeRoot(); const h = load(id).startMode(id, root, options, d); return { root, h } }
afterEach(() => vi.useRealTimers())

const IDS = ['weather', 'photos', 'news', 'calendar', 'social']

for (const id of IDS) {
  test(`${id}: renders its example`, () => {
    const { root, h } = draw(id, example(id), data(id))
    expect(root.innerHTML).toContain(`m-${id}`)
    h.stop()
  })
  test(`${id}: shows a message while data hasn't arrived`, () => {
    expect(draw(id, example(id), null).root.innerHTML).toContain('class="msg"')
  })
  test(`${id}: stop clears its timers`, () => {
    vi.useFakeTimers()
    const { root, h } = draw(id, example(id), data(id))
    h.stop()
    root.innerHTML = 'stopped'
    vi.advanceTimersByTime(10 * 60 * 1000)
    expect(root.innerHTML).toBe('stopped')
  })
}

test('weather: current conditions, place and daily forecast', () => {
  const html = draw('weather', example('weather'), data('weather')).root.innerHTML
  expect(html).toContain('Madrid')
  expect(html).toContain('14°')
  expect(html).toContain('Partly cloudy')
  expect(html.match(/m-weather-day"/g)).toHaveLength(5)
})

test('weather: forecast dates are read as local days', () => {
  const d = { ...data('weather'), days: [{ date: '2026-11-27', high: 1, low: 0, code: 0 }] }
  expect(draw('weather', example('weather'), d).root.innerHTML).toContain('Fri')
})

test('weather: asks for a place when none is set', () => {
  expect(draw('weather', { place: '', units: 'celsius' }, null).root.innerHTML).toContain('Add a place')
})

test('weather: escapes the place name', () => {
  const html = draw('weather', example('weather'), { ...data('weather'), place: '<b>x</b>' }).root.innerHTML
  expect(html).not.toContain('<b>x</b>')
})

test('photos: shows the first photo and preloads the next', () => {
  const html = draw('photos', example('photos'), data('photos')).root.innerHTML
  const urls = data('photos').photos.map(p => p.url)
  expect(html).toContain(urls[0])
  expect(html).toContain('m-photos-preload')
  expect(html).toContain(urls[1])
})

test('photos: advances after the chosen seconds', () => {
  vi.useFakeTimers()
  const urls = data('photos').photos.map(p => p.url)
  const { root, h } = draw('photos', { ...example('photos'), seconds: 10 }, data('photos'))
  vi.advanceTimersByTime(10000)
  expect(root.innerHTML).toMatch(new RegExp(`m-photos-in[^>]*>\\s*<div[^>]*${urls[1]}`))
  h.stop()
})

test('photos: drops links that could break out of the style attribute', () => {
  const html = draw('photos', example('photos'), { photos: [{ url: 'https://x.test/a.jpg) ; background:red' }, { url: 'javascript:alert(1)' }] }).root.innerHTML
  expect(html).not.toContain('background:red')
  expect(html).not.toContain('javascript')
  expect(html).toContain('no photos')
})

test('photos: asks for an album when none is set', () => {
  expect(draw('photos', { ...example('photos'), album: null }, null).root.innerHTML).toContain('Add a shared album')
})

test('news: shows a headline with its source, then the next one', () => {
  vi.useFakeTimers()
  const items = data('news').items
  const { root, h } = draw('news', { ...example('news'), seconds: 8 }, data('news'))
  expect(root.innerHTML).toContain(items[0].title)
  expect(root.innerHTML).toContain(items[0].source)
  vi.advanceTimersByTime(8000)
  expect(root.innerHTML).toContain(items[1].title)
  h.stop()
})

test('news: escapes headlines', () => {
  const html = draw('news', example('news'), { items: [{ title: '<img onerror=x>', source: 'S', time: Date.now() }] }).root.innerHTML
  expect(html).not.toContain('<img')
})

test('calendar: groups events under Today and Tomorrow', () => {
  const today = new Date(); today.setHours(9, 30, 0, 0)
  const t = today.getTime()
  const d = new Date(t + 86400000)
  const ymd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  const html = draw('calendar', { ics: 'https://x.test/a.ics', days: 3, hour12: false }, {
    events: [{ title: 'Standup', start: t, end: t + 900000 }, { title: 'Holiday', allDay: true, date: ymd }],
  }).root.innerHTML
  expect(html.indexOf('Today')).toBeLessThan(html.indexOf('Standup'))
  expect(html.indexOf('Tomorrow')).toBeLessThan(html.indexOf('Holiday'))
  expect(html).toContain('09:30')
  expect(html).toContain('All day')
})

test('calendar: shows a quiet day instead of an empty column', () => {
  expect(draw('calendar', { ics: 'https://x.test/a.ics', days: 1, hour12: false }, { events: [] }).root.innerHTML).toContain('Nothing planned')
})

test('social: big formatted numbers per account', () => {
  const html = draw('social', example('social'), { counts: [{ network: 'github', name: 'pballada', count: 1234567 }, { network: 'bluesky', name: 'a.bsky.social', count: 48210 }] }).root.innerHTML
  expect(html).toContain('pballada')
  expect(html).toContain('GitHub')
})

test('social: counts up to the new value on update', () => {
  vi.useFakeTimers()
  const { root, h } = draw('social', example('social'), { counts: [{ network: 'github', name: 'a', count: 1000 }] })
  vi.advanceTimersByTime(5000)
  expect(root.innerHTML).toContain('1,000')
  h.update({ counts: [{ network: 'github', name: 'a', count: 1500 }] })
  vi.advanceTimersByTime(300)
  expect(root.innerHTML).not.toContain('1,500')
  vi.advanceTimersByTime(5000)
  expect(root.innerHTML).toContain('1,500')
  h.stop()
})

test('social: millions are shortened', () => {
  vi.useFakeTimers()
  const { root, h } = draw('social', example('social'), { counts: [{ network: 'youtube', name: '@x', count: 2340000 }] })
  vi.advanceTimersByTime(5000)
  expect(root.innerHTML).toContain('2.34M')
  h.stop()
})

import { test, expect, vi, afterEach } from 'vitest'
import { loadScreen, fakeRoot } from './helpers.js'

const FILES = ['runtime/runtime.js', 'modes/clock/screen.js']
const clock = opts => loadScreen(FILES, opts).OD
afterEach(() => vi.useRealTimers())

test('without Intl time-zone support the second zone is skipped', () => {
  expect(clock({ safari9: true }).modes.clock.zoneTime(new Date(), 'America/New_York', false)).toBe(null)
})

test('with Intl the second zone is formatted in that zone', () => {
  const d = new Date(Date.UTC(2026, 0, 15, 17, 5))
  expect(clock().modes.clock.zoneTime(d, 'America/New_York', false)).toBe('12:05')
  expect(clock().modes.clock.zoneTime(d, 'America/New_York', true)).toBe('12:05 PM')
})

test('an unknown zone is skipped', () => {
  expect(clock().modes.clock.zoneTime(new Date(), 'Mars/Base', false)).toBe(null)
})

test('render draws the time, date and zone', () => {
  const root = fakeRoot()
  clock().startMode('clock', root, { hour12: false, tz2: 'America/New_York' }, null)
  expect(root.innerHTML).toContain('class="m-clock-time"')
  expect(root.innerHTML).toMatch(/\d\d:\d\d/)
  expect(root.innerHTML).toContain('New York')
})

test('render works on Safari 9 and skips the zone', () => {
  const root = fakeRoot()
  clock({ safari9: true }).startMode('clock', root, { hour12: true, tz2: 'America/New_York' }, null)
  expect(root.innerHTML).toMatch(/(am|pm)/)
  expect(root.innerHTML).not.toContain('New York')
})

test('stop clears the timer', () => {
  vi.useFakeTimers()
  const root = fakeRoot()
  const h = clock().startMode('clock', root, { hour12: false, tz2: null }, null)
  h.stop()
  root.innerHTML = 'stopped'
  vi.advanceTimersByTime(5000)
  expect(root.innerHTML).toBe('stopped')
})

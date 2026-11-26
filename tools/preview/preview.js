import { checkOptions } from '/tools/options.js'

const $ = id => document.getElementById(id)
const modes = await (await fetch('/tools/preview/modes-list.json')).json()

// Load every mode's code and styles, the same way the olddevice build bundles them.
await Promise.all(modes.map(m => new Promise((ok, fail) => {
  if (m.hasCss) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="/modes/${m.id}/screen.css">`)
  const s = document.createElement('script'); s.src = `/modes/${m.id}/screen.js`; s.onload = ok; s.onerror = fail; document.body.appendChild(s)
})))

$('mode').innerHTML = modes.map(m => `<option value="${m.id}">${m.name}</option>`).join('')
let running = null

function show() {
  const m = modes.find(x => x.id === $('mode').value)
  $('error').textContent = ''
  if (running) running.stop()
  running = null
  try {
    const options = checkOptions(m.settings, JSON.parse($('options').value))
    const data = $('data').value.trim() ? JSON.parse($('data').value) : null
    running = OD.startMode(m.id, $('root'), options, data)
  } catch (e) { $('error').textContent = e.message }
}

function pick() {
  const m = modes.find(x => x.id === $('mode').value)
  $('options').value = JSON.stringify(m.example, null, 2)
  $('data').value = m.exampleData ? JSON.stringify(m.exampleData, null, 2) : ''
  show()
}

// ?mode=<id> opens that mode; &bare shows only the screen (used for README screenshots).
const q = new URLSearchParams(location.search)
if (modes.some(m => m.id === q.get('mode'))) $('mode').value = q.get('mode')
if (q.has('bare')) document.body.classList.add('bare')
$('mode').addEventListener('change', pick)
$('options').addEventListener('input', show)
$('data').addEventListener('input', show)
pick()

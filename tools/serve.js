// npm run preview → http://localhost:5173/tools/preview/ . Serves this folder; no dependencies.
import { createServer } from 'node:http'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, extname, sep } from 'node:path'

const ROOT = resolve('.')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' }

function modesList() {
  return readdirSync(join(ROOT, 'modes'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => {
    const dir = join(ROOT, 'modes', d.name)
    const m = JSON.parse(readFileSync(join(dir, 'mode.json'), 'utf8'))
    const data = join(dir, 'example-data.json')
    return { ...m, hasCss: existsSync(join(dir, 'screen.css')), exampleData: existsSync(data) ? JSON.parse(readFileSync(data, 'utf8')) : null }
  })
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  try {
    if (path === '/tools/preview/modes-list.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(modesList()))
    }
    const file = resolve(ROOT, '.' + (path.endsWith('/') ? path + 'index.html' : path))
    if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('Not found') }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    res.end(readFileSync(file))
  } catch (e) {
    res.writeHead(500); res.end(String(e.message))
  }
}).listen(5173, () => console.log('Preview: http://localhost:5173/tools/preview/'))

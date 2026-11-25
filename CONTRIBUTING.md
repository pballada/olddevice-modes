# Contributing a mode

Thanks for helping old screens do new things. A mode is one folder in `modes/`. Copy `modes/clock/` to start.

## 1. `mode.json`

```json
{
  "id": "clock",
  "name": "Clock",
  "description": "A big wall clock, with an optional second time zone.",
  "settings": [
    { "key": "hour12", "type": "boolean", "label": "12-hour clock", "default": false },
    { "key": "tz2", "type": "timezone", "label": "Second time zone", "optional": true, "default": null }
  ],
  "source": null,
  "example": { "hour12": false, "tz2": "America/New_York" }
}
```

- `id`: lowercase letters, digits and dashes, the same as the folder name.
- `name` (up to 40 characters) and `description` (10–200) appear in the dashboard.
- `settings`: what people can choose. The dashboard draws the form from this list, and the server checks every value. Each setting needs a `key`, a `label`, and a `default` (or `"optional": true` with `"default": null`). Types:

| type | extra fields | value |
|---|---|---|
| `boolean` | | `true` / `false` |
| `choice` | `options: [{ "value", "label" }]` | one of the values |
| `text` | `maxLength` (up to 200) | a string |
| `url` | `hosts` (optional allowed list) | an http or https link |
| `number` | `min`, `max`, `step` | a number |
| `timezone` | | an IANA zone, like `Europe/Madrid` |
| `list` | `of` (any type above), `maxItems` (up to 20) | a list |

- `source`: `null`, or the data source your mode needs: `{ "type": "rss", "settings": ["feeds"], "refreshMinutes": 15 }`. `type` must be listed in [`sources.json`](sources.json). The app fetches the data and hands it to your mode. **Need a source that doesn't exist yet? Open an issue first.** Data sources run on the olddevice server and are written by the maintainer.
- `example`: valid settings used by the preview and the checks. If you use a source, add `example-data.json` with a sample of what it returns.

## 2. `screen.js`

```js
(function () {
  function render(root, options, data) {
    root.innerHTML = '<div class="m-hello">' + OD.esc(options.greeting) + '</div>';
    return {
      stop: function () { /* clear timers */ },
      update: function (newData) { /* new source data arrived (optional) */ }
    };
  }
  OD.registerMode('hello', { render: render });
})();
```

Rules (most are checked automatically):

- **ES5 only.** No `let`/`const`, arrow functions, classes, template strings or `Promise`. Screens include iPads from 2011.
- **No network or storage.** Don't use `fetch`, `XMLHttpRequest`, `WebSocket`, `localStorage`, `sessionStorage` or cookies, and don't load scripts or images from other sites. Data only arrives through `data`.
- **No `eval` or `Function(`.**
- **Stay in your box.** Draw only inside `root`. Prefix CSS classes with `m-<id>-`. Add no globals.
- **Escape text** from settings or data with `OD.esc(text)` before putting it in HTML.
- **Clean up.** `stop()` must clear every timer you started.
- Design for a screen read from across a room: large type, high contrast, dark background (`#17293B`), amber accent (`#F2B134`).

## 3. `screen.css` (optional)

The same old-browser rules apply: add `-webkit-` prefixes, and don't use CSS grid, CSS variables, `url(` or `@import`.

## Changing an existing mode

Screens out there already have settings saved. Adding a setting is fine (it needs a `default`). Changing a setting's `type` or removing a mode breaks people's screens, so the check fails unless the maintainer adds the `breaking-ok` label.

## Submitting

1. `npm run preview` and look at your mode at a few window sizes.
2. `npm test` and `npm run check` pass.
3. Open a pull request with a screenshot. CI runs the same checks.
<!-- CI flow test -->

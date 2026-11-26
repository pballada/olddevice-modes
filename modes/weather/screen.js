// Weather mode. ES5. Data comes from the "weather" source (Open-Meteo).
(function () {
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // WMO weather codes → [icon, label].
  function kind(code) {
    if (code === 0) return ['sun', 'Clear'];
    if (code === 1) return ['sun', 'Mostly clear'];
    if (code === 2) return ['partly', 'Partly cloudy'];
    if (code === 3) return ['cloud', 'Cloudy'];
    if (code === 45 || code === 48) return ['fog', 'Fog'];
    if (code >= 51 && code <= 57) return ['rain', 'Drizzle'];
    if (code >= 61 && code <= 67) return ['rain', 'Rain'];
    if (code >= 71 && code <= 77) return ['snow', 'Snow'];
    if (code >= 80 && code <= 82) return ['rain', 'Showers'];
    if (code === 85 || code === 86) return ['snow', 'Snow showers'];
    if (code >= 95) return ['storm', 'Thunderstorm'];
    return ['cloud', ''];
  }

  // Icons are drawn with CSS so they look the same on every device (no emoji, no images).
  function icon(name) {
    var cloud = '<i class="m-weather-cloud"></i>';
    var parts = {
      sun: '<i class="m-weather-sun"></i>',
      partly: '<i class="m-weather-sun m-weather-sun-small"></i>' + cloud,
      cloud: cloud,
      rain: cloud + '<i class="m-weather-rain"><b></b><b></b><b></b></i>',
      snow: cloud + '<i class="m-weather-snow"><b></b><b></b><b></b></i>',
      storm: cloud + '<i class="m-weather-bolt"></i>',
      fog: '<i class="m-weather-fog"><b></b><b></b><b></b></i>'
    };
    return '<span class="m-weather-icon">' + parts[name] + '</span>';
  }

  function deg(n) { return Math.round(n) + '°'; }

  // "2026-11-27" as a local day (new Date("YYYY-MM-DD") would read it as UTC).
  function dayName(ymd) {
    var p = String(ymd).split('-');
    return DAYS[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
  }

  function draw(root, options, data) {
    if (!options.place) { root.innerHTML = '<p class="msg">Add a place in the dashboard to see its weather.</p>'; return; }
    if (!data || !data.current) { root.innerHTML = '<p class="msg">Getting the forecast for ' + OD.esc(options.place) + '…</p>'; return; }
    var now = kind(data.current.code);
    var days = '';
    var list = data.days || [];
    for (var i = 0; i < list.length && i < 5; i++) {
      var d = list[i];
      days += '<div class="m-weather-day"><div class="m-weather-dname">' + dayName(d.date) + '</div>' + icon(kind(d.code)[0]) +
        '<div class="m-weather-range"><span>' + deg(d.high) + '</span> ' + deg(d.low) + '</div></div>';
    }
    root.innerHTML = '<div class="m-weather">' +
      '<div class="m-weather-now">' + icon(now[0]) +
        '<div class="m-weather-temp">' + deg(data.current.temp) + '</div>' +
        '<div class="m-weather-info"><div class="m-weather-place">' + OD.esc(data.place || options.place) + '</div>' +
          '<div class="m-weather-label">' + now[1] + '</div>' +
          (data.today ? '<div class="m-weather-hl">High ' + deg(data.today.high) + ', low ' + deg(data.today.low) + '</div>' : '') +
        '</div></div>' +
      '<div class="m-weather-days">' + days + '</div></div>';
  }

  function render(root, options, data) {
    draw(root, options, data);
    return { update: function (d) { data = d; draw(root, options, d); } };
  }

  OD.registerMode('weather', { render: render, kind: kind });
})();

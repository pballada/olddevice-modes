// Clock mode. ES5.
(function () {
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function time(d, hour12) {
    var h = d.getHours();
    if (!hour12) return pad(h) + ':' + pad(d.getMinutes());
    return ((h % 12) || 12) + ':' + pad(d.getMinutes()) + '<small>' + (h < 12 ? 'am' : 'pm') + '</small>';
  }

  // Safari 9 has no Intl and silently ignores toLocaleTimeString options, so check Intl itself.
  function zoneTime(d, tz, hour12) {
    if (typeof Intl !== 'object' || !Intl || !Intl.DateTimeFormat) return null;
    try {
      return new Intl.DateTimeFormat('en-US', hour12
        ? { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }
        : { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
    } catch (e) { return null; }
  }

  function render(root, options) {
    var zoneName = options.tz2 ? options.tz2.split('/').pop().replace(/_/g, ' ') : '';
    function tick() {
      var d = new Date();
      var other = options.tz2 && zoneTime(d, options.tz2, options.hour12);
      root.innerHTML = '<div class="m-clock">' +
        '<div class="m-clock-time">' + time(d, options.hour12) + '</div>' +
        '<div class="m-clock-date">' + DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '</div>' +
        (other ? '<div class="m-clock-zone">' + OD.esc(zoneName + ' ' + other) + '</div>' : '') +
        '</div>';
    }
    tick();
    var timer = setInterval(tick, 1000);
    return { stop: function () { clearInterval(timer); } };
  }

  OD.registerMode('clock', { render: render, zoneTime: zoneTime });
})();

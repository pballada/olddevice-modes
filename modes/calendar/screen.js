// Calendar mode. ES5. The "calendar" source turns an .ics link into events for today through 7 days ahead.
(function () {
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MAX = 6; // events per day before "+ N more"

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function time(d, hour12) {
    var h = d.getHours();
    return hour12 ? ((h % 12) || 12) + ':' + pad(d.getMinutes()) + (h < 12 ? 'am' : 'pm') : pad(h) + ':' + pad(d.getMinutes());
  }

  function draw(root, options, data) {
    if (!options.ics) { root.innerHTML = '<p class="msg">Add a calendar link in the dashboard.</p>'; return; }
    if (!data) { root.innerHTML = '<p class="msg">Loading your calendar…</p>'; return; }
    var now = new Date(), cols = '';
    for (var n = 0; n < options.days; n++) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
      var key = ymd(day), list = [];
      var events = data.events || [];
      for (var k = 0; k < events.length; k++) {
        var e = events[k];
        if (e.allDay ? e.date === key : ymd(new Date(e.start)) === key) list.push(e);
      }
      list.sort(function (a, b) { return (a.allDay ? -1 : a.start) - (b.allDay ? -1 : b.start); });
      var rows = '';
      for (var j = 0; j < list.length && j < MAX; j++) {
        var ev = list[j], past = !ev.allDay && ev.end < now.getTime();
        rows += '<li class="m-calendar-event' + (past ? ' m-calendar-past' : '') + '"><span class="m-calendar-time">' +
          (ev.allDay ? 'All day' : time(new Date(ev.start), options.hour12)) + '</span>' + OD.esc(ev.title) + '</li>';
      }
      if (list.length > MAX) rows += '<li class="m-calendar-more">+ ' + (list.length - MAX) + ' more</li>';
      if (!list.length) rows = '<li class="m-calendar-none">Nothing planned</li>';
      var name = n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : DAYS[day.getDay()];
      cols += '<section class="m-calendar-day' + (n === 0 ? ' m-calendar-today' : '') + '"><h2>' + name +
        '<span>' + MONTHS[day.getMonth()] + ' ' + day.getDate() + '</span></h2><ul>' + rows + '</ul></section>';
    }
    root.innerHTML = '<div class="m-calendar">' + cols + '</div>';
  }

  function render(root, options, data) {
    draw(root, options, data);
    var timer = setInterval(function () { draw(root, options, data); }, 60000); // keeps "Today" and past events right
    return {
      stop: function () { clearInterval(timer); },
      update: function (d) { data = d; draw(root, options, d); }
    };
  }

  OD.registerMode('calendar', { render: render });
})();

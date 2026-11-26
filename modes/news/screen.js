// News mode. ES5. The "rss" source turns feeds into a short list of headlines.
(function () {
  function ago(t) {
    var mins = Math.round((new Date().getTime() - t) / 60000);
    if (!(mins >= 0)) return '';
    if (mins < 2) return 'just now';
    if (mins < 60) return mins + ' minutes ago';
    var h = Math.round(mins / 60);
    if (h < 48) return h === 1 ? '1 hour ago' : h + ' hours ago';
    return Math.round(h / 24) + ' days ago';
  }

  function render(root, options, data) {
    var i = 0, timer = null;
    function items() { return (data && data.items) || []; }

    function draw() {
      var list = items();
      if (!options.preset && !(options.feeds && options.feeds.length)) { root.innerHTML = '<p class="msg">Choose a news source in the dashboard.</p>'; return; }
      if (!data) { root.innerHTML = '<p class="msg">Loading headlines…</p>'; return; }
      if (!list.length) { root.innerHTML = '<p class="msg">No headlines right now.</p>'; return; }
      var it = list[i % list.length];
      var title = String(it.title || '');
      var size = title.length > 110 ? ' m-news-long' : title.length < 50 ? ' m-news-short' : '';
      root.innerHTML = '<div class="m-news">' +
        '<div class="m-news-meta"><span class="m-news-source">' + OD.esc(it.source) + '</span> <span class="m-news-time">' + ago(it.time) + '</span></div>' +
        '<h1 class="m-news-title' + size + '">' + OD.esc(title) + '</h1>' +
        (list.length > 1 ? '<div class="m-news-bar"><div style="-webkit-animation-duration:' + options.seconds + 's;animation-duration:' + options.seconds + 's"></div></div>' : '') +
        '</div>';
    }

    draw();
    timer = setInterval(function () { if (items().length > 1) { i++; draw(); } }, options.seconds * 1000);
    return {
      stop: function () { clearInterval(timer); },
      update: function (d) { var had = data; data = d; if (!had) { i = 0; draw(); } }
    };
  }

  OD.registerMode('news', { render: render });
})();

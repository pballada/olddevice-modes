// Follower counters. ES5. The "social" source returns one count per account; numbers count up to each new value.
(function () {
  var NETWORKS = { youtube: ['YouTube', 'subscribers'], bluesky: ['Bluesky', 'followers'], mastodon: ['Mastodon', 'followers'], github: ['GitHub', 'followers'] };
  var STEPS = 30, STEP_MS = 50;

  function format(n) {
    n = Math.round(n);
    if (n >= 1000000) return (Math.floor(n / 10000) / 100) + 'M';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function render(root, options, data) {
    var shown = {}, from = {}, target = [], step = 0, timer = null;

    function draw() {
      if (!target.length) {
        var any = options.youtube.length || options.bluesky.length || options.mastodon.length || options.github.length;
        root.innerHTML = '<p class="msg">' + (!any ? 'Add accounts in the dashboard to count their followers.' : data ? 'No counts yet.' : 'Counting followers…') + '</p>';
        return;
      }
      var size = target.length === 1 ? ' m-social-one' : target.length <= 4 ? '' : ' m-social-many';
      var cards = '';
      for (var k = 0; k < target.length; k++) {
        var c = target[k], net = NETWORKS[c.network] || [String(c.network), 'followers'];
        cards += '<div class="m-social-card"><div class="m-social-count">' + format(shown[c.key]) + '</div>' +
          '<div class="m-social-name">' + OD.esc(c.name) + '</div>' +
          '<div class="m-social-net m-social-' + (NETWORKS[c.network] ? c.network : 'other') + '">' + OD.esc(net[0]) + ' ' + net[1] + '</div></div>';
      }
      root.innerHTML = '<div class="m-social' + size + '">' + cards + '</div>';
    }

    function tick() {
      step++;
      var t = step / STEPS, ease = 1 - Math.pow(1 - t, 3);
      for (var k = 0; k < target.length; k++) {
        var c = target[k];
        shown[c.key] = step >= STEPS ? c.count : from[c.key] + (c.count - from[c.key]) * ease;
      }
      draw();
      if (step >= STEPS) { clearInterval(timer); timer = null; }
    }

    function setData(d) {
      data = d;
      var list = (d && d.counts) || [];
      target = [];
      for (var k = 0; k < list.length; k++) {
        var c = list[k];
        if (!c || typeof c.count !== 'number') continue;
        var key = c.network + ':' + c.name;
        target.push({ key: key, network: c.network, name: c.name, count: c.count });
        from[key] = shown.hasOwnProperty(key) ? shown[key] : 0;
        shown[key] = from[key];
      }
      step = 0;
      if (timer) clearInterval(timer);
      timer = target.length ? setInterval(tick, STEP_MS) : null;
      draw();
    }

    setData(data);
    return {
      stop: function () { if (timer) clearInterval(timer); timer = null; },
      update: setData
    };
  }

  OD.registerMode('social', { render: render, format: format });
})();

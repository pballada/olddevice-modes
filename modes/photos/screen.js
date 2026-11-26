// Photos mode. ES5. The "photos" source lists screen-sized image links; images load straight from the album's provider.
(function () {
  var FADE = 2; // seconds of crossfade
  // Links go inside style="background-image:url(...)": allow only plain http(s) or same-site paths with no quotes, brackets or spaces.
  var SAFE = /^(https?:\/\/|\/)[^"'()\\\s<>]+$/;

  function layer(url, options, n, extra, delay) {
    var kb = options.motion ? ' m-photos-kb' + (n % 4) : '';
    var anim = options.motion ? '-webkit-animation-duration:' + (options.seconds + FADE) + 's;animation-duration:' + (options.seconds + FADE) + 's;' +
      '-webkit-animation-delay:' + delay + 's;animation-delay:' + delay + 's;' : '';
    return '<div class="m-photos-layer' + extra + '"><div class="m-photos-img m-photos-' + options.fit + kb + '" style="' + anim +
      'background-image:url(' + OD.esc(url) + ')"></div></div>';
  }

  function render(root, options, data) {
    var urls = [], i = 0, timer = null;

    function setData(d) {
      urls = [];
      var list = (d && d.photos) || [];
      for (var k = 0; k < list.length; k++) if (list[k] && SAFE.test(String(list[k].url))) urls.push(String(list[k].url));
      if (i >= urls.length) i = 0;
    }

    function draw(first) {
      if (!options.album) { root.innerHTML = '<p class="msg">Add a shared album link in the dashboard to start the slideshow.</p>'; return; }
      if (!data) { root.innerHTML = '<p class="msg">Loading photos…</p>'; return; }
      if (!urls.length) { root.innerHTML = '<p class="msg">This album has no photos yet, or they can’t be shown.</p>'; return; }
      var prev = (i - 1 + urls.length) % urls.length;
      // The old photo stays underneath, its zoom continued from where it was (negative delay), while the new one fades in on top.
      root.innerHTML = '<div class="m-photos">' +
        (first || urls.length < 2 ? '' : layer(urls[prev], options, prev, '', -options.seconds)) +
        layer(urls[i], options, i, first ? '' : ' m-photos-in', 0) +
        (urls.length > 1 ? '<div class="m-photos-preload" style="background-image:url(' + OD.esc(urls[(i + 1) % urls.length]) + ')"></div>' : '') +
        '</div>';
    }

    function next() { i = (i + 1) % urls.length; draw(false); }

    setData(data);
    draw(true);
    timer = setInterval(function () { if (urls.length > 1) next(); }, options.seconds * 1000);
    return {
      stop: function () { clearInterval(timer); },
      update: function (d) { var had = data && urls.length; data = d; setData(d); if (!had) draw(true); }
    };
  }

  OD.registerMode('photos', { render: render });
})();

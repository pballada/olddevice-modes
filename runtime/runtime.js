// olddevice mode runtime. ES5: runs on Safari from iOS 9. Modes call OD.registerMode; the screen calls OD.startMode.
var OD = window.OD || {};
window.OD = OD;
OD.modes = OD.modes || {};

OD.registerMode = function (id, mode) { OD.modes[id] = mode; };

OD.esc = function (text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

// Returns the running mode's handle, or null for an unknown mode. Errors from render reach the caller.
OD.startMode = function (id, root, options, data) {
  var mode = OD.modes.hasOwnProperty(id) ? OD.modes[id] : null;
  if (!mode) return null;
  root.innerHTML = '';
  var h = mode.render(root, options, data) || {};
  return {
    stop: function () { if (h.stop) h.stop(); },
    update: function (d) { if (h.update) h.update(d); }
  };
};

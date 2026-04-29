/*! ham-autofix-client UMD build — expone window.HAMAutoFix */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HAMAutoFix = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DEFAULTS = {
    endpoint: 'http://127.0.0.1:8000/report',
    source: 'js',
    captureFetch: true,
    captureResources: true,
    captureUnhandledRejections: true,
    dedupe: true,
    appName: null,
    release: null,
    beforeSend: null,
  };
  var _opts = null, _seen = new Set(), _origFetch = null, _onError = null, _onRejection = null;

  function _relPath(url) {
    if (!url) return null;
    try { var u = new URL(url, typeof location !== 'undefined' ? location.href : 'http://localhost/'); return u.pathname.replace(/^\//, ''); }
    catch (e) { return String(url); }
  }
  function _send(payload) {
    var opts = _opts; if (!opts) return;
    if (opts.dedupe) {
      var key = (payload.message || '') + '|' + (payload.file || '') + ':' + (payload.line || 0);
      if (_seen.has(key)) return; _seen.add(key);
    }
    payload.extra = Object.assign({}, payload.extra || {});
    if (opts.appName) payload.extra.app = opts.appName;
    if (opts.release) payload.extra.release = opts.release;
    if (typeof opts.beforeSend === 'function') {
      try { var r = opts.beforeSend(payload); if (r === false || r == null) return; if (typeof r === 'object') payload = r; } catch (e) {}
    }
    try {
      var body = JSON.stringify(payload);
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(opts.endpoint, new Blob([body], { type: 'application/json' }));
      } else if (typeof fetch === 'function') {
        var f = _origFetch || fetch;
        f(opts.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, mode: 'cors' }).catch(function(){});
      }
    } catch (e) {}
  }
  function _handleError(ev) {
    var opts = _opts; if (!opts) return;
    if (opts.captureResources && ev.target && ev.target !== window && (ev.target.src || ev.target.href)) {
      _send({ source: opts.source, message: 'Recurso no cargado: ' + (ev.target.src || ev.target.href), file: _relPath(location.href), line: 0, stack: null, extra: { kind: 'resource', tag: ev.target.tagName } });
      return;
    }
    _send({ source: opts.source, message: ev.message || 'Error JS', file: _relPath(ev.filename) || _relPath(location.href), line: ev.lineno || 0, stack: ev.error && ev.error.stack ? String(ev.error.stack) : null, extra: { col: ev.colno, page: location.href } });
  }
  function _handleRejection(ev) {
    var opts = _opts; if (!opts) return;
    var reason = ev.reason, msg = (reason && reason.message) || String(reason);
    _send({ source: opts.source, message: 'Promise rechazada: ' + msg, file: _relPath(location.href), line: 0, stack: reason && reason.stack ? String(reason.stack) : null, extra: { kind: 'unhandledrejection' } });
  }
  function _wrapFetch() {
    var opts = _opts;
    if (!opts || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    if (window.fetch.__hamWrapped) return;
    _origFetch = window.fetch.bind(window);
    var wrapped = function () {
      var args = arguments, url = (args[0] && args[0].url) || args[0];
      return _origFetch.apply(this, args).then(function (resp) {
        if (!resp.ok && resp.status >= 400) {
          _send({ source: opts.source, message: 'fetch ' + resp.status + ' ' + url, file: _relPath(location.href), line: 0, stack: null, extra: { kind: 'fetch', status: resp.status, url: String(url) } });
        }
        return resp;
      }).catch(function (err) {
        _send({ source: opts.source, message: 'fetch falló: ' + (err && err.message || err) + ' → ' + url, file: _relPath(location.href), line: 0, stack: err && err.stack ? String(err.stack) : null, extra: { kind: 'fetch_error', url: String(url) } });
        throw err;
      });
    };
    wrapped.__hamWrapped = true;
    window.fetch = wrapped;
  }
  function init(options) {
    if (typeof window === 'undefined') return;
    if (_opts) return;
    _opts = Object.assign({}, DEFAULTS, options || {});
    _onError = _handleError; _onRejection = _handleRejection;
    window.addEventListener('error', _onError, true);
    if (_opts.captureUnhandledRejections) window.addEventListener('unhandledrejection', _onRejection);
    if (_opts.captureFetch) _wrapFetch();
  }
  function captureError(err, extra) {
    if (!_opts) return;
    var e = err instanceof Error ? err : new Error(String(err));
    _send({ source: _opts.source, message: e.message, file: _relPath(location.href), line: 0, stack: e.stack || null, extra: Object.assign({ kind: 'manual' }, extra || {}) });
  }
  function shutdown() {
    if (!_opts) return;
    if (typeof window !== 'undefined') {
      if (_onError) window.removeEventListener('error', _onError, true);
      if (_onRejection) window.removeEventListener('unhandledrejection', _onRejection);
      if (_origFetch) window.fetch = _origFetch;
    }
    _opts = null; _origFetch = null; _seen.clear();
  }
  return { init: init, captureError: captureError, shutdown: shutdown };
}));

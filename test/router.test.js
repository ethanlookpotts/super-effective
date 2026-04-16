/**
 * Unit tests for js/router.js
 *
 * Only tests the pure parse/build helpers. applyRoute and setRoute touch
 * DOM + history and are covered by e2e/routing.spec.ts.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert'); // non-strict: ignores cross-realm prototype diffs from vm context
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const src = (...parts) => path.join(__dirname, '..', 'js', ...parts);
const ctx = vm.createContext({
  location: { hash: '' },
  window: { addEventListener: () => {} },
  document: { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null },
  history: { pushState: () => {}, replaceState: () => {} },
});
vm.runInContext(fs.readFileSync(src('router.js'), 'utf8'), ctx);
vm.runInContext(
  'globalThis.parseRoute=parseRoute; globalThis.buildRoute=buildRoute;',
  ctx
);
const { parseRoute, buildRoute } = ctx;

describe('parseRoute', () => {
  test('empty hash defaults to search page', () => {
    assert.deepEqual(parseRoute(''), { page: 'search', params: {} });
  });

  test('bare hash defaults to search', () => {
    assert.deepEqual(parseRoute('#'), { page: 'search', params: {} });
    assert.deepEqual(parseRoute('#/'), { page: 'search', params: {} });
  });

  test('parses known page routes', () => {
    for (const page of ['search', 'party', 'gyms', 'location', 'tms', 'settings']) {
      assert.deepEqual(parseRoute('#/' + page), { page, params: {} });
    }
  });

  test('unknown page falls back to search', () => {
    assert.deepEqual(parseRoute('#/bogus'), { page: 'search', params: {} });
  });

  test('parses dex number param on search', () => {
    assert.deepEqual(parseRoute('#/search?n=25'), { page: 'search', params: { n: '25' } });
  });

  test('parses type filter param on search', () => {
    assert.deepEqual(parseRoute('#/search?type=Electric'), {
      page: 'search',
      params: { type: 'Electric' },
    });
  });

  test('decodes URI-encoded values', () => {
    assert.deepEqual(parseRoute('#/search?type=' + encodeURIComponent('Fire')), {
      page: 'search',
      params: { type: 'Fire' },
    });
  });

  test('parses multiple params', () => {
    assert.deepEqual(parseRoute('#/search?type=Fire&n=6'), {
      page: 'search',
      params: { type: 'Fire', n: '6' },
    });
  });
});

describe('buildRoute', () => {
  test('builds page-only route', () => {
    assert.equal(buildRoute('party', {}), '#/party');
  });

  test('omits empty/null params', () => {
    assert.equal(buildRoute('search', { n: null, type: '' }), '#/search');
  });

  test('includes non-empty params', () => {
    assert.equal(buildRoute('search', { n: 25 }), '#/search?n=25');
  });

  test('encodes special characters in values', () => {
    assert.equal(
      buildRoute('search', { type: 'Fire & Ice' }),
      '#/search?type=Fire%20%26%20Ice'
    );
  });

  test('round-trips parse ∘ build for every page', () => {
    for (const page of ['search', 'party', 'gyms', 'location', 'tms', 'settings']) {
      assert.deepEqual(parseRoute(buildRoute(page, {})), { page, params: {} });
    }
  });

  test('round-trips with params', () => {
    const built = buildRoute('search', { n: 150 });
    assert.deepEqual(parseRoute(built), { page: 'search', params: { n: '150' } });
  });
});

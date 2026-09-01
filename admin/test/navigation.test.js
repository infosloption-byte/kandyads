import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationGroups, filterNavigation, canAccessPath } from '../src/config/navigation.js';

test('administrator sees all permissioned navigation groups', () => {
  const permissions = navigationGroups.flatMap((group) => group.items.map(([, , permission]) => permission));
  const filtered = filterNavigation(navigationGroups, permissions);
  assert.equal(filtered.length, navigationGroups.length);
  assert.equal(filtered.flatMap((group) => group.items).length, navigationGroups.flatMap((group) => group.items).length);
});

test('restricted role only sees permitted modules', () => {
  const filtered = filterNavigation(navigationGroups, ['dashboard.view', 'inventory.read', 'inventory.write']);
  const routes = filtered.flatMap((group) => group.items.map(([, route]) => route));
  assert.deepEqual(routes, ['/', '/inventory']);
});

test('direct URL access follows the same permission boundary', () => {
  assert.equal(canAccessPath('/inventory', ['inventory.read']), true);
  assert.equal(canAccessPath('/projects/123', ['inventory.read']), false);
  assert.equal(canAccessPath('/projects/123', ['projects.read']), true);
});

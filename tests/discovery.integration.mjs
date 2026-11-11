import assert from 'node:assert/strict';

// Run against an isolated server: TEST_API_URL=http://127.0.0.1:3309 node tests/discovery.integration.mjs
const base = process.env.TEST_API_URL;
assert.ok(base, 'Set TEST_API_URL to an isolated test server');
async function request(path, token, body, method = 'POST') {
  const response = await fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
const suffix = Date.now();
const register = (name, coordinates) => request('/api/auth/register', null, {
  name, email: `${name}-${suffix}@example.test`, age: 26, locality: 'Sonari', coordinates,
});
const alice = (await register('Alice', { lat: 22.812234, lng: 86.168567 })).data;
const bob = (await register('Bob', { lat: 22.812234, lng: 86.168567 })).data;
assert.ok(alice.sessionToken && bob.sessionToken);
assert.equal((await request('/api/discover', null, null, 'GET')).status, 401);
assert.equal((await request('/api/auth/location', null, {}, 'PUT')).status, 401);
const discover = async () => (await request('/api/discover', alice.sessionToken, null, 'GET')).data.profiles;
let profiles = await discover();
assert.ok(!profiles.some(p => p.id === alice.user.id), 'Exclude current user');
let match = profiles.find(p => p.id === bob.user.id);
assert.ok(match, 'Registered user appears alongside seeded accounts');
assert.equal(match.distanceKm, 0, 'Same GPS location has zero distance');
assert.ok(profiles.some(p => p.id === 'usr_priyanka_26'), 'Demo account remains');
assert.equal(match.email, undefined);
assert.equal(match.tokens, undefined);
assert.equal(match.password, undefined);
assert.notDeepEqual(match.coordinates, bob.user.coordinates, 'Precise GPS is private');
const location = { locality: 'Sonari', city: 'Jamshedpur', coordinates: { lat: 23, lng: 86 } };
assert.equal((await request('/api/auth/location', bob.sessionToken, { ...location, coordinates: { lat: 91, lng: 0 } }, 'PUT')).status, 400);
assert.equal((await request('/api/auth/location', bob.sessionToken, location, 'PUT')).status, 200);
const restored = (await request('/api/auth/session', bob.sessionToken, null, 'GET')).data.user;
assert.deepEqual(restored.coordinates, location.coordinates, 'Location persisted and restored');
assert.ok(restored.locationUpdatedAt);
profiles = await discover();
match = profiles.find(p => p.id === bob.user.id);
assert.ok(match.distanceKm > 20, 'Discovery uses updated saved GPS');
assert.equal(match.email, undefined);
console.log('PASS: authenticated discovery, real/demo profiles, self-exclusion, GPS privacy, location validation, persistence and updated distances');

import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setupTurn } from '../scripts/setup-turn.mjs';
const folder = await mkdtemp(path.join(os.tmpdir(), 'cipherdate-turn-'));
try {
  const options = { hostname:'turn.example.com', publicIp:'203.0.113.10', relayIp:'10.0.0.5', output:path.join(folder,'relay') };
  const output = await setupTurn(options);
  const env = await readFile(path.join(output,'backend.env'),'utf8');
  const secret = env.match(/TURN_SHARED_SECRET=(.*)/)[1];
  const config = await readFile(path.join(output,'turnserver.conf'),'utf8');
  assert.ok(config.includes(`static-auth-secret=${secret}`));
  assert.ok(config.includes('external-ip=203.0.113.10/10.0.0.5'));
  assert.ok(config.includes('no-tls\n'));
  assert.ok(config.includes('denied-peer-ip=169.254.0.0-169.254.255.255'));
  assert.equal((await stat(path.join(output,'backend.env'))).mode & 0o777, 0o600);
  assert.equal((await stat(output)).mode & 0o777, 0o700);
  await setupTurn(options);
  assert.equal(await readFile(path.join(output,'backend.env'),'utf8'),env,'Reruns preserve the shared secret');
  await writeFile(path.join(folder,'fullchain.pem'),'test fixture'); await writeFile(path.join(folder,'privkey.pem'),'test fixture');
  await setupTurn({...options,tlsDir:folder});
  assert.ok((await readFile(path.join(output,'backend.env'),'utf8')).includes('turns:turn.example.com:5349?transport=tcp'));
  await assert.rejects(setupTurn({...options,hostname:'bad\nconfig'}));
  await assert.rejects(setupTurn({...options,publicIp:'invalid'}));
  console.log('PASS: matching secrets, idempotence, private permissions, NAT mapping, peer restrictions, TLS and input validation');
} finally { await rm(folder,{recursive:true,force:true}); }

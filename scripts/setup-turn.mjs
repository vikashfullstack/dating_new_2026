import crypto from 'node:crypto';
import net from 'node:net';
import path from 'node:path';
import { mkdir, readFile, writeFile, chmod, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function setupTurn({ hostname, publicIp, relayIp = publicIp, output = '.turn', tlsDir, tlsCert = 'fullchain.pem', tlsKey = 'privkey.pem' }) {
  if (!hostname || hostname.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(hostname)) throw new Error('Provide a valid TURN DNS hostname.');
  if (net.isIP(publicIp) !== 4 || net.isIP(relayIp) !== 4) throw new Error('Provide the server public IPv4 and, if behind NAT, its private relay IPv4.');
  for (const value of [tlsCert, tlsKey]) if (path.isAbsolute(value) || value.split(/[\\/]/).includes('..') || /[\r\n]/.test(value)) throw new Error('Certificate paths must be relative to --tls-dir.');
  if (tlsDir) {
    await access(path.resolve(tlsDir, tlsCert));
    await access(path.resolve(tlsDir, tlsKey));
  }
  const directory = path.resolve(output);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  let secret;
  try {
    const existing = await readFile(path.join(directory, 'backend.env'), 'utf8');
    secret = existing.match(/^TURN_SHARED_SECRET=([a-f0-9]{64})$/m)?.[1];
    if (!secret) throw new Error('Existing backend.env has an unrecognized secret. Preserve it and choose a new output folder.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    secret = crypto.randomBytes(32).toString('hex');
  }
  const urls = [`turn:${hostname}:3478?transport=udp`, `turn:${hostname}:3478?transport=tcp`];
  if (tlsDir) urls.push(`turns:${hostname}:5349?transport=tcp`);
  const config = [
    'listening-port=3478', `listening-ip=${relayIp}`, `relay-ip=${relayIp}`,
    `external-ip=${publicIp === relayIp ? publicIp : `${publicIp}/${relayIp}`}`,
    'min-port=49160', 'max-port=49200', 'fingerprint', 'use-auth-secret',
    `static-auth-secret=${secret}`, `realm=${hostname}`, 'stale-nonce=600',
    'user-quota=8', 'total-quota=200', 'no-cli', 'no-multicast-peers', 'no-tcp-relay',
    'pidfile=/tmp/turnserver.pid', 'log-file=stdout', 'simple-log',
    ...['0.0.0.0-0.255.255.255', '10.0.0.0-10.255.255.255', '100.64.0.0-100.127.255.255',
      '127.0.0.0-127.255.255.255', '169.254.0.0-169.254.255.255', '172.16.0.0-172.31.255.255',
      '192.168.0.0-192.168.255.255', '224.0.0.0-255.255.255.255', '::1', 'fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      'fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff'].map(range => `denied-peer-ip=${range}`),
    ...(tlsDir ? ['tls-listening-port=5349', `cert=/tls/${tlsCert}`, `pkey=/tls/${tlsKey}`, 'no-tlsv1', 'no-tlsv1_1', 'no-dtls'] : ['no-tls', 'no-dtls']),
  ].join('\n')+'\n';
  const compose = `services:\n  coturn:\n    image: coturn/coturn:4.18.0\n    restart: unless-stopped\n    network_mode: host\n    user: "${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}"\n    read_only: true\n    tmpfs:\n      - /tmp:mode=1777,size=16m\n    cap_drop:\n      - ALL\n    security_opt:\n      - no-new-privileges:true\n    volumes:\n      - ./turnserver.conf:/etc/coturn/turnserver.conf:ro\n${tlsDir ? `      - ${JSON.stringify(path.resolve(tlsDir)+':/tls:ro')}\n` : ''}    command: ["-c", "/etc/coturn/turnserver.conf"]\n    logging:\n      driver: json-file\n      options:\n        max-size: "10m"\n        max-file: "3"\n`;
  for (const [name, text] of Object.entries({ 'turnserver.conf': config, 'compose.yaml': compose, 'backend.env': `TURN_URLS=${urls.join(',')}\nTURN_SHARED_SECRET=${secret}\n` })) {
    await writeFile(path.join(directory, name), text, { mode: 0o600 });
    await chmod(path.join(directory, name), 0o600);
  }
  return directory;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  const names = { '--hostname': 'hostname', '--public-ip': 'publicIp', '--relay-ip': 'relayIp', '--output': 'output', '--tls-dir': 'tlsDir', '--tls-cert': 'tlsCert', '--tls-key': 'tlsKey' };
  try {
    for (let i = 2; i < process.argv.length; i += 2) {
      if (!names[process.argv[i]] || !process.argv[i+1]) throw new Error('Usage: node scripts/setup-turn.mjs --hostname turn.example.com --public-ip PUBLIC_IPV4 [--relay-ip PRIVATE_IPV4] [--tls-dir CERT_DIRECTORY]');
      options[names[process.argv[i]]] = process.argv[i+1];
    }
    const directory = await setupTurn(options);
    console.log(`Prepared private coturn configuration in ${directory}. No service started.\nLoad backend.env into your Node server environment, then start this compose.yaml on the public Linux host. Secrets were not printed.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

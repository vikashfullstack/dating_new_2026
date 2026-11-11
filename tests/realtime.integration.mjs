import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { WebSocket } from 'ws';

// Exercise the real HTTP/WebSocket handlers with isolated in-memory persistence.
const folder = await mkdtemp(path.join(process.cwd(), '.realtime-test-'));
const port = 3397;
const users = `const users = new Map(), sessions = new Map(), messages = [];
export const sequelize = {close: async()=>{}};
export async function initializeDatabase(seeds) { for(const user of seeds) users.set(user.email,user); }
export const serverUsers = {list:async()=>[...users.values()],get:async key=>users.get(key),set:async(key,value)=>users.set(key,value)};
export const serverSessions = {get:async key=>sessions.get(key),set:async(key,value)=>sessions.set(key,value),delete:async key=>sessions.delete(key),count:async()=>sessions.size};
export const encryptedMessageStore = {push:async message=>messages.push(message),count:async()=>messages.length,forUser:async id=>messages.filter(m=>m.recipientId===id||m.senderId===id)};`;
let server;
const sockets = [];
try {
  await build({entryPoints:['server.ts'], outfile:path.join(folder,'server.mjs'), bundle:true, platform:'node', format:'esm', packages:'external', plugins:[{name:'memory-database', setup(build){build.onResolve({filter:/backend\/database$/},()=>({path:'database',namespace:'test'}));build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:users,loader:'js'}));}}]});
  server = spawn(process.execPath,[path.join(folder,'server.mjs')],{env:{...process.env,NODE_ENV:'production',PORT:String(port)},stdio:['ignore','pipe','pipe']});
  server.stderr.on('data', data => process.stderr.write(data));
  await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(data.toString().includes('server running'))resolve();});server.once('exit',code=>reject(Error('Server exited '+code)));setTimeout(()=>reject(Error('Server timeout')),10000).unref();});
  const base = `http://127.0.0.1:${port}`;
  async function register(name) {const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email:name+'@example.test',locality:'Sonari'})});return r.json();}
  const alice = await register('Alice'), bob = await register('Bob');
  async function connect(account) {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`); sockets.push(ws);
    const inbox = []; ws.on('message',data=>inbox.push(JSON.parse(data)));
    await new Promise(resolve=>ws.once('open',resolve));
    ws.send(JSON.stringify({type:'auth:register',sessionToken:account.sessionToken,userId:'spoofed'}));
    await wait(inbox,p=>p.type==='auth:confirmed');
    assert.equal(inbox.find(p=>p.type==='auth:confirmed').userId,account.user.id);
    return {ws,inbox};
  }
  async function wait(inbox,predicate) { for(let n=0;n<100;n++){const found=inbox.find(predicate);if(found)return found;await new Promise(r=>setTimeout(r,20));}throw Error('Expected event not received'); }
  const a=await connect(alice), b=await connect(bob);
  a.ws.send(JSON.stringify({type:'chat:message',id:'m1',chatId:'conversation',senderId:'forged',recipientId:bob.user.id,ciphertext:'encrypted-fixture',iv:'iv',salt:'salt'}));
  const incoming=await wait(b.inbox,p=>p.type==='chat:incoming');
  assert.equal(incoming.message.senderId,alice.user.id);
  assert.equal(incoming.message.ciphertext,'encrypted-fixture');
  assert.equal((await wait(a.inbox,p=>p.type==='chat:ack')).status,'delivered');
  for(const type of ['signal:call-offer','signal:call-answer','signal:ice-candidate','signal:call-hangup']) {
    a.ws.send(JSON.stringify({type,recipientId:bob.user.id,chatId:'call1',sdp:{type:'offer',sdp:'fixture'},candidate:{candidate:'fixture'}}));
    const event=await wait(b.inbox,p=>p.type===type);
    assert.equal(event.senderId,alice.user.id);assert.equal(event.chatId,'call1');
  }
  const replay=await connect(bob);
  const history = (await wait(replay.inbox,p=>p.type==='chat:incoming')).message;
  assert.equal(history.id,'m1');
  assert.equal(history.isHistory,true,'History replay must not trigger notification sounds');
  assert.equal(incoming.message.isHistory,undefined,'Live messages may trigger notification sounds');
  const unauth=new WebSocket(`ws://127.0.0.1:${port}/ws`);sockets.push(unauth);
  await new Promise(resolve=>unauth.once('open',resolve));
  const closed=new Promise(resolve=>unauth.once('close',resolve));
  unauth.send(JSON.stringify({type:'auth:register',userId:alice.user.id}));
  assert.equal(await closed,1008);
  assert.equal((await fetch(base+'/api/missing')).status,404);
  console.log('PASS: authenticated sockets, sender identity, message delivery/ack, call signaling, reconnect replay, invalid-session rejection, JSON API 404');
} finally { sockets.forEach(ws=>ws.terminate());server?.kill();await rm(folder,{recursive:true,force:true}); }

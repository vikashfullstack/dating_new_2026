import assert from 'node:assert/strict';
import { NotificationSounds } from '../src/services/notificationSounds';

const oscillators: any[] = [];
class FakeAudioContext {
  state = 'suspended'; currentTime = 0; destination = {}; onstatechange?: () => void;
  async resume() { this.state = 'running'; this.onstatechange?.(); }
  createOscillator() {
    const node = { frequency: {value:0}, type: '', starts: 0, stops: 0, connect() {}, disconnect(){}, start(){this.starts++;}, stop(){this.stops++;}, onended: null };
    oscillators.push(node); return node;
  }
  createGain() { return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}; }
}
Object.assign(globalThis, { window: {AudioContext: FakeAudioContext} });
const sounds = new NotificationSounds();
sounds.message();
assert.equal(oscillators.length,0,'No audio before explicit enable');
await sounds.enable();
assert.equal(sounds.isEnabled(),true);
assert.equal(oscillators.length,2,'Enable confirms sound with a chime');
sounds.message();
assert.equal(oscillators.length,4,'New message chimes');
sounds.startRinging();
assert.equal(oscillators.length,8,'Incoming call plays ringtone');
sounds.startRinging();
assert.equal(oscillators.length,8,'Duplicate offer does not start another ringtone');
sounds.message();
assert.equal(oscillators.length,8,'Message does not interrupt incoming ringtone');
sounds.stopRinging();
assert.ok(oscillators.every(node=>node.stops===2),'Call end stops all scheduled tones');
sounds.disable();
sounds.message();
assert.equal(oscillators.length,8,'Muted alerts are silent');
sounds.startRinging();
assert.equal(oscillators.length,8,'Muted incoming call stays silent');
await sounds.enable();
assert.equal(oscillators.length,12,'Enabling during incoming call starts ringtone');
sounds.stopRinging();
sounds.disable();
console.log('PASS: audio unlock, message chime, ringtone, duplicate suppression, mute, stop and re-enable during incoming call');

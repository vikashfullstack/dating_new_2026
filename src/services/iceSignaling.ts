/** ICE gathering may start before SDP is sent; preserve signaling order. */
export class OutgoingIceQueue {
  private ready = false;
  private pending: RTCIceCandidateInit[] = [];
  constructor(private send: (candidate: RTCIceCandidateInit) => void) {}
  add(candidate: RTCIceCandidateInit) {
    if (this.ready) this.send(candidate);
    else this.pending.push(candidate);
  }
  descriptionSent() {
    this.ready = true;
    for (const candidate of this.pending.splice(0)) this.send(candidate);
  }
  reset() { this.ready = false; this.pending = []; }
}

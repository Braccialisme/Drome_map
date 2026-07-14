// drome-commu — backend "léger" pour l'onglet Amis.
//  • PIN d'amitié / de groupe : un code à 6 chiffres = une "salle" (Durable Object).
//  • Présence live : chaque membre connecté en WebSocket diffuse sa position ; le DO
//    rebroadcast la liste des membres à tout le monde.
//  • Points partagés : les points posés dans la salle sont persistés dans le DO et
//    renvoyés aux nouveaux arrivants.
// Aucun compte : l'identité = un uid aléatoire généré côté client (localStorage).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    // Crée un code de salle unique (réservé 48h en KV) → {code}
    if (url.pathname === '/room/new' && req.method === 'POST') {
      let code;
      for (let i = 0; i < 8; i++) {
        code = String(Math.floor(100000 + Math.random() * 900000));
        if (!(await env.PINS.get('room:' + code))) break;
      }
      await env.PINS.put('room:' + code, '1', { expirationTtl: 172800 }); // 48h
      return json({ code });
    }

    // Vérifie qu'une salle existe (le code a été créé) → {exists}
    let m = url.pathname.match(/^\/room\/(\d{6})\/exists$/);
    if (m) return json({ exists: !!(await env.PINS.get('room:' + m[1])) });

    // WebSocket : /room/:code  → routé vers le Durable Object de ce code
    m = url.pathname.match(/^\/room\/(\d{6})$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket')
        return new Response('expected websocket', { status: 426, headers: CORS });
      const id = env.ROOM.idFromName(m[1]);
      return env.ROOM.get(id).fetch(req);
    }

    return new Response('drome-commu ok', { headers: CORS });
  },
};

const STALE_MS = 90 * 1000; // membre sans signe de vie > 90s = retiré

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.members = new Map(); // ws -> { uid, profile, pos, t }
    this.points = null;       // chargé paresseusement depuis le storage
    this.name = null;         // nom de la salle
  }

  async loadPoints() {
    if (this.points === null) this.points = (await this.state.storage.get('points')) || [];
    return this.points;
  }
  async loadName() {
    if (this.name === null) this.name = (await this.state.storage.get('name')) || '';
    return this.name;
  }
  async savePoints() {
    await this.state.storage.put('points', this.points.slice(-200)); // borne
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket')
      return new Response('expected websocket', { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    await this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async accept(ws) {
    ws.accept();
    await this.loadPoints();
    await this.loadName();

    ws.addEventListener('message', async (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === 'hello') {
        this.members.set(ws, { uid: msg.uid, profile: msg.profile || {}, pos: msg.pos || null, t: Date.now() });
        // envoie l'état complet au nouvel arrivant (nom + membres + points existants)
        this.sendTo(ws, { type: 'meta', name: this.name });
        this.sendTo(ws, { type: 'members', members: this.list() });
        this.sendTo(ws, { type: 'points', points: this.points });
        this.broadcast({ type: 'members', members: this.list() });
      } else if (msg.type === 'pos') {
        const me = this.members.get(ws);
        if (me) { me.pos = { lng: msg.lng, lat: msg.lat }; me.t = Date.now(); this.broadcast({ type: 'members', members: this.list() }); }
      } else if (msg.type === 'point') {
        const me = this.members.get(ws);
        const p = msg.point || {};
        if (me && p.id && p.lng != null && p.lat != null) {
          this.points = this.points.filter((x) => x.id !== p.id);
          this.points.push(p);
          await this.savePoints();
          this.broadcast({ type: 'points', points: this.points });
        }
      } else if (msg.type === 'meta') {
        if (typeof msg.name === 'string') {
          this.name = msg.name.slice(0, 40);
          await this.state.storage.put('name', this.name);
          this.broadcast({ type: 'meta', name: this.name });
        }
      } else if (msg.type === 'delpoint') {
        this.points = this.points.filter((x) => x.id !== msg.id);
        await this.savePoints();
        this.broadcast({ type: 'points', points: this.points });
      }
    });

    const drop = () => { this.members.delete(ws); this.broadcast({ type: 'members', members: this.list() }); };
    ws.addEventListener('close', drop);
    ws.addEventListener('error', drop);
  }

  list() {
    const now = Date.now();
    // purge les membres périmés (onglet fermé sans close propre)
    for (const [ws, m] of this.members) if (now - m.t > STALE_MS) this.members.delete(ws);
    return [...this.members.values()].map((m) => ({ uid: m.uid, profile: m.profile, pos: m.pos }));
  }
  sendTo(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }
  broadcast(obj) { const s = JSON.stringify(obj); for (const ws of this.members.keys()) { try { ws.send(s); } catch {} } }
}

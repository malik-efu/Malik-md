// plugins/anticall.js
const fs = require('fs');
const PATH = './data/anticall.json';

// read/write state
function readState() {
  try {
    if (!fs.existsSync(PATH)) return { enabled: false };
    const raw = fs.readFileSync(PATH, 'utf8') || '{}';
    return JSON.parse(raw);
  } catch (e) {
    console.error('readState error', e);
    return { enabled: false };
  }
}
function writeState(obj) {
  try {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(PATH, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('writeState error', e); }
}

// optional simple command integration (adjust to your cmd() wrapper signature)
async function anticallCommandReply(conn, isOwner, text, reply) {
  if (!isOwner) return reply('❌ Only owner can use this.');
  const arg = (text || '').trim().toLowerCase();
  if (!['on','off','status'].includes(arg)) {
    return reply('Usage: .anticall on|off|status');
  }
  if (arg === 'status') {
    const s = readState();
    return reply(`Anticall is ${s.enabled ? 'ON' : 'OFF'}`);
  }
  writeState({ enabled: arg === 'on' });
  return reply(`Anticall ${arg === 'on' ? 'ENABLED' : 'DISABLED'}`);
}

// The core: normalize different call event shapes and handle them
async function handleRawCallEvent(sock, raw) {
  // raw can be:
  // - an array from sock.ev.on('call', calls) where each item is { id, from, status, ... }
  // - an object from sock.ws.on('CB:call', json) where json.content[0] exists (older)
  // - other shapes on forks — we attempt to normalize
  try {
    const state = readState();
    if (!state.enabled) return;

    // helper to handle a normalized call entry
    async function handle(call) {
      try {
        // normalized expected fields: call.id, call.from, call.status
        const callId = call.id || call['call-id'] || (call.attrs && call.attrs['call-id']);
        const from = call.from || call.fromJid || (call.attrs && call.attrs.from) || call.fromJid;
        const status = call.status || call.tag || (call.type) || (call.attrs && call.attrs.status) || '';

        if (!callId || !from) {
          console.log('anticall: unknown call shape, skipping', call);
          return;
        }

        // only act on incoming offers
        const isOffer = (status && typeof status === 'string' && status.toLowerCase().includes('offer')) ||
                        (status === 'offer') || (status === 'inbound') || (call.tag === 'offer');

        if (!isOffer) {
          console.log('anticall: not an offer, status=', status);
          return;
        }

        console.log('📞 Anticall: incoming call detected from', from, 'callId:', callId);

        // 1) reject call
        if (typeof sock.rejectCall === 'function') {
          try {
            await sock.rejectCall(callId, from);
            console.log('📵 Anticall: rejected call from', from);
          } catch (e) {
            console.warn('anticall: rejectCall failed', e && e.message || e);
          }
        } else {
          console.warn('anticall: sock.rejectCall() not available on this Baileys instance');
        }

        // 2) block caller
        if (typeof sock.updateBlockStatus === 'function') {
          try {
            await sock.updateBlockStatus(from, 'block'); // 'block' or true depending on fork; this form is common
            console.log('🚷 Anticall: blocked', from);
          } catch (e) {
            // some forks expect boolean true/false:
            try {
              await sock.updateBlockStatus(from, true);
              console.log('🚷 Anticall: blocked (fallback boolean) ', from);
            } catch (e2) {
              console.warn('anticall: updateBlockStatus failed', e && e.message || e2 && e2.message || e2);
            }
          }
        } else {
          console.warn('anticall: sock.updateBlockStatus() not available on this Baileys instance');
        }

        // 3) try to send a message (optional; ignore if fails)
        try {
          if (typeof sock.sendMessage === 'function') {
            await sock.sendMessage(from, { text: '🚫 Do not call this bot. You have been blocked.' });
          }
        } catch {}

      } catch (err) {
        console.error('anticall: handle(call) error', err);
      }
    }

    // If raw is an array of calls
    if (Array.isArray(raw)) {
      for (const c of raw) {
        // some arrays include wrapper { id, from, status } or full objects
        await handle(c);
      }
      return;
    }

    // If raw looks like CB:call websocket shape: { content: [ { attrs:..., tag: 'offer' } ] }
    if (raw && raw.content && Array.isArray(raw.content) && raw.content.length) {
      for (const item of raw.content) {
        // item may include attrs/from/tag
        const normalized = {
          id: item.attrs && item.attrs['call-id'] || item.id,
          from: item.attrs && item.attrs.from,
          status: item.tag || (item.attrs && item.attrs.status)
        };
        await handle(normalized);
      }
      return;
    }

    // If raw is a single object with fields
    if (raw && typeof raw === 'object') {
      await handle(raw);
      return;
    }

    console.log('anticall: unknown event format', typeof raw, raw);
  } catch (err) {
    console.error('anticall: overall handler error', err);
  }
}

module.exports = {
  readState,
  writeState,
  anticallCommandReply,
  handleRawCallEvent
};

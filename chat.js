/**
 * chat.js – Shared open chat using PeerJS (P2P, no database)
 *
 * Topology: star (hub-and-spoke)
 *   • The first user registers with the fixed ROOM_ID on the PeerJS cloud.
 *   • Subsequent users connect to that host.
 *   • The host relays every message to all connected clients and keeps an
 *     in-memory history of the last MAX_HISTORY messages.
 *   • If the host leaves, the next client waits briefly then tries to
 *     become the new host.
 */

const ROOM_ID = 'chat-juegos-clasicos-sala-v1';
const MAX_HISTORY = 80;
const RECONNECT_DELAY_MS = 2000;
const JOIN_TIMEOUT_MS = 4000;
const PEER_DEBUG_LEVEL = 0;

let peer = null;
let isHost = false;
let hostConn = null;          // (clients) connection to the host
let clients = [];             // (host) connections to all clients
let history = [];             // (host) in-memory message history
let username = '';
let userCount = 1;

// ── DOM references ─────────────────────────────────────────────────
const loginScreen    = document.getElementById('loginScreen');
const chatScreen     = document.getElementById('chatScreen');
const usernameInput  = document.getElementById('usernameInput');
const loginError     = document.getElementById('loginError');
const btnJoin        = document.getElementById('btnJoin');
const messagesEl     = document.getElementById('messages');
const msgInput       = document.getElementById('msgInput');
const btnSend        = document.getElementById('btnSend');
const connectionBadge = document.getElementById('connectionBadge');
const userCountEl    = document.getElementById('userCount');

// ── Login ──────────────────────────────────────────────────────────
btnJoin.addEventListener('click', startJoin);
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startJoin();
});

function startJoin() {
  const name = usernameInput.value.trim();
  if (!name) {
    showLoginError('Por favor, introduce un nombre de usuario.');
    return;
  }
  username = name;
  loginScreen.style.display = 'none';
  chatScreen.style.display = 'flex';
  setBadge('connecting', 'Conectando...');
  joinRoom();
}

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

// ── Room joining ───────────────────────────────────────────────────
function joinRoom() {
  peer = new Peer(null, { debug: PEER_DEBUG_LEVEL });
  peer.on('open', () => tryAsClient());
  peer.on('error', (err) => {
    console.error('Peer error:', err);
    addSystemMessage('Error de conexión. Intenta recargar la página.');
    setBadge('error', 'Error');
  });
}

function tryAsClient() {
  const conn = peer.connect(ROOM_ID, { reliable: true });

  const timeout = setTimeout(() => {
    conn.close();
    becomeHost();
  }, JOIN_TIMEOUT_MS);

  conn.on('open', () => {
    clearTimeout(timeout);
    isHost = false;
    hostConn = conn;
    setBadge('client', 'Conectado');
    setupClientHandlers(conn);
    conn.send({ type: 'join', username });
  });

  conn.on('error', () => {
    clearTimeout(timeout);
    becomeHost();
  });
}

function becomeHost() {
  if (peer) peer.destroy();

  peer = new Peer(ROOM_ID, { debug: PEER_DEBUG_LEVEL });

  peer.on('open', () => {
    isHost = true;
    setBadge('host', 'Anfitrión');
    addSystemMessage('Eres el anfitrión de esta sala.');
    updateUserCount(1);

    // Accept incoming client connections
    peer.on('connection', (conn) => {
      clients.push(conn);
      setupHostHandlers(conn);
    });
  });

  peer.on('error', (err) => {
    // Another peer claimed the host ID first – retry as client
    if (err.type === 'unavailable-id') {
      peer.destroy();
      peer = new Peer(null, { debug: PEER_DEBUG_LEVEL });
      peer.on('open', () => setTimeout(tryAsClient, 500));
    } else {
      console.error('Host peer error:', err);
      setBadge('error', 'Error');
    }
  });
}

// ── Host-side connection handling ──────────────────────────────────
function setupHostHandlers(conn) {
  conn.on('open', () => {
    // Send recent history to the new joiner
    if (history.length > 0) {
      conn.send({ type: 'history', messages: history });
    }
    updateUserCount(clients.length + 1); // +1 for the host
    broadcastUserCount();
  });

  conn.on('data', (data) => {
    if (data.type === 'chat') {
      const msg = { ...data, time: data.time || Date.now() };
      history.push(msg);
      if (history.length > MAX_HISTORY) history.shift();
      displayMessage(msg);
      broadcastToClients({ type: 'chat', ...msg }, conn);
    } else if (data.type === 'join') {
      const sys = systemPayload(`${data.username} se ha unido al chat.`);
      displayMessage(sys);
      broadcastToClients(sys, conn);
    }
  });

  conn.on('close', () => {
    clients = clients.filter((c) => c !== conn);
    updateUserCount(clients.length + 1);
    broadcastUserCount();
    const sys = systemPayload('Un usuario ha salido del chat.');
    displayMessage(sys);
    broadcastToClients(sys);
  });

  conn.on('error', () => {
    clients = clients.filter((c) => c !== conn);
    updateUserCount(clients.length + 1);
    broadcastUserCount();
  });
}

// ── Client-side connection handling ───────────────────────────────
function setupClientHandlers(conn) {
  conn.on('data', (data) => {
    if (data.type === 'chat') {
      displayMessage(data);
    } else if (data.type === 'history') {
      data.messages.forEach((msg) => displayMessage(msg));
    } else if (data.type === 'system') {
      addSystemMessage(data.text);
    } else if (data.type === 'userCount') {
      updateUserCount(data.count);
    }
  });

  conn.on('close', () => {
    hostConn = null;
    addSystemMessage('El anfitrión ha salido. Buscando nuevo anfitrión...');
    setBadge('connecting', 'Reconectando...');
    setTimeout(() => {
      peer.destroy();
      peer = new Peer(null, { debug: PEER_DEBUG_LEVEL });
      peer.on('open', () => setTimeout(tryAsClient, 500));
    }, RECONNECT_DELAY_MS);
  });
}

// ── Messaging ──────────────────────────────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  msgInput.value = '';

  const msg = { type: 'chat', username, text, time: Date.now() };

  if (isHost) {
    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();
    displayMessage(msg);
    broadcastToClients(msg);
  } else if (hostConn && hostConn.open) {
    hostConn.send(msg);
    // Show locally immediately (optimistic)
    displayMessage({ ...msg, own: true });
  }
}

btnSend.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ── Helpers ────────────────────────────────────────────────────────
function broadcastToClients(data, excludeConn = null) {
  clients.forEach((conn) => {
    if (conn !== excludeConn && conn.open) {
      conn.send(data);
    }
  });
}

function broadcastUserCount() {
  broadcastToClients({ type: 'userCount', count: clients.length + 1 });
}

function systemPayload(text) {
  return { type: 'system', text };
}

function updateUserCount(count) {
  userCount = count;
  userCountEl.textContent = count === 1 ? '1 usuario' : `${count} usuarios`;
}

function setBadge(type, text) {
  connectionBadge.textContent = text;
  connectionBadge.className = `badge badge-${type}`;
}

function addSystemMessage(text) {
  displayMessage({ type: 'system', text });
}

function displayMessage(msg) {
  const el = document.createElement('div');

  if (msg.type === 'system') {
    el.className = 'msg msg-system';
    el.textContent = msg.text;
  } else {
    const isOwn = msg.own || msg.username === username;
    el.className = `msg ${isOwn ? 'msg-own' : 'msg-other'}`;

    if (!isOwn) {
      const nameEl = document.createElement('div');
      nameEl.className = 'msg-username';
      nameEl.textContent = msg.username;
      el.appendChild(nameEl);
    }

    const textEl = document.createElement('div');
    textEl.textContent = msg.text;
    el.appendChild(textEl);

    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = formatTime(msg.time);
    el.appendChild(timeEl);
  }

  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ── Leave chat ─────────────────────────────────────────────────────
function leaveChat() {
  if (peer) peer.destroy();
  location.href = 'index.html';
}

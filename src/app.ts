import './index.css';
import { io } from 'socket.io-client';

document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
<div class="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
  <header class="flex items-center justify-between px-6 h-14 shrink-0 bg-slate-900 border-b border-slate-800">
    <div class="flex items-center space-x-4">
      <div class="w-8 h-8 bg-sky-500 rounded flex items-center justify-center">
        <svg class="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
      </div>
      <h1 class="text-lg font-bold tracking-tight text-white">Android Remote Control</h1>
      <span id="streamingBadge" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">WAITING</span>
    </div>
    <div class="flex items-center space-x-6 text-sm">
      <div class="flex flex-col items-end">
        <span class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Latency</span>
        <span class="text-sky-400 font-mono">-- ms</span>
      </div>
      <div class="flex flex-col items-end border-l border-slate-800 pl-6">
        <span class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Encoding</span>
        <span class="text-slate-300">WebRTC</span>
      </div>
    </div>
  </header>

  <main class="flex flex-1 overflow-hidden">
    <aside class="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
      <div class="p-4 border-b border-slate-800">
        <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Connection Stats</h2>
        <div class="space-y-3">
          <div class="bg-slate-800/50 p-3 rounded border border-slate-700/50">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-400">Signaling Server</span>
              <span class="text-emerald-400 font-bold italic">Connected</span>
            </div>
            <div class="text-[11px] font-mono text-slate-500 break-all">\${window.location.host}</div>
          </div>
          <div class="bg-slate-800/50 p-3 rounded border border-slate-700/50">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-400">Status</span>
            </div>
            <div class="text-[11px] text-sky-400 font-bold leading-tight" id="statusMessage">Connecting to signaling server...</div>
            <div class="mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-500">Role: <span class="text-slate-300 italic">Web Client</span></div>
          </div>
        </div>
      </div>

      <div class="flex-1 p-4 overflow-hidden flex flex-col">
        <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Signaling Log</h2>
        <div id="sigLog" class="flex-1 overflow-y-auto bg-black/40 rounded p-3 font-mono text-[10px] space-y-2 text-slate-400">
        </div>
      </div>
    </aside>

    <section class="flex-1 flex flex-col bg-slate-950 p-6 relative overflow-hidden">
      <div class="flex-1 relative flex items-center justify-center min-h-0">
        <div class="relative h-full aspect-[9/19] max-w-full bg-slate-800 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-700 shrink-0">
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
          <div class="w-full h-full bg-black rounded-[2.2rem] overflow-hidden relative group cursor-crosshair">
            
            <video id="remoteVideo" autoplay playsinline class="w-full h-full object-contain pointer-events-none select-none"></video>
            
            <div id="touchOverlay" class="absolute inset-0 z-10 touch-none cursor-crosshair"></div>
            
            <div id="placeholder" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 pointer-events-none transition-opacity duration-300">
               <svg class="w-16 h-16 mb-4 animate-pulse text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
               </svg>
               <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waiting for Device</span>
            </div>

          </div>
        </div>
        
        <div class="absolute top-0 left-0 flex space-x-2">
          <div class="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span class="text-slate-500">RTC State:</span> <span id="rtcStateHud" class="text-white">WAITING</span>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-center space-x-4 shrink-0">
        <button class="flex flex-col items-center p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 cursor-default">
          <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1">
             <div class="w-4 h-4 border-2 border-slate-400 rounded"></div>
          </div>
          <span class="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Home</span>
        </button>
        <button class="flex flex-col items-center p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 cursor-default">
          <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1">
             <div class="w-4 h-4 border-l-2 border-b-2 border-slate-400 rotate-45 ml-1"></div>
          </div>
          <span class="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Back</span>
        </button>
        <button class="flex flex-col items-center p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 cursor-default">
          <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1">
             <div class="w-5 h-1 bg-slate-400"></div>
             <div class="w-5 h-1 bg-slate-400 mt-1"></div>
          </div>
          <span class="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Recents</span>
        </button>
      </div>
    </section>

    <aside class="w-80 bg-slate-900/50 border-l border-slate-800 flex flex-col shrink-0">
      <div class="p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div class="flex items-center justify-between">
           <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remote Action Feed</h2>
           <span id="feedStatus" class="h-2 w-2 rounded-full bg-slate-600"></span>
        </div>
      </div>
      <div id="actionFeed" class="flex-1 overflow-y-auto p-2 space-y-2">
      </div>
      <div class="p-4 border-t border-slate-800 bg-slate-900/80 shrink-0">
        <div class="flex flex-col space-y-2">
           <button id="clearBtn" class="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors">Clear Activity</button>
        </div>
      </div>
    </aside>
  </main>
</div>
`;

function logSignal(msg: string, colorClass: string = "text-slate-500") {
  const logEl = document.getElementById('sigLog');
  if (logEl) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    logEl.insertAdjacentHTML('beforeend', `<p><span class="text-sky-400">[${time}]</span> <span class="${colorClass}">${msg}</span></p>`);
    logEl.scrollTop = logEl.scrollHeight;
  }
}

function logActionLog(action: string, x: number, y: number) {
  const feedEl = document.getElementById('actionFeed');
  const feedStatus = document.getElementById('feedStatus');
  if (feedEl) {
    const colorClass = action === 'DOWN' ? 'text-sky-400' : action === 'UP' ? 'text-rose-400' : 'text-amber-400';
    if (feedStatus) {
      feedStatus.className = 'h-2 w-2 rounded-full bg-sky-500 animate-pulse';
      setTimeout(() => { feedStatus.className = 'h-2 w-2 rounded-full bg-slate-600'; }, 300);
    }
    feedEl.insertAdjacentHTML('afterbegin', `
      <div class="bg-black/60 p-3 rounded border border-slate-800 font-mono text-[11px] animate-fade-in">
        <div class="${colorClass} mb-1">{ action: "${action}" }</div>
        <div class="text-slate-500 grid grid-cols-2">
          <span>x: ${x.toFixed(4)}</span>
          <span>y: ${y.toFixed(4)}</span>
        </div>
      </div>
    `);
    while (feedEl.children.length > 50) {
      feedEl.removeChild(feedEl.lastChild!);
    }
  }
}

document.getElementById('clearBtn')?.addEventListener('click', () => {
    const feedEl = document.getElementById('actionFeed');
    if (feedEl) feedEl.innerHTML = '';
});

// Setup observer for status message to keep signal logs updated roughly
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const text = (mutation.target as HTMLElement).innerText;
      logSignal(text, text.includes('Receiving') ? 'text-emerald-400' : 'text-slate-300');
      
      const badge = document.getElementById('streamingBadge');
      const rtcHud = document.getElementById('rtcStateHud');
      if (text.includes('Receiving')) {
        if (badge) { badge.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"; badge.innerText = "STREAMING"; }
        if (rtcHud) rtcHud.innerText = "CONNECTED";
      }
    }
  });
});
const statusMsgObsrTarget = document.getElementById('statusMessage');
if (statusMsgObsrTarget) { observer.observe(statusMsgObsrTarget, { childList: true }); }

// App elements
const video = document.getElementById('remoteVideo') as HTMLVideoElement;
const overlay = document.getElementById('touchOverlay') as HTMLDivElement;
const statusMsg = document.getElementById('statusMessage') as HTMLDivElement;
const placeholder = document.getElementById('placeholder') as HTMLDivElement;

// Socket.io initialization
const socket = io();

// WebRTC Configuration
const config: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let peerConnection: RTCPeerConnection | null = null;

// --- Signaling Logic ---

socket.on('connect', () => {
  statusMsg.innerText = 'Connected as Web Client. Waiting for Android device...';
  // Declare role as 'web' client
  socket.emit('join', { role: 'web' });
});

socket.on('peer_joined', (data) => {
  if (data.role === 'android') {
    statusMsg.innerText = 'Android device connected. Initializing WebRTC...';
    initWebRTC(); // Start offering WebRTC to the device
  }
});

async function initWebRTC() {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    if (video.srcObject !== event.streams[0]) {
      video.srcObject = event.streams[0];
      statusMsg.innerText = 'Receiving device stream...';
      placeholder.style.opacity = '0';
      video.play().catch(e => console.error("Auto-play prevented", e));
    }
  };

  // Pre-add a transceiver to ensure we are requesting video incoming stream
  peerConnection.addTransceiver('video', { direction: 'recvonly' });

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
  } catch (err) {
    console.error('Error creating SDP offer', err);
  }
}

// Handle incoming WebRTC signaling messages
socket.on('offer', async (offer) => {
  // Wait, if Android offers first, create peer and answer
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice-candidate', e.candidate);
    };
    peerConnection.ontrack = (e) => {
      video.srcObject = e.streams[0];
      statusMsg.innerText = 'Receiving device stream...';
      placeholder.style.opacity = '0';
      video.play().catch(console.error);
    };
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

socket.on('ice-candidate', async (candidate) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// --- Mouse / Touch Event Coordinate Calculation Logic ---

// Computes proportional position relative to *actual video frame scale*
function getRelativeCoords(e: MouseEvent | TouchEvent) {
  const rect = video.getBoundingClientRect();

  let clientX, clientY;
  if (window.TouchEvent && e instanceof TouchEvent) {
    clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX;
    clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  // Fallback map boundaries to full element size if stream metadata missing
  let actualWidth = rect.width;
  let actualHeight = rect.height;
  let startX = 0;
  let startY = 0;

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    const videoRatio = video.videoWidth / video.videoHeight;
    const elementRatio = rect.width / rect.height;

    if (videoRatio > elementRatio) {
      // Stream is letterboxed top/bottom
      actualHeight = rect.width / videoRatio;
      startY = (rect.height - actualHeight) / 2;
    } else {
      // Stream is pillarboxed left/right
      actualWidth = rect.height * videoRatio;
      startX = (rect.width - actualWidth) / 2;
    }
  }

  const x = (clientX - rect.left - startX) / actualWidth;
  const y = (clientY - rect.top - startY) / actualHeight;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y))
  };
}

let isDragging = false;

function emitAction(action: 'DOWN' | 'MOVE' | 'UP', coords: { x: number, y: number }) {
  socket.emit('remote_action', { action, ...coords });
  logActionLog(action, coords.x, coords.y);
}

// 1. Mouse Event Listeners
overlay.addEventListener('mousedown', (e) => {
  isDragging = true;
  emitAction('DOWN', getRelativeCoords(e));
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  emitAction('MOVE', getRelativeCoords(e));
});

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  emitAction('UP', getRelativeCoords(e));
});

// 2. Touch Event Listeners (for Mobile Browsers connecting to control Android)
overlay.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDragging = true;
  emitAction('DOWN', getRelativeCoords(e));
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  emitAction('MOVE', getRelativeCoords(e));
}, { passive: false });

window.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  isDragging = false;
  emitAction('UP', getRelativeCoords(e));
});

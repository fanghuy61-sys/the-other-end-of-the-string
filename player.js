'use strict';
const frame = document.getElementById('game');
const panel = document.getElementById('touch');
const toggle = document.getElementById('toggle');
const full = document.getElementById('full');
const fingers = new Map();
function setPanel(open) {
  releaseAll();
  panel.hidden = !open;
  toggle.textContent = open ? 'Hide controls' : 'Show controls';
  toggle.setAttribute('aria-expanded', String(open));
}
function send(key, pressed) {
  const receive = frame.contentWindow?.hfyTouchKey;
  if (typeof receive === 'function') receive(key, pressed);
}
function release(id) {
  const button = fingers.get(id);
  if (!button) return;
  fingers.delete(id);
  if (![...fingers.values()].includes(button)) {
    button.classList.remove('held');
    send(button.dataset.key, false);
  }
}
function releaseAll() { for (const id of [...fingers.keys()]) release(id); }
for (const button of panel.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    button.setPointerCapture(ev.pointerId);
    frame.contentWindow.focus();
    if (![...fingers.values()].includes(button)) send(button.dataset.key, true);
    fingers.set(ev.pointerId, button);
    button.classList.add('held');
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    button.addEventListener(event, ev => release(ev.pointerId));
  }
  button.addEventListener('contextmenu', ev => ev.preventDefault());
}
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
window.addEventListener('pagehide', releaseAll);
toggle.addEventListener('pointerdown', ev => ev.preventDefault());
toggle.addEventListener('click', () => { setPanel(panel.hidden); frame.contentWindow.focus(); });
full.hidden = !document.fullscreenEnabled;
full.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen().catch(() => {});
  frame.contentWindow.focus();
});
document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; });
setPanel(matchMedia('(pointer:coarse)').matches);


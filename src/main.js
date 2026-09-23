import './style.css';
import { projects } from './content.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// ── Hero background: perspective grid + floating shapes + gradient orbs + mouse glow ──
(function() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, cx, cy;
  let mouseX = 0.5, mouseY = 0.5, targetMX = 0.5, targetMY = 0.5;
  let time = 0;

  function resize() {
    const hero = canvas.parentElement;
    const rect = hero.getBoundingClientRect();
    w = canvas.width = rect.width * devicePixelRatio;
    h = canvas.height = rect.height * devicePixelRatio;
    cx = w / 2; cy = h * 0.55;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement);

  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.parentElement.getBoundingClientRect();
    targetMX = (e.clientX - rect.left) / rect.width;
    targetMY = (e.clientY - rect.top) / rect.height;
  });
  canvas.parentElement.addEventListener('mouseleave', () => { targetMX = 0.5; targetMY = 0.5; });

  // ── Floating shapes ──
  const shapes = [];
  for (let i = 0; i < 12; i++) {
    shapes.push({
      x: Math.random(),
      y: Math.random(),
      r: 4 + Math.random() * 16,
      speed: 0.0003 + Math.random() * 0.0008,
      amplitude: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.08 + Math.random() * 0.18,
      type: ['circle','diamond','hex','cross'][Math.floor(Math.random()*4)],
      hue: [210, 240, 270, 290, 320][Math.floor(Math.random()*5)]
    });
  }

  // ── Gradient orbs ──
  const orbs = [
    { x: 0.75, y: 0.35, r: 0.35, hue: 240, speed: 0.0003 },
    { x: 0.25, y: 0.55, r: 0.28, hue: 280, speed: 0.0004 },
    { x: 0.6, y: 0.7, r: 0.25, hue: 210, speed: 0.00025 },
    { x: 0.45, y: 0.2, r: 0.2, hue: 320, speed: 0.00035 },
  ];

  function drawShape(ctx, x, y, r, type) {
    ctx.beginPath();
    switch(type) {
      case 'circle':
        ctx.arc(x, y, r, 0, Math.PI * 2);
        break;
      case 'diamond':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * 0.7, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r * 0.7, y);
        ctx.closePath();
        break;
      case 'hex':
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 180 * (60 * i - 30);
          const px = x + r * Math.cos(a);
          const py = y + r * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'cross':
        ctx.moveTo(x - r * 0.4, y - r);
        ctx.lineTo(x + r * 0.4, y - r);
        ctx.lineTo(x + r * 0.4, y - r * 0.4);
        ctx.lineTo(x + r, y - r * 0.4);
        ctx.lineTo(x + r, y + r * 0.4);
        ctx.lineTo(x + r * 0.4, y + r * 0.4);
        ctx.lineTo(x + r * 0.4, y + r);
        ctx.lineTo(x - r * 0.4, y + r);
        ctx.lineTo(x - r * 0.4, y + r * 0.4);
        ctx.lineTo(x - r, y + r * 0.4);
        ctx.lineTo(x - r, y - r * 0.4);
        ctx.lineTo(x - r * 0.4, y - r * 0.4);
        ctx.closePath();
        break;
    }
  }

  function draw() {
    mouseX += (targetMX - mouseX) * 0.05;
    mouseY += (targetMY - mouseY) * 0.05;
    time += 1;
    const W = w / devicePixelRatio;
    const H = h / devicePixelRatio;
    ctx.clearRect(0, 0, W, H);

    // ── 1. Gradient orbs (blurred) ──
    orbs.forEach(orb => {
      const ox = (orb.x + Math.sin(time * orb.speed) * 0.08 + (mouseX - 0.5) * 0.15) * W;
      const oy = (orb.y + Math.cos(time * orb.speed * 1.3) * 0.08 + (mouseY - 0.5) * 0.15) * H;
      const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * W * 0.9);
      gradient.addColorStop(0, `hsla(${orb.hue},70%,65%,0.12)`);
      gradient.addColorStop(0.5, `hsla(${orb.hue},60%,55%,0.04)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    });

    // ── 2. Perspective grid floor ──
    const gridCenterX = W * (0.5 + (mouseX - 0.5) * 0.3);
    const gridCenterY = H * 0.85;
    const horizonY = H * 0.45;
    ctx.strokeStyle = 'rgba(132,153,255,0.06)';
    ctx.lineWidth = 0.5;

    // Horizontal lines
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const perspective = Math.pow(t, 2.5);
      const y = horizonY + (gridCenterY - horizonY) * perspective;
      const spread = perspective * W * 0.9;
      const x1 = gridCenterX - spread;
      const x2 = gridCenterX + spread;
      const alpha = (1 - perspective) * 0.35;
      ctx.strokeStyle = `rgba(132,153,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = -15; i <= 15; i++) {
      const t = i / 15;
      const x = gridCenterX + t * W * 1.2;
      const alpha = Math.abs(t) < 0.15 ? 0.2 : 0.04;
      ctx.strokeStyle = `rgba(132,153,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, horizonY);
      ctx.lineTo(gridCenterX + t * W * 0.6, H);
      ctx.stroke();
    }

    // Bright center line
    ctx.strokeStyle = 'rgba(183,160,251,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gridCenterX, horizonY);
    ctx.lineTo(gridCenterX, H);
    ctx.stroke();

    // ── 3. Floating shapes ──
    shapes.forEach(s => {
      const sx = ((s.x + Math.sin(time * s.speed + s.phase) * s.amplitude * 0.15 + (mouseX - 0.5) * 0.3) % 1 + 1) % 1;
      const sy = ((s.y + Math.cos(time * s.speed * 1.4 + s.phase) * s.amplitude * 0.15 + (mouseY - 0.5) * 0.3) % 1 + 1) % 1;
      const px = sx * W;
      const py = sy * H;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3);
      glow.addColorStop(0, `hsla(${s.hue},80%,70%,${s.opacity})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(px - s.r * 3, py - s.r * 3, s.r * 6, s.r * 6);

      ctx.strokeStyle = `hsla(${s.hue},70%,65%,${s.opacity * 0.8})`;
      ctx.lineWidth = 0.8;
      drawShape(ctx, px, py, s.r, s.type);
      ctx.stroke();
    });

    // ── 4. Mouse glow ──
    const mgx = mouseX * W;
    const mgy = mouseY * H;
    const mouseGlow = ctx.createRadialGradient(mgx, mgy, 0, mgx, mgy, 350);
    mouseGlow.addColorStop(0, 'rgba(183,160,251,0.12)');
    mouseGlow.addColorStop(0.3, 'rgba(150,130,240,0.06)');
    mouseGlow.addColorStop(0.6, 'rgba(100,120,220,0.02)');
    mouseGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = mouseGlow;
    ctx.fillRect(0, 0, W, H);

    // ── 5. Scan lines overlay ──
    ctx.fillStyle = 'rgba(16,22,42,0.03)';
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }

    // ── 6. Floating particles near cursor ──
    const nearCursor = shapes.filter(s => {
      const sx = ((s.x + Math.sin(time * s.speed + s.phase) * s.amplitude * 0.15 + (mouseX - 0.5) * 0.3) % 1 + 1) % 1;
      const sy = ((s.y + Math.cos(time * s.speed * 1.4 + s.phase) * s.amplitude * 0.15 + (mouseY - 0.5) * 0.3) % 1 + 1) % 1;
      return Math.hypot((sx - mouseX) * W, (sy - mouseY) * H) < 200;
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

const careers = {
  furen: { domain: 'ENERGY & INTELLIGENCE', mark: 'ϟ', heading: '能源数字化与 AI 可视化', intro: '负责能源数字化多端产品的前端研发协作，将 AI 问答与三维可视化带入真实业务。', points: ['负责 EMS 管理端、能源大屏、H5 / App 与低代码平台，承担任务拆分、接口协同与交付推进。', '建设 AI 流式问答、设备上下文、语音输入和告警联动，完成储能模型、站点拓扑与数据图表。', '推进中英德日多语言及德国项目适配，处理时区、电价、报表与地图差异，沉淀公共能力。'], tags: ['前端技术负责', 'AI 能源问答', '三维可视化', '多端与多语言'] },
  beta: { domain: 'PRODUCTS & CREATIVE TOOLS', mark: '✳', heading: '金融 SaaS 与智慧社区', intro: '连接金融数字营销与智慧社区业务，构建可复用的多端产品和可视化内容生产工具。', points: ['开发理财师保险计划书、数字营销与投后服务等 PC / H5 / SaaS 产品，适配 App、微信与企微。', '从 0 到 1 开发部署智慧社区后台、大屏和微信小程序，交付郑州、丽水等地智慧展馆及预约审核系统。', '开发 H5 运营工厂、短视频编辑平台和 ChatGPT 流式原型，完成配置化表单、SSR 改造与多端兼容。'], tags: ['金融 SaaS', '智慧社区', '可视化编辑器', '多端交付'] },
  sino: { domain: 'FOUNDATIONS & LEADERSHIP', mark: '⌘', heading: '营销 SaaS 与前端团队协作', intro: '积累营销 SaaS、数字金融与移动端研发经验，并在营销 SaaS 项目中承担前端组长职责。', points: ['实现线索评级、模型圈选、智能推荐、A/B Test 与埋点分析，交付哈根达斯、雅培、一汽马自达等客户项目。', '负责技术选型、工作量评估、任务分配及研发协作，推进业务需求落地和版本交付。', '参与数字金融 App、官网及 PC / 移动端开发，覆盖行情、支付、预警、K 线与收益分析。'], tags: ['营销分析 SaaS', '前端协作', '业务建模', '多端适配'] },
};

function addTextNodes(container, tag, values) {
  container.replaceChildren(...values.map(text => { const node = document.createElement(tag); node.textContent = text; return node; }));
}
function selectCareer(id) {
  const career = careers[id];
  if (!career) return;
  $$('[data-career]').forEach(button => { const active = button.dataset.career === id; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
  $('#career-panel').setAttribute('aria-labelledby', `career-tab-${id}`);
  $('#career-panel').dataset.activeCareer = id;
  $('#career-domain').textContent = career.domain;
  $('.career-panel-mark').textContent = career.mark;
  $('#career-heading').textContent = career.heading;
  $('#career-intro').textContent = career.intro;
  addTextNodes($('#career-points'), 'li', career.points);
  addTextNodes($('#career-tags'), 'span', career.tags);
  if (!reducedMotion.matches) $('#career-panel').animate([{ opacity: .3, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'ease-out' });
}
$$('[data-career]').forEach(button => button.addEventListener('click', () => selectCareer(button.dataset.career)));
selectCareer('furen');

function setupKeyboardTabs(selector) {
  const tabs = $$(selector);
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    let next;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
  }));
}
setupKeyboardTabs('[data-career]');
// Scene handled by iframe in model section below

const dialog = $('#project-dialog');
let dialogOpener;
function openProject(id, opener) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  dialogOpener = opener;
  $('#dialog-category').textContent = project.category;
  $('#dialog-title').textContent = project.title;
  $('#dialog-description').textContent = project.description;
  addTextNodes($('#dialog-stack'), 'span', project.stack);
  addTextNodes($('#dialog-highlights'), 'li', project.highlights);
  const preview = $('#dialog-preview');
  preview.hidden = !project.preview;
  if (project.preview) {
    $('#dialog-preview-image').src = project.preview.src;
    $('#dialog-preview-image').alt = project.preview.alt;
    $('#dialog-preview-link').href = project.preview.full || project.preview.src;
    $('#dialog-preview-caption').textContent = project.preview.caption;
  } else {
    $('#dialog-preview-image').removeAttribute('src');
    $('#dialog-preview-image').alt = '';
    $('#dialog-preview-link').removeAttribute('href');
    $('#dialog-preview-caption').textContent = '';
  }
  const link = $('#dialog-website');
  link.textContent = project.websiteLabel || '访问在线产品 ↗';
  link.hidden = !project.website;
  if (project.website) link.href = project.website;
  else link.removeAttribute('href');
  dialog.dataset.project = id;
  document.body.classList.add('dialog-open');
  scene?.setSuspended(true);
  dialog.showModal();
  dialog.scrollTop = 0;
  $('#close-dialog').focus();
}
function closeProject() { dialog.close(); }
$$('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
$('#close-dialog').addEventListener('click', closeProject);
$('#dialog-back').addEventListener('click', closeProject);
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeProject(); } });
dialog.addEventListener('close', () => { scene?.setSuspended(false); document.body.classList.remove('dialog-open'); dialogOpener?.focus({ preventScroll: true }); });

// Dragging actual node elements demonstrates a small, local canvas interaction.
const miniCanvas = $('#mini-canvas');
const miniNodes = $$('.mini-node');
const nodeRects = new Map();
let canvasSize, nodeFrame = 0, pendingNodeMove;
function measureNodes() {
  canvasSize = { width: miniCanvas.clientWidth, height: miniCanvas.clientHeight };
  miniNodes.forEach(node => nodeRects.set(node, { x: node.offsetLeft, y: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight }));
}
function drawWires() {
  const connect = (a, b, path) => {
    const left = nodeRects.get(a), right = nodeRects.get(b);
    const start = {x: left.x + left.width, y: left.y + left.height / 2}, end = {x: right.x, y: right.y + right.height / 2};
    const d = Math.max(28, Math.abs(end.x - start.x) * .55);
    path.setAttribute('d', `M ${start.x} ${start.y} C ${start.x + d} ${start.y}, ${end.x - d} ${end.y}, ${end.x} ${end.y}`);
  };
  connect($('.node-prompt'), $('.node-image'), $('#wire-a'));
  connect($('.node-image'), $('.node-video'), $('#wire-b'));
}
function flushNodeMove() {
  nodeFrame = 0;
  if (!pendingNodeMove) return;
  const {node, x, y} = pendingNodeMove;
  pendingNodeMove = null;
  const rect = nodeRects.get(node);
  rect.x = Math.max(7, Math.min(canvasSize.width - rect.width - 7, x));
  rect.y = Math.max(7, Math.min(canvasSize.height - rect.height - 24, y));
  node.style.left = `${rect.x}px`;
  node.style.top = `${rect.y}px`;
  drawWires();
}
function queueNodeMove(node, x, y) {
  pendingNodeMove = {node, x, y};
  if (!nodeFrame) nodeFrame = requestAnimationFrame(flushNodeMove);
}
measureNodes();
miniNodes.forEach(node => {
  let drag;
  node.tabIndex = 0;
  node.setAttribute('role', 'group');
  node.setAttribute('aria-label', `${node.querySelector('.mini-node-label').textContent}，可拖动或用方向键移动`);
  node.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = nodeRects.get(node);
    drag = { x: event.clientX, y: event.clientY, left: rect.x, top: rect.y };
    node.setPointerCapture(event.pointerId);
  });
  node.addEventListener('pointermove', event => { if (drag) queueNodeMove(node, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y); });
  const end = () => { drag = null; };
  node.addEventListener('pointerup', end); node.addEventListener('pointercancel', end); node.addEventListener('lostpointercapture', end);
  node.addEventListener('keydown', event => {
    const delta = {ArrowLeft: [-8,0], ArrowRight: [8,0], ArrowUp: [0,-8], ArrowDown: [0,8]}[event.key];
    if (delta) { event.preventDefault(); const rect = nodeRects.get(node); queueNodeMove(node, rect.x + delta[0], rect.y + delta[1]); }
  });
});
new ResizeObserver(() => {
  measureNodes();
  miniNodes.forEach(node => {
    const rect = nodeRects.get(node);
    if (rect.x + rect.width + 7 > canvasSize.width) { rect.x = Math.max(7, canvasSize.width - rect.width - 7); node.style.left = `${rect.x}px`; }
  });
  drawWires();
}).observe(miniCanvas);
drawWires();

let studioPlaying = false;
$('#studio-play').addEventListener('click', () => { studioPlaying = !studioPlaying; $('.studio-preview').classList.toggle('playing', studioPlaying); $('#studio-play').setAttribute('aria-label', studioPlaying ? '暂停短视频编辑器动效示意' : '播放短视频编辑器动效示意'); $('#studio-play').setAttribute('aria-pressed', String(studioPlaying)); $('#studio-play span').textContent = studioPlaying ? 'Ⅱ' : '▶'; });

const studioPreview = $('.studio-preview');
new IntersectionObserver(([entry]) => studioPreview.classList.toggle('offscreen', !entry.isIntersecting), { threshold: 0 }).observe(studioPreview);

let toastTimer;
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2500); }
$('#copy-email').addEventListener('click', async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText('675394631@qq.com');
    else { const input = document.createElement('textarea'); input.value = '675394631@qq.com'; input.setAttribute('readonly', ''); input.style.cssText = 'position:fixed;left:-9999px;'; document.body.append(input); input.select(); const success = document.execCommand('copy'); input.remove(); if (!success) throw new Error('copy unavailable'); }
    toast('邮箱已复制：675394631@qq.com');
  } catch { toast('长按邮箱地址即可复制'); }
});

const icons = {
  home: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-40 12 12)"/>',
  work: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  experience: '<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="8" cy="6" r="2" fill="#141b30"/><circle cx="16" cy="12" r="2" fill="#141b30"/><circle cx="10" cy="18" r="2" fill="#141b30"/>',
  contact: '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8M8 13h5"/>',
};
const mobileNav = document.createElement('nav');
mobileNav.className = 'bottom-nav'; mobileNav.setAttribute('aria-label', '手机导航');
mobileNav.innerHTML = [['home','简历'],['experience','经历'],['work','项目'],['contact','联系']].map(([id, label]) => `<a href="#${id}" data-nav="${id}" ${id === 'home' ? 'class="active" aria-current="location"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${label}</span></a>`).join('');
document.body.append(mobileNav);
const navSections = ['home', 'experience', 'work', 'contact'].map(id => ({id, element: document.getElementById(id)}));
const navLinks = $$('[data-nav]');
let activeNav = '', scrollPending = false;
const updateNav = () => {
  scrollPending = false;
  let active = 'home';
  for (const {id, element} of navSections) { if (element.getBoundingClientRect().top <= innerHeight * .4) active = id; }
  if (active === activeNav) return;
  activeNav = active;
  navLinks.forEach(link => { link.classList.toggle('active', link.dataset.nav === active); if (link.dataset.nav === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
};
window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNav); } }, { passive: true });
updateNav();

$$('.reveal').forEach(el => el.classList.add('visible'));

// The mobile project viewer behaves like a native sheet: drag its handle to dismiss.
const sheetHeader = $('.dialog-top');
let sheetDrag;
sheetHeader.addEventListener('pointerdown', event => {
  if (event.target.closest('button') || innerWidth > 700) return;
  sheetDrag = { y: event.clientY, distance: 0 };
  sheetHeader.setPointerCapture(event.pointerId);
});
sheetHeader.addEventListener('pointermove', event => {
  if (!sheetDrag) return;
  sheetDrag.distance = Math.max(0, event.clientY - sheetDrag.y);
  dialog.style.transform = `translateY(${Math.min(200, sheetDrag.distance)}px)`;
});
function finishSheetDrag(event) {
  if (!sheetDrag) return;
  const shouldClose = event.type !== 'pointercancel' && sheetDrag.distance > 75;
  sheetDrag = undefined;
  dialog.style.transform = '';
  if (shouldClose) closeProject();
}
sheetHeader.addEventListener('pointerup', finishSheetDrag);
sheetHeader.addEventListener('pointercancel', finishSheetDrag);

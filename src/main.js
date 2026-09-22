import './style.css';
import { projects } from './content.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
setupKeyboardTabs('[data-world]');

let scene, scenePromise, currentWorld = 'ai';
let paused = reducedMotion.matches;
const worldCopy = {
  ai: ['AIMAGIC', 'AI 创意工具 · 独立全栈产品', 'AIMagic · AI 创意工具平台'],
  energy: ['3D MODEL SHOWCASE', 'Blender / Three.js / GLB', '模型展示 · 智慧能源园区'],
};
const posters = { ai: './assets/scene-ai.webp', energy: './assets/scene-energy.webp' };
function selectWorld(mode) {
  currentWorld = mode;
  const copy = worldCopy[mode];
  $$('[data-world]').forEach(button => { const selected = button.dataset.world === mode; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  $('#scene-title').textContent = copy[0];
  $('#scene-subtitle').textContent = copy[1];
  $('#annotation-label').textContent = copy[2];
  $('#scene-poster').src = posters[mode];
  $('#scene-poster').alt = `${copy[1]}项目三维预览`;
  $('.hero').dataset.world = mode;
  $('#scene-wrap').setAttribute('aria-labelledby', `world-${mode}`);
  scene?.setMode(mode);
}
$$('[data-world]').forEach(button => button.addEventListener('click', () => selectWorld(button.dataset.world)));
function updatePauseUI() { $('#pause-symbol').textContent = paused ? '▷' : 'Ⅱ'; $('#pause-scene').setAttribute('aria-label', paused ? '播放自动动画' : '暂停自动动画'); $('#pause-scene').title = paused ? '播放自动动画' : '暂停自动动画'; $('#pause-scene').setAttribute('aria-pressed', String(paused)); }
updatePauseUI();
$('#pause-scene').addEventListener('click', () => { paused = !paused; scene?.setPaused(paused); updatePauseUI(); });
$('#reset-scene').addEventListener('click', () => { scene?.resetView(); toast('已回到初始视角'); });
reducedMotion.addEventListener('change', event => { paused = event.matches; updatePauseUI(); });
function activateScene() {
  if (scenePromise) return scenePromise;
  $('#scene-loading').hidden = false;
  scenePromise = import('./scene.js').then(({ initScene }) => {
    scene = initScene($('#scene'), { initialMode: currentWorld, paused, suspended: $('#project-dialog').open });
    scene.setMode(currentWorld);
    const updateReady = () => {
      const ready = $('#scene').dataset.sceneReady;
      if (ready === 'true') {
        $('#scene-wrap').classList.add('scene-live');
        $('#scene-loading').hidden = true;
        $('.drag-hint').innerHTML = '<span aria-hidden="true">⤧</span> 拖拽旋转 · 双指缩放';
      } else if (ready === 'fallback') {
        $('#scene-loading').hidden = true;
        $('#scene-wrap').classList.remove('scene-live');
      }
    };
    const observer = new MutationObserver(updateReady);
    observer.observe($('#scene'), { attributes: true, attributeFilter: ['data-scene-ready'] });
    updateReady();
    return scene;
  }).catch(() => {
    scenePromise = null;
    $('#scene-loading').hidden = true;
    toast('三维演示加载失败，简历内容可正常查看');
  });
  return scenePromise;
}
// Auto-start the 3D scene on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => activateScene());
} else {
  activateScene();
}

$('#fullscreen-scene').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($('.hero').requestFullscreen) await $('.hero').requestFullscreen();
    else {
      const active = $('.hero').classList.toggle('immersive');
      document.body.classList.toggle('immersive-open', active);
      $('#fullscreen-scene').setAttribute('aria-label', active ? '退出沉浸模式' : '进入沉浸模式');
      toast(active ? '已进入沉浸模式，点击 ⛶ 返回' : '已返回作品集');
    }
  } catch { toast('当前浏览器暂不支持全屏，仍可拖拽探索'); }
});
document.addEventListener('fullscreenchange', () => $('#fullscreen-scene').setAttribute('aria-label', document.fullscreenElement ? '退出沉浸模式' : '进入沉浸模式'));

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
window.addEventListener('pagehide', () => scene?.setPaused(true));
window.addEventListener('pageshow', () => scene?.setPaused(paused));

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

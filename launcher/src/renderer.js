const state = { snapshot: null, selected: null, view: 'library', busy: false };
const $ = selector => document.querySelector(selector);
const ui = {
  content: $('#content'), gameNav: $('#gameNav'), gameCount: $('#gameCount'), pageTitle: $('#pageTitle'),
  pageEyebrow: $('#pageEyebrow'), refresh: $('#refreshButton'), website: $('#websiteButton'), brand: $('#brandButton'),
  settings: $('#settingsButton'), dialog: $('#settingsDialog'), form: $('#settingsForm'), catalogUrl: $('#catalogUrlInput'),
  channel: $('#updateChannelInput'), connection: $('#connectionCard'), connectionTitle: $('#connectionTitle'),
  connectionText: $('#connectionText'), overlay: $('#operationOverlay'), operationTitle: $('#operationTitle'),
  operationFile: $('#operationFile'), progress: $('#operationProgress'), percent: $('#operationPercent'),
  bytes: $('#operationBytes'), toasts: $('#toastStack')
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const safeUrl = value => { try { const url = new URL(value, location.href); return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
const fmtBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const units = ['B','KB','MB','GB','TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
};
const fmtDate = value => value ? new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'long', year:'numeric' }).format(new Date(value)) : '—';

function notify(title, message, danger = false) {
  const node = document.createElement('div');
  node.className = `toast${danger ? ' danger' : ''}`;
  node.innerHTML = `<strong>${esc(title)}</strong><small>${esc(message)}</small>`;
  ui.toasts.append(node);
  setTimeout(() => node.remove(), 5200);
}

function statusFor(game) {
  const runtime = game.runtime || {};
  if (!runtime.install) return { label:'Oyun bulunamadı', tone:'muted', action:'none' };
  if (runtime.error) return { label:'Kontrol hatası', tone:'danger', action:'none' };
  if (!game.release) return { label:'Yakında', tone:'muted', action:'none' };
  return ({
    installed:{ label:'Dublaj güncel', tone:'success', action:'launch' },
    adopted:{ label:'Dublaj mevcut', tone:'success', action:'launch' },
    'update-available':{ label:'Güncelleme hazır', tone:'accent', action:'install' },
    'repair-required':{ label:'Onarım gerekli', tone:'accent', action:'install' },
    'removed-externally':{ label:'Yeniden indir', tone:'accent', action:'install' },
    available:{ label:'İndirmeye hazır', tone:'accent', action:'install' }
  })[runtime.analysis?.status] || { label:'İndirmeye hazır', tone:'accent', action:'install' };
}

function setConnection(meta = {}) {
  ui.connection.classList.toggle('online', meta.source === 'remote');
  ui.connection.classList.toggle('offline', meta.source !== 'remote');
  ui.connectionTitle.textContent = meta.source === 'remote' ? 'Çevrimiçi' : meta.source === 'cache' ? 'Önbellek modu' : 'Bağlantı yok';
  ui.connectionText.textContent = meta.source === 'remote' ? 'Katalog güncel' : meta.source === 'cache' ? 'Son kayıt gösteriliyor' : 'Sunucu bekleniyor';
}

function applyBrand() {
  const brand = state.snapshot?.catalog?.brand || {};
  if (/^#[0-9a-f]{6}$/i.test(brand.accent || '')) document.documentElement.style.setProperty('--accent', brand.accent);
  if (brand.name) document.title = `${brand.name} Launcher`;
}

function renderNav() {
  const games = state.snapshot?.catalog?.games || [];
  ui.gameCount.textContent = games.length;
  ui.gameNav.replaceChildren(...games.map(game => {
    const button = document.createElement('button');
    const cover = safeUrl(game.coverImage || game.heroImage);
    button.className = `game-nav-item${game.id === state.selected ? ' active' : ''}`;
    button.innerHTML = `${cover ? `<img src="${esc(cover)}" alt="">` : '<span class="nav-cover-fallback">O</span>'}<span><strong>${esc(game.title)}</strong><small>${esc(statusFor(game).label)}</small></span>`;
    button.onclick = () => { state.selected = game.id; state.view = 'library'; render(); };
    return button;
  }));
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
}

function button(label, kind, handler, disabled = false) {
  const node = document.createElement('button');
  node.className = `button ${kind}`;
  node.textContent = label;
  node.disabled = disabled;
  node.onclick = handler;
  return node;
}

function renderGame(game) {
  const runtime = game.runtime || {};
  const analysis = runtime.analysis || {};
  const status = statusFor(game);
  ui.pageEyebrow.textContent = 'ODIUM KÜTÜPHANESİ';
  ui.pageTitle.textContent = game.title;

  const hero = document.createElement('article');
  hero.className = 'hero';
  const heroUrl = safeUrl(game.heroImage || game.coverImage);
  if (heroUrl) hero.style.setProperty('--hero', `url("${heroUrl.replaceAll('"', '%22')}")`);
  hero.innerHTML = `<div class="hero-copy"><div class="badges">${game.launcherExclusive?.enabled ? `<span class="badge exclusive">${esc(game.launcherExclusive.label || "Launcher'a Özel")}</span>` : ''}<span class="badge ${status.tone}">${esc(status.label)}</span>${runtime.install ? `<span class="badge">${runtime.install.platform === 'steam' ? 'Steam' : 'Epic Games'}</span>` : ''}</div><h2>${esc(game.title)}</h2><p>${esc(game.description || game.shortDescription || 'Odium Stüdyo Türkçe dublaj projesi.')}</p><div class="hero-actions"></div></div>`;
  const actions = hero.querySelector('.hero-actions');
  const available = Boolean(runtime.install && game.release && !runtime.error);
  if (status.action === 'launch') actions.append(button('Oyunu başlat', 'primary', () => execute(() => window.odium.launchGame(game.id), 'Oyun başlatıldı.')));
  else actions.append(button(analysis.status === 'update-available' ? 'Güncellemeyi yükle' : analysis.status === 'repair-required' ? 'Dublajı onar' : analysis.status === 'removed-externally' ? 'Yeniden indir' : 'Dublajı indir', 'primary', () => install(game), !available));
  if (runtime.install) actions.append(button('Klasörü aç', 'ghost', () => execute(() => window.odium.openInstallFolder(game.id))));
  if (analysis.state) actions.append(button('Dublajı kaldır', 'ghost danger', () => uninstall(game)));

  const panels = document.createElement('div');
  panels.className = 'info-grid';
  const pending = analysis.pendingBytes || 0;
  panels.innerHTML = `<section class="panel"><div class="panel-head"><h3>Dublaj sürümü</h3><span>${game.release ? `v${esc(game.release.version)}` : 'Yayın bekleniyor'}</span></div><div class="stats"><div><strong>${esc(analysis.totalFiles || 0)}</strong><small>Dosya</small></div><div><strong>${esc(fmtBytes(game.release?.size || 0))}</strong><small>Toplam</small></div><div><strong>${esc(fmtBytes(pending))}</strong><small>İndirilecek</small></div></div><p class="changelog">${esc(game.release?.changelog || 'Yeni sürüm notları admin panelinden yayınlanır.')}</p></section><section class="panel"><div class="panel-head"><h3>Sistem kontrolü</h3><span>Otomatik</span></div><div class="checks"><div class="check ${runtime.install ? 'ok' : ''}"><b>${runtime.install ? '✓' : '!'}</b><span><strong>${runtime.install ? 'Resmî kurulum bulundu' : 'Oyun bulunamadı'}</strong><small>${esc(runtime.install?.installPath || 'Steam veya Epic kurulumu gerekli.')}</small></span></div><div class="check ${runtime.error ? '' : 'ok'}"><b>${runtime.error ? '!' : '✓'}</b><span><strong>${runtime.error ? 'Manifest hatası' : 'SHA-256 doğrulaması'}</strong><small>${esc(runtime.error || 'Her dosya kurulmadan önce doğrulanır.')}</small></span></div></div></section>`;

  const related = (state.snapshot.catalog.games || []).filter(item => item.id !== game.id);
  const fragment = document.createDocumentFragment();
  fragment.append(hero, panels);
  if (related.length) {
    const heading = document.createElement('h2'); heading.className = 'section-title'; heading.textContent = 'Diğer projeler';
    const grid = document.createElement('div'); grid.className = 'game-grid';
    related.forEach(item => {
      const card = document.createElement('button'); card.className = 'game-card';
      const image = safeUrl(item.heroImage || item.coverImage);
      card.innerHTML = `<span class="game-card-image"${image ? ` style="background-image:url('${esc(image)}')"` : ''}></span><span><strong>${esc(item.title)}</strong><small>${esc(statusFor(item).label)}</small></span>`;
      card.onclick = () => { state.selected = item.id; render(); document.querySelector('.main-area').scrollTo({ top:0, behavior:'smooth' }); };
      grid.append(card);
    });
    fragment.append(heading, grid);
  }
  ui.content.replaceChildren(fragment);
}

function renderNews() {
  ui.pageEyebrow.textContent = 'ODIUM HABERLERİ';
  ui.pageTitle.textContent = 'Stüdyodan son gelişmeler';
  const news = [...(state.snapshot?.catalog?.news || [])].sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (!news.length) { ui.content.innerHTML = '<div class="empty"><div class="empty-mark">◫</div><h2>Henüz haber yayınlanmadı</h2><p>Admin panelinden yayınlanan haberler burada görünecek.</p></div>'; return; }
  const grid = document.createElement('div'); grid.className = 'news-grid';
  news.forEach(item => {
    const card = document.createElement('article'); card.className = 'news-card';
    const image = safeUrl(item.image);
    card.innerHTML = `<div class="news-image"${image ? ` style="background-image:url('${esc(image)}')"` : ''}></div><div><span>${esc(fmtDate(item.publishedAt).toUpperCase())}</span><h2>${esc(item.title)}</h2><p>${esc(item.summary || item.body || '')}</p></div>`;
    grid.append(card);
  });
  ui.content.replaceChildren(grid);
}

function render() {
  applyBrand(); renderNav();
  if (state.view === 'news') return renderNews();
  const games = state.snapshot?.catalog?.games || [];
  const game = games.find(item => item.id === state.selected) || games[0];
  if (!game) { ui.pageTitle.textContent = 'Türkçe dublajlarınız'; ui.content.innerHTML = '<div class="empty"><div class="empty-mark">O</div><h2>Katalog yayına hazır</h2><p>Admin panelinden ilk oyunu etkinleştirdiğinizde mevcut EXE güncellenmeden burada görünecek.</p></div>'; return; }
  state.selected = game.id; renderGame(game); renderNav();
}

async function load(force = false) {
  ui.refresh.disabled = true;
  try {
    state.snapshot = force ? await window.odium.refresh() : await window.odium.bootstrap();
    setConnection(state.snapshot.meta);
    if (state.snapshot.meta?.warning) notify('Önbellek kullanılıyor', state.snapshot.meta.warning, true);
    const games = state.snapshot.catalog.games || [];
    if (!games.some(game => game.id === state.selected)) state.selected = games[0]?.id || null;
    render();
  } catch (error) { notify('Katalog yüklenemedi', error.message, true); setConnection({}); }
  finally { ui.refresh.disabled = false; }
}

async function execute(action, success = null) { try { await action(); if (success) notify('Tamamlandı', success); } catch (error) { notify('İşlem başarısız', error.message, true); } }
function showOperation(show, title = 'Dosyalar hazırlanıyor') { state.busy = show; ui.overlay.classList.toggle('hidden', !show); ui.operationTitle.textContent = title; ui.progress.style.width = '0%'; ui.percent.textContent = '0%'; ui.bytes.textContent = '0 MB / 0 MB'; }
async function install(game) { showOperation(true, `${game.title} hazırlanıyor`); try { const result = await window.odium.install(game.id); state.snapshot = result.snapshot; notify('Dublaj kuruldu', `${game.title} kullanıma hazır.`); render(); } catch (error) { notify('Kurulum başarısız', error.message, true); } finally { showOperation(false); } }
async function uninstall(game) { if (!confirm(`${game.title} dublajı kaldırılıp orijinal dosyalar geri yüklensin mi?`)) return; showOperation(true, `${game.title} kaldırılıyor`); try { const result = await window.odium.uninstall(game.id); state.snapshot = result.snapshot; notify('Dublaj kaldırıldı', 'Orijinal dosyalar geri yüklendi.'); render(); } catch (error) { notify('Kaldırma başarısız', error.message, true); } finally { showOperation(false); } }

window.odium.onProgress(event => {
  if (!state.busy) return;
  if (event.file) ui.operationFile.textContent = event.file;
  if (event.type === 'file-start') ui.operationTitle.textContent = `Dosyalar indiriliyor (${event.index + 1}/${event.count})`;
  if (event.type === 'file-installed') ui.operationTitle.textContent = 'Dublaj uygulanıyor';
  if (event.type === 'file-restored') ui.operationTitle.textContent = 'Orijinal dosyalar geri yükleniyor';
  const total = Number(event.totalBytes || event.fileTotal || 0); const done = Number(event.completedBytes || 0) + Number(event.received || 0);
  const percent = total ? Math.min(100, Math.round(done / total * 100)) : 0;
  ui.progress.style.width = `${percent}%`; ui.percent.textContent = `${percent}%`; ui.bytes.textContent = `${fmtBytes(done)} / ${fmtBytes(total)}`;
});

document.querySelectorAll('[data-view]').forEach(node => node.onclick = () => { state.view = node.dataset.view; render(); });
ui.brand.onclick = () => { state.view = 'library'; render(); };
ui.refresh.onclick = () => load(true);
ui.website.onclick = () => execute(() => window.odium.openExternal(state.snapshot?.catalog?.brand?.website || 'https://odiumtr.com'));
ui.settings.onclick = async () => { const settings = await window.odium.getSettings(); ui.catalogUrl.value = settings.catalogUrl || ''; ui.channel.value = settings.updateChannel || 'stable'; ui.dialog.showModal(); };
ui.form.onsubmit = async event => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); try { state.snapshot = await window.odium.saveSettings({ catalogUrl:ui.catalogUrl.value, updateChannel:ui.channel.value }); setConnection(state.snapshot.meta); ui.dialog.close(); render(); notify('Ayarlar kaydedildi', 'Katalog yeni adresten yüklendi.'); } catch (error) { notify('Ayarlar kaydedilemedi', error.message, true); } };
load();

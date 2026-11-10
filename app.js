'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const smooth = (a, b, n) => { const x = clamp((n - a) / (b - a)); return x * x * (3 - 2 * x); };
const hero = $('.hero');
const heroImage = $('.hero-image');
const heroHeading = $('.hero-heading');
const heroBottom = $('.hero-bottom');
const heroType = $('.hero-type');
const scrollCue = $('.scroll-cue');
const cinema = $('.cinema');
const cinemaFrame = $('.cinema-frame');
const cinemaHeading = $('.cinema-heading');
const cinemaWords = $$('.cinema-word');
const scrollVideo = $('.scroll-video');
const intro = $('.intro');
const introLines = $$('.intro-text span');
const pageProgress = $('.page-progress');
let ticking = false;
let seekTarget = 0;
let seeking = false;
function seekVideo() {
  if (seeking || scrollVideo.readyState < 2 || !Number.isFinite(scrollVideo.duration)) return;
  const target = clamp(seekTarget, 0, Math.max(0, scrollVideo.duration - .05));
  if (Math.abs(scrollVideo.currentTime - target) < .035) return;
  seeking = true;
  scrollVideo.currentTime = target;
}
scrollVideo.addEventListener('seeked', () => { seeking = false; seekVideo(); });
scrollVideo.addEventListener('loadeddata', () => { seeking = false; seekVideo(); });
scrollVideo.addEventListener('error', () => { seeking = false; });
function renderScroll() {
  ticking = false;
  const vh = innerHeight;
  const y = scrollY;
  const documentLength = document.documentElement.scrollHeight - vh;
  pageProgress.style.transform = `scaleX(${documentLength > 0 ? y / documentLength : 0})`;
  if (reduceMotion.matches) return;
  const heroRect = hero.getBoundingClientRect();
  const h = clamp(-heroRect.top / Math.max(1, heroRect.height - vh + 54));
  heroImage.style.scale = `${1 + h * .18}`;
  heroImage.style.translate = `0 ${h * -18}px`;
  heroHeading.style.opacity = `${1 - smooth(.02, .42, h)}`;
  heroHeading.style.transform = `translateY(${-h * 70}px)`;
  heroType.style.opacity = `${1 - smooth(.2, .75, h)}`;
  heroType.style.scale = `${1 + h * .12}`;
  heroBottom.style.opacity = `${1 - smooth(.55, .98, h)}`;
  scrollCue.style.opacity = `${1 - smooth(0, .2, h)}`;
  heroBottom.inert = h > .96;
  scrollCue.inert = h > .18;
  const introRect = intro.getBoundingClientRect();
  introLines.forEach((line, i) => line.classList.toggle('lit', introRect.top < vh * (.83 - i * .16)));
  const cRect = cinema.getBoundingClientRect();
  const c = clamp((54 - cRect.top) / Math.max(1, cRect.height - vh + 54));
  const expansion = smooth(0, .33, c);
  const mobile = innerWidth < 768;
  const initialWidth = mobile ? 74 : 45;
  const initialTop = mobile ? 20 : 13;
  const initialHeight = mobile ? 72 : 78;
  cinemaFrame.style.width = `${initialWidth + (100 - initialWidth) * expansion}%`;
  cinemaFrame.style.top = `${initialTop * (1 - expansion)}%`;
  cinemaFrame.style.height = `${initialHeight + (100 - initialHeight) * expansion}%`;
  cinemaFrame.style.borderRadius = `${28 * (1 - expansion)}px`;
  cinemaHeading.style.opacity = `${1 - smooth(.06, .28, c)}`;
  cinemaHeading.style.transform = `translateY(${-expansion * 35}px)`;
  const intervals = [[.27, .37, .48, .59], [.48, .59, .69, .79], [.69, .79, .94, 1.05]];
  cinemaWords.forEach((word, i) => {
    const [a, b, d, e] = intervals[i];
    const appear = smooth(a, b, c);
    const disappear = smooth(d, e, c);
    word.style.opacity = `${appear * (1 - disappear)}`;
    word.style.transform = `translateY(${(1 - appear) * 35 - disappear * 30}px) scale(${.95 + appear * .05})`;
  });
  if (cRect.top < vh && cRect.bottom > 0 && scrollVideo.readyState >= 1) {
    seekTarget = clamp(c) * Math.max(0, scrollVideo.duration - .1);
    seekVideo();
  }
}
const scheduleScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(renderScroll); } };
addEventListener('scroll', scheduleScroll, {passive: true});
addEventListener('resize', scheduleScroll, {passive: true});
addEventListener('load', scheduleScroll);
reduceMotion.addEventListener('change', () => location.reload());
renderScroll();

// Load the scroll film only when the visitor approaches it.
const mediaObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    scrollVideo.preload = 'auto';
    scrollVideo.load();
    mediaObserver.disconnect();
  }
}, {rootMargin: '700px'});
mediaObserver.observe(cinema);

const track = $('.highlight-track');
const cards = $$('.highlight-card');
const dots = $$('.gallery-dots button');
let slide = 0;
function goToSlide(index) {
  slide = (index + cards.length) % cards.length;
  const card = cards[slide];
  track.scrollTo({left: card.offsetLeft - track.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
}
$$('[data-slide]').forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.slide))));
$$('[data-direction]').forEach(button => button.addEventListener('click', () => goToSlide(slide + Number(button.dataset.direction))));
track.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goToSlide(slide + (event.key === 'ArrowRight' ? 1 : -1)); } });
let galleryTicking = false;
track.addEventListener('scroll', () => {
  if (galleryTicking) return;
  galleryTicking = true;
  requestAnimationFrame(() => {
    galleryTicking = false;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearest = Infinity;
    cards.forEach((card, i) => { const r = card.getBoundingClientRect(); const distance = Math.abs(r.left + r.width / 2 - center); if (distance < nearest) { nearest = distance; slide = i; } });
    dots.forEach((dot, i) => { dot.classList.toggle('selected', i === slide); if (i === slide) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current'); });
  });
}, {passive:true});

const filmDialog = $('.film-dialog');
const fullFilm = $('#full-film');
let lastFocus = null;
function lockForDialog(dialog) { lastFocus = document.activeElement; document.body.classList.add('modal-open'); dialog.showModal(); }
function afterClose() { document.body.classList.remove('modal-open'); lastFocus?.focus({preventScroll:true}); }
$$('[data-film]').forEach(button => button.addEventListener('click', () => {
  lockForDialog(filmDialog);
  fullFilm.preload = 'auto';
  fullFilm.play().catch(() => { /* Native controls remain available if playback is restricted. */ });
}));
$('[data-close-film]').addEventListener('click', () => filmDialog.close());
filmDialog.addEventListener('close', () => { fullFilm.pause(); afterClose(); });
filmDialog.addEventListener('click', event => { if (event.target === filmDialog) { const r = filmDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) filmDialog.close(); } });

const photos = [
  {src:'assets/moment-playful.jpg', title:'小小惊喜', alt:'她戴着透明圆框眼镜，露出俏皮的惊喜表情'},
  {src:'assets/moment-candid.jpg', title:'日常切片', alt:'她自然地望向镜头，手里拿着零食'},
  {src:'assets/moment-soft.jpg', title:'温柔时刻', alt:'她在生活镜头前的自然神情'},
  {src:'assets/moment-portrait.jpg', title:'目光所及', alt:'她长发披肩，与镜头安静对视'}
];
const lightbox = $('.lightbox');
let photoIndex = 0;
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  $('#lightbox-image').src = photo.src;
  $('#lightbox-image').alt = photo.alt;
  $('#lightbox-caption').textContent = photo.title;
  $('.lightbox-count').textContent = `${photoIndex + 1} / ${photos.length}`;
}
$$('[data-gallery]').forEach(button => button.addEventListener('click', () => { showPhoto(Number(button.dataset.gallery)); lockForDialog(lightbox); }));
$('[data-close-gallery]').addEventListener('click', () => lightbox.close());
$('.lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
$('.lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('keydown', event => { if (event.key === 'ArrowRight') showPhoto(photoIndex + 1); if (event.key === 'ArrowLeft') showPhoto(photoIndex - 1); });
lightbox.addEventListener('close', afterClose);
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });

const portraitOptions = [
  {src:'assets/editorial.webp', label:'光影人像', className:'', creative:true, description:'以原视频形象为参考，探索柔光中的另一面。', alt:'以视频中女生为参考生成的柔光棚拍创意人像'},
  {src:'assets/moment-portrait.jpg', label:'日常原片', className:'original', creative:false, description:'保留原视频里的光线、神情，和最自然的她。', alt:'原视频中，她坐在镜头前的自然人像'},
  {src:'assets/moment-soft.jpg', label:'黑白时刻', className:'mono', creative:false, description:'褪去色彩，让目光与神情成为画面的主角。', alt:'她的原视频截图，以黑白呈现'}
];
let portraitTimer;
$$('[data-portrait]').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('active')) return;
  const option = portraitOptions[Number(button.dataset.portrait)];
  $$('[data-portrait]').forEach(item => { const selected = item === button; item.classList.toggle('active',selected); item.setAttribute('aria-pressed',String(selected)); });
  const image = $('#portrait-image');
  image.classList.add('switching');
  clearTimeout(portraitTimer);
  portraitTimer = setTimeout(() => {
    image.src = option.src;
    image.alt = option.alt;
    image.className = option.className;
    $('#portrait-style').textContent = option.label;
    $('#creative-badge').hidden = !option.creative;
    $('#portrait-description').textContent = option.description;
  }, reduceMotion.matches ? 0 : 210);
}));

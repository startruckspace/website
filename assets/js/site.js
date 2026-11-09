/* Star Truck Space — SPRINT: header, parallax, scroll effects, preview, fuel switch */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var noHover = window.matchMedia('(hover: none), (pointer: coarse)');
  var header = document.querySelector('.site-header');
  var cover = document.querySelector('.cover');
  var frame = cover && cover.querySelector('.cover__frame');
  var engineCard = document.querySelector('.engine__card');

  /* ---- 1. Header: dark text over light sections ---- */
  function updateHeader(){
    if(!header) return;
    var limit = cover ? cover.offsetHeight - header.offsetHeight : 0;
    header.classList.toggle('is-light', window.scrollY > limit - 1);
  }

  /* ---- 2. Scroll: cover narrows into a card, engine card widens ---- */
  var ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      updateHeader();
      if(reduce.matches) return;
      var vh = window.innerHeight;
      if(frame){
        var p = Math.min(1, Math.max(0, window.scrollY / (cover.offsetHeight * 0.9)));
        cover.style.setProperty('--shrink', p.toFixed(3));
      }
      if(engineCard){
        var r = engineCard.getBoundingClientRect();
        var g = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
        engineCard.style.setProperty('--inset', (1 - g).toFixed(3));
        engineCard.style.setProperty('--grow', g.toFixed(3));
      }
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---- 3. Cursor parallax on the image layer only ---- */
  document.querySelectorAll('[data-parallax]').forEach(function(box){
    var layer = box.querySelector('.cover__media');
    if(!layer) return;
    var MAX_X = 22, MAX_Y = 14, EASE = 0.08;
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
    function still(){ return reduce.matches || noHover.matches; }
    function step(){
      cx += (tx - cx) * EASE; cy += (ty - cy) * EASE;
      if(Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05){ cx = tx; cy = ty; }
      layer.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
      raf = (cx !== tx || cy !== ty) ? requestAnimationFrame(step) : 0;   /* loop stops once settled */
    }
    function kick(){ if(!raf) raf = requestAnimationFrame(step); }
    /* listen on document: a cursor over the header is still inside the cover */
    document.addEventListener('pointermove', function(e){
      if(still() || e.pointerType === 'touch') return;
      var r = box.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if(inside){
        var nx = (e.clientX - r.left) / r.width * 2 - 1;
        var ny = (e.clientY - r.top) / r.height * 2 - 1;
        tx = -Math.max(-1, Math.min(1, nx)) * MAX_X;
        ty = -Math.max(-1, Math.min(1, ny)) * MAX_Y;
      } else { tx = 0; ty = 0; }                       /* cursor left the cover: ease back to origin */
      kick();
    }, {passive:true});
    document.documentElement.addEventListener('pointerleave', function(){ tx = 0; ty = 0; kick(); });
    window.addEventListener('blur', function(){ tx = 0; ty = 0; kick(); });
    function reset(){ if(still()){ tx = ty = cx = cy = 0; layer.style.transform = 'translate3d(0,0,0)'; } }
    if(reduce.addEventListener){ reduce.addEventListener('change', reset); noHover.addEventListener('change', reset); }
  });

  /* ---- 4. Reveal on scroll ---- */
  var revealables = document.querySelectorAll('.reveal, .rows .row');
  if('IntersectionObserver' in window && !reduce.matches){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -12% 0px'});
    revealables.forEach(function(el){ io.observe(el); });
  } else {
    revealables.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---- 5. Cover preview following the cursor over list rows ---- */
  var preview = document.querySelector('.preview');
  var rows = document.querySelectorAll('.rows .row a[data-i]');
  if(preview && rows.length){
    var imgs = preview.querySelectorAll('img');
    var px = 0, py = 0, qx = 0, qy = 0, praf = 0, shown = false;
    function pstep(){
      qx += (px - qx) * 0.16; qy += (py - qy) * 0.16;
      preview.style.transform = 'translate3d(' + (qx + 40) + 'px,' + (qy - 95) + 'px,0) scale(' + (shown ? 1 : .85) + ')';
      praf = (Math.abs(px - qx) > 0.3 || Math.abs(py - qy) > 0.3) ? requestAnimationFrame(pstep) : 0;
    }
    rows.forEach(function(a){
      a.addEventListener('pointerenter', function(e){
        if(reduce.matches || noHover.matches || e.pointerType === 'touch') return;
        var i = +a.getAttribute('data-i');
        imgs.forEach(function(im, k){ im.classList.toggle('on', k === i); });
        if(!shown){ qx = px = e.clientX; qy = py = e.clientY; }
        shown = true; preview.classList.add('on');
        if(!praf) praf = requestAnimationFrame(pstep);
      });
      a.addEventListener('pointermove', function(e){ px = e.clientX; py = e.clientY; if(!praf) praf = requestAnimationFrame(pstep); });
    });
    document.querySelector('.rows').addEventListener('pointerleave', function(){
      shown = false; preview.classList.remove('on'); if(!praf) praf = requestAnimationFrame(pstep);
    });
  }

  /* ---- 6. D–T / D–D switch ---- */
  var sw = document.querySelector('[data-switch]');
  if(sw){
    var buttons = sw.querySelectorAll('button');
    var panels = document.querySelectorAll('[data-mode]');
    buttons.forEach(function(b){
      b.addEventListener('click', function(){
        var m = b.getAttribute('data-set');
        buttons.forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        panels.forEach(function(p){ p.hidden = p.getAttribute('data-mode') !== m; });
      });
    });
  }


  /* ---- 7. Engine video: plays once when the card is on screen ---- */
  var vcard = document.querySelector('[data-video-card]');
  if(vcard){
    var vid = vcard.querySelector('video'), replay = vcard.querySelector('.replay');
    var conn = navigator.connection || {};
    var saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    if(vid && !reduce.matches && !saveData && 'IntersectionObserver' in window){
      var loaded = false, played = false;
      function load(){
        if(loaded) return; loaded = true;
        vid.querySelectorAll('source[data-src]').forEach(function(s){ s.src = s.getAttribute('data-src'); });
        vid.preload = 'auto'; vid.load();
      }
      function play(){
        var p = vid.play();
        if(p && p.catch) p.catch(function(){ /* autoplay blocked: keep the still image */ });
      }
      vid.addEventListener('playing', function(){ vcard.classList.add('is-video'); replay.hidden = true; });
      vid.addEventListener('ended', function(){ replay.hidden = false; });   /* stays on the last frame */
      replay.addEventListener('click', function(){ vid.currentTime = 0; play(); });
      var vo = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting && en.intersectionRatio >= 0.2) load();
          if(en.isIntersecting && en.intersectionRatio >= 0.6 && !played){ played = true; play(); }
        });
      }, {threshold:[0, 0.2, 0.6]});
      vo.observe(vcard);
    }
  }
})();

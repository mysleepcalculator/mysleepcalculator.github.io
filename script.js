/* =================================================================
   My Sleep Calculator – Main JavaScript
   - 90-minute sleep cycle math (3 modes)
   - Mobile nav
   - AGGRESSIVE ADSENSE-STYLE AD ORCHESTRATOR:
       • Bottom anchor (728x90 desktop / 320x50 mobile) – appears after small scroll
       • Left & Right sliding sidebar ads – slide in after delay (desktop only)
       • 300x250 Interstitial popup – appears after time + scroll
       • Pop-under – fires on first user interaction (handled by Adsterra script)
   ================================================================= */

(function(){
  'use strict';

  /* ---------- Year in footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav   = document.querySelector('.main-nav');
  if (navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      var open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded','false');
      });
    });
  }

  /* =================================================================
     SLEEP CYCLE CALCULATOR
     ================================================================= */
  var CYCLE_MIN = 90;
  var FALL_ASLEEP_MIN = 15;
  var CYCLES = [6,5,4,3,2,1];

  var mode = 'wake';
  var tabs = document.querySelectorAll('.calc-tabs .tab');
  var timeInput = document.getElementById('time-input');
  var timeLabel = document.getElementById('time-label');
  var timeHelp  = document.getElementById('time-help');
  var calcBtn   = document.getElementById('calc-btn');
  var resultBox = document.getElementById('result');

  function pad(n){ return n<10 ? '0'+n : ''+n; }
  function fmt12(h, m){
    var ap = h>=12 ? 'PM':'AM';
    var hh = h%12; if (hh===0) hh = 12;
    return hh + ':' + pad(m) + ' ' + ap;
  }
  function shiftMinutes(h, m, deltaMin){
    var total = h*60 + m + deltaMin;
    total = ((total % 1440) + 1440) % 1440;
    return { h: Math.floor(total/60), m: total%60 };
  }
  function parseInputTime(){
    if (!timeInput.value) return null;
    var p = timeInput.value.split(':');
    return { h: parseInt(p[0],10), m: parseInt(p[1],10) };
  }
  function nowTime(){
    var d = new Date();
    return { h: d.getHours(), m: d.getMinutes() };
  }

  function setMode(newMode){
    mode = newMode;
    tabs.forEach(function(t){
      var active = t.dataset.mode === newMode;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true':'false');
    });
    if (mode === 'wake'){
      timeLabel.textContent = 'What time do you want to wake up?';
      timeHelp.textContent  = 'We add ~15 minutes for the average time it takes to fall asleep.';
      timeInput.disabled = false;
      if (!timeInput.value) timeInput.value = '07:00';
    } else if (mode === 'bed'){
      timeLabel.textContent = 'What time are you going to bed?';
      timeHelp.textContent  = 'Best wake-up times based on 90-minute sleep cycles after you fall asleep.';
      timeInput.disabled = false;
      if (!timeInput.value) timeInput.value = '23:00';
    } else {
      timeLabel.textContent = 'Sleeping now…';
      timeHelp.textContent  = 'Using your current time + 15 minutes to fall asleep.';
      timeInput.disabled = true;
    }
    resultBox.innerHTML = '';
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ setMode(t.dataset.mode); }); });

  function renderResults(items, headline, footnote){
    var html = '<h3 class="result-title">'+headline+'</h3><div class="result-grid">';
    items.forEach(function(it, idx){
      var best = (it.cycles === 6 || (items.length<=3 && idx===0));
      html += '<div class="result-card '+(best?'best':'')+'">'
            + '<div class="rc-time">'+ it.time +'</div>'
            + '<div class="rc-meta">'+ it.cycles +' cycles · '+ it.hours +' hrs</div>'
            + '</div>';
    });
    html += '</div>';
    if (footnote) html += '<p class="result-note">'+footnote+'</p>';
    resultBox.innerHTML = html;
  }

  function calculate(){
    var t;
    if (mode === 'now') t = nowTime();
    else t = parseInputTime();
    if (!t){ resultBox.innerHTML = '<p class="result-note" style="color:#c0392b">⚠ Please enter a valid time.</p>'; return; }

    var items = [];
    if (mode === 'wake'){
      CYCLES.forEach(function(c){
        var delta = -(c*CYCLE_MIN + FALL_ASLEEP_MIN);
        var r = shiftMinutes(t.h, t.m, delta);
        items.push({ time: fmt12(r.h,r.m), cycles: c, hours: (c*1.5).toFixed(1) });
      });
      renderResults(items,
        '😴 To wake up refreshed at <b>'+fmt12(t.h,t.m)+'</b>, go to bed at:',
        '6 cycles = best for adults. We added ~15 min for falling asleep.');
    } else {
      var start = shiftMinutes(t.h, t.m, FALL_ASLEEP_MIN);
      [1,2,3,4,5,6].forEach(function(c){
        var r = shiftMinutes(start.h, start.m, c*CYCLE_MIN);
        items.push({ time: fmt12(r.h,r.m), cycles: c, hours: (c*1.5).toFixed(1) });
      });
      var head = (mode === 'now')
        ? '☕ If you sleep now, wake up at one of these times:'
        : '⏰ Going to bed at <b>'+fmt12(t.h,t.m)+'</b>? Wake up at:';
      renderResults(items, head, 'Pick 5 or 6 cycles for optimal rest. 3–4 cycles is OK for short sleep.');
    }
  }

  calcBtn.addEventListener('click', calculate);
  timeInput.addEventListener('change', function(){ if (mode!=='now') calculate(); });
  setMode('wake');
  calculate();

  /* Smooth scroll offset for sticky header */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length<2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({top:top, behavior:'smooth'});
    });
  });

  /* =================================================================
     ╔══════════════════════════════════════════════╗
     ║   ADSENSE-STYLE AD ORCHESTRATOR              ║
     ╚══════════════════════════════════════════════╝
     ================================================================= */

  var IS_MOBILE = window.matchMedia('(max-width: 720px)').matches;
  var IS_NARROW = window.matchMedia('(max-width: 1280px)').matches;

  /* ----- Helper: show element ----- */
  function showAd(el){
    if (!el) return;
    el.style.display = '';                      // remove inline display:none
    // next frame, add .show so transition kicks in
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        el.classList.add('show');
      });
    });
  }
  function hideAd(el){
    if (!el) return;
    el.classList.remove('show');
    setTimeout(function(){ el.style.display = 'none'; }, 500);
  }

  /* ===== Close button delegation for floating sidebars ===== */
  document.querySelectorAll('.floating-side .ad-close').forEach(function(btn){
    btn.addEventListener('click', function(){
      hideAd(document.getElementById(btn.dataset.target));
    });
  });

  /* =================================================================
     1) BOTTOM STICKY ANCHOR  (AdSense-style)
        - Desktop: 728x90 leaderboard
        - Mobile : 320x50 banner
        - Trigger: after user scrolls 150px OR 4 seconds (whichever comes first)
     ================================================================= */
  var anchorAd  = document.getElementById('anchorAd');
  var anchorBtn = document.getElementById('anchorClose');
  var anchorShown = false;
  function maybeShowAnchor(){
    if (anchorShown) return;
    anchorShown = true;
    showAd(anchorAd);
    // adjust body padding so anchor doesn't cover footer
    document.body.style.paddingBottom = (IS_MOBILE ? 70 : 110) + 'px';
  }
  // by scroll
  window.addEventListener('scroll', function onScroll(){
    if (window.scrollY > 150){
      maybeShowAnchor();
      window.removeEventListener('scroll', onScroll);
    }
  }, { passive:true });
  // by timer fallback
  setTimeout(maybeShowAnchor, 4000);
  // close button
  if (anchorBtn) anchorBtn.addEventListener('click', function(){
    hideAd(anchorAd);
    document.body.style.paddingBottom = IS_MOBILE ? '0' : '0';
  });

  /* =================================================================
     2) LEFT SLIDING SIDEBAR (160x300) — desktop only
        Trigger: 6 seconds after page load
     ================================================================= */
  var floatLeft = document.getElementById('floatLeft');
  if (floatLeft && !IS_NARROW){
    setTimeout(function(){ showAd(floatLeft); }, 6000);
  }

  /* =================================================================
     3) RIGHT SLIDING SIDEBAR (160x600) — desktop only
        Trigger: 9 seconds after page load (staggered for less intrusion)
     ================================================================= */
  var floatRight = document.getElementById('floatRight');
  if (floatRight && !IS_NARROW){
    setTimeout(function(){ showAd(floatRight); }, 9000);
  }

  /* =================================================================
     4) INTERSTITIAL POPUP (300x250 center modal)
        Trigger: 18 seconds OR after user scrolls 50% of page
                 — whichever happens first
        5-second close timer to comply with “better ads” policies
     ================================================================= */
  var interBackdrop = document.getElementById('interBackdrop');
  var interClose    = document.getElementById('interClose');
  var interTimerEl  = document.getElementById('interTimer');
  var interShown    = false;

  function fireInterstitial(){
    if (interShown || !interBackdrop) return;
    interShown = true;
    interBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // 5-second close countdown
    var sec = 5;
    interClose.disabled = true;
    interTimerEl.textContent = sec;
    var tmr = setInterval(function(){
      sec--;
      if (sec <= 0){
        clearInterval(tmr);
        interClose.disabled = false;
        var skip = document.querySelector('.inter-skip');
        if (skip) skip.textContent = 'Tap × to close';
      } else {
        interTimerEl.textContent = sec;
      }
    }, 1000);
  }
  function closeInterstitial(){
    if (!interBackdrop) return;
    interBackdrop.style.display = 'none';
    document.body.style.overflow = '';
  }
  if (interClose) interClose.addEventListener('click', closeInterstitial);
  if (interBackdrop){
    interBackdrop.addEventListener('click', function(e){
      if (e.target === interBackdrop && !interClose.disabled) closeInterstitial();
    });
  }

  // time-based trigger
  setTimeout(fireInterstitial, 18000);

  // scroll-based trigger (50%)
  window.addEventListener('scroll', function onDeepScroll(){
    var pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    if (pct >= 0.5){
      fireInterstitial();
      window.removeEventListener('scroll', onDeepScroll);
    }
  }, { passive:true });

  /* =================================================================
     5) EXIT-INTENT INTERSTITIAL (desktop only)
        When user moves mouse to top of viewport (about to leave),
        show the interstitial once.
     ================================================================= */
  if (!IS_MOBILE){
    var exitArmed = true;
    document.addEventListener('mouseleave', function(e){
      if (!exitArmed) return;
      if (e.clientY <= 5){
        exitArmed = false;
        fireInterstitial();
      }
    });
  }

})();

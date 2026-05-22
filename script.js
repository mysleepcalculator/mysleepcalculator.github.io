/* =================================================================
   My Sleep Calculator – Main JavaScript
   - 90-minute sleep cycle math
   - Three modes: wake / bed / now
   - Mobile nav, sticky ad close, scroll-triggered sidebar ads
   ================================================================= */

(function(){
  'use strict';

  // ---------- Year in footer ----------
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Mobile navigation ----------
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav   = document.querySelector('.main-nav');
  if (navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      var open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close menu when link clicked
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded','false');
      });
    });
  }

  // ---------- Sticky bottom ad close ----------
  var closeSticky = document.getElementById('closeStickyAd');
  var stickyAd    = document.getElementById('stickyAd');
  if (closeSticky && stickyAd){
    closeSticky.addEventListener('click', function(){ stickyAd.style.display='none'; });
  }

  // ---------- Sidebar ads: close buttons ----------
  document.querySelectorAll('.sidebar-ad .ad-close').forEach(function(btn){
    btn.addEventListener('click', function(){
      btn.closest('.sidebar-ad').classList.add('hidden');
    });
  });

  // ---------- Sidebar ads: reveal only when user scrolls into article ----------
  var articleEl = document.getElementById('article');
  var asideEl   = document.querySelector('.article-aside');
  if (articleEl && asideEl && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          asideEl.classList.add('show');
        }
      });
    }, { threshold: 0.05 });
    io.observe(articleEl);
  } else if (asideEl) {
    asideEl.classList.add('show');
  }

  // =================================================================
  //                    SLEEP CYCLE CALCULATOR
  // =================================================================
  var CYCLE_MIN = 90;       // 1 sleep cycle minutes
  var FALL_ASLEEP_MIN = 15; // average minutes to fall asleep
  var CYCLES = [6,5,4,3,2,1]; // show 6 options

  var mode = 'wake';        // 'wake' | 'bed' | 'now'
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

  // returns {h,m}
  function shiftMinutes(h, m, deltaMin){
    var total = h*60 + m + deltaMin;
    total = ((total % 1440) + 1440) % 1440; // wrap 24h
    return { h: Math.floor(total/60), m: total%60 };
  }

  function parseInputTime(){
    if (!timeInput.value) return null;
    var parts = timeInput.value.split(':');
    return { h: parseInt(parts[0],10), m: parseInt(parts[1],10) };
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

  tabs.forEach(function(t){
    t.addEventListener('click', function(){ setMode(t.dataset.mode); });
  });

  function renderResults(items, headline, footnote){
    var html = '<h3 class="result-title">'+headline+'</h3><div class="result-grid">';
    items.forEach(function(it, idx){
      var best = (it.cycles === 6 || (items.length<=3 && idx===0));
      html += ''
        + '<div class="result-card '+(best?'best':'')+'">'
        +   '<div class="rc-time">'+ it.time +'</div>'
        +   '<div class="rc-meta">'+ it.cycles +' cycles · '+ it.hours +' hrs</div>'
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
      // count BACK from wake time
      CYCLES.forEach(function(c){
        var delta = -(c*CYCLE_MIN + FALL_ASLEEP_MIN);
        var r = shiftMinutes(t.h, t.m, delta);
        items.push({ time: fmt12(r.h,r.m), cycles: c, hours: (c*1.5).toFixed(1) });
      });
      renderResults(items,
        '😴 To wake up refreshed at <b>'+fmt12(t.h,t.m)+'</b>, go to bed at:',
        '6 cycles = best for adults. We added ~15 min for falling asleep.');
    }
    else {
      // mode 'bed' or 'now' – count FORWARD from sleep time
      // add 15 minutes to fall asleep first
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
  // initial calculation on page load
  setMode('wake');
  calculate();

  // =================================================================
  // Smooth scroll offset for sticky header
  // =================================================================
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

})();

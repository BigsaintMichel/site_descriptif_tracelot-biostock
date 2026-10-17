/* TraceLot & BioStock — interactions et animations GSAP */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var fr = function (n) { return Math.round(n).toLocaleString('fr-FR'); };

  // État partagé avec les scènes 3D
  window.TL = window.TL || { journey: 0, reduce: reduce };

  /* ---------- Menu mobile ---------- */
  var toggle = $('#menu-toggle');
  var mnav = $('#mobile-nav');
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.hidden;
      mnav.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () { mnav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- Mise à l'échelle des maquettes ---------- */
  function fitAll() {
    $$('[data-fit]').forEach(function (box) {
      var inner = box.firstElementChild;
      var base = parseFloat(box.getAttribute('data-fit')) || 760;
      var s = Math.min(1, box.clientWidth / base);
      inner.style.transform = 'scale(' + s + ')';
      box.style.height = (inner.offsetHeight * s) + 'px';
    });
  }
  fitAll();
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { fitAll(); });
    $$('[data-fit]').forEach(function (b) { ro.observe(b); });
  } else {
    window.addEventListener('resize', fitAll);
  }

  /* ---------- Horloge du tableau de bord (rafraîchi ~20 s) ---------- */
  var tick = 12;
  setInterval(function () {
    tick = (tick + 1) % 21;
    $$('[data-tick]').forEach(function (el) { el.textContent = tick; });
  }, 1000);

  /* ---------- Contact ---------- */
  var form = $('#contact-form');
  var wa = $('#wa-send');
  function buildWa() {
    if (!form || !wa) return;
    var name = $('#f-name').value.trim();
    var org = $('#f-org').value.trim();
    var topic = $('#f-topic').value;
    var msg = $('#f-msg').value.trim();
    var text = 'Bonjour, ' + topic.toLowerCase() + ' concernant TraceLot & BioStock.';
    if (name) text += '\nNom : ' + name;
    if (org) text += '\nOrganisation : ' + org;
    if (msg) text += '\n\n' + msg;
    wa.href = 'https://api.whatsapp.com/send/?phone=2250748981879&text=' + encodeURIComponent(text);
  }
  if (form) {
    form.addEventListener('input', buildWa);
    form.addEventListener('change', buildWa);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    buildWa();
  }
  var copyBtn = $('#copy-phone');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var num = '+2250748981879';
      var done = function () { copyBtn.textContent = 'Copié'; setTimeout(function () { copyBtn.textContent = 'Copier'; }, 1800); };
      var fallback = function () {
        var r = doc.createRange(); r.selectNodeContents($('#phone-number'));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        copyBtn.textContent = 'Sélectionné';
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(num).then(done, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });
  }

  /* ---------- Démo verdicts (données) ---------- */
  var SCN = {
    conforme: { dep: [82, 18], arr: [81, 17], w: '2,45 t', needle: -62, code: 'CONFORME', col: '#34D399',
      text: "L'écart entre le départ et l'arrivée reste dans la tolérance. Le lot entre en stock.",
      next: ['pill-ok', 'Reçu validé · entrée en stock'], alert: null, drops: false, lost: 0, scale: false },
    humidite: { dep: [82, 18], arr: [81, 31], w: '2,77 t', needle: 2, code: 'ALERTE_HUMIDITE', col: '#FBBF24',
      text: "Le lot pèse plus lourd, avec autant de matière sèche : il a pris l'eau en route. Mouillage suspect.",
      next: ['pill-warn', 'Quarantaine · décision du superviseur'], alert: ['warn', 'Alerte orange', 'Humidité en hausse pendant le transport'], drops: true, lost: 0, scale: false },
    masse: { dep: [82, 18], arr: [66, 15], w: '2,01 t', needle: 64, code: 'ALERTE_MASSE', col: '#F87171',
      text: "De la matière sèche a disparu entre le village et l'usine. Vol de sacs suspect.",
      next: ['pill-warn', 'Quarantaine · décision du superviseur'], alert: ['bad', 'Alerte rouge', 'Matière sèche manquante à l’arrivée'], drops: false, lost: 2, scale: false },
    balance: { dep: [82, 18], arr: [90, 13], w: '2,57 t', needle: 14, code: 'ALERTE_BALANCE', col: '#FBBF24',
      text: "L'arrivée affiche plus de matière sèche qu'au départ : c'est physiquement impossible. Une balance est à vérifier.",
      next: ['pill-warn', 'Quarantaine · balance à contrôler'], alert: ['warn', 'Alerte orange', 'Écart incohérent, balance à vérifier'], drops: false, lost: 0, scale: true },
    combinee: { dep: [82, 18], arr: [70, 34], w: '2,58 t', needle: 70, code: 'ALERTE_COMBINEE', col: '#F87171',
      text: "Le camion pèse plus lourd, mais transporte moins de matière sèche. On aurait payé de l'eau et perdu du combustible.",
      next: ['pill-warn', 'Quarantaine · décision du superviseur'], alert: ['bad', 'Alerte rouge', 'Perte de matière sèche et humidité en hausse'], drops: true, lost: 2, scale: false }
  };
  var MAXW = 110;
  var demo = $('#verdict-demo');
  var sackGroup = $('#load-sacks');
  var dropGroup = $('#load-drops');
  var SVGNS = 'http://www.w3.org/2000/svg';
  var sacks = [];
  var dropTl = null;

  function buildSacks() {
    if (!sackGroup) return;
    for (var i = 0; i < 8; i++) {
      var g = doc.createElementNS(SVGNS, 'g');
      var x = 22 + i * 60;
      g.setAttribute('transform', 'translate(' + x + ' 0)');
      var p = doc.createElementNS(SVGNS, 'path');
      p.setAttribute('d', 'M4 46c0-6 8-9 20-9s20 3 20 9l3 40c0 5-10 7-23 7S1 91 1 86z');
      p.setAttribute('fill', '#A27B4C');
      p.setAttribute('stroke', '#7A5733');
      p.setAttribute('stroke-width', '2');
      var tag = doc.createElementNS(SVGNS, 'rect');
      tag.setAttribute('x', '17'); tag.setAttribute('y', '58'); tag.setAttribute('width', '14'); tag.setAttribute('height', '11'); tag.setAttribute('rx', '1.5');
      tag.setAttribute('fill', '#F5F7FA');
      g.appendChild(p); g.appendChild(tag);
      sackGroup.appendChild(g);
      sacks.push({ g: g, p: p, x: x });
    }
    for (var d = 0; d < 7; d++) {
      var dp = doc.createElementNS(SVGNS, 'path');
      dp.setAttribute('d', 'M0 0c-4 6-6 10-6 13a6 6 0 0 0 12 0c0-3-2-7-6-13z');
      dp.setAttribute('opacity', '0');
      dropGroup.appendChild(dp);
    }
  }
  buildSacks();

  function setScenario(key, animate) {
    var s = SCN[key]; if (!s || !demo) return;
    $$('.scenario-btn', demo).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scenario') === key)); });
    $('#dep-dry').style.width = (s.dep[0] / MAXW * 100) + '%';
    $('#dep-water').style.width = (s.dep[1] / MAXW * 100) + '%';
    $('#arr-dry').style.width = (s.arr[0] / MAXW * 100) + '%';
    $('#arr-water').style.width = (s.arr[1] / MAXW * 100) + '%';
    $('#w-arr').textContent = 'Poids brut ' + s.w;
    $('#gauge-needle').style.transform = 'rotate(' + s.needle + 'deg)';
    var code = $('#verdict-code'); code.textContent = s.code; code.style.color = s.col;
    $('#verdict-text').textContent = s.text;
    var nx = $('#verdict-next'); nx.className = 'pill mt-1 ' + s.next[0]; nx.textContent = s.next[1];

    var row = $('#alert-row'), toast = $('#tg-toast');
    if (s.alert) {
      var bad = s.alert[0] === 'bad';
      row.style.background = bad ? '#FEF2F2' : '#FFFBEB';
      row.style.borderColor = bad ? '#FCA5A5' : '#FCD34D';
      row.style.color = bad ? '#991B1B' : '#92400E';
      $('#alert-title').textContent = s.alert[1];
      $('#alert-desc').textContent = s.alert[2];
      $('#tg-text').textContent = 'Nouvelle ' + s.alert[1].toLowerCase() + ' sur un lot du Lôh-Djiboua. Ouvrez le lien sécurisé pour voir le détail.';
      toast.style.opacity = '1';
    } else {
      row.style.background = '#ECFDF5'; row.style.borderColor = '#A7F3D0'; row.style.color = '#065F46';
      $('#alert-title').textContent = 'Lot conforme';
      $('#alert-desc').textContent = 'Entré en stock, empreinte posée';
      $('#tg-text').textContent = 'Aucune notification : un lot conforme ne déclenche pas d’alerte.';
      toast.style.opacity = '.55';
    }

    sacks.forEach(function (sk, i) {
      var lost = i >= sacks.length - s.lost;
      sk.p.setAttribute('fill', lost ? 'none' : '#A27B4C');
      sk.p.setAttribute('stroke', lost ? '#C8643B' : (s.scale ? '#F59E0B' : '#7A5733'));
      sk.p.setAttribute('stroke-dasharray', lost ? '5 4' : '');
      sk.g.style.opacity = lost ? '.8' : '1';
      sk.g.querySelector('rect').style.opacity = lost ? '0' : '1';
    });
    if (dropTl) { dropTl.kill(); dropTl = null; }
    $$('path', dropGroup).forEach(function (d) { d.setAttribute('opacity', '0'); });
    if (s.drops && hasGsap && !reduce) {
      dropTl = gsap.timeline({ repeat: -1 });
      $$('path', dropGroup).forEach(function (d, i) {
        var x = 46 + i * 66;
        dropTl.fromTo(d, { attr: { transform: 'translate(' + x + ' -12)' }, opacity: 0 },
          { attr: { transform: 'translate(' + x + ' 40)' }, opacity: 1, duration: .55, ease: 'power2.in' }, i * 0.18)
          .to(d, { opacity: 0, duration: .15 }, i * 0.18 + .55);
      });
    } else if (s.drops) {
      $$('path', dropGroup).forEach(function (d, i) { d.setAttribute('transform', 'translate(' + (46 + i * 66) + ' 30)'); d.setAttribute('opacity', '1'); });
    }
    if (animate && hasGsap && !reduce && s.alert) {
      gsap.fromTo(row, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: 'power3.out' });
      gsap.fromTo(toast, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: .25, ease: 'power3.out' });
    }
  }
  var autoPlayed = false;
  $$('.scenario-btn').forEach(function (b) {
    b.addEventListener('click', function () { autoPlayed = true; setScenario(b.getAttribute('data-scenario'), true); });
  });
  setScenario('combinee', false);

  /* ---------- Démo hors-ligne ---------- */
  var queue = $('#queue');
  var qItems = [];
  if (queue) {
    for (var q = 0; q < 15; q++) {
      var it = doc.createElement('div');
      it.className = 'q-item';
      it.innerHTML = '<span aria-hidden="true">●</span>P' + String(q + 1).padStart(2, '0');
      queue.appendChild(it);
      qItems.push(it);
    }
  }
  var syncTl = null;
  function syncState(o) {
    $('#q-count').textContent = o.wait;
    $('#srv-count').textContent = o.recv;
    $('#r-sync').textContent = o.recv;
    $('#srv-batch').textContent = o.batch;
    $('#net-label').textContent = o.label;
    $('#net-dot').classList.toggle('on', !!o.online);
    $('#server-box').classList.toggle('lit', o.recv === 15);
  }
  function playSync() {
    if (!hasGsap || reduce) return;
    if (syncTl) syncTl.kill();
    qItems.forEach(function (el) { el.classList.remove('sent'); el.style.opacity = 0; });
    syncState({ wait: 0, recv: 0, batch: 'en attente du réseau', label: 'Mode avion · hors réseau', online: false });
    var st = { n: 0 };
    syncTl = gsap.timeline();
    qItems.forEach(function (el, i) {
      syncTl.to(el, { opacity: 1, duration: .18, onStart: function () { $('#q-count').textContent = i + 1; } }, i * 0.14);
    });
    syncTl.add(function () { syncState({ wait: 15, recv: 0, batch: 'connexion détectée', label: 'Réseau rétabli · envoi en cours', online: true }); }, '+=0.7');
    [0, 1, 2].forEach(function (b) {
      syncTl.add(function () {
        for (var k = b * 5; k < b * 5 + 5; k++) qItems[k].classList.add('sent');
        st.n = (b + 1) * 5;
        syncState({ wait: 15 - st.n, recv: st.n, batch: 'paquet ' + (b + 1) + ' sur 3 reçu', label: 'Réseau rétabli · envoi en cours', online: true });
      }, '+=0.75');
    });
    syncTl.add(function () { syncState({ wait: 0, recv: 15, batch: 'dans l’ordre, sans doublon', label: 'Synchronisé · aucune perte', online: true }); }, '+=0.5');
  }
  var replay = $('#sync-replay');
  if (replay) replay.addEventListener('click', function () {
    if (!hasGsap || reduce) {
      qItems.forEach(function (el) { el.classList.add('sent'); });
      syncState({ wait: 0, recv: 15, batch: 'dans l’ordre, sans doublon', label: 'Synchronisé · aucune perte', online: true });
      return;
    }
    playSync();
  });

  /* ---------- Empreinte SHA-256 réelle ---------- */
  var hashBox = $('#hash-box');
  var realHash = null;
  (function () {
    var payload = 'LOT-2026-000184|RECU_VALIDE|ZEGO->DIVO|31 sacs|verdict=CONFORME';
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)).then(function (buf) {
          realHash = Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
          if (!hasGsap || reduce) hashBox.textContent = realHash;
        }).catch(function () {});
      }
    } catch (e) {}
  })();
  function typeHash() {
    var target = realHash || hashBox.textContent;
    var hex = '0123456789abcdef';
    var o = { i: 0 };
    gsap.to(o, { i: target.length, duration: 1.8, ease: 'none', onUpdate: function () {
      var n = Math.floor(o.i), s = target.slice(0, n);
      for (var k = n; k < Math.min(target.length, n + 6); k++) s += hex[(Math.random() * 16) | 0];
      hashBox.textContent = s;
    }, onComplete: function () { hashBox.textContent = target; } });
  }

  /* ---------- Parcours d'un lot (données d'état) ---------- */
  var journey = $('.journey');
  var steps = $$('#journey-steps > li');
  var railBars = $$('#journey-rail i');
  var jStatus = $('#journey-status');
  var jLoc = $('#journey-loc');
  var mission = $$('#mission-chain [data-m]');
  var curStep = -1;

  function missionIndex(p) {
    if (p < 1 / 6) return -1;
    if (p < 0.25) return 0;
    if (p < 0.33) return 1;
    if (p < 0.55) return 2;
    if (p < 0.92) return 3;
    return 4;
  }
  function setJourney(p) {
    window.TL.journey = p;
    var idx = Math.min(5, Math.floor(p * 6));
    railBars.forEach(function (b, i) { b.style.setProperty('--fill', Math.max(0, Math.min(1, p * 6 - i)).toFixed(3)); });
    var status = steps[idx].getAttribute('data-status');
    var pill = steps[idx].getAttribute('data-pill');
    if (idx === 1 && p * 6 - 1 < 0.5) { status = 'Réservé'; pill = 'neutral'; }
    if (jStatus.textContent !== status) {
      jStatus.textContent = status;
      jStatus.className = 'pill pill-' + pill;
      if (hasGsap && !reduce) gsap.fromTo(jStatus, { scale: .85 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
    }
    jLoc.textContent = steps[idx].getAttribute('data-loc');
    var m = missionIndex(p);
    mission.forEach(function (el, i) {
      el.style.color = i === m ? '#34D399' : (i < m ? '#E8EEF3' : '#5B6E82');
    });
    if (idx !== curStep) {
      steps.forEach(function (li, i) { li.classList.toggle('is-current', i === idx); });
      if (hasGsap && !reduce && curStep !== -1) gsap.fromTo(steps[idx], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power2.out' });
      curStep = idx;
    }
  }
  function sizeSteps() {
    var ol = $('#journey-steps');
    var h = 0;
    steps.forEach(function (li) { h = Math.max(h, li.offsetHeight); });
    ol.style.minHeight = h + 'px';
  }

  /* ---------- Sans GSAP ou mouvement réduit : page statique complète ---------- */
  if (!hasGsap || reduce) {
    if (replay && reduce) replay.click();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Hero */
  gsap.from('[data-hero]', { y: 26, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.09, delay: 0.1 });

  /* Compteurs */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.fromTo(o, { v: 0 }, { v: end, duration: end > 1000 ? 2.2 : 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = fr(o.v); } });
      }
    });
  });

  /* Apparitions : seuls les éléments encore sous la ligne de flottaison sont masqués */
  var vh = window.innerHeight;
  function prepare(els) {
    return els.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.95; });
  }
  prepare($$('[data-reveal]')).forEach(function (el) {
    gsap.set(el, { opacity: 0, y: 32 });
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }); } });
  });
  var staggered = prepare($$('[data-stagger]'));
  gsap.set(staggered, { opacity: 0, y: 36 });
  ScrollTrigger.batch(staggered, {
    start: 'top 90%', once: true,
    onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }); }
  });

  /* Navigation active */
  $$('.nav-link[href^="#"]').forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: function (self) { a.classList.toggle('is-active', self.isActive); } });
  });

  /* Problème : petites scènes en boucle */
  function loopWhileVisible(trigger, tl) {
    tl.pause();
    ScrollTrigger.create({ trigger: trigger, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { self.isActive ? tl.play() : tl.pause(); } });
  }
  var dropsTl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
  $$('#art-water .drop').forEach(function (d, i) {
    dropsTl.fromTo(d, { y: -10, opacity: 0 }, { y: 52, opacity: 1, duration: 0.7, ease: 'power2.in' }, i * 0.28)
      .to(d, { opacity: 0, duration: 0.2 }, i * 0.28 + 0.7);
  });
  loopWhileVisible('#art-water', dropsTl);
  var theftTl = gsap.timeline({ repeat: -1, repeatDelay: 1, yoyo: true });
  theftTl.to('#art-theft .gone', { opacity: 0, x: 26, duration: 1.1, ease: 'power2.inOut' })
    .to('#art-theft .ghost', { opacity: 1, duration: 0.5 }, '-=0.3');
  loopWhileVisible('#art-theft', theftTl);
  var scaleTl = gsap.timeline({ repeat: -1, yoyo: true });
  scaleTl.fromTo('#art-scale .beam', { rotation: -9 }, { rotation: 7, duration: 1.4, ease: 'sine.inOut' });
  loopWhileVisible('#art-scale', scaleTl);

  /* Solution : téléphone et tableau de bord */
  gsap.fromTo('#phone', { rotationY: -24, rotationX: 8 }, { rotationY: -8, rotationX: 3, ease: 'none',
    scrollTrigger: { trigger: '#solution', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  var line = $('#dash-solution .chart-line');
  if (line) {
    var len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set('#dash-solution .chart-area', { opacity: 0 });
    gsap.set('#dash-solution .donut', { opacity: 0 });
    ScrollTrigger.create({ trigger: '#dash-solution', start: 'top 80%', once: true, onEnter: function () {
      gsap.to(line, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' });
      gsap.to('#dash-solution .chart-area', { opacity: 1, duration: 1, delay: 0.8 });
      gsap.to('#dash-solution .donut', { opacity: 1, duration: 0.5, stagger: 0.25, delay: 0.3 });
    } });
  }
  var pq = $('#phone-queue');
  if (pq) {
    ScrollTrigger.create({ trigger: '#phone', start: 'top 70%', once: true, onEnter: function () {
      var o = { v: 0 };
      gsap.to(o, { v: 3, duration: 1.2, ease: 'steps(3)', onUpdate: function () { pq.textContent = Math.round(o.v); } });
    } });
  }

  /* Parcours épinglé */
  if (journey && steps.length) {
    journey.classList.add('is-live');
    sizeSteps();
    setJourney(0);
    ScrollTrigger.create({
      trigger: '#journey-stage', start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 5); },
      pin: true, scrub: 0.6, anticipatePin: 1,
      onUpdate: function (self) { setJourney(self.progress); },
      onRefresh: function (self) { sizeSteps(); setJourney(self.progress); }
    });
  }

  /* Détection : le moment d'alerte */
  ScrollTrigger.create({ trigger: '#verdict-demo', start: 'top 70%', once: true, onEnter: function () {
    if (autoPlayed) return;
    setScenario('conforme', false);
    gsap.delayedCall(2.2, function () { if (!autoPlayed) setScenario('combinee', true); autoPlayed = true; });
  } });

  /* Hors-ligne */
  qItems.forEach(function (el) { el.style.opacity = 1; });
  ScrollTrigger.create({ trigger: '#sync-demo', start: 'top 75%', once: true, onEnter: playSync });

  /* Registre d'audit */
  var rows = $$('#ledger .ledger-row:not(.ledger-head)');
  if (prepare([$('#ledger')]).length) {
    gsap.set(rows, { opacity: 0, x: -16 });
    gsap.set('#ledger .lock', { scale: 0, transformOrigin: '50% 50%' });
  }
  ScrollTrigger.create({ trigger: '#ledger', start: 'top 80%', once: true, onEnter: function () {
    var tl = gsap.timeline();
    tl.to(rows, { opacity: 1, x: 0, stagger: 0.18, duration: 0.5, ease: 'power2.out' })
      .to('#ledger .lock', { scale: 1, stagger: 0.12, duration: 0.35, ease: 'back.out(3)' }, '-=0.3')
      .fromTo('#ledger .denied', { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' })
      .add(typeHash, '-=0.4');
  } });

  /* Feuille de route */
  ScrollTrigger.create({ trigger: '#road', start: 'top 80%', once: true, onEnter: function () {
    gsap.to('#road-progress', { width: '14%', duration: 1.6, ease: 'power2.out' });
  } });

  window.addEventListener('load', function () { fitAll(); ScrollTrigger.refresh(); });
})();

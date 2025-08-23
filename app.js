// Visual Scheduler - ES5 stable build with in-app dialogs + applause + confetti
(function () {
  function $(s, el){ return (el||document).querySelector(s); }
  function $all(s, el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); }

  var STORAGE_KEY = 'vsched-data-simplified-v5';
  var dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  var defaultTasksOrder = [
    "Wake up","Dress up","Wash hands","Comb hair","Bus ride","Drawing","Ride bicycle",
    "Breakfast","Shower","Brush teeth","School","Lunch","Sports","Go home","Parent pick up",
    "Clean room","Homework","Play games","Go to sleep","Walk with a dog"
  ];
  var defaultTimes = [
    "07:00 AM","07:05 AM","07:10 AM","07:12 AM","07:30 AM","04:30 PM","05:00 PM",
    "07:15 AM","07:25 AM","07:45 AM","08:00 AM","12:00 PM","04:00 PM","05:30 PM",
    "05:35 PM","06:00 PM","07:00 PM","08:00 PM","09:30 PM","06:30 PM"
  ];
  
  function norm(name){ return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_'); }
function mkId(name){ return name.toLowerCase().replace(/[^a-z0-9]+/g,'_'); }
  function pickImg(name){ var stem='assets/images/defaults/'+norm(name||''); return stem+'.png'; }
  var defaultDayTasks = defaultTasksOrder.map(function(name, i){
    return { id: mkId(name), name: name, time: defaultTimes[i]||'', image: pickImg(name),
      audio: null, timer_minutes: null, one_time: false, completed: false };
  });
  var DEFAULT_DATA = { version: 1, days: {} };
  for (var di=0; di<dayNames.length; di++){
    DEFAULT_DATA.days[dayNames[di]] = { name: dayNames[di], tasks: defaultDayTasks.slice() };
  }
  window.DEFAULT_DATA = DEFAULT_DATA;

  var data = null;
  var currentDayIndex = (new Date().getDay()+6)%7;

  function loadData(){
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      data = s ? JSON.parse(s) : DEFAULT_DATA;
    } catch(e){
      data = DEFAULT_DATA;
    }
    saveData(); render();
  }
  function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function getDay(){ return data.days[dayNames[currentDayIndex]]; }

  function render(){
    var d = getDay();
    var dayEl = $('#dayName'); if (!dayEl) return;
    dayEl.textContent = d.name;

    var list = $('#taskList'); if (!list) return;
    list.innerHTML = '';
    var done = 0;

    for (var i=0; i<d.tasks.length; i++){
      var t = d.tasks[i];
      var tpl = $('#taskItemTpl');
      if (!tpl || !tpl.content) continue;
      var li = tpl.content.firstElementChild.cloneNode(true);
      li.setAttribute('data-index', i);

      var img = li.querySelector('.thumb'); if (img){ img.src = (t.image || pickImg(t.name)); img.onerror=function(e){ e.target.onerror=null; e.target.src='assets/images/defaults/default.png'; }; }
      var nm  = li.querySelector('.name'); if (nm) nm.textContent = t.name || 'Task';
      var tm  = li.querySelector('.time'); if (tm) tm.textContent = t.time || '';

      var ed  = li.querySelector('.edit');   if (ed) ed.onclick = (function(idx){ return function(){ openEdit(idx); }; })(i);
      var del = li.querySelector('.delete'); if (del) del.onclick = (function(idx){ return function(){ delTask(idx); }; })(i);
      var dn  = li.querySelector('.done');   if (dn) dn.onclick = (function(idx){ return function(){ toggleDone(idx); }; })(i);

// Open viewer when tapping image or text area
var th = li.querySelector('.thumb'); if (th) th.onclick = (function(idx){ return function(){ openViewer(idx); }; })(i);
var meta = li.querySelector('.meta'); if (meta) meta.onclick = (function(idx){ return function(){ openViewer(idx); }; })(i);


      if (t.completed){ li.classList.add('doneItem'); done++; }
      list.appendChild(li);
    }

    var bar = $('#progressBar');
    if (bar) {
      var pct = d.tasks.length ? Math.round(100*done/d.tasks.length) : 0;
      bar.style.width = pct + '%';
    }

    wireDragDrop();
  }

  // ----- Confetti support -----
  var confettiCanvas = null, confettiCtx = null, confettiParticles = [], confettiActive = false;
  function ensureConfettiCanvas(){
    if (confettiCanvas) return;
    confettiCanvas = document.getElementById('confettiCanvas');
    if (!confettiCanvas){
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'confettiCanvas';
      document.body.appendChild(confettiCanvas);
    }
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
  }
  function resizeConfetti(){
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  function burstConfetti(x, y, count){
    ensureConfettiCanvas();
    confettiParticles = [];
    var colors = ['#FFD166','#06D6A0','#EF476F','#118AB2','#8338EC','#FFBE0B'];
    for (var i=0;i<count;i++){
      var angle = Math.random()*Math.PI*2;
      var speed = 2 + Math.random()*5;
      confettiParticles.push({
        x:x, y:y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed - 4*Math.random(),
        size: 4 + Math.random()*4,
        color: colors[(Math.random()*colors.length)|0],
        life: 60 + (Math.random()*40)|0
      });
    }
    if (!confettiActive){
      confettiActive = true;
      requestAnimationFrame(stepConfetti);
    }
  }
  function stepConfetti(){
    if (!confettiActive || !confettiCtx) return;
    confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    for (var i=confettiParticles.length-1;i>=0;i--){
      var p = confettiParticles[i];
      p.vy += 0.15;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(p.x, p.y, p.size, p.size);
      if (p.life <= 0 || p.y > confettiCanvas.height+10) confettiParticles.splice(i,1);
    }
    if (confettiParticles.length){
      requestAnimationFrame(stepConfetti);
    } else {
      confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
      confettiActive = false;
    }
  }
  function celebrateAtElement(el){
    try{
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width/2;
      var cy = rect.top + rect.height/2;
      burstConfetti(cx, cy, 120);
    }catch(e){
      burstConfetti(window.innerWidth/2, window.innerHeight/3, 120);
    }
  }

// --- Enlarged Activity Viewer ---
var viewerIndex = null;
function openViewer(i){
  viewerIndex = i;
  var d = getDay(); var t = d.tasks[i]; if (!t) return;
  var dlg = document.getElementById('viewerDialog');
  var img = document.getElementById('viewerImg');

  img.src = (t.image || pickImg(t.name));
  img.onerror = function(e){ e.target.onerror=null; e.target.src='assets/images/defaults/default.png'; };

  document.getElementById('viewerClose').onclick = function(){ safeClose(dlg); };

  document.getElementById('viewerFinish').onclick = function(){
    // Mark complete (don’t toggle) + same celebration as toggleDone()
    if (!t.completed) {
      t.completed = true;
      try {
        var a = document.getElementById('applause');
        if (a){ a.currentTime = 0; a.play(); }
      } catch(e){}
      // confetti from center of screen
      burstConfetti(window.innerWidth/2, Math.min(window.innerHeight*0.45, window.innerHeight-120), 140);
      if (t.audio){ try { new Audio(t.audio).play(); } catch(e){} }
      saveData();
    }
    render();
    safeClose(dlg);
  };

  openDialog(dlg);
}


  // ----- Edit -----
  function openEdit(i){
    var d = getDay(); var t = d.tasks[i]; if (!t) return;
    var dlg = $('#editDialog'); if (!dlg) return;

    $('#taskName').value = t.name||'';
    $('#taskTime').value = to24(t.time||'');
    $('#taskTimer').value = t.timer_minutes||'';
    $('#taskOneTime').checked = !!t.one_time;
    $('#oneTimeDateWrap').style.display = t.one_time ? '' : 'none';
    $('#taskDate').value = t.date||'';

    var prev = $('#imagePreview');
    if (t.image){ prev.src = t.image; prev.style.display = ''; } else prev.style.display = 'none';

    $('#taskOneTime').onchange = function(e){ $('#oneTimeDateWrap').style.display = e.target.checked ? '' : ''; };
    $('#resetImageBtn').onclick = function(){ t.image='assets/images/defaults/default.png'; prev.src=t.image; prev.style.display=''; };
    $('#removeVoiceBtn').onclick = function(){ t.audio=null; alertInApp('Voice removed'); };

    $('#cancelTaskBtn').onclick = function(){ safeClose(dlg); };

    $('#saveTaskBtn').onclick = function(){
      var name = ($('#taskName').value||'').trim() || 'Task';
      var time = $('#taskTime').value;
      if (time){
        var parts = time.split(':'); var n = parseInt(parts[0],10);
        var ampm = n>=12 ? 'PM' : 'AM'; var hh = ((n+11)%12)+1;
        time = String(hh<10?('0'+hh):hh) + ':' + parts[1] + ' ' + ampm;
      }
      var timer = $('#taskTimer').value ? parseInt($('#taskTimer').value,10) : null;
      var one   = $('#taskOneTime').checked;
      var date  = $('#taskDate').value || null;

      var imgF = $('#taskImage').files[0];
      var audF = $('#taskAudio').files[0];

      function apply(){
        t.name = name; t.time = time; t.timer_minutes = timer; t.one_time = one; t.date = date;
        saveData(); render(); safeClose(dlg);
      }

      if (imgF){
        var r = new FileReader();
        r.onload = function(){ t.image = r.result;
          if (audF){
            var r2 = new FileReader();
            r2.onload = function(){ t.audio = r2.result; apply(); };
            r2.readAsDataURL(audF);
          } else apply();
        };
        r.readAsDataURL(imgF);
      } else if (audF){
        var r3 = new FileReader();
        r3.onload = function(){ t.audio = r3.result; apply(); };
        r3.readAsDataURL(audF);
      } else apply();
    };

    openDialog(dlg);
  }

  function to24(s){
    if (!s) return '';
    if (!(s.indexOf('AM')>-1 || s.indexOf('PM')>-1)) return s;
    var parts = s.split(' ');
    var hm = parts[0], ap = parts[1];
    var hm2 = hm.split(':'); var h = parseInt(hm2[0],10), m = hm2[1];
    if (ap==='PM' && h<12) h+=12; if (ap==='AM' && h===12) h=0;
    return (h<10?('0'+h):h)+':'+m;
  }

  // ----- Toggle Done (applause + confetti) -----
  function toggleDone(i){
    var d=getDay(); var t=d.tasks[i]; if (!t) return;
    t.completed = !t.completed;

    if (t.completed){
      try {
        var a = $('#applause');
        if (a){ a.currentTime = 0; a.play(); }
      } catch(e){}
      var li = document.querySelector('#taskList .task[data-index="'+i+'"]');
      if (li) celebrateAtElement(li); else burstConfetti(window.innerWidth/2, window.innerHeight/3, 120);
      if (t.audio){ try { new Audio(t.audio).play(); } catch(e){} }
    }

    saveData(); render();
  }

  // ----- In-app confirm & alert -----
  function confirmInApp(message){
    return new Promise(function(resolve){
      var dlg = $('#confirmDialog');
      var txt = $('#confirmText');
      var ok = $('#confirmOk');
      var cancel = $('#confirmCancel');
      if (!dlg) { return resolve(window.confirm(message||'Confirm?')); }
      txt.textContent = message || 'Confirm?';
      function cleanup(ans){
        // reset labels in case alertInApp changed them
        cancel.style.display = '';
        ok.textContent = 'Confirm';
        safeClose(dlg);
        ok.onclick = null; cancel.onclick = null;
        resolve(ans);
      }
      ok.onclick = function(){ cleanup(true); };
      cancel.onclick = function(){ cleanup(false); };
      openDialog(dlg);
    });
  }
  function alertInApp(message){
    return new Promise(function(resolve){
      var dlg = $('#confirmDialog');
      if (!dlg){ alert(message||''); return resolve(); }
      var txt = $('#confirmText');
      var ok = $('#confirmOk');
      var cancel = $('#confirmCancel');
      txt.textContent = message || '';
      cancel.style.display = 'none';
      ok.textContent = 'OK';
      ok.onclick = function(){
        cancel.style.display = '';
        ok.textContent = 'Confirm';
        safeClose(dlg);
        ok.onclick = null;
        resolve();
      };
      openDialog(dlg);
    });
  }

  // ----- Delete (in-app confirm) -----
  function delTask(i){
    var d=getDay(); var t=d.tasks[i]; if (!t) return;
    confirmInApp('Confirm Delete?').then(function(ok){
      if (!ok) return;
      d.tasks.splice(i,1);
      saveData(); render();
    });
  }

  // ----- Drag reorder (desktop) -----
function wireDragDrop() {
  const list = document.getElementById("taskList");
  let draggingEl = null;

  list.addEventListener("dragstart", function (e) {
    if (e.target.classList.contains("task")) {
      draggingEl = e.target;
      draggingEl.classList.add("dragging");
    }
  });

  list.addEventListener("dragend", function (e) {
    if (draggingEl) {
      draggingEl.classList.remove("dragging");
      draggingEl = null;
    }
  });

  list.addEventListener("dragover", function (e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(list, e.clientY);
    if (afterElement == null) {
      list.appendChild(draggingEl);
    } else {
      list.insertBefore(draggingEl, afterElement);
    }
  });

  list.addEventListener("drop", function (e) {
    e.preventDefault();
    saveReorderedTasks(); // Optional: implement this if needed
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

  // ----- Global UI -----
  function installGlobal(){
    function S(){ return getDay(); }

    $('#backDay').onclick = function(){ currentDayIndex=(currentDayIndex+6)%7; render(); };
    $('#forwardDay').onclick = function(){ currentDayIndex=(currentDayIndex+1)%7; render(); };
    $('#editDayName').onclick = function(){
      var d=S(); var n = prompt('Rename this day/list:', d.name);
      if (n){ d.name=n; saveData(); render(); }
    };
    $('#resetDay').onclick = function(){
      var d=S(); for (var i=0;i<d.tasks.length;i++) d.tasks[i].completed=false;
      saveData(); render();
    };
    $('#addTask').onclick = function(){
      S().tasks.push({ id:'new_'+Date.now(), name:'New task', time:'', image: pickImg('New task'),
        audio:null, timer_minutes:null, one_time:false, completed:false });
      saveData(); render();
    };

    var setup = $('#setupDialog');
    $('#settingsBtn').onclick = function(){
      var boxes = $all('.copyDay'); for (var i=0;i<boxes.length;i++) boxes[i].checked=false;
      openDialog(setup);
    };
    $('#setupClose').onclick = function(){ safeClose(setup); };

    // Clear day
    $('#clearThisDay').onclick = function(){
      confirmInApp('Clear all tasks for this day?').then(function(ok){
        if (!ok) return;
        S().tasks = [];
        saveData(); render(); safeClose(setup);
      });
    };
    // Restore defaults (day)
    $('#restoreDefaultsDay').onclick = function(){
      var name = dayNames[currentDayIndex];
      var def = DEFAULT_DATA.days[name];
      if (!def) { alertInApp('No defaults'); return; }
      confirmInApp('Restore defaults for '+name+'?').then(function(ok){
        if (!ok) return;
        data.days[name].tasks = JSON.parse(JSON.stringify(def.tasks));
        saveData(); render(); safeClose(setup);
      });
    };
    // Reset whole week
    $('#resetWeekDefaults').onclick = function(){
      confirmInApp('Reset ALL days to defaults?').then(function(ok){
        if (!ok) return;
        for (var i=0;i<dayNames.length;i++){
          var nm = dayNames[i];
          data.days[nm].tasks = JSON.parse(JSON.stringify(DEFAULT_DATA.days[nm].tasks));
        }
        saveData(); render(); safeClose(setup);
      });
    };
    // Copy to selected (in-app alerts)
    $('#copyToSelected').onclick = function(){
      var from = S();
      var boxes = $all('.copyDay');
      var sel = [];
      for (var i=0;i<boxes.length;i++) if (boxes[i].checked) sel.push(parseInt(boxes[i].value,10));

      if (!sel.length) { alertInApp('Select at least one day'); return; }

      for (var j=0;j<sel.length;j++){
        var idx = sel[j];
        var nm = dayNames[idx];
        var cloned = JSON.parse(JSON.stringify(from.tasks));
        for (var c=0;c<cloned.length;c++) cloned[c].completed = false;
        data.days[nm].tasks = cloned;
      }

      saveData();
      safeClose(setup);
      alertInApp('Copied.');
    };
  }

  function openDialog(dlg){
    try { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open',''); }
    catch(e){ dlg.setAttribute('open',''); }
  }
  function safeClose(dlg){
    try { dlg.close(); } catch(e){}
    dlg.removeAttribute('open');
  }

  function start(){ try { loadData(); installGlobal(); } catch(e){ console.error('Init error:', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// --- Reorder toggle ---
(function setupReorderToggle() {
  var reorderBtn = document.getElementById("reorderToggle");
  if (!reorderBtn) return;

  reorderBtn.addEventListener("click", function () {
    var isReordering = document.body.classList.toggle("reordering");
    reorderBtn.textContent = isReordering ? "✓" : "↕";
    reorderBtn.title = isReordering ? "Done" : "Reorder";

    var tasks = document.querySelectorAll("#taskList .task");
    tasks.forEach(function (task) {
      if (isReordering) {
        task.setAttribute("draggable", true);
        task.classList.add("reorder-mode");
      } else {
        task.removeAttribute("draggable");
        task.classList.remove("reorder-mode");
      }
    });
  });
})();

(function () {
    var el = document.getElementById('gantt');
    var dataEl = document.getElementById('gantt-data');
    if (!el || !dataEl || typeof Gantt === 'undefined') return;

    var tasks;
    try {
        tasks = JSON.parse(dataEl.textContent || dataEl.innerText || '[]');
    } catch (e) {
        tasks = [];
    }
    if (!tasks.length) return;

    var gantt = new Gantt(el, tasks, {
        view_mode: 'Week',
        language: 'en',
        bar_height: 22,
        padding: 18,
        on_click: function (task) {
            window.location.href = '/Projects/WorkPackages/Edit/' + task.id;
        }
    });

    var buttons = document.querySelectorAll('.gantt-viewmodes [data-viewmode]');
    function setActive(mode) {
        for (var j = 0; j < buttons.length; j++) {
            if (buttons[j].getAttribute('data-viewmode') === mode) {
                buttons[j].classList.add('active');
            } else {
                buttons[j].classList.remove('active');
            }
        }
    }
    setActive('Week');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', (function (btn) {
            return function () {
                var mode = btn.getAttribute('data-viewmode');
                gantt.change_view_mode(mode);
                setActive(mode);
            };
        })(buttons[i]));
    }

    // ----- Resizable wrap: custom handle + persist per project -----
    var wrap = document.querySelector('.gantt-wrap');
    var handle = document.querySelector('.gantt-resize-handle');
    var sizeOut = document.getElementById('gantt-size');
    var resetBtn = document.getElementById('gantt-reset-size');
    if (!wrap || !handle) return;

    var projectId = wrap.getAttribute('data-project-id') || 'default';
    var storageKey = 'progress-hub.gantt-size.' + projectId;
    var defaultHeight = 480;
    var minWidth = 320;
    var minHeight = 200;

    function applySize(size) {
        if (!size) return;
        if (size.width) wrap.style.width = size.width + 'px';
        if (size.height) wrap.style.height = size.height + 'px';
    }

    function readSavedSize() {
        try {
            var raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function saveSize() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                width: wrap.clientWidth,
                height: wrap.clientHeight
            }));
        } catch (e) { /* quota / private mode — ignore */ }
    }

    function showSize() {
        if (!sizeOut) return;
        sizeOut.textContent = wrap.clientWidth + ' × ' + wrap.clientHeight + ' px';
    }

    applySize(readSavedSize());
    showSize();

    var drag = null;

    handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        drag = {
            startX: e.clientX,
            startY: e.clientY,
            startW: wrap.clientWidth,
            startH: wrap.clientHeight
        };
        document.body.classList.add('gantt-resizing');
    });

    document.addEventListener('mousemove', function (e) {
        if (!drag) return;
        var w = Math.max(minWidth, drag.startW + (e.clientX - drag.startX));
        var h = Math.max(minHeight, drag.startH + (e.clientY - drag.startY));
        wrap.style.width = w + 'px';
        wrap.style.height = h + 'px';
        showSize();
    });

    document.addEventListener('mouseup', function () {
        if (!drag) return;
        drag = null;
        document.body.classList.remove('gantt-resizing');
        saveSize();
    });

    // Touch support (mobile / pen)
    handle.addEventListener('touchstart', function (e) {
        if (!e.touches.length) return;
        var t = e.touches[0];
        drag = {
            startX: t.clientX,
            startY: t.clientY,
            startW: wrap.clientWidth,
            startH: wrap.clientHeight
        };
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
        if (!drag || !e.touches.length) return;
        var t = e.touches[0];
        var w = Math.max(minWidth, drag.startW + (t.clientX - drag.startX));
        var h = Math.max(minHeight, drag.startH + (t.clientY - drag.startY));
        wrap.style.width = w + 'px';
        wrap.style.height = h + 'px';
        showSize();
    }, { passive: true });

    document.addEventListener('touchend', function () {
        if (!drag) return;
        drag = null;
        saveSize();
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            wrap.style.width = '';
            wrap.style.height = defaultHeight + 'px';
            try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
            showSize();
        });
    }
})();

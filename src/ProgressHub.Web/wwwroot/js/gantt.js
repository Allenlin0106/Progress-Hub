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

    // ----- Resizable frame: persist size per project in localStorage -----
    var frame = document.querySelector('.gantt-frame');
    var sizeOut = document.getElementById('gantt-size');
    var resetBtn = document.getElementById('gantt-reset-size');
    if (!frame) return;

    var projectId = frame.getAttribute('data-project-id') || 'default';
    var storageKey = 'progress-hub.gantt-size.' + projectId;
    var defaultHeight = 480;

    function applySize(size) {
        if (!size) return;
        if (size.width) frame.style.width = size.width + 'px';
        if (size.height) frame.style.height = size.height + 'px';
    }

    function readSavedSize() {
        try {
            var raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveSize() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                width: frame.clientWidth,
                height: frame.clientHeight
            }));
        } catch (e) { /* quota / private mode — ignore */ }
    }

    function showSize() {
        if (!sizeOut) return;
        sizeOut.textContent = frame.clientWidth + ' × ' + frame.clientHeight + ' px';
    }

    applySize(readSavedSize());
    showSize();

    if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function () {
            showSize();
            saveSize();
        });
        ro.observe(frame);
    } else {
        // Fallback: poll on mouseup (older browsers)
        document.addEventListener('mouseup', function () {
            showSize();
            saveSize();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            frame.style.width = '';
            frame.style.height = defaultHeight + 'px';
            try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
            showSize();
        });
    }
})();

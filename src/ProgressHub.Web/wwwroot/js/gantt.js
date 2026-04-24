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
})();

(function () {
    var board = document.querySelector('.kanban');
    if (!board || typeof Sortable === 'undefined') return;

    var moveUrl = board.getAttribute('data-move-url');
    var token = board.getAttribute('data-token');
    var lists = board.querySelectorAll('.kanban-list');

    function handleEnd(evt) {
        var card = evt.item;
        var toList = evt.to;
        var id = parseInt(card.getAttribute('data-id'), 10);
        var status = toList.getAttribute('data-status');
        var position = evt.newIndex;

        fetch(moveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id: id, status: status, position: position })
        }).then(function (res) {
            if (!res.ok) {
                alert('Failed to save (' + res.status + '). Reloading.');
                window.location.reload();
            }
        }).catch(function () {
            alert('Network error. Reloading.');
            window.location.reload();
        });
    }

    for (var i = 0; i < lists.length; i++) {
        new Sortable(lists[i], {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: handleEnd
        });
    }
})();

const DISPLAY = (function init() {
    var displayedEnding = false;

    function series(len) {
        var a = [];
        for (var i=0; i<len; i++)
            a.push(i);
        return a;
    }

    function activationUpdate() {
        if (displayedEnding)
            return;

        if (GAME.state.ending === GAME.ENDING.LOST) {
            GAME.revealMines().forEach(function (mineid) {
                setTimeout(function () {
                    $('td[data-mineid=' + mineid + ']').html('*');
                }, Math.floor(Math.random() * 500));
            });

            setTimeout(function () { alert('Defeat!'); }, 510);
            displayedEnding = true;
        }

        if (GAME.state.ending === GAME.ENDING.WON) {
            setTimeout(function () { alert('Victory!'); }, 100);
            displayedEnding = true;
        }
    }

    function updateFlagsCountLbl() {
        $('#flagsLbl').html(GAME.state.countRemainingFlags());
        if (GAME.state.countRemainingFlags() === 0)
            $('#flagsBtn').css('backgroundColor', '#4A4');
        else
            $('#flagsBtn').css('backgroundColor', '');
    }

    function updateFlagLbl(square, flag) {
        square.html(flag ? flag.icon : '');
        updateFlagsCountLbl();
    }

    function renderGrid() {
        series(GAME.state.rows).forEach(function (r) {
            var row = $('<tr></tr>');
            series(GAME.state.cols).forEach(function (c) {
                var col = $('<td></td>');
                col.addClass('unclicked');
                var mid = GAME.MineID.get(r, c);
                col.attr('data-mineid', mid);
                row.append(col);
            });
            $('#mines').append(row);
        });

        displayedEnding = false;
        updateFlagsCountLbl();
    }

    function highlight(mineid) {
        $('td[data-mineid=' + mineid + ']').addClass('highlight');
    }

    function clearHighlight() {
        $('.highlight').removeClass('highlight');
    }

    return {
        activationUpdate: activationUpdate,
        updateFlagLbl: updateFlagLbl,
        renderGrid: renderGrid,
        highlight: highlight,
        clearHighlight: clearHighlight
    };
})();
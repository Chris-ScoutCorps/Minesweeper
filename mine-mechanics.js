const GAME = (function init() {
    const rows = 20;
    const cols = 30;
    const mines = 80;
    var state;

    const FLAG = Object.freeze({
        SET: { icon: '>' },
        QUESTION: { icon: '?' }
    });
    const ENDING = Object.freeze({
        WON: true,
        LOST: false,
        NONE: null
    });

    const MineID = Object.freeze({
        get: function (row, col) {
            return row + '-' + col;
        },
        parse: function (id) {
            var s = id.split('-');
            return {
                row: parseInt(s[0]),
                col: parseInt(s[1])
            }
        }
    });

    function buildState() {
        function getRandomMine() {
            return MineID.get(
                Math.floor(Math.random() * rows),
                Math.floor(Math.random() * cols)
            );
        }

        var mineLocations = {};
        var clicked = {};
        var flags = {};

        while (Object.keys(mineLocations).length < mines) { //hash to avoid dupes
            mineLocations[getRandomMine()] = true;
        }

        return {
            ending: ENDING.NONE,
            rows: rows,
            cols: cols,
            mines: mines,
            isMine: function (id) {
                return mineLocations[id] || false;
            },
            setClicked: function (id) {
                clicked[id] = true;
            },
            isClicked: function (id) {
                return clicked[id] || false;
            },
            toggleFlag: function (id) {
                if (!flags[id]) flags[id] = FLAG.SET;
                else if (flags[id] === FLAG.SET) flags[id] = FLAG.QUESTION;
                else delete flags[id];

                return flags[id] || false;
            },
            getFlag: function (id) {
                return flags[id] || false;
            },
            didWin: function () {
                return Object.keys(clicked).length === ((rows * cols) - mines);
            },
            countRemainingFlags: function () {
                return mines - Object.keys(flags).filter(function (f) {
                        return flags[f] === FLAG.SET;
                    }).length;
            }
        };
    }
    state = buildState();

    function getAdjacent(id) {
        var p = MineID.parse(id);
        return [
            { row: p.row - 1, col: p.col },
            { row: p.row - 1, col: p.col + 1 },
            { row: p.row, col: p.col + 1 },
            { row: p.row + 1, col: p.col + 1 },
            { row: p.row + 1, col: p.col },
            { row: p.row + 1, col: p.col - 1 },
            { row: p.row, col: p.col - 1 },
            { row: p.row - 1, col: p.col - 1 }
        ].filter(function (x) {
            return x.row >= 0 && x.col >= 0 && x.row < rows && x.col < cols;
        }).map(function (a) {
            return MineID.get(a.row, a.col);
        });
    }


    function activate(square) {
        const id = square.attr('data-mineid');

        if (state.getFlag(id)) {
            return;
        }

        square.removeClass('unclicked');
        state.setClicked(id);
        if (state.isMine(id)) {
            square.addClass('mine');
            state.ending = ENDING.LOST;
        }
        else {
            square.addClass('clicked');
        }

        if (state.didWin()) {
            state.ending = ENDING.WON;
        }

        const adjacent = getAdjacent(id);
        const adjMines = adjacent.filter(function (a) {
            return state.isMine(a);
        }).length;

        if (adjMines) {
            square.html(adjMines);
        }
        else {
            setTimeout(function () {
                adjacent.forEach(function (a) {
                    if (!state.isClicked(a)) {
                        activate($('td[data-mineid=' + a + ']'));
                    }
                });
            }, 15);
        }
    }

    return {
        FLAG: FLAG,
        ENDING: ENDING,
        MineID: MineID,
        state: state,
        getAdjacent: getAdjacent,
        activate: activate
    }
})();
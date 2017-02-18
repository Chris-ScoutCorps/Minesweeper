const GAME = (function init() {
    const rows = 20;
    const cols = 30;
    const mines = 80;
    var state;
    var mineLocations;
    var adjMineCountMemoize;

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

    function isMine (id) {
        return mineLocations[id] || false;
    }

    function buildState() {
        function getRandomMine() {
            return MineID.get(
                Math.floor(Math.random() * rows),
                Math.floor(Math.random() * cols)
            );
        }

        adjMineCountMemoize = {};
        mineLocations = {};
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
            },
            countNakedSquares: function () {
                return (rows*cols) - (Object.keys(clicked).length + Object.keys(flags).length)
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

    function getAdjacentMineCount(id) {
        if (adjMineCountMemoize[id] == null) {
            adjMineCountMemoize[id] = getAdjacent(id).filter(function (a) {
                return isMine(a);
            }).length;
        }
        return adjMineCountMemoize[id];
    }
    function getAdjacentFlagCount(id) {
        return getAdjacent(id).filter(function (a) {
            return state.getFlag(a) === FLAG.SET;
        }).length;
    }

    function activate(square, callback) {
        const id = square.attr('data-mineid');

        if (state.getFlag(id)) {
            return;
        }

        square.removeClass('unclicked');
        state.setClicked(id);
        if (isMine(id)) {
            square.addClass('mine');
            state.ending = ENDING.LOST;
        }
        else {
            square.addClass('clicked');
        }

        if (state.didWin()) {
            state.ending = ENDING.WON;
        }

        callback();
        if (state.ending !== ENDING.NONE)
            return;

        const adjMines = getAdjacentMineCount(id);
        if (adjMines) {
            square.html(adjMines);
        }
        else {
            setTimeout(function () {
                getAdjacent(id).forEach(function (a) {
                    if (!state.isClicked(a)) {
                        activate($('td[data-mineid=' + a + ']'), callback);
                    }
                });
            }, 15);
        }
    }

    function activateSpecial(id, callback) {
        if (state.isClicked(id) && state.ending === ENDING.NONE) {
            const adjMines = getAdjacentMineCount(id);
            const adjFlags = getAdjacentFlagCount(id);

            if (adjFlags && adjFlags === adjMines) {
                getAdjacent(id).forEach(function (a) {
                    if (!state.getFlag(a)) {
                        activate($('td[data-mineid=' + a + ']'), callback);
                    }
                });
            }
        }
    }

    return {
        FLAG: FLAG,
        ENDING: ENDING,
        MineID: MineID,
        state: state,
        getAdjacent: getAdjacent,
        getAdjacentMineCount: getAdjacentMineCount,
        getAdjacentFlagCount: getAdjacentFlagCount,
        activate: activate,
        activateSpecial: activateSpecial,
        revealMines: function () {
            if (state.ending === ENDING.NONE)
                throw "Game not over!";
            return Object.keys(mineLocations);
        }
    }
})();
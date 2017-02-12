const AUTOPLAY = (function () {
    function activate(id) {
        const square = $('td[data-mineid=' + id + ']');
        GAME.activate(square, DISPLAY.activationUpdate);
        DISPLAY.highlight(id);
    }
    function flag(id) {
        var flag;
        do {
            flag = GAME.state.toggleFlag(id);
            const square = $('td[data-mineid=' + id + ']');
            DISPLAY.updateFlagLbl(square, flag);
        } while (flag !== GAME.FLAG.SET);
        DISPLAY.highlight(id);
    }

    function iterateGrid(f) {
        $('td', '#mines').each(function () {
            const mineid = $(this).attr('data-mineid');
            f(mineid);
        });
    }

    const placeObviousFlags = {
        name: 'Place Obvious Flags',
        doIt: function() {
            DISPLAY.clearHighlight();

            var placed = 0;

            iterateGrid(function (id) {
                const adjFresh = GAME.getAdjacent(id).filter(function (a) {
                    return !GAME.state.isClicked(a) && GAME.state.getFlag(a) !== GAME.FLAG.SET;
                });
                if (adjFresh.length) {
                    const adjMines = GAME.getAdjacentMineCount(id);
                    const adjFlags = GAME.getAdjacentFlagCount(id);
                    if (adjFresh.length === adjMines - adjFlags) {
                        adjFresh.forEach(function (a) {
                            flag(a);
                            placed++;
                        });
                    }
                }
            });

            this.tried = true;
            if (placed)
                clearObviousSafeSpaces.tried = false;
        },
        tried: true
    };

    const clearObviousSafeSpaces = {
        name: 'Clear Obvious Safe Spaces',
        doIt: function() {
            DISPLAY.clearHighlight();

            var cleared = 0;

            this.tried = true;
            if (cleared)
                placeObviousFlags.tried = false;
        },
        tried: true
    };

    const guess = {
        name: 'Take A Wild Guess',
        doIt: function() {
            DISPLAY.clearHighlight();

            const id = GAME.MineID.get(
                Math.floor(Math.random() * GAME.state.rows),
                Math.floor(Math.random() * GAME.state.cols)
            );
            activate(id);

            placeObviousFlags.tried = false;
            clearObviousSafeSpaces.tried = false;
        }
    };

    function next() {
        if (!placeObviousFlags.tried)
            return placeObviousFlags;
        if (!clearObviousSafeSpaces.tried)
            return clearObviousSafeSpaces;
        return guess;
    }

    return {
        next: next,
        registerHumanAction: function () {
            DISPLAY.clearHighlight();
            placeObviousFlags.tried = false;
            clearObviousSafeSpaces.tried = false;
        }
    };
})();
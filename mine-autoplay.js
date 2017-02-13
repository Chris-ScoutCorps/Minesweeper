const AUTOPLAY = (function () {
    const DELAY = 50;

    function getActivationCallback(id) {
        return function () {
            DISPLAY.activationUpdate();
            DISPLAY.highlight(id);
        };
    }
    function activate(id) {
        const square = $('td[data-mineid=' + id + ']');
        GAME.activate(square, getActivationCallback(id));
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
                            setTimeout(function () { flag(a) }, placed*DELAY);
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
        cleared: {},
        doIt: function() {
            DISPLAY.clearHighlight();
            var cleared = 0;
            const me = this;

            iterateGrid(function (id) {
                if (GAME.state.isClicked(id) && !me.cleared[id]) {

                    const adjFresh = GAME.getAdjacent(id).filter(function (a) {
                        return !GAME.state.isClicked(a) && GAME.state.getFlag(a) !== GAME.FLAG.SET;
                    });
                    if (adjFresh.length) {
                        const adjMines = GAME.getAdjacentMineCount(id);
                        const adjFlags = GAME.getAdjacentFlagCount(id);
                        if (adjFlags === adjMines) {
                            setTimeout(function () {
                                GAME.activateSpecial(id, getActivationCallback(id));
                            }, cleared*DELAY);

                            cleared++;
                            me.cleared[id] = true;
                        }
                    }
                }
            });

            this.tried = true;
            if (cleared)
                placeObviousFlags.tried = false;
        },
        tried: true
    };

    const guess = {
        name: 'Take A Guess',
        doIt: function() {
            DISPLAY.clearHighlight();

            var probabilities = [];
            iterateGrid(function (id) {
                if (!GAME.state.isClicked(id) && !GAME.state.getFlag(id)) {
                    probabilities.push({ id: id, p: 0 }); //TODO: actually try probabilities
                }
            });
            probabilities.sort(function (a,b) {
               return a.p - b.p;
            });

            activate(probabilities[0].id);

            placeObviousFlags.tried = false;
            clearObviousSafeSpaces.tried = false;
        }
    };

    function next() {
        if (GAME.state.ending === GAME.ENDING.WON)
            return {
                name: "I'm a champ!",
                doIt: function () { }
            };
        if (GAME.state.ending === GAME.ENDING.LOST)
            return {
                name: "I have let you down :-(",
                doIt: function () { }
            };

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
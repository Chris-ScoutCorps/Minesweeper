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

            if (cleared) {
                placeObviousFlags.tried = false;
                this.tried = false;
            }
            else {
                this.tried = true;
            }
        },
        tried: true
    };

    function isNaked(id) {
        return !GAME.state.isClicked(id) && !GAME.state.getFlag(id);
    }
    function assignProbabilitiesFromRevealedNumbers(probabilities) {
        iterateGrid(function (id) {
            if (GAME.state.isClicked(id)) {
                const adjMines = GAME.getAdjacentMineCount(id);
                if (adjMines) {
                    const adjFlags = GAME.getAdjacentFlagCount(id);
                    const adjNaked = GAME.getAdjacent(id).filter(isNaked);
                    const unknownMines = adjMines - adjFlags;

                    adjNaked.forEach(function (a) {
                        if (!unknownMines) {
                            probabilities[a] = 0;
                        }
                        else if (probabilities[a] !== 0) { //if it's clear, don't F with it. otherwise take the highest probability
                            probabilities[a] = Math.max(unknownMines / adjNaked.length, probabilities[a] || 0);
                        }
                    });
                }
            }
        });
    }
    function assignProbabilitiesFromDefault(probabilities) {
        var naked = 0;
        iterateGrid(function (id) {
            if (isNaked(id)) {
                naked++;
            }
        });
        const remaining = GAME.state.countRemainingFlags();
        iterateGrid(function (id) {
            if (isNaked(id) && probabilities[id] == null) {
                probabilities[id] = remaining / naked;
            }
        });
    }
    function distFromCenter(mineid) {
        const cr = GAME.state.rows / 2;
        const cc = GAME.state.cols / 2;
        const mine = GAME.MineID.parse(mineid);
        return Math.sqrt(
            (mine.row - cr) * (mine.row - cr),
            (mine.col - cc) * (mine.col - cc)
        );
    }

    const guess = {
        name: 'Take A Guess',
        doIt: function() {
            DISPLAY.clearHighlight();

            var probabilities = {};
            assignProbabilitiesFromRevealedNumbers(probabilities);
            assignProbabilitiesFromDefault(probabilities);

            probabilities = Object.keys(probabilities).map(function (k) {
                return {
                    id: k,
                    p: probabilities[k],
                    value: GAME.getAdjacent(k).filter(isNaked).length,
                    distFromCenter: distFromCenter(k)
                };
            });

            //lowest probability - use "what will reveal the most" as tie-breaker, closest to center as next tie-breaker
            probabilities.sort(function (a,b) {
                if (a.p !== b.p)
                    return a.p - b.p;
                if (a.value !== b.value)
                    return b.value - a.value;
                return a.distFromCenter - b.distFromCenter;
            });

            activate(probabilities[0].id);

            placeObviousFlags.tried = false;
            clearObviousSafeSpaces.tried = false;
        }
    };

    const finishHim = {
        name: 'FINISH HIM',
        doIt: function() {
            DISPLAY.clearHighlight();

            GAME.activateAll(function () {
                DISPLAY.activationUpdate();
                DISPLAY.highlightFlagsBtn();
            });
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

        if (GAME.state.countRemainingFlags() === 0) {
            return finishHim;
        }

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
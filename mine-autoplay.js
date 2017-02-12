const AUTOPLAY = (function () {
    const placeObviousFlags = {
        name: 'Place Obvious Flags',
        doIt: function() {
            var placed = 0;

            this.tried = true;
            if (placed)
                clearObviousSafeSpaces.tried = false;
        },
        tried: true
    };

    const clearObviousSafeSpaces = {
        name: 'Clear Obvious Safe Spaces',
        doIt: function() {
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
            placeObviousFlags.tried = false;
            clearObviousSafeSpaces.tried = false;
        }
    };
})();
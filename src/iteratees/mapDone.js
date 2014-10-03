define(['enumerators/EOF'], function(EOF) {
    return function(iteratee, fn) {
        return iteratee.flatMap(EOF).map(function(step) {
            return step(
                function() {throw new Error('Diverging Iteratee');},
                fn
            );
        });
    }
});
define(['compose', 'iteratees/Step'], function(compose, Step) {
    return function (source, mapFn) { //mapFn: Input => Input
        function mapStep(step) {
            return step(function(inputFn) {
                    return Step.cont(compose(mapFn, inputFn, mapIteratee));
                }, function() {
                    return step;
                }
            )
        }
        function mapIteratee(iteratee) {
            return iteratee.flatMap(mapStep);
        }
        return function(step) {
            return source(mapStep(step));
        }
    }
});
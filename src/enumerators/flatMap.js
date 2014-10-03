define(['functions/compose', 'iteratees/Step', './EOF'], function(compose, Step, EOF) {
    return function(source, transformFn) { //transformFn: v => Enumerator
        function transformInput(input) {
            return input(transformFn, function() {return EOF; });
        }
        function mapStep(step) {
            return step(function() {
                    return Step.cont(compose(transformInput, function(enumerator) {return enumerator(step); }));
                }, function() {return step; }
            )
        }
        return function(step) {
            return source(mapStep(step));
        }
    }
});
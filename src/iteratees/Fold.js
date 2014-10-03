define(['functions/compose', './FoldM', 'monads/Identity'], function(compose, FoldM, Id) {
    return function(fn, initial) {
        return FoldM(compose(fn, Id), initial);
    }
});
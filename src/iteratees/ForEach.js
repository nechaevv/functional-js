define(['functions/compose', './FoldM', 'monads/Identity'], function(compose, FoldM, Id) {
    return function(fn) {
        return FoldM(compose(function(acc, elem) {return elem;}, fn, Id), undefined);
    }
});
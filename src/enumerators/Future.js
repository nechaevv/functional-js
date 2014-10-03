define(['functions/compose', './Input', 'monads/Identity'], function(compose, Input, Id) {
    return function(futureFn) {
        return function (step) {
            return step(function (inputFn) {
                return futureFn().flatMap(compose(Input.elem, inputFn));
            }, function () {
                return Id(step);
            });
        };
    }
});
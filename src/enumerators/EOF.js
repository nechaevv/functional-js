define(['./Input', 'monads/Identity'], function(Input, Id) {
    return function(step) {
        return step(function (inputFn) {
            return inputFn(Input.eof)
        }, function () {
            return Id(step);
        });
    }
});

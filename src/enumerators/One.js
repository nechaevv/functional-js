define(['./Input', 'monads/Identity'], function(Input, Id) {
    return function(value) {
        return function(step) {
            return step(function(inputFn) {
                return inputFn(Input.elem(value));
            }, function() {
                return Id(step);
            });
        };
    }

});
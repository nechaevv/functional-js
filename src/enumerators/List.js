define(['./Input', 'monads/Identity'], function(Input, Id) {
    return function(array) {
        return function(step) {
            return array.reduce(function(acc, elem) {
                return acc.flatMap(function(step) {
                    return step(function(inputFn) {
                        return inputFn(Input.elem(elem));
                    }, function() {
                        return Id(step);
                    });
                });
            }, Id(step));
        };
    }
});
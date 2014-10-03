define(['monads/Identity'], function(Id) {
    return function() {
        var enumerators = arguments;
        return function(step) {
            return Array.prototype.reduce.call(enumerators, function(acc, enumerator) {
                return acc.flatMap(enumerator);
            }, Id(step));
        }
    }
});

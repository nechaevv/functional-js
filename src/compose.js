define(function () {
    return function () {
        var composeChain = arguments;
        return function () {
            return Array.prototype.slice.call(composeChain, 1).reduce(function (acc, fn) {
                return fn(acc);
            }, composeChain[0].apply(this, arguments));
        }
    };
});
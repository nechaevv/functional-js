define(function() {
    return function fmap(fn) {
        return function(v) {
            return v.map(fn);
        };
    }
});

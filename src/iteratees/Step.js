define(function() {
    return {
        cont: function(inputFn) {
            return function(cont, done) {
                return cont(inputFn);
            }
        },
        done: function(result) {
            return function(cont, done) {
                return done(result);
            };
        }
    }
});
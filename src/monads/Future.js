define(['functions/compose', 'Promise', './Identity'], function(compose, Promise, Id) {
    function Future(deferred) {
        if (this instanceof Future) {
            this.deferred = deferred;
            this.map = function (fn) {
                var result = Promise();
                deferred.then(
                    compose(fn, result.resolve.bind(result)),
                    result.reject.bind(result)
                );
                return Future(result);
            };
            this.forEach = deferred.then.bind(deferred);
            this.flatMap = function (fnM) {
                var result = Promise();
                deferred.then(function (v) {
                    var innerM = fnM(v);
                    if(innerM instanceof Future) innerM.deferred.then(
                        result.resolve.bind(result), result.reject.bind(result)
                    );
                    else if (innerM instanceof Id) innerM.map(result.resolve.bind(result));
                    else throw new Error('Incompatible monad')
                }, result.reject.bind(result));
                return Future(result);
            };
            this.recover = function(handler) {
                var recovered = Promise();
                deferred.then(
                    recovered.resolve.bind(recovered),
                    compose(handler, recovered.resolve.bind(recovered))
                );
                return Future(recovered);
            };
        } else return new Future(deferred);
    }
});
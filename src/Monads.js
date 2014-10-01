define(function() {
    function fmap(fn) {
        return function(v) {
            return v.map(fn);
        };
    }

    function Id(value) {
        if (this instanceof Id) {
            this.value = value;
            this.map = function(fn) {
                return Id(fn(value));
            };
            this.flatMap = function(fnM) {
                return fnM(value);
            };
        } else return new Id(value);
    }
    Id.pure = Id.prototype.pure = Id;
    Id.fmap = Id.prototype.fmap = fmap;

    function Future(deferred) {
        if (this instanceof Future) {
            this.deferred = deferred;
            this.map = function (fn) {
                var result = $.Deferred();
                deferred.then(function (v) {
                    result.resolve(fn(v));
                }, function (err) {
                    result.reject(err);
                });
                return Future(result);
            };
            this.flatMap = function (fnM) {
                var result = $.Deferred();
                deferred.then(function (v) {
                    var innerM = fnM(v);
                    if(innerM instanceof Future) innerM.deferred.then(function (v2) {
                            result.resolve(v2);
                        }, function (err) {
                            result.reject(err);
                        });
                    else if (innerM instanceof Id) result.resolve(innerM.value);
                    else if(innerM instanceof Option) innerM.fold(
                        function(v) {result.resolve(v);},
                        result.reject.bind(result, "Failed by None fold"));
                    else throw new Error('Incompatible monad')
                }, function (err) {
                    result.reject(err);
                });
                return Future(result);
            };
            this.recover = function(handler) {
                var recovered = $.Deferred();
                deferred.then(recovered.resolve.bind(recovered), function(err) {
                    recovered.resolve(handler(err));
                });
                return Future(recovered);
            };
        } else return new Future(deferred)
    }
    Future.pure = Future.prototype.pure = function(v) {
        return Future(new $.Deferred().resolve(v));
    };
    Future.fmap = Future.prototype.fmap = fmap;

    function Some(value) {
        if (this instanceof Some) {
            this.map = function (fn) {
                return fn(value);
            };
            this.flatMap = function (fnM) {
                var innerM = fnM(value);
                if (innerM instanceof Option) return innerM;
                else if(innerM instanceof Id) return Some(innerM.value);
                else if(innerM instanceof Future) return innerM;
                else throw new Error('Incompatible monad');
            };
            this.fold = function(some, none) {
                return some(value);
            }
        } else return new Some(value);
    }

    function Option() {}
    Option.pure = Option.prototype.pure = Some;
    Option.fmap = Option.prototype.fmap = fmap;
    Some.prototype = new Option();
    Some.prototype.constructor = Some;
    var None = new Option();
    None.map = None.flatMap = function() { return None; };
    None.fold = function(some, none) {
        return none();
    };

    function List(array) {
        if (this instanceof List) {
            this.array = array;
            this.map = function(fn) {
                return List(array.map(fn))
            };
            this.flatMap = function(fnM) {
                return List(array.reduce(function(acc, elem) {
                    var innerM = fnM(elem);
                    if (innerM instanceof List) return acc.concat(innerM.array);
                    else if (innerM instanceof Id) acc.push(innerM.value);
                    else if (innerM instanceof Option) innerM.map(function(v) {acc.push(v);});
                    else throw new Error('Incompatible monad');
                    return acc;
                }, []));
            }
        }
    }
    List.pure = List.prototype.pure = function(v) {
        return List([v]);
    };
    List.fmap = List.prototype.fmap = fmap;

    return {
        Id: Id,
        Future: Future,
        Option: Option,
        Some: Some,
        None: None,
        List: List
    };
});

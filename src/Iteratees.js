define(['functional', 'Monads'], function(functional, Monads) {
    var Step = {
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
    };

    var Input = {
        elem: function(e) {
            return function(elem, eof) {
                return elem(e);
            }
        },
        eof: function(elem, eof) {
            return eof();
        }
    };

    function enumEof(step) {
        return step(function (inputFn) {
            return inputFn(Input.eof)
        }, function () {
            return Monads.Id(step);
        });
    }

    function enumOne(value) {
        return function(step) {
            return step(function(inputFn) {
                return inputFn(Input.elem(value));
            }, function() {
                return Monads.Id(step);
            });
        };
    }

    function enumList(list) {
        return function(step) {
            return list.reduce(function(acc, elem) {
                return acc.flatMap(function(step) {
                    return step(function(inputFn) {
                        return inputFn(Input.elem(elem));
                    }, function() {
                        return Monads.Id(step);
                    });
                });
            }, Monads.Id(step));
        };
    }

    function enumFuture(futureFn) {
        return function(step) {
            return step(function(inputFn) {
                return futureFn().flatMap(function(value) {
                    return inputFn(Input.elem(value))
                });
            }, function() {
                return Monads.Id(step);
            });
        };
    }

    function foldIterateeStep(fnM, acc) { // fnM: (elem, acc) => M(acc)
        return Step.cont(function (input) {
            return input(function (elem) {
                return fnM(acc, elem).map(function(newAcc) {
                    return foldIterateeStep(fnM, newAcc);
                });
            }, function () {
                return Monads.Id(Step.done(acc));
            });
        });
    }

    function mapEnumerator(source, mapFn) { //mapFn: Input => Input
        function mapStep(step) {
            return step(function(inputFn) {
                    return Step.cont(functional.compose(mapFn, inputFn, mapIteratee));
                }, function() {
                    return step;
                }
            )
        }
        function mapIteratee(iteratee) {
            return iteratee.flatMap(mapStep);
        }
        return function(step) {
            return source(mapStep(step));
        }
    }

    function flatMapEnumerator(source, transformFn) { //transformFn: v => Enumerator
        function transformInput(input) {
            return input(transformFn, function() {return enumEof; });
        }
        function mapStep(step) {
            return step(function() {
                    return Step.cont(functional.compose(transformInput, function(enumerator) {return enumerator(step); }));
                }, function() {return step; }
            )
        }
        return function(step) {
            return source(mapStep(step));
        }
    }

    function composeEnumerators() {
        var enumerators = arguments;
        return function(step) {
            return Array.prototype.reduce.call(enumerators, function(acc, enumerator) {
                return acc.flatMap(function(step) {
                    return enumerator(step)
                });
            }, Monads.Id(step));
        }
    }

    return {
        Step: Step,
        Input: Input,
        enumList: enumList,
        enumFuture: enumFuture,
        enumEof: enumEof,
        enumOne: enumOne,
        enumEmpty: Monads.Id,
        composeEnumerators: composeEnumerators,
        mapEnumerator: mapEnumerator,
        flatMapEnumerator: flatMapEnumerator,
        foldM: function (fnM, initial) {
            return foldIterateeStep(fnM, Monads.Id(initial));
        },
        fold: function(fn, initial) {
            return foldIterateeStep(functional.compose(fn, Monads.Id), initial);
        },
        mapResult: function(iteratee, fn) {
            return iteratee.flatMap(enumEof).map(function(step) {
                return step(
                    function() {throw new Error('Diverging Iteratee');},
                    fn
                );
            });
        }
    }

});

"use strict";

import { compose } from './functions';
import { Id } from './monads';

export var Step = {
    cont: function(inputFn) {
        return (cont, done) => cont(inputFn)
    },
    done: function(result) {
        return (cont, done) => done(result);
    }
};

function foldStep(fnM, acc) { // fnM: (elem, acc) => M(acc)
    return Step.cont(input => input(
            elem => fnM(acc, elem).map(newAcc => foldStep(fnM, newAcc)),
        () => new Id(Step.done(acc))));
}

export function fold(fn, initial) {
    return foldStep(compose(fn, v => new Id(v)), initial);
}

export function forEach(fn) {
    return foldStep((acc, elem) => {
        fn(elem);
        return new Id(undefined);
    }, undefined);
}

export function forEachCancellable(fn) {
    var cancelled = false;
    return Step.cont(input => input(function(elem) {
        if (cancelled) return new Id(Step.done());
        else {
            fn(elem);
            return new Id(forEachCancellable(fn));
        }
    }), () => new Id(Step.done()));
}

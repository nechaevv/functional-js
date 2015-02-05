import { compose } from 'functional-js/functions';
import { Id } from 'functional-js/monads';

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
            elem => fnM(acc, elem).map(newAcc => foldStep(fnM, newAcc))
    ), () => Id(Step.done(acc)));
}

export function fold(fn, initial) {
    return foldStep(compose(fn, Id), initial);
}

export function forEach(fn) {
    return foldStep(compose((acc, elem) => elem, fn, Id), undefined);
}

export function forEachCancellable(fn) {
    var cancelled = false;
    return Step.cont(input => input(function(elem) {
        if (cancelled) return Id(Step.done());
        else {
            fn(elem);
            return Id(forEachCancellable(fn));
        }
    }), () => Id(Step.done()));
}

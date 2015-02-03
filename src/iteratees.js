import { compose } from 'functions';
import { Id } from 'monads';

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
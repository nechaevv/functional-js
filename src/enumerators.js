"use strict";

import { compose } from './functions';
import { Id, Future as FutureMonad } from './monads';
import { Step } from './iteratees';


export var Input = {
    elem: function(e) {
        return (elem, eof) => elem(e);
    },
    eof: function(elem, eof) {
        return eof();
    }
};

export function Enumerator(stepFn) {
    stepFn.append = function(nextEnum) {
        return Enumerator(step => this(step).flatMap(nextEnum(step)));
    };
    stepFn.mapInput = function(mapInputFn) { //mapFn: Input => Input
        function mapStep(step) {
            return step(inputFn => Step.cont(compose(mapInputFn, inputFn, iteratee => iteratee.map(mapStep))), () => step);
        }
        return Enumerator(step => this(mapStep(step)));
    };
    stepFn.map = function(mapFn) { //mapFn A=>B
        return this.mapInput(input => (elem, eof) => input(compose(mapFn, elem), eof));
    };
    stepFn.flatMap = function(transformFn) { //transformFn: v => Enumerator
        function mapStep(step) {
            return step(
                () => Step.cont(compose(
                        input => input(transformFn, () => EOF ),
                        enumerator => enumerator(step)
                )), () => step
            )
        }
        return Enumerator(step => this(mapStep(step)));
    };
    return stepFn;
}

export var EOF = Enumerator(step => step(inputFn => inputFn(Input.eof), () => Id(step)));

export function mapDone(iteratee, fn) {
    return iteratee.flatMap(EOF).map(step => step(
        () => { throw new Error('Diverging Iteratee') },
        fn));
}

export function One(value) {
    return Enumerator(step => step(
            inputFn => inputFn(Input.elem(value)),
        () => Id(step)
    ));
}

export function List(array) {
    return Enumerator(step => array.reduce(
        (acc, elem) => acc.flatMap(
                step => step(
                    inputFn => inputFn(Input.elem(elem)),
                () =>  Id(step)
            )
        ), Id(step)));
}

export function FutureInput(futureInputFn) {
    return Enumerator(step => step(
            inputFn => futureInputFn().flatMap(inputFn),
        () => Id(step)
    ));
}

export function Future(futureFn) {
    return FutureInput(compose(futureFn, fv => fv.map(Input.elem)));
}

export class Channel {
    constructor() {
        this._createNext();
    }
    _createNext() {
        this._next = FutureMonad(new Promise((resolve, reject) => {
            this._resolve = resolve;
        }));
    }
    push(v) {
        var resolve = this._resolve;
        this._createNext();
        resolve(Input.elem(v));
    }
    eofAndEnd() {
        var resolve = this._resolve;
        this._next = undefined;
        this._resolve = undefined;
        resolve(Input.eof);
    }
    enumerator() {
        return Enumerator(step => FutureInput(() => this._next)(step).flatMap(this.enumerator()));
    }
}
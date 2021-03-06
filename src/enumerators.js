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
        return Enumerator(step => this(step).flatMap(nextEnum));
    };
    stepFn.mapInput = function(mapInputFn) { //mapFn: Input => Input
        function mapStep(step) {
            return step(
                inputFn => Step.cont(compose(mapInputFn, inputFn, iteratee => iteratee.map(mapStep))),
                () => new Id(step)
            );
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
                )), () => new Id(step)
            )
        }
        return Enumerator(step => this(mapStep(step)));
    };
    stepFn.filter = function(predicate) { //predicate: v => boolean
        function mapStep(step) {
            return step(
                    inputFn => Step.cont(compose(input => input(
                        elem => predicate(elem) ? inputFn(input) : Id(step),
                        inputFn(input)
                    ), iteratee => iteratee.map(mapStep))),
                () => new Id(step)
            );
        }
        return Enumerator(step => this(mapStep(step)));
    };
    return stepFn;
}

export var EOF = Enumerator(step => step(inputFn => inputFn(Input.eof), () => new Id(step)));

export function mapDone(iteratee) {
    return iteratee.flatMap(EOF).map(step => step(
        () => { throw new Error('Diverging Iteratee') },
        result => result));
}

export function One(value) {
    return Enumerator(step => step(
            inputFn => inputFn(Input.elem(value)),
        () => new Id(step)
    ));
}

export function List(array) {
    return Enumerator(step => array.reduce(
        (acc, elem) => acc.flatMap(
                step => step(
                    inputFn => inputFn(Input.elem(elem)),
                () =>  new Id(step)
            )
        ), new Id(step)));
}

export function FutureInput(futureInputFn) {
    return Enumerator(step => step(
            inputFn => futureInputFn().flatMap(inputFn),
        () => new Id(step)
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
        this._next = new FutureMonad(new Promise((resolve, reject) => {
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
        return Enumerator(step => step(
                inputFn => this._next.flatMap(inputFn).flatMap(this.enumerator()),
            () => new Id(step)
        ));
    }
}

export function EventStream(eventTarget, eventName) {
    var channel = new Channel();
    function listener(event) {
        channel.push(event);
    }
    eventTarget.addEventListener(eventName, listener);
    var enumerator = channel.enumerator();
    enumerator.close = function() {
        eventTarget.removeEventListener(eventName, listener);
        channel.eofAndEnd();
    };
    return enumerator;
}
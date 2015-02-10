import { compose as composeFn } from './functions';
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

export function EOF(step) {
    return step(inputFn => inputFn(Input.eof), () => Id(step));
}

export function mapDone(iteratee, fn) {
    return iteratee.flatMap(EOF).map(step => step(
        () => { throw new Error('Diverging Iteratee') },
        fn));
}

export function compose() {
    var enumerators = arguments;
    return step => Array.prototype.reduce.call(enumerators, (acc, enumerator) => acc.flatMap(enumerator), Id(step));
}

export function mapInput(source, mapFn) { //mapFn: Input => Input
    function mapStep(step) {
        return step(inputFn => Step.cont(composeFn(mapFn, inputFn, iteratee => iteratee.map(mapStep))), () => step);
    }
    return step => source(mapStep(step));
}
export function map(source, mapFn) { //mapFn A=>B
    return mapInput(source, input => (elem, eof) => input(composeFn(mapFn, elem), eof));
}

export function flatMap(source, transformFn) { //transformFn: v => Enumerator
    function mapStep(step) {
        return step(
            () => Step.cont(composeFn(
                    input => input(transformFn, () => EOF ),
                    enumerator => enumerator(step)
            )), () => step
        )
    }
    return step => source(mapStep(step));
}

export function One(value) {
    return step => step(
            inputFn => inputFn(Input.elem(value)),
        () => Id(step)
    );
}

export function List(array) {
    return step => array.reduce(
        (acc, elem) => acc.flatMap(
                step => step(
                    inputFn => inputFn(Input.elem(elem)),
                () =>  Id(step)
            )
        ), Id(step));
}

export function FutureInput(futureInput) {
    return step => step(
        inputFn => futureInput.flatMap(inputFn),
        () => Id(step)
    );
}

export function Future(future) {
    return FutureInput(future.map(Input.elem));
}

function BroadcastEnumerator(channel) {
    return step => FutureInput(channel._next)(step).flatMap(BroadcastEnumerator(channel));
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
        return BroadcastEnumerator(this);
    }
}

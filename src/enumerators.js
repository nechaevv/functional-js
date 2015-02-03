import { compose as composeFn } from 'functions';
import { Id, Future as FutureMonad } from 'monads';

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

export function map(source, mapFn) { //mapFn: Input => Input
    function mapStep(step) {
        return step(inputFn => Step.cont(composeFn(mapFn, inputFn, iteratee => iteratee.flatMap(mapStep))), () => step);
    }
    return step => source(mapStep(step));
}

export function flatMap(source, transformFn) { //transformFn: v => Enumerator
    function mapStep(step) {
        return step(
            () => Step.cont(compose(
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

export function Future(futureFn) {
    return step => step(
            inputFn => futureFn().flatMap(composeFn(Input.elem, inputFn)),
            () => Id(step));
}

function enumFutureInput(futureInputFn) {
    return step => step(
        inputFn => futureInputFn().flatMap(inputFn),
        () => Id(step)
    );
}

function BroadcastEnumerator(channel) {
    return step => enumFutureInput(FutureMonad.bind(this, channel._next))(step).flatMap(BroadcastEnumerator(channel));
}

export class Channel {
    constructor() {
        if (this instanceof Channel) this._createNext();
    }
    _createNext() {
        this._next = new Promise((resolve, reject) => {
            this._resolve = resolve;
        });
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
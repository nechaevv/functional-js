"use strict";

import { compose } from './functions';

export class Id {
    constructor(value) {
        this._value = value;
    }
    map(fn) {
        return new Id(fn(this._value));
    }
    forEach(fn) {
        fn(this._value);
    }
    flatMap(fnM) {
        return fnM(this._value);
    }
}

export class Option {
    map(fn) {
        return this.fold(
            function(value) {return Some(fn(value));},
            function() {return None;}
        );
    }
    forEach(fn) {
        this.fold(fn, () => {})
    }
    flatMap(fnM) {
        return this.fold(
            function(value) {
                var innerM = fnM(value);
                if (innerM instanceof Option) return innerM;
                else if(innerM instanceof Id) return innerM.map(Some);
                else throw new Error('Incompatible monad');
            }, function() {return None; }
        );
    }
}

export class Some extends Option {
    constructor(value) {
        this._value = value;
    }
    fold(some, none) {
        return some(value);
    }
}

export var None = new Option();
None.fold = function(some, none) { return none(); };
Option.Some = Some;
Option.None = None;

export class List {
    constructor(array) {
        this._array = array;
    }
    map(fn) {
        return List(this._array.map(fn))
    }
    flatMap(fnM) {
        return List(this._array.reduce(function(acc, elem) {
            var innerM = fnM(elem);
            if (innerM instanceof List || innerM instanceof Id || innerM instanceof Option) {
                innerM.forEach(acc.push.bind(acc));
            }
            else throw new Error('Incompatible monad');
            return acc;
        }, []));
    }
    forEach(fn) {
        this._array.forEach(fn);
    }
}

export class Future {
    constructor(promise) {
        this._promise = promise;
    }
    map(fn) {
        return new Future(this._promise.then(fn));
    }
    forEach(fn) {
        this._promise.then(fn);
    }
    flatMap(fnM) {
        var result = new Promise((resolve, reject) => {
            this._promise.then(function (v) {
                var innerM = fnM(v);
                if (innerM instanceof Future) innerM._promise.then(resolve, reject);
                else if (innerM instanceof Id) innerM.forEach(resolve);
                else throw new Error('Incompatible monad')
            }, reject);
        });
        return new Future(result);
    };
    recover(handler) {
        var recovered = new Promise((resolve, reject) => {
            this._promise.then(resolve, compose(handler, resolve));
        });
        return new Future(recovered);
    }
}

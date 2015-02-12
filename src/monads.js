"use strict";

import { compose } from './functions';

export function Id(value) {
    if (this instanceof Id) {
        this.map = function(fn) {
            return Id(fn(value));
        };
        this.forEach = function(fn) {fn(value);};
        this.flatMap = function(fnM) {
            return fnM(value);
        };
    } else return new Id(value);
}

function Some(value) {
    if (this instanceof Some) {
        this.fold = function(some, none) { return some(value); };
        this.forEach = function(fn) {fn(value);};
    } else return new Some(value);
}

export function Option() {}

Some.prototype = new Option();
Some.prototype.constructor = Some;
var None = new Option();
None.map = None.flatMap = function() { return None; };
None.fold = function(some, none) { return none(); };
None.forEach = function() {};
Option.Some = Some;
Option.None = None;

Option.prototype.map = function(fn) {
    return this.fold(
        function(value) {return Some(fn(value));},
        function() {return None;}
    );
};
Option.prototype.flatMap = function (fnM) {
    return this.fold(
        function(value) {
            var innerM = fnM(value);
            if (innerM instanceof Option) return innerM;
            else if(innerM instanceof Id) return innerM.map(Some);
            else throw new Error('Incompatible monad');
        }, function() {return None; }
    );
};

export function List(array) {
    if (this instanceof List) {
        this.map = function(fn) {
            return List(array.map(fn))
        };
        this.flatMap = function(fnM) {
            return List(array.reduce(function(acc, elem) {
                var innerM = fnM(elem);
                if (innerM instanceof List) return innerM.forEach(acc.push.bind(acc));
                else if (innerM instanceof Id) innerM.map(acc.push.bind(acc));
                else throw new Error('Incompatible monad');
                return acc;
            }, []));
        };
        this.forEach = array.forEach.bind(array);
    }
}

export function Future(promise) {
    if (this instanceof Future) {
        this._promise = promise;
        this.map = compose(promise.then.bind(promise), Future);
        this.forEach = promise.then.bind(promise);
        this.flatMap = function (fnM) {
            var result = new Promise((resolve, reject) => {
                promise.then(function (v) {
                    var innerM = fnM(v);
                    if (innerM instanceof Future) innerM._promise.then(resolve, reject);
                    else if (innerM instanceof Id) innerM.forEach(resolve);
                    else throw new Error('Incompatible monad')
                }, reject);
            });
            return Future(result);
        };
        this.recover = function(handler) {
            var recovered = new Promise((resolve, reject) => {
                promise.then(resolve, compose(handler, resolve));
            });
            return Future(recovered);
        };
    } else return new Future(promise);
}

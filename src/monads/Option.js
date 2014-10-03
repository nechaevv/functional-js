define(['./Identity'], function(Id) {
    function Some(value) {
        if (this instanceof Some) {
            this.fold = function(some, none) { return some(value); };
            this.forEach = function(fn) {fn(value);};
        } else return new Some(value);
    }

    function Option() {}

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

    return Option;

});
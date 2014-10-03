define(function() {
    function Some(value) {
        if (this instanceof Some) {
            this.map = function (fn) {
                return fn(value);
            };
            this.flatMap = function (fnM) {
                var innerM = fnM(value);
                if (innerM instanceof Option) return innerM;
                else if(innerM instanceof Id) return Some(innerM.value);
                else if(innerM instanceof Future) return innerM;
                else throw new Error('Incompatible monad');
            };
            this.fold = function(some, none) {
                return some(value);
            }
        } else return new Some(value);
    }

    function Option() {}
    Some.prototype = new Option();
    Some.prototype.constructor = Some;
    var None = new Option();
    None.map = None.flatMap = function() { return None; };
    None.fold = function(some, none) {
        return none();
    };
    Option.Some = Some;
    Option.None = None;

    return Option;

});
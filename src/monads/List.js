define(function() {
    function List(array) {
        if (this instanceof List) {
            this.array = array;
            this.map = function(fn) {
                return List(array.map(fn))
            };
            this.flatMap = function(fnM) {
                return List(array.reduce(function(acc, elem) {
                    var innerM = fnM(elem);
                    if (innerM instanceof List) return acc.concat(innerM.array);
                    else if (innerM instanceof Id) acc.push(innerM.value);
                    else if (innerM instanceof Option) innerM.map(function(v) {acc.push(v);});
                    else throw new Error('Incompatible monad');
                    return acc;
                }, []));
            }
        }
    }
    return List;
});
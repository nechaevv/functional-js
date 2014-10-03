define(['./Identity'], function(Id) {
    function List(array) {
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
    return List;
});
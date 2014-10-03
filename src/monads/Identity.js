define(function() {
    function Id(value) {
        if (this instanceof Id) {
            this.value = value;
            this.map = function(fn) {
                return Id(fn(value));
            };
            this.flatMap = function(fnM) {
                return fnM(value);
            };
        } else return new Id(value);
    }
    return Id;
});

define(function() {
    return {
        elem: function(e) {
            return function(elem, eof) {
                return elem(e);
            }
        },
        eof: function(elem, eof) {
            return eof();
        }
    }
});

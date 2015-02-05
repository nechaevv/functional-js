export function compose() {
    var composeChain = arguments;
    return function () {
        return Array.prototype.slice.call(composeChain, 1).reduce(
            (acc, fn) => fn(acc),
            composeChain[0].apply(this, arguments)
        );
    }
}

export function fmap(fn) {
    return v => v.map(fn);
}

define(['Monads', 'Iteratees', 'Promise'], function(Monads, Iteratees, Promise) {
    function BroadcastEnumerator(channel) {
        return function(step) {
            return Iteratees.enumFuture(Monads.Future.bind(this, channel.next))(step).flatMap(BroadcastEnumerator(channel))
        };
    }
    function Channel() {
        if (this instanceof Channel) {
            this.next = Promise();
            this.enumerator = BroadcastEnumerator(this);
        }
    }
    Channel.prototype.push = function(v) {
        var pending = this.next;
        this.next = Promise();
        pending.resolve(v);
    };

    return Channel;
});

define(['Monads', 'Iteratees', 'Promise'], function(Monads, Iteratees, Promise) {
    function enumFutureInput(futureInputFn) {
        return function(step) {
            return step(function(inputFn) {
                return futureInputFn().flatMap(inputFn);
            }, function() {
                return Monads.Id(step);
            });
        };
    }

    function BroadcastEnumerator(channel) {
        return function(step) {
            return enumFutureInput(Monads.Future.bind(this, channel.next))(step).flatMap(BroadcastEnumerator(channel))
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
        pending.resolve(Iteratees.Input.elem(v));
    };
    Channel.prototype.eofAndEnd = function() {
        var pending = this.next;
        this.next = undefined;
        pending.resolve(Iteratees.Input.eof);
    };

    return Channel;
});

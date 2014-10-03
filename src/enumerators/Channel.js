define(['./Input', 'Promise', 'monads/Future', 'monads/Identity'], function(Input, Promise, Future, Id) {
    function enumFutureInput(futureInputFn) {
        return function(step) {
            return step(function(inputFn) {
                return futureInputFn().flatMap(inputFn);
            }, function() {
                return Id(step);
            });
        };
    }

    function BroadcastEnumerator(channel) {
        return function(step) {
            return enumFutureInput(Future.bind(this, channel.next))(step).flatMap(BroadcastEnumerator(channel))
        };
    }
    function Channel() {
        if (this instanceof Channel) {
            this.next = Promise();
        }
    }
    Channel.prototype.push = function(v) {
        var pending = this.next;
        this.next = Promise();
        pending.resolve(Input.elem(v));
    };
    Channel.prototype.eofAndEnd = function() {
        var pending = this.next;
        this.next = undefined;
        pending.resolve(Input.eof);
    };
    Channel.prototype.enumerator = function() {
        return BroadcastEnumerator(this);
    };

    return Channel;
});

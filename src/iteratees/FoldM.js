define(['monads/Identity', './Step'], function(Id, Step) {
    function foldIterateeStep(fnM, acc) { // fnM: (elem, acc) => M(acc)
        return Step.cont(function (input) {
            return input(function (elem) {
                return fnM(acc, elem).map(function(newAcc) {
                    return foldIterateeStep(fnM, newAcc);
                });
            }, function () {
                return Id(Step.done(acc));
            });
        });
    }
    return foldIterateeStep;
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.myConsole = Object.create(console, {
    assert: {
        value: function assert(assertion, message) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (typeof window === "undefined") {
                try {
                    console.assert.apply(console, [assertion, message].concat(args));
                }
                catch (err) {
                    console.error(err.stack);
                }
            }
            else {
                console.assert.apply(console, [assertion, message].concat(args));
            }
        },
        configurable: true,
        enumerable: true,
        writable: true,
    },
});
exports.equals = function (a, b) {
    var reference_equals = function (a, b) {
        var object_references = [];
        return (reference_equals = _reference_equals)(a, b);
        function _reference_equals(a, b) {
            var l = object_references.length;
            while (l--)
                if (object_references[l--] === b)
                    return object_references[l] === a;
            object_references.push(a, b);
            return null;
        }
    };
    var _equals = function (a, b) {
        var s, l, p, x, y;
        if ((s = toString.call(a)) !== toString.call(b))
            return false;
        switch (s) {
            default:
                return a.valueOf() === b.valueOf();
            case "[object Number]":
                a = +a;
                b = +b;
                return a ?
                    a === b
                    :
                        a === a ?
                            1 / a === 1 / b
                            : b !== b;
            case "[object RegExp]":
                return a.source === b.source
                    && a.global === b.global
                    && a.ignoreCase === b.ignoreCase
                    && a.multiline === b.multiline
                    && a.lastIndex === b.lastIndex;
            case "[object Function]":
                return false;
            case "[object Array]":
                if ((l = a.length) !== b.length)
                    return false;
                while (l--) {
                    if ((x = a[l]) === (y = b[l]) && x !== 0 || _equals(x, y))
                        continue;
                    return false;
                }
                return true;
            case "[object Object]":
                l = 0;
                for (p in a) {
                    if (a.hasOwnProperty(p)) {
                        ++l;
                        if ((x = a[p]) === (y = b[p]) && x !== 0 || _equals(x, y))
                            continue;
                        return false;
                    }
                }
                for (p in b)
                    if (b.hasOwnProperty(p) && --l < 0)
                        return false;
                return true;
        }
    };
    return a === b
        && a !== 0
        || _equals(a, b);
};

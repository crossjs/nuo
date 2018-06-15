"use strict";
exports.__esModule = true;
var set_immediate_1 = require("core-js/library/fn/set-immediate");
var handler_1 = require("./handler");
var utils_1 = require("./utils");
var Nuo = /** @class */ (function () {
    function Nuo(fn) {
        var _this = this;
        if (!isNuo(this)) {
            throw new TypeError("Promises must be constructed via new");
        }
        if (!utils_1.isFunction(fn)) {
            throw new TypeError("The first argument must be a function");
        }
        this.state = 0;
        this.value = null;
        this.sofar = null;
        this.deferred = [];
        doResolve(fn, function (value) { return _this.resolve(value); }, function (reason) { return _this.reject(reason); }, function (sofar) { return _this.notify(sofar); });
    }
    Nuo.prototype["catch"] = function (onRejected) {
        return this.then(null, onRejected);
    };
    Nuo.prototype["finally"] = function (done) {
        return this.then(function (value) { return Nuo.resolve(done()).then(function () { return value; }); }, function (reason) { return Nuo.resolve(done()).then(function () {
            throw reason;
        }); });
    };
    Nuo.prototype.progress = function (onProgress) {
        return this.then(null, null, onProgress);
    };
    Nuo.prototype.then = function (onFulfilled, onRejected, onProgress) {
        var _this = this;
        return new Nuo(function (resolve, reject, notify) {
            _this.handle(new handler_1["default"](onFulfilled, onRejected, onProgress, resolve, reject, notify));
        });
    };
    Nuo.prototype.handle = function (deferred) {
        var _this = this;
        if (this.state === 0) {
            this.deferred.push(deferred);
            if (deferred.onProgress) {
                if (this.sofar !== null) {
                    set_immediate_1["default"](function () {
                        deferred.onProgress(_this.sofar);
                    });
                }
            }
            return;
        }
        set_immediate_1["default"](function () {
            var cb = _this.state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (_this.state === 1 ? deferred.resolve : deferred.reject)(_this.value);
            }
            else {
                try {
                    var ret = cb(_this.value);
                    deferred.resolve(ret);
                }
                catch (e) {
                    deferred.reject(e);
                }
            }
        });
    };
    Nuo.prototype.finale = function (keepDeferred) {
        for (var i = 0, d = this.deferred, len = d.length; i < len; i++) {
            this.handle(d[i]);
        }
        if (!keepDeferred) {
            this.deferred = [];
        }
    };
    Nuo.prototype.resolve = function (newValue) {
        var _this = this;
        try {
            // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === this) {
                throw new TypeError("A promise cannot be resolved with itself.");
            }
            if (newValue && (utils_1.isObject(newValue) || utils_1.isFunction(newValue))) {
                var then_1 = newValue.then;
                if (utils_1.isFunction(then_1)) {
                    doResolve(function (resolve, reject, notify) {
                        then_1.call(newValue, resolve, reject, notify);
                    }, function (value) { return _this.resolve(value); }, function (reason) { return _this.reject(reason); }, function (sofar) { return _this.notify(sofar); });
                    return;
                }
            }
            this.state = 1;
            this.value = newValue;
            this.finale();
        }
        catch (e) {
            this.reject(e);
        }
    };
    Nuo.prototype.reject = function (newValue) {
        this.state = 2;
        this.value = newValue;
        this.finale();
    };
    Nuo.prototype.notify = function (sofar) {
        this.sofar = sofar;
        this.finale(true);
    };
    Nuo.resolve = function (value) {
        return isNuo(value)
            ? value
            : new Nuo(function (resolve) { return resolve(value); });
    };
    Nuo.reject = function (value) {
        return new Nuo(function (resolve, reject) { return reject(value); });
    };
    Nuo.notify = function (value) {
        return new Nuo(function (resolve, reject, notify) { return notify(value); });
    };
    Nuo.all = function (values) { return new Nuo(function (resolve, reject, notify) {
        if (values.length === 0) {
            return resolve([]);
        }
        var remaining = values.length;
        function res(i, val) {
            try {
                if (val && (utils_1.isObject(val) || utils_1.isFunction(val))) {
                    var then = val.then;
                    if (utils_1.isFunction(then)) {
                        then.call(val, function (value) {
                            res(i, value);
                        }, reject, notify);
                        return;
                    }
                }
                values[i] = val;
                if (--remaining === 0) {
                    resolve(values);
                }
            }
            catch (e) {
                reject(e);
            }
        }
        // 各数组项都会被执行到，
        // 即时中途出现被拒绝项。
        for (var i = 0, len = remaining; i < len; i++) {
            res(i, values[i]);
        }
    }); };
    Nuo.race = function (values) { return new Nuo(function (resolve, reject, notify) {
        // 各数组项都会被执行到，
        // 即时中途出现被拒绝项。
        for (var i = 0, len = values.length; i < len; i++) {
            Nuo.resolve(values[i]).then(resolve, reject, notify);
        }
    }); };
    Nuo.any = function (values) { return new Nuo(function (resolve, reject, notify) {
        if (values.length === 0) {
            return reject();
        }
        var remaining = values.length;
        function res(i, val) {
            try {
                if (val && (utils_1.isObject(val) || utils_1.isFunction(val))) {
                    var then = val.then;
                    if (utils_1.isFunction(then)) {
                        then.call(val, function (value) {
                            res(i, value);
                        }, reject, notify);
                        return;
                    }
                }
                resolve(val);
            }
            catch (e) {
                reject(e);
            }
            if (--remaining === 0) {
                reject();
            }
        }
        // 各数组项都会被执行到，
        // 即时中途出现被拒绝项。
        for (var i = 0, len = remaining; i < len; i++) {
            res(i, values[i]);
        }
    }); };
    return Nuo;
}());
/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected, onProgress) {
    var done = false;
    try {
        fn(function (value) {
            if (done) {
                return;
            }
            done = true;
            onFulfilled(value);
        }, function (reason) {
            if (done) {
                return;
            }
            done = true;
            onRejected(reason);
        }, function (sofar) {
            if (done) {
                return;
            }
            onProgress(sofar);
        });
    }
    catch (e) {
        if (done) {
            return;
        }
        done = true;
        onRejected(e);
    }
}
function isNuo(val) {
    return val instanceof Nuo;
}
exports["default"] = Nuo;
//# sourceMappingURL=index.js.map
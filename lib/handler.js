"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var Handler = /** @class */ (function () {
    function Handler(onFulfilled, onRejected, onProgress, resolve, reject, notify) {
        this.onFulfilled = utils_1.isFunction(onFulfilled) ? onFulfilled : null;
        this.onRejected = utils_1.isFunction(onRejected) ? onRejected : null;
        this.onProgress = utils_1.isFunction(onProgress) ? onProgress : null;
        this.resolve = resolve;
        this.reject = reject;
        this.notify = notify;
    }
    return Handler;
}());
exports["default"] = Handler;
//# sourceMappingURL=handler.js.map
/*!
 * NUO v0.1.0
 * (c) 2016 crossjs
 * Released under the MIT License.
 */
var nuo = (function () {
'use strict';

(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      var arguments$1 = arguments;

      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments$1[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? undefined : global : self));

function Nuo (fn) {
  var this$1 = this;

  if (typeof this !== 'object') { throw new TypeError('Promises must be constructed via new') }
  if (typeof fn !== 'function') { throw new TypeError('The first argument must be a function') }
  this._s = null;
  this._v = null;
  this._p = null;
  this._d = [];

  doResolve(fn, function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    resolve.apply(this$1, args);
  }, function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    reject.apply(this$1, args);
  }, function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    notify.apply(this$1, args);
  });
}

function handle (deferred) {
  var this$1 = this;

  if (this._s === null) {
    this._d.push(deferred);
    if (deferred.onProgress) {
      if (this._p !== null) {
        setImmediate(function () {
          deferred.onProgress(this$1._p);
        });
      }
    }
    return
  }

  setImmediate(function () {
    var cb = this$1._s ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (this$1._s ? deferred.resolve : deferred.reject)(this$1._v);
      return
    }
    var ret;
    try {
      ret = cb(this$1._v);
    } catch (e) {
      deferred.reject(e);
      return
    }
    deferred.resolve(ret);
  });
}

function resolve (newValue) {
  var this$1 = this;

  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === this) {
      throw new TypeError('A promise cannot be resolved with itself.')
    }

    if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
      var then = newValue.then;
      if (typeof then === 'function') {
        doResolve(function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          then.apply(newValue, args);
        }, function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          resolve.apply(this$1, args);
        }, function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          reject.apply(this$1, args);
        }, function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          notify.apply(this$1, args);
        });
        return
      }
    }

    this._s = true;
    this._v = newValue;
    finale.call(this);
  } catch (e) {
    reject.call(this, e);
  }
}

function reject (newValue) {
  this._s = false;
  this._v = newValue;
  finale.call(this);
}

function notify (progress) {
  this._p = progress;
  finale.call(this, true);
}

function finale (keep) {
  var this$1 = this;

  for (var i = 0, len = this._d.length; i < len; i++) {
    handle.call(this$1, this$1._d[i]);
  }
  if (!keep) {
    this._d = null;
  }
}

function Handler (onFulfilled, onRejected, onProgress, resolve, reject, notify) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.onProgress = typeof onProgress === 'function' ? onProgress : null;
  this.resolve = resolve;
  this.reject = reject;
  this.notify = notify;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve (fn, onFulfilled, onRejected, onProgress) {
  var done = false;
  try {
    fn(function (value) {
      if (done) { return }
      done = true;
      onFulfilled(value);
    }, function (reason) {
      if (done) { return }
      done = true;
      onRejected(reason);
    }, function (progress) {
      if (done) { return }
      onProgress(progress);
    });
  } catch (e) {
    if (done) { return }
    done = true;
    onRejected(e);
  }
}

Nuo.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
};

Nuo.prototype.finally = function (done) {
  return this.then(function (value) { return Nuo.resolve(done()).then(function () {
    return value
  }); }, function (reason) { return Nuo.resolve(done()).then(function () {
    throw reason
  }); })
};

Nuo.prototype.progress = function (onProgress) {
  return this.then(null, null, onProgress)
};

Nuo.prototype.then = function (onFulfilled, onRejected, onProgress) {
  var this$1 = this;

  return new Nuo(function (resolve, reject, notify) {
    handle.call(this$1, new Handler(onFulfilled, onRejected, onProgress, resolve, reject, notify));
  })
};

Nuo.resolve = function (value) {
  if (value && typeof value === 'object' && value.constructor === Nuo) {
    return value
  }

  return new Nuo(function (resolve) { return resolve(value); })
};

Nuo.reject = function (value) { return new Nuo(function (resolve, reject) { return reject(value); }); };

Nuo.notify = function (value) { return new Nuo(function (resolve, reject, notify) { return notify(value); }); };

Nuo.all = function (values) {
  return new Nuo(function (resolve, reject, notify) {
    if (values.length === 0) { return resolve([]) }
    var remaining = values.length;

    function res (i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(val, function (val) {
              res(i, val);
            }, reject, notify);
            return
          }
        }
        values[i] = val;
        if (--remaining === 0) {
          resolve(values);
        }
      } catch (e) {
        reject(e);
      }
    }
    for (var i = 0; i < values.length; i++) {
      res(i, values[i]);
    }
  })
};

Nuo.race = function (values) {
  return new Nuo(function (resolve, reject, notify) {
    for (var i = 0, len = values.length; i < len; i++) {
      Nuo.resolve(values[i]).then(resolve, reject, notify);
    }
  })
}

;(function (global) {
  // override
  global.Promise = Nuo;
}(typeof self === 'undefined' ? typeof global === 'undefined' ? undefined : global : self));

return Nuo;

}());

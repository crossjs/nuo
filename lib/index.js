/*!
 * NUO v1.1.0
 * (c) 2018 crossjs
 * Released under the MIT License.
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var setImmediate = _interopDefault(require('core-js/library/fn/set-immediate'));

//      
function isObject (val     )          {
  return typeof val === 'object'
}

function isFunction (val     )          {
  return typeof val === 'function'
}

//      

var Handler = function Handler (
  onFulfilled               ,
  onRejected               ,
  onProgress               ,
  resolve               ,
  reject               ,
  notify               
) {
  this.onFulfilled = isFunction(onFulfilled) ? onFulfilled : null;
  this.onRejected = isFunction(onRejected) ? onRejected : null;
  this.onProgress = isFunction(onProgress) ? onProgress : null;
  this.resolve = resolve;
  this.reject = reject;
  this.notify = notify;
};

//      

var Nuo = function Nuo (fn               ) {
  var this$1 = this;

  if (!isNuo(this)) {
    throw new TypeError('Promises must be constructed via new')
  }
  if (!isFunction(fn)) {
    throw new TypeError('The first argument must be a function')
  }
  this.state = 0;
  this.value = null;
  this.sofar = null;
  this.deferred = [];

  doResolve(
    fn,
    function (value   ) { return this$1.resolve(value); },
    function (reason   ) { return this$1.reject(reason); },
    function (sofar   ) { return this$1.notify(sofar); });
};

Nuo.resolve = function resolve (value   )    {
  return isNuo(value)
    ? value
    : new Nuo(function (resolve               ) { return resolve(value); })
};

Nuo.reject = function reject (value   )    {
  return new Nuo(function (
    resolve               ,
    reject               ) { return reject(value); })
};

Nuo.notify = function notify (value   )    {
  return new Nuo(function (
    resolve               ,
    reject               ,
    notify               ) { return notify(value); })
};

Nuo.all = function all (values     )    {
  return new Nuo(function (resolve               , reject               , notify               ) {
    if (values.length === 0) {
      return resolve([])
    }
    var remaining = values.length;

    function res (i      , val   ) {
      try {
        if (val && (isObject(val) || isFunction(val))) {
          var then = val.then;
          if (isFunction(then)) {
            then.call(val, function (value   ) {
              res(i, value);
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
    // 各数组项都会被执行到，
    // 即时中途出现被拒绝项。
    for (var i = 0, len = remaining; i < len; i++) {
      res(i, values[i]);
    }
  })
};

Nuo.race = function race (values     )    {
  return new Nuo(function (resolve, reject, notify) {
    // 各数组项都会被执行到，
    // 即时中途出现被拒绝项。
    for (var i = 0, len = values.length; i < len; i++) {
      Nuo.resolve(values[i]).then(resolve, reject, notify);
    }
  })
};

Nuo.any = function any (values     )    {
  return new Nuo(function (
    resolve               ,
    reject               ,
    notify               ) {
    if (values.length === 0) {
      return reject()
    }
    var remaining = values.length;

    function res (i      , val   ) {
      try {
        if (val && (isObject(val) || isFunction(val))) {
          var then = val.then;
          if (isFunction(then)) {
            then.call(val, function (value   ) {
              res(i, value);
            }, reject, notify);
            return
          }
        }
        resolve(val);
      } catch (e) {
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
  })
};

Nuo.prototype.catch = function catch$1 (onRejected               ) {
  return this.then(null, onRejected)
};

Nuo.prototype.finally = function finally$1 (done         ) {
  return this.then(
    function (value   ) { return Nuo.resolve(done()).then(function () { return value; }); },
    function (reason   ) { return Nuo.resolve(done()).then(function () {
      throw reason
    }); })
};

Nuo.prototype.progress = function progress (onProgress               ) {
  return this.then(null, null, onProgress)
};

Nuo.prototype.then = function then (
  onFulfilled   ,
  onRejected   ,
  onProgress   
) {
    var this$1 = this;

  return new Nuo(function (
    resolve               ,
    reject               ,
    notify               ) {
    this$1.handle(new Handler(
      onFulfilled, onRejected, onProgress,
      resolve, reject, notify
    ));
  })
};

Nuo.prototype.handle = function handle (deferred       ) {
    var this$1 = this;

  if (this.state === 0) {
    this.deferred.push(deferred);
    var onProgress = deferred.onProgress;
    if (onProgress) {
      if (this.sofar !== null) {
        setImmediate(function () {
          onProgress(this$1.sofar);
        });
      }
    }
    return
  }

  setImmediate(function () {
    var cb                 = this$1.state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (!cb) {
      (this$1.state === 1 ? deferred.resolve : deferred.reject)(this$1.value);
    } else {
      try {
        var ret = cb(this$1.value);
        deferred.resolve(ret);
      } catch (e) {
        deferred.reject(e);
      }
    }
  });
};

Nuo.prototype.finale = function finale (keepDeferred        ) {
    var this$1 = this;

  for (var i = 0, d = this.deferred, len = d.length; i < len; i++) {
    this$1.handle(d[i]);
  }
  if (!keepDeferred) {
    this.deferred = [];
  }
};

Nuo.prototype.resolve = function resolve (newValue   ) {
    var this$1 = this;

  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === this) {
      throw new TypeError('A promise cannot be resolved with itself.')
    }

    if (newValue && (isObject(newValue) || isFunction(newValue))) {
      var then = newValue.then;
      if (isFunction(then)) {
        doResolve(function (
          resolve               ,
          reject               ,
          notify               ) {
          then.call(newValue, resolve, reject, notify);
        },
          function (value   )    { return this$1.resolve(value); },
          function (reason   )    { return this$1.reject(reason); },
          function (sofar   )    { return this$1.notify(sofar); });
        return
      }
    }

    this.state = 1;
    this.value = newValue;
    this.finale();
  } catch (e) {
    this.reject(e);
  }
};

Nuo.prototype.reject = function reject (newValue   ) {
  this.state = 2;
  this.value = newValue;
  this.finale();
};

Nuo.prototype.notify = function notify (sofar   ) {
  this.sofar = sofar;
  this.finale(true);
};

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve (
  fn                 ,
  onFulfilled                 ,
  onRejected                 ,
  onProgress                 
) {
  var done          = false;
  try {
    fn(function (value     ) {
      if (done) {
        return
      }
      done = true;
      onFulfilled(value);
    }, function (reason     ) {
      if (done) {
        return
      }
      done = true;
      onRejected(reason);
    }, function (sofar     ) {
      if (done) {
        return
      }
      onProgress(sofar);
    });
  } catch (e) {
    if (done) {
      return
    }
    done = true;
    onRejected(e);
  }
}

function isNuo (val     )          {
  return val instanceof Nuo
}

module.exports = Nuo;

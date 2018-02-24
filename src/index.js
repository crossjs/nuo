const setImmediate = require('core-js/library/fn/set-immediate')

function Nuo (fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('The first argument must be a function')
  // state
  this._s = null
  // value
  this._v = null
  // progress
  this._p = null
  // deferred
  this._d = []

  doResolve(fn, (...args) => {
    resolve.apply(this, args)
  }, (...args) => {
    reject.apply(this, args)
  }, (...args) => {
    notify.apply(this, args)
  })
}

function handle (deferred) {
  if (this._s === null) {
    this._d.push(deferred)
    if (deferred.onProgress) {
      if (this._p !== null) {
        setImmediate(() => {
          deferred.onProgress(this._p)
        })
      }
    }
    return
  }

  setImmediate(() => {
    const cb = this._s ? deferred.onFulfilled : deferred.onRejected
    if (cb === null) {
      (this._s ? deferred.resolve : deferred.reject)(this._v)
      return
    }
    let ret
    try {
      ret = cb(this._v)
    } catch (e) {
      deferred.reject(e)
      return
    }
    deferred.resolve(ret)
  })
}

function resolve (newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === this) {
      throw new TypeError('A promise cannot be resolved with itself.')
    }

    if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
      const then = newValue.then
      if (typeof then === 'function') {
        doResolve((...args) => {
          then.apply(newValue, args)
        }, (...args) => {
          resolve.apply(this, args)
        }, (...args) => {
          reject.apply(this, args)
        }, (...args) => {
          notify.apply(this, args)
        })
        return
      }
    }

    this._s = true
    this._v = newValue
    finale.call(this)
  } catch (e) {
    reject.call(this, e)
  }
}

function reject (newValue) {
  this._s = false
  this._v = newValue
  finale.call(this)
}

function notify (progress) {
  this._p = progress
  finale.call(this, true)
}

function finale (keep) {
  for (let i = 0, len = this._d.length; i < len; i++) {
    handle.call(this, this._d[i])
  }
  if (!keep) {
    this._d = null
  }
}

function Handler (onFulfilled, onRejected, onProgress, resolve, reject, notify) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.onProgress = typeof onProgress === 'function' ? onProgress : null
  this.resolve = resolve
  this.reject = reject
  this.notify = notify
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve (fn, onFulfilled, onRejected, onProgress) {
  let done = false
  try {
    fn(value => {
      if (done) return
      done = true
      onFulfilled(value)
    }, reason => {
      if (done) return
      done = true
      onRejected(reason)
    }, progress => {
      if (done) return
      onProgress(progress)
    })
  } catch (e) {
    if (done) return
    done = true
    onRejected(e)
  }
}

Nuo.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected)
}

Nuo.prototype['finally'] = function (done) {
  return this.then(value => Nuo.resolve(done()).then(() => {
    return value
  }), reason => Nuo.resolve(done()).then(() => {
    throw reason
  }))
}

Nuo.prototype.progress = function (onProgress) {
  return this.then(null, null, onProgress)
}

Nuo.prototype.then = function (onFulfilled, onRejected, onProgress) {
  return new Nuo((resolve, reject, notify) => {
    handle.call(this, new Handler(onFulfilled, onRejected, onProgress, resolve, reject, notify))
  })
}

Nuo.resolve = value => {
  if (value && typeof value === 'object' && value.constructor === Nuo) {
    return value
  }

  return new Nuo(resolve => resolve(value))
}

Nuo.reject = value => new Nuo((resolve, reject) => reject(value))

Nuo.notify = value => new Nuo((resolve, reject, notify) => notify(value))

Nuo.all = values => {
  return new Nuo((resolve, reject, notify) => {
    if (values.length === 0) return resolve([])
    let remaining = values.length

    function res (i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          const then = val.then
          if (typeof then === 'function') {
            then.call(val, val => {
              res(i, val)
            }, reject, notify)
            return
          }
        }
        values[i] = val
        if (--remaining === 0) {
          resolve(values)
        }
      } catch (e) {
        reject(e)
      }
    }
    for (let i = 0; i < values.length; i++) {
      res(i, values[i])
    }
  })
}

Nuo.race = values => {
  return new Nuo((resolve, reject, notify) => {
    for (let i = 0, len = values.length; i < len; i++) {
      Nuo.resolve(values[i]).then(resolve, reject, notify)
    }
  })
}

export default Nuo

import setImmediate from "core-js/library/fn/set-immediate"
import Handler from "./handler"
import { isFunction, isObject } from "./utils"

class Nuo {
  public static resolve = (value: any) =>
    isNuo(value)
      ? value
      : new Nuo((resolve: resolveFunc) => resolve(value))

  public static reject = (value: any) =>
    new Nuo((
      resolve: resolveFunc,
      reject: rejectFunc) => reject(value))

  public static notify = (value: any) =>
    new Nuo((
      resolve: resolveFunc,
      reject: rejectFunc,
      notify: notifyFunc) => notify(value))

  public static all = (values: any[]) => new Nuo((resolve: resolveFunc, reject: rejectFunc, notify: notifyFunc) => {
    if (values.length === 0) {
      return resolve([])
    }
    let remaining = values.length

    function res(i: number, val: any) {
      try {
        if (val && (isObject(val) || isFunction(val))) {
          const then = val.then
          if (isFunction(then)) {
            then.call(val, (value: any) => {
              res(i, value)
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
    // 各数组项都会被执行到，
    // 即时中途出现被拒绝项。
    for (let i = 0, len = remaining; i < len; i++) {
      res(i, values[i])
    }
  })

  public static race = (values: any[]) => new Nuo((resolve, reject, notify) => {
    // 各数组项都会被执行到，
    // 即时中途出现被拒绝项。
    for (let i = 0, len = values.length; i < len; i++) {
      Nuo.resolve(values[i]).then(resolve, reject, notify)
    }
  })

  public static any = (values: any[]) => new Nuo((
    resolve: resolveFunc,
    reject: rejectFunc,
    notify: notifyFunc) => {
    if (values.length === 0) {
      return reject()
    }
    let remaining = values.length

    function res(i: number, val: any) {
      try {
        if (val && (isObject(val) || isFunction(val))) {
          const then = val.then
          if (isFunction(then)) {
            then.call(val, (value: any) => {
              res(i, value)
            }, reject, notify)
            return
          }
        }
        resolve(val)
      } catch (e) {
        reject(e)
      }
      if (--remaining === 0) {
        reject()
      }
    }
    // 各数组项都会被执行到，
    // 即时中途出现被拒绝项。
    for (let i = 0, len = remaining; i < len; i++) {
      res(i, values[i])
    }
  })

  public state: number
  public value: any
  public sofar: any
  public deferred: Handler[]

  constructor(fn: PromiseFunc) {
    if (!isNuo(this)) {
      throw new TypeError("Promises must be constructed via new")
    }
    if (!isFunction(fn)) {
      throw new TypeError("The first argument must be a function")
    }
    this.state = 0
    this.value = null
    this.sofar = null
    this.deferred = []

    doResolve(
      fn,
      (value: any) => this.resolve(value),
      (reason: any) => this.reject(reason),
      (sofar: any) => this.notify(sofar))
  }

  public catch(onRejected: rejectFunc) {
    return this.then(null, onRejected)
  }

  public finally(done: () => any) {
    return this.then(
      (value: any) => Nuo.resolve(done()).then(() => value),
      (reason: any) => Nuo.resolve(done()).then(() => {
        throw reason
      }))
  }

  public progress(onProgress: notifyFunc) {
    return this.then(null, null, onProgress)
  }

  public then(
    onFulfilled?: resolveFunc,
    onRejected?: rejectFunc,
    onProgress?: notifyFunc,
  ) {
    return new Nuo((
      resolve: resolveFunc,
      reject: rejectFunc,
      notify: notifyFunc) => {
      this.handle(new Handler(
        onFulfilled, onRejected, onProgress,
        resolve, reject, notify,
      ))
    })
  }

  private handle(deferred: Handler) {
    if (this.state === 0) {
      this.deferred.push(deferred)
      if (deferred.onProgress) {
        if (this.sofar !== null) {
          setImmediate(() => {
            deferred.onProgress(this.sofar)
          })
        }
      }
      return
    }

    setImmediate(() => {
      const cb = this.state === 1 ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (this.state === 1 ? deferred.resolve : deferred.reject)(this.value)
      } else {
        try {
          const ret = cb(this.value)
          deferred.resolve(ret)
        } catch (e) {
          deferred.reject(e)
        }
      }
    })
  }

  private finale(keepDeferred?: boolean) {
    for (let i = 0, d = this.deferred, len = d.length; i < len; i++) {
      this.handle(d[i])
    }
    if (!keepDeferred) {
      this.deferred = []
    }
  }

  private resolve(newValue: any) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === this) {
        throw new TypeError("A promise cannot be resolved with itself.")
      }

      if (newValue && (isObject(newValue) || isFunction(newValue))) {
        const then = newValue.then
        if (isFunction(then)) {
          doResolve((
            resolve: resolveFunc,
            reject: rejectFunc,
            notify: notifyFunc) => {
              then.call(newValue, resolve, reject, notify)
            },
            (value: any): any => this.resolve(value),
            (reason: any): any => this.reject(reason),
            (sofar: any): any => this.notify(sofar))
          return
        }
      }

      this.state = 1
      this.value = newValue
      this.finale()
    } catch (e) {
      this.reject(e)
    }
  }

  private reject(newValue: any) {
    this.state = 2
    this.value = newValue
    this.finale()
  }

  private notify(sofar: any) {
    this.sofar = sofar
    this.finale(true)
  }
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(
  fn: PromiseFunc,
  onFulfilled: resolveFunc,
  onRejected: rejectFunc,
  onProgress: notifyFunc,
) {
  let done: boolean = false
  try {
    fn((value: any) => {
      if (done) {
        return
      }
      done = true
      onFulfilled(value)
    }, (reason: any) => {
      if (done) {
        return
      }
      done = true
      onRejected(reason)
    }, (sofar: any) => {
      if (done) {
        return
      }
      onProgress(sofar)
    })
  } catch (e) {
    if (done) {
      return
    }
    done = true
    onRejected(e)
  }
}

function isNuo(val: any): boolean {
  return val instanceof Nuo
}

export default Nuo

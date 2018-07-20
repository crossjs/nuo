// @flow
import { isFunction } from './utils'

export default class Handler {
  onFulfilled: promiseCallback | null
  onRejected: promiseCallback | null
  onProgress: promiseCallback | null
  resolve: promiseExecuter
  reject: promiseExecuter
  notify: promiseExecuter
  constructor (
    onFulfilled: promiseCallback,
    onRejected: promiseCallback,
    onProgress: promiseCallback,
    resolve: promiseExecuter,
    reject: promiseExecuter,
    notify: promiseExecuter,
  ) {
    this.onFulfilled = isFunction(onFulfilled) ? onFulfilled : null
    this.onRejected = isFunction(onRejected) ? onRejected : null
    this.onProgress = isFunction(onProgress) ? onProgress : null
    this.resolve = resolve
    this.reject = reject
    this.notify = notify
  }
}

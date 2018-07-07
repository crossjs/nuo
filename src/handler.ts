import { isFunction } from "./utils"

export type notifyFunc = (sofar?: any) => any
export type PromiseFunc = (
  resolve: resolveFunc,
  reject: rejectFunc,
  notify: notifyFunc) => void

export default class Handler {
  public onFulfilled: resolveFunc | null
  public onRejected: rejectFunc | null
  public onProgress: notifyFunc | null
  public resolve: resolveFunc
  public reject: rejectFunc
  public notify: notifyFunc
  constructor(
    onFulfilled: resolveFunc | null,
    onRejected: rejectFunc | null,
    onProgress: notifyFunc | null,
    resolve: resolveFunc,
    reject: rejectFunc,
    notify: notifyFunc,
  ) {
    this.onFulfilled = isFunction(onFulfilled) ? onFulfilled : null
    this.onRejected = isFunction(onRejected) ? onRejected : null
    this.onProgress = isFunction(onProgress) ? onProgress : null
    this.resolve = resolve
    this.reject = reject
    this.notify = notify
  }
}

import Promise from '../../src'

global.adapter = {
  resolved: Promise.resolve,
  rejected: Promise.reject,
  deferred: () => {
    const obj = {}
    const prom = new Promise((resolve, reject) => {
      obj.resolve = resolve
      obj.reject = reject
    })
    obj.promise = prom
    return obj
  }
}

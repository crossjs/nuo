import tests from 'promises-aplus-tests'
import Promise from '../src'

tests.mocha({
  resolved: Promise.resolve,
  rejected: Promise.rejected,
  deferred: () => {
    const obj = {}
    const prom = new Promise((resolve, reject) => {
      obj.resolve = resolve
      obj.reject = reject
    })
    obj.promise = prom
    return obj
  }
})

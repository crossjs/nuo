import assert from 'better-assert'
import Promise from '../..'

const a = { _id: 'a' }
const b = { _id: 'b' }
const c = { _id: 'c' }

const A = Promise.resolve(a)
const B = Promise.resolve(b)
const C = Promise.resolve(c)

const rejection = { _id: 'rejection' }
const rejected = new Promise((resolve, reject) => reject(rejection))

describe('Promise.race(...)', () => {
  describe('an array', () => {
    describe('that is empty', () => {
      it('returns a promise for an empty array', done => {
        const res = Promise.race([])
        assert(res instanceof Promise)
        res
        .then(() => assert(false))
        .catch(() => assert(false))
        .finally(() => assert(false))
        setTimeout(done, 50)
      })
    })
    describe('of objects', () => {
      it('returns a promise for the array', done => {
        const res = Promise.race([a, b, c])
        assert(res instanceof Promise)
        res.then(res => assert(res._id === a._id)).catch(() => {
          console.log('        ***WARNING***: should NEVER reach here')
          // never reach here
          assert(false)
        }).finally(done)
      })
    })
    describe('of promises', () => {
      it('returns a promise for an array containing the fulfilled values', done => {
        const res = Promise.race([A, B, C])
        assert(res instanceof Promise)
        res.then(res => {
          assert(res._id === a._id)
        }).catch(() => {
          console.log('        ***WARNING***: should NEVER reach here')
          // never reach here
          assert(false)
        }).finally(done)
      })
    })
    describe('of mixed values', () => {
      it('returns a promise for an array containing the fulfilled values', done => {
        const res = Promise.race([A, b, C])
        assert(res instanceof Promise)
        res.then(res => {
          assert(res._id === a._id)
        }).catch(() => {
          console.log('        ***WARNING***: should NEVER reach here')
          // never reach here
          assert(false)
        }).finally(done)
      })
    })
    describe('containing at least one rejected promise', () => {
      it('rejects the resulting promise NOT at top', done => {
        const res = Promise.race([A, rejected, C])
        assert(res instanceof Promise)
        res
        .then(res => assert(res._id === a._id))
        .catch(() => assert(false))
        .finally(done)
      })

      it('rejects the resulting promise at top', done => {
        const res = Promise.race([rejected, B, C])
        assert(res instanceof Promise)
        res
        .then(res => assert(false))
        .catch(res => assert(res._id === rejection._id))
        .finally(done)
      })
    })
    describe('when given a foreign promise', () => {
      it('should provide the correct value of `this`', done => {
        const p = { then (onFulfilled) { onFulfilled({ self: this }) } }
        Promise.race([p]).then(res => assert(p === res.self)).finally(done)
      })
    })
  })
})

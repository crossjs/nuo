import assert from 'better-assert'
import Promise from '../../dist'

const a = { _id: 'a' }
const b = { _id: 'b' }
const c = { _id: 'c' }

const A = Promise.resolve(a)
const B = Promise.resolve(b)
const C = Promise.resolve(c)

const rejection = { _id: 'rejection' }
const rejected = new Promise((resolve, reject) => reject(rejection))

describe('Promise.all(...)', () => {
  describe('an array', () => {
    describe('that is empty', () => {
      it('returns a promise for an empty array', done => {
        const res = Promise.all([])
        assert(res instanceof Promise)
        res.then(res => {
          assert(Array.isArray(res))
          assert(res.length === 0)
        })
        .finally(done)
      })
    })
    describe('of objects', () => {
      it('returns a promise for the array', done => {
        const res = Promise.all([a, b, c])
        assert(res instanceof Promise)
        res.then(res => {
          assert(Array.isArray(res))
          assert(res[0] === a)
          assert(res[1] === b)
          assert(res[2] === c)
        })
        .finally(done)
      })
    })
    describe('of promises', () => {
      it('returns a promise for an array containing the fulfilled values', done => {
        const d = {}
        let resolveD
        const res = Promise.all([new Promise(resolve => {
          resolveD = resolve
        }), A, B, C])
        assert(res instanceof Promise)
        res.then(res => {
          assert(res.length === 4)
          assert(res[0] === d)
          assert(res[1] === a)
          assert(res[2] === b)
          assert(res[3] === c)
        }).catch(() => {
          console.log('        ***WARNING***: should NEVER reach here')
          // never reach here
          assert(false)
        }).finally(done)
        resolveD(d)
        resolveD(d)
      })
    })
    describe('of mixed values', () => {
      it('returns a promise for an array containing the fulfilled values', done => {
        const res = Promise.all([A, b, C])
        assert(res instanceof Promise)
        res.then(res => {
          assert(Array.isArray(res))
          assert(res[0] === a)
          assert(res[1] === b)
          assert(res[2] === c)
        })
        .finally(done)
      })
    })
    describe('containing at least one rejected promise', () => {
      it('rejects the resulting promise', done => {
        const res = Promise.all([A, rejected, C])
        assert(res instanceof Promise)
        res.then(res => {
          throw new Error('Should be rejected')
        },
        err => assert(err === rejection))
        .finally(done)
      })
    })
    describe('containing at least one eventually rejected promise', () => {
      it('rejects the resulting promise', done => {
        let rejectB
        const rejected = new Promise((resolve, reject) => {
          rejectB = reject
        })
        const res = Promise.all([A, rejected, C])
        assert(res instanceof Promise)
        res.then(res => {
          throw new Error('Should be rejected')
        },
        err => assert(err === rejection))
        .finally(done)
        rejectB(rejection)
      })
    })
    describe('when given a foreign promise', () => {
      it('should provide the correct value of `this`', done => {
        const p = { then (onFulfilled) { onFulfilled({ self: this }) } }
        Promise.all([p]).then(res => {
          assert(p === res[0].self)
        }).finally(done)
      })
    })
  })
})

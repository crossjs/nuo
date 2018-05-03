import assert from 'assert'

const a = { _id: 'a' }
const b = { _id: 'b' }
const c = { _id: 'c' }

const A = Promise.resolve(a)
const B = Promise.resolve(b)
const C = Promise.resolve(c)

const rejection = { _id: 'rejection' }
const rejected = Promise.reject(rejection)

describe('Promise.all(...)', () => {
  describe('an array', () => {
    describe('that is empty', () => {
      it('returns a promise for an empty array', () => {
        const res = Promise.all([])
        assert(res instanceof Promise)
        return res.then(res => {
          assert(Array.isArray(res))
          assert(res.length === 0)
        })
      })
    })
    describe('of objects', () => {
      it('returns a promise for the array', () => {
        const res = Promise.all([a, b, c])
        assert(res instanceof Promise)
        return res.then(res => {
          assert(Array.isArray(res))
          assert(res[0] === a)
          assert(res[1] === b)
          assert(res[2] === c)
        })
      })
    })
    describe('of promises', () => {
      it('returns a promise for an array containing the fulfilled values', () => {
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
        }).catch(() => assert(false))
        resolveD(d)
        resolveD(d)
        return res
      })
    })
    describe('of mixed values', () => {
      it('returns a promise for an array containing the fulfilled values', () => {
        const res = Promise.all([A, b, C])
        assert(res instanceof Promise)
        return res.then(res => {
          assert(Array.isArray(res))
          assert(res[0] === a)
          assert(res[1] === b)
          assert(res[2] === c)
        })
      })
    })
    describe('containing at least one rejected promise', () => {
      it('rejects the resulting promise', () => {
        const res = Promise.all([A, rejected, C])
        assert(res instanceof Promise)
        return res.then(res => {
          throw new Error('Should be rejected')
        }, err => assert(err === rejection))
      })
    })
    describe('containing at least one eventually rejected promise', () => {
      it('rejects the resulting promise', () => {
        const rejected = new Promise((resolve, reject) => {
          setImmediate(() => {
            reject(rejection)
          })
        })
        const res = Promise.all([A, rejected, rejected, C])
        assert(res instanceof Promise)
        return res.then(res => {
          throw new Error('Should be rejected')
        }, err => assert(err === rejection))
      })
    })
    describe('when given a foreign promise', () => {
      it('should provide the correct value of `this`', () => {
        const p = { then (onFulfilled) { onFulfilled({ self: this }) } }
        return Promise.all([p]).then(res => assert(p === res[0].self))
      })
    })
  })
})

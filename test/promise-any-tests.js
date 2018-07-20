import assert from 'assert'

const a = { _id: 'a' }
const b = { _id: 'b' }
const c = { _id: 'c' }

const A = Promise.resolve(a)
const B = Promise.resolve(b)
const C = Promise.resolve(c)

const rejection = { _id: 'rejection' }
const rejected = Promise.reject(rejection)

describe('Promise.any(...)', () => {
  describe('an array', () => {
    describe('that is empty', () => {
      it('returns a promise for an empty array', () => {
        const res = Promise.any([])
        assert(res instanceof Promise)
        return res
        .then(() => assert(false))
        .catch(e => assert(e === undefined))
      })
    })
    describe('of objects', () => {
      it('returns a promise for the array', () => {
        const res = Promise.any([a, b, c])
        assert(res instanceof Promise)
        return res
        .then(res => assert(res._id === a._id))
        .catch(e => assert(false))
      })
    })
    describe('of promises', () => {
      it('returns a promise for an array containing the fulfilled values', () => {
        const res = Promise.any([A, B, C])
        assert(res instanceof Promise)
        return res
        .then(res => assert(res._id === a._id))
        .catch(e => assert(false))
      })
    })
    describe('of mixed values', () => {
      it('returns a promise for an array containing the fulfilled values', () => {
        const res = Promise.any([A, b, C])
        assert(res instanceof Promise)
        return res
        // b returns first
        .then(res => assert(res._id === b._id))
        .catch(e => assert(false))
      })
    })
    describe('containing at least one rejected promise', () => {
      it('rejects the resulting promise NOT at top', () => {
        const res = Promise.any([A, rejected, C])
        assert(res instanceof Promise)
        return res
        .then(res => assert(res._id === a._id))
        .catch(e => assert(false))
      })

      it('rejects the resulting promise at top', () => {
        const res = Promise.any([rejected, B, C])
        assert(res instanceof Promise)
        return res
        .then(res => assert(false))
        .catch(e => assert(e._id === 'rejection'))
      })
    })
    describe('when given a foreign promise', () => {
      it('should provide the correct value of `this`', () => {
        const p = { then (onFulfilled) { onFulfilled({ self: this }) } }
        return Promise.any([p]).then(res => assert(p === res.self))
      })
    })
  })
})

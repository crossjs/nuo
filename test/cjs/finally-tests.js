import assert from 'better-assert'
import Promise from '../../dist'

describe('Promise#finally(done)', () => {
  describe('no value is passed in', () => {
    it('does not provide a value to the finally code', done => {
      const promise = Promise.resolve(1)

      promise.finally((...args) => {
        assert(args.length === 0)
        done()
      })
    })

    it('does not provide a reason to the finally code', done => {
      const promise = Promise.reject(new Error())

      promise.finally((...args) => {
        assert(args.length === 0)
        done()
      })
    })
  })

  describe('non-exceptional cases do not affect the result', () => {
    it('preserves the original fulfillment value even if the finally callback returns a value', done => {
      const fulfillmentValue = 1
      const promise = Promise.resolve(fulfillmentValue)

      promise
      .then(value => {
        assert(fulfillmentValue === value)
        return value
      })
      .catch(() => assert(false))
      .finally((...args) => {
        assert(args.length === 0)
        done()
      })
    })

    it('preserves the original rejection reason even if the finally callback returns a value', done => {
      const rejectionReason = new Error()
      const promise = Promise.reject(rejectionReason)

      promise
      .then(() => assert(false))
      .catch(reason => assert(rejectionReason === reason))
      .finally((...args) => {
        assert(args.length === 0)
        done()
      })
    })
  })
})

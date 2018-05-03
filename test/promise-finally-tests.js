import assert from 'assert'

describe('Promise#finally(())', () => {
  describe('no value is passed in', () => {
    it('does not provide a value to the finally code', () => {
      const promise = Promise.resolve(1)

      return promise.finally((...args) => {
        assert(args.length === 0)
      })
    })

    it('does not provide a reason to the finally code', () => {
      const promise = Promise.reject(new Error())

      // should catch rejection
      return promise.catch(e => {}).finally((...args) => {
        assert(args.length === 0)
      })
    })
  })

  describe('non-exceptional cases do not affect the result', () => {
    it('preserves the original fulfillment value even if the finally callback returns a value', () => {
      const fulfillmentValue = 1
      const promise = Promise.resolve(fulfillmentValue)

      return promise
      .then(value => {
        assert(fulfillmentValue === value)
        return value
      })
      .catch(() => assert(false))
      .finally((...args) => {
        assert(args.length === 0)
      })
    })

    it('preserves the original rejection reason even if the finally callback returns a value', () => {
      const rejectionReason = new Error()
      const promise = Promise.reject(rejectionReason)

      return promise
      .then(() => assert(false))
      .catch(reason => assert(rejectionReason === reason))
      .finally((...args) => {
        assert(args.length === 0)
      })
    })
  })
})

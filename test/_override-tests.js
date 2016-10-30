global.Promise = {
  fakePromise: true
}

const assert = require('assert')
require('../src')

describe('Global overridding', () => {
  it('should NOT override global Promise', () => {
    assert(global.Promise.fakePromise === true)
  })
})

global.Promise = {
  fakePromise: true
}

const assert = require('assert')
require('../src')

describe('Override global', () => {
  it('should override global Promise', () => {
    assert(global.Promise.fakePromise === undefined)
    assert(global.Promise.name === 'Nuo')
  })
})

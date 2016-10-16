import assert from 'assert'
import Promise from '../..'

describe('Promise#progress(listener)', () => {
  describe('Promise.notify(progress)', () => {
    it('basic', done => {
      Promise.notify(45)
        .progress(value => {
          assert(value === 45)
          done()
        })
    })
  })
  describe('common use', () => {
    it('basic', done => {
      let times = 0
      new Promise((resolve, reject, notify) => {
        notify(40)
        setTimeout(() => {
          times = 1
          notify(55)
        }, 50)
      }).progress(value => {
        if (times === 0) {
          assert(value === 40)
        } else {
          assert(value === 55)
          done()
        }
      })
    })
    it('with resolve', done => {
      let progress = 0
      new Promise((resolve, reject, notify) => {
        notify((progress = 40))
        resolve(15)
        setTimeout(() => {
          notify((progress = 55))
        }, 50)
      })
      .then(value => assert(value === 15))
      .progress(value => {
        assert(value === progress)
        if (progress === 55) {
          // never reach here
          assert(false)
        }
      })
      .finally(done)
    })
    it('with reject', done => {
      let progress = 0
      new Promise((resolve, reject, notify) => {
        notify((progress = 40))
        reject(15)
        setTimeout(() => {
          notify((progress = 55))
        }, 50)
      })
      .catch(value => assert(value === 15))
      .progress(value => {
        assert(value === progress)
        if (progress === 55) {
          // never reach here
          assert(false)
        }
      })
      setTimeout(done, 100)
    })
  })
})

# 诺（諾）nuò

> :two_hearts: Lightweight ES6 Promise polyfill for the browser and node. Adheres closely to the spec. It is a perfect polyfill IE, Firefox or any other browser that does not support native promises.

[![Travis](https://img.shields.io/travis/crossjs/nuo.svg?style=flat-square)](https://travis-ci.org/crossjs/nuo)
[![Coveralls](https://img.shields.io/coveralls/crossjs/nuo.svg?style=flat-square)](https://coveralls.io/github/crossjs/nuo)
[![dependencies](https://david-dm.org/crossjs/nuo.svg?style=flat-square)](https://david-dm.org/crossjs/nuo)
[![devDependency Status](https://david-dm.org/crossjs/nuo/dev-status.svg?style=flat-square)](https://david-dm.org/crossjs/nuo#info=devDependencies)
[![NPM version](https://img.shields.io/npm/v/nuo.svg?style=flat-square)](https://npmjs.org/package/nuo)

This implementation is based on [taylorhakes/promise-polyfill](https://github.com/taylorhakes/promise-polyfill) and [then/promise](https://github.com/then/promise). It has been changed to use the prototype for performance and memory reasons.

For API information about Promises, please check out this article [HTML5Rocks article](http://www.html5rocks.com/en/tutorials/es6/promises/).

## Changelog

**1.0.0**: global promise does NOT override by default

## Browser Support

IE8+, Chrome, Firefox, IOS 4+, Safari 5+, Opera

## Usage

```bash
$ npm install nuo --save
```

```js
import Promise from 'nuo'

new Promise((resolve, reject, notify) => {
  // resolve, reject, notify
}).then(value => {
  // do something
}).catch(error => {
  // do something
}).progress(value => {
  // do something
}).finally(() => {
  // do something
})
```

**warning: the non-standard progress and finally are NOT recommended to use, though they are working fine.**

## Testing

```bash
npm install
npm test
```

## License

MIT

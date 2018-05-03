module.exports = {
  testRegex: 'test/.*-tests\\.js$',
  setupFiles: ['./adapter.cjs.js'],
  setupTestFrameworkScriptFile: './adapter-patch.js'
}

module.exports = {
  testRegex: 'test/.*-tests\\.js$',
  setupFiles: ['./adapter.es.js'],
  setupTestFrameworkScriptFile: './adapter-patch.js'
}

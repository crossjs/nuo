module.exports = {
  testRegex: 'test/.*-tests\\.js$',
  setupFiles: ['./adapter.js'],
  setupTestFrameworkScriptFile: './adapter-patch.js',
  collectCoverage: process.env.npm_lifecycle_event !== 'dev',
  verbose: process.env.npm_lifecycle_event === 'dev'
}

module.exports = {
  rootDir: '../',
  testRegex: 'test/.*-tests\\.js$',
  setupFiles: ['./test/adapter.js'],
  setupTestFrameworkScriptFile: './test/adapter-patch.js',
  collectCoverage: process.env.npm_lifecycle_event !== 'start',
  collectCoverageFrom: ['**/src/*.js'],
  verbose: process.env.npm_lifecycle_event === 'start'
}

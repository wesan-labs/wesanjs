const defineJestConfig = require("../../../define_jest_config")
module.exports = defineJestConfig({
  testPathIgnorePatterns: ["/node_modules/", "/.medusa/", "/dist/"],
})

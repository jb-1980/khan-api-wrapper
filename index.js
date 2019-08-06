const { KhanOauth, KhanAPIWrapper } = require("./lib/api-base")
const { KhanAPIWrapperV1Mixin } = require("./lib/api-v1")
const { KhanAPIWrapperV2Mixin } = require("./lib/api-v2")
const { KhanAPIWrapperInternalMixin } = require("./lib/api-internal")

// combining all the methods across the different api versions.
class _KhanAPIWrapper extends KhanAPIWrapperInternalMixin(
  KhanAPIWrapperV2Mixin(KhanAPIWrapperV1Mixin(KhanAPIWrapper))
) {}

module.exports = { KhanOauth, KhanAPIWrapper: _KhanAPIWrapper }

const { KhanAPIWrapper } = require("./api-base")

const KhanAPIWrapperInternalMixin = SuperClass =>
  class extends SuperClass {
    /* These are endpoints that go with /api/internal. They are currently
     * undocumented, so any contributions and documentation are welcome.
     */

    async internalUserMissions() {
      ;`Retrieve data about the user missions
        `
      const endpoint = "/api/internal/user/missions"
      return await this.fetchResource(endpoint, true, "GET")
    }
  }

module.exports = {
  KhanAPIWrapperInternalMixin,
  KhanAPIWrapperInternal: KhanAPIWrapperInternalMixin(KhanAPIWrapper),
}

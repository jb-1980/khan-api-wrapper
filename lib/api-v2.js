const { KhanAPIWrapper } = require("./api-base")

const KhanAPIWrapperV2Mixin = SuperClass =>
  class extends SuperClass {
    /* These are endpoints that go with /api/v2. They are currently undocumented,
     * so any contributions and documentation are welcome.
     */

    async v2topictree() {
      ;`Retrieve an object with the following keys:
            articles: [],
            exercises: [],
            missions: [],
            topics: [],
            videos: []
        `
      const endpoint = "/api/v2/topics/topictree"
      return await this.fetchResource(endpoint, false, "GET")
    }
  }

module.exports = {
  KhanAPIWrapperV2Mixin,
  KhanAPIWrapperV2: KhanAPIWrapperV2Mixin(KhanAPIWrapper),
}

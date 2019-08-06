const { KhanAPIWrapper } = require("./api-base")

const KhanAPIWrapperV1Mixin = SuperClass =>
  class extends SuperClass {
    // constructor(consumerKey, consumerSecret, identifier = null, password = null) {
    //   super(consumerKey, consumerSecret, identifier, password)
    // }

    /**
     * This section is the documented api as found at
     * https://api-explorer.khanacademy.org/, without the deprecated endpoints
     *
     **/

    // BADGES
    async badges(identifier = null) {
      const endpoint = "/api/v1/badges"
      const needsAuth = identifier !== null
      return await this.fetchResource(endpoint, needsAuth, "GET", identifier)
    }

    async badgesCategories() {
      const endpoint = "/api/v1/badges/categories"
      return await this.fetchResource(endpoint, false, "GET")
    }

    async badgesCategoriesCategory(categoryId) {
      ;`Retrieve specific badge category identified by <category>.
    :param: categoryId: An integer representing the category:
      '0' for 'meteorite',
      '1' for 'moon',
      '2' for 'earth',
      '3' for 'sun',
      '4' for 'black hole',
      '5' for 'challenge patch'
    `
      const endpoint = `/api/v1/badges/categories/${categoryId}`
      return await this.fetchResource(endpoint, false, "GET")
    }

    // EXERCISES
    async exercises(tags = []) {
      const endpoint = "/api/v1/exercises"
      return await this.fetchResource(endpoint, false, "GET", { tags })
    }

    async exercisesExerciseName(name) {
      const endpoint = `/api/v1/exercises/${name}`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async exercisesExerciseFollowupExercises(name) {
      const endpoint = `/api/v1/exercises/${name}/followup_exercises`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async exercisesExerciseVideos(name) {
      const endpoint = `/api/v1/exercises/${name}/videos`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async exercisesPerseusAutocomplete() {
      const endpoint = "/api/v1/exercises/perseus_autocomplete"
      return await this.fetchResource(endpoint, false, "GET")
    }

    // PLAYLISTS
    async playlistsExercises(topicSlug) {
      const endpoint = `/api/v1/playlists/${topicSlug}/exercises`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async playlistsVideos(topicSlug) {
      const endpoint = `/api/v1/playlists/${topicSlug}/videos`
      return await this.fetchResource(endpoint, false, "GET")
    }

    // TOPIC
    async topic(topicSlug) {
      const endpoint = `/api/v1/topic/${topicSlug}`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async topicExercises(topicSlug) {
      const endpoint = `/api/v1/topic/${topicSlug}/exercises`
      return await this.fetchResource(endpoint, false, "GET")
    }

    async topicVideos(topicSlug) {
      const endpoint = `/api/v1/topic/${topicSlug}/videos`
      return await this.fetchResource(endpoint, false, "GET")
    }

    // TOPICTREE
    async topictree(kind = null) {
      ;`Retrieve full hierarchical listing of our entire library's topic tree.
      :param: kind, string of topic type
          kind=Topic, returns only topics
          kind=Exercise, returns topics and exercises
          kind=Video, returns topics and videos
      `
      const endpoint = "/api/v1/topictree"
      return await this.fetchResource(endpoint, false, "GET", { kind })
    }

    // USER
    async user(identifier = {}) {
      ;`Retrieve data about a user. If no identifier is provided, it will
    return the authenticated user.
    :param: identifier, one of three identifiers:
      username, userid, email
    `
      const endpoint = "/api/v1/user"
      return await this.fetchResource(endpoint, true, "GET", identifier)
    }

    async userExercises(exercises = [], identifier = {}) {
      ;`Retrieve info about a user's interaction with exercises.
      :param: identifier, one of four identifiers: username, userid, email, kaid
      :param: exercises, optional list of exercises to filter. If none is provided,
      all exercises attempted by user will be returned.`
      const endpoint = "/api/v1/user/exercises"
      return await this.fetchResource(endpoint, true, "GET", {
        ...identifier,
        exercises: exercises.join(","),
      })
    }

    async userExercisesName(exercise, identifier = {}) {
      ;`Retrieve info about a user's interaction with exercises.
    :param: identifier, one of four identifiers: username, userid, email, kaid
    :param: exercises, optional list of exercises to filter. If none is provided,
    all exercises attempted by user will be returned.`
      const endpoint = `/api/v1/user/exercises/${exercise}`
      return await this.fetchResource(endpoint, true, "GET", identifier)
    }

    async userExercisesFollowupExercises(exercise, identifier = {}) {
      ;`Retrieve info about all specific exercise listed as a prerequisite to
    <exercise_name>
    :param: exercise, the specific exercise to get info for
    :param: identifier, one of four identifiers: username, userid, email, kaid`
      const endpoint = `/api/v1/user/exercises/${exercise}/followup_exercises`
      return await this.fetchResource(endpoint, true, "GET", identifier)
    }

    async userExercisesLog(
      exercise,
      identifier = {},
      dt_start = null,
      dt_end = null
    ) {
      ;`Retrieve a list of ProblemLog entities for one exercise for one user.`
      const endpoint = `/api/v1/user/exercises/${exercise}/log`
      return await this.fetchResource(endpoint, true, "GET", {
        ...identifier,
        dt_start,
        dt_end,
      })
    }

    async userExercisesProgressChanges(
      dt_start = null,
      dt_end = null,
      identifier = {}
    ) {
      ;`Retrieve a list of ProblemLog entities for one exercise for one user.`
      const endpoint = `/api/v1/user/exercises/progress_changes`
      return await this.fetchResource(endpoint, true, "GET", {
        ...identifier,
        dt_start,
        dt_end,
      })
    }

    async userVideos(dt_start = null, dt_end = null, identifier = {}) {
      ;`Retrieve a list of information about a single video a user has watched:
    the amount of time watched, points received, etc.`
      const endpoint = `/api/v1/user/videos`
      return await this.fetchResource(endpoint, true, "GET", {
        ...identifier,
        dt_start,
        dt_end,
      })
    }

    async userVideosYoutubeid(youtubeid, identifier = {}) {
      ;`Retrieve info about a users interaction with a single video.`

      const endpoint = `/api/v1/user/videos/${youtubeid}`
      return await this.fetchResource(endpoint, true, "GET", identifier)
    }

    async userVideosYoutubeidLog(
      youtubeid,
      dt_start = null,
      dt_end = null,
      identifier = {}
    ) {
      const endpoint = `/api/v1/user/videos/${youtubeid}/log`
      return await this.fetchResource(endpoint, true, "GET", {
        ...identifier,
        dt_start,
        dt_end,
      })
    }

    // VIDEOS
    async videos(videoid) {
      const endpoint = `/api/v1/videos/${videoid}`
      return await this.fetchResource(endpoint)
    }

    async videosExercises(videoid) {
      const endpoint = `/api/v1/videos/${videoid}/exercises`
      return await this.fetchResource(endpoint)
    }
  }

module.exports = {
  KhanAPIWrapperV1Mixin,
  KhanAPIWrapperV1: KhanAPIWrapperV1Mixin(KhanAPIWrapper),
}

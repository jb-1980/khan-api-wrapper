const OAuth = require("oauth-1.0a")
const crypto = require("crypto")
const axios = require("axios")

const BASE_URL = "https://www.khanacademy.org"
const REQUEST_TOKEN_URL = `${BASE_URL}/api/auth2/request_token`
const AUTHORIZE_URL = `${BASE_URL}/api/auth2/authorize`
const ACCESS_TOKEN_URL = `${BASE_URL}/api/auth2/access_token`

class KhanOauth {
  constructor(consumerKey, consumerSecret, identifier = null, password = null) {
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
    this.identifier = identifier
    this.password = password
    this.oauth = OAuth({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function: (baseString, key) =>
        crypto
          .createHmac("sha1", key)
          .update(baseString)
          .digest("base64"),
    })
  }

  async authorize(res, oauth_callback) {
    // STEP 1: Get a request token
    const requestData = {
      url: REQUEST_TOKEN_URL,
      method: "POST",
      data: { oauth_callback },
    }
    const requestTokenString = await axios
      .post(REQUEST_TOKEN_URL, null, {
        params: this.oauth.authorize(requestData),
      })
      .then(res => res.data)
      .catch(err => console.error(err))
    const [oauth_token_secret, oauth_token] = requestTokenString
      .split("&")
      .map(t => t.split("=")[1])

    // STEP 2: Authorize request token with browser
    const params = `oauth_token=${encodeURIComponent(oauth_token)}`
    const url = `${AUTHORIZE_URL}?${params}`

    res.redirect(url)

    // STEP 3: Get an access token will have to be completed once
    // user is redirected to oauth_callback by calling the getAccessTokens
    // method directly with the oauth_token and oauth_token_secret given in
    // the response.
  }

  async authorizeSelf() {
    if (!this.identifier || !this.password) {
      throw new Error(
        "No identifier or password provided when the KhanOauth class was constructed"
      )
    }
    // STEP 1: Get a request token
    const requestData = {
      url: REQUEST_TOKEN_URL,
      method: "POST",
    }
    const requestTokenString = await axios
      .post(REQUEST_TOKEN_URL, null, {
        params: this.oauth.authorize(requestData),
      })
      .then(res => res.data)
      .catch(err => console.error(err))
    const [oauth_token_secret, oauth_token] = requestTokenString
      .split("&")
      .map(t => t.split("=")[1])

    // STEP 2: Authorize request token without browser
    await axios
      .post(AUTHORIZE_URL, null, {
        params: {
          identifier: this.identifier,
          password: this.password,
          oauth_token,
        },
      })
      .then(res => res.data)
      .catch(err => console.error(err))

    // STEP 3: Get an access token
    return await this.getAccessTokens(oauth_token, oauth_token_secret)
  }

  async getAccessTokens(
    oauth_token,
    oauth_token_secret,
    oauth_verifier = null
  ) {
    const accessData = {
      url: ACCESS_TOKEN_URL,
      method: "POST",
    }
    if (oauth_verifier) {
      accessData.data = { oauth_verifier }
    }
    const accessTokenString = await axios
      .post(ACCESS_TOKEN_URL, null, {
        params: this.oauth.authorize(accessData, {
          key: oauth_token,
          secret: oauth_token_secret,
        }),
      })
      .then(res => res.data)
      .catch(err => console.error(err))

    return accessTokenString.split("&").map(t => t.split("=")[1])
  }
}

const KhanAPIWrapper = class {
  constructor(
    consumerKey,
    consumerSecret,
    accessToken = null,
    accessSecret = null
  ) {
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
    this.accessToken = accessToken
    this.accessSecret = accessSecret
    this.oauth = OAuth({
      consumer: {
        key: consumerKey,
        secret: consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function: (baseString, key) =>
        crypto
          .createHmac("sha1", key)
          .update(baseString)
          .digest("base64"),
    })
  }

  async fetchResource(
    endpoint,
    needsAuth = false,
    method = "GET",
    params = null,
    data = {}
  ) {
    const url = `${BASE_URL}${endpoint}`

    let oauth_params
    if (needsAuth) {
      const _params = {
        url,
        method,
      }
      if (params) {
        _params.data = params
      }
      oauth_params = this.oauth.authorize(_params, {
        key: this.accessToken,
        secret: this.accessSecret,
      })
    }

    switch (method) {
      case "GET": {
        const config = { params: needsAuth ? oauth_params : params }
        const res = await axios.get(url, config).then(res => res.data)
        return res
      }

      case "POST": {
        const config = { params: needsAuth ? oauth_params : params }
        const res = await axios.post(url, data, config)
        return res
      }

      default: {
        throw new Error(`${method} is not implemented`)
      }
    }
  }

  /**
   * This section is the documented api as found at
   * https://api-explorer.khanacademy.org/
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
    exercise,
    identifier = {},
    dt_start = null,
    dt_end = null
  ) {
    ;`Retrieve a list of ProblemLog entities for one exercise for one user.`
    const endpoint = `/api/v1/user/exercises/${exercise}/progress_changes`
    return await this.fetchResource(endpoint, true, "GET", {
      ...identifier,
      dt_start,
      dt_end,
    })
  }

  async userVideos(identifier = {}, dt_start = null, dt_end = null) {
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
    identifier = {},
    dt_start = null,
    dt_end = null
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

module.exports = { KhanOauth, KhanAPIWrapper }

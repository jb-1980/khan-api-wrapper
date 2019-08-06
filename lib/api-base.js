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

class KhanAPIWrapper {
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
}

module.exports = { KhanOauth, KhanAPIWrapper }

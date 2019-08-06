require("dotenv").config()
const fs = require("fs")
const { promisify } = require("util")
const readAsync = promisify(fs.readFile)
const writeAsync = promisify(fs.writeFile)
const { KhanAPIWrapper, KhanOauth } = require("../../index")

const {
  KHAN_PASSWORD,
  KHAN_IDENTIFIER,
  KHAN_CONSUMER_SECRET,
  KHAN_CONSUMER_KEY,
  TEST_KHAN_USERNAME,
  TEST_KHAN_KAID,
  TEST_KHAN_USERID,
  TEST_KHAN_EMAIL,
} = process.env

const fetchAccessToken = async () => {
  const kauth = new KhanOauth(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    KHAN_IDENTIFIER,
    KHAN_PASSWORD
  )

  const [token, secret] = await kauth.authorizeSelf()

  return await writeAsync(
    "tokens.json",
    JSON.stringify({
      token,
      secret,
      timestamp: new Date().getTime(),
    }),
    { encoding: "utf8" }
  )
    .then(() => [token, secret])
    .catch(err => {
      throw err
    })
}

// Check if our cached token is valid. If so, return it, otherwise fetch a new one.
const getAccessToken = async () => {
  return await readAsync("tokens.json", { encoding: "utf8" })
    .then(jsonString => JSON.parse(jsonString))
    .then(({ token, secret, timestamp }) => {
      const now = new Date().getTime()
      if (now - timestamp > 24 * 3600 * 1000) {
        return fetchAccessToken()
      }

      return [token, secret]
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        // file not found, which should happen the first time
        return fetchAccessToken()
      }

      throw err
    })
}

test("/api/v2/topics/topictree endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const topics = await kapi.v2topictree()

  expect(typeof topics).toBe("object")
  expect(topics.articles).not.toBe(undefined)
}, 240000)

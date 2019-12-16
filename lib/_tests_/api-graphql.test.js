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
  TEST_KHAN_COURSEID,
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

jest.setTimeout(60000)

test("graphql progressByStudent endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const progressByStudent = await kapi.graphqlProgressByStudent(
    TEST_KHAN_COURSEID
  )

  console.log({ progressByStudent })
  expect(progressByStudent.errors).toBeNull()
  expect(progressByStudent.data).toBeTruthy()
})

require("dotenv").config()
const { KhanOauth } = require("../../index")

const {
  KHAN_PASSWORD,
  KHAN_IDENTIFIER,
  KHAN_CONSUMER_SECRET,
  KHAN_CONSUMER_KEY,
} = process.env

test("fetches tokens for authorize self", async () => {
  const kauth = new KhanOauth(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    KHAN_IDENTIFIER,
    KHAN_PASSWORD
  )
  tokens = await kauth.authorizeSelf()
  expect(tokens.length).toBe(2)
  expect(typeof tokens[0]).toBe("string")
  expect(typeof tokens[1]).toBe("string")
})

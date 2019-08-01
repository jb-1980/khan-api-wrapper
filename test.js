require("dotenv").config()
const fs = require("fs")
const { promisify } = require("util")
const readAsync = promisify(fs.readFile)
const writeAsync = promisify(fs.writeFile)
const { KhanAPIWrapper, KhanOauth } = require("./index")

const {
  KHAN_PASSWORD,
  KHAN_IDENTIFIER,
  KHAN_CONSUMER_SECRET,
  KHAN_CONSUMER_KEY,
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

test("/api/v1/badges endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const badges = await kapi.badges()

  expect(Array.isArray(badges)).toBe(true)
  expect(badges[0].badge_category).not.toBe(undefined)
})

test("/api/v1/badges/categories endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const badgesCategories = await kapi.badgesCategories()

  expect(Array.isArray(badgesCategories)).toBe(true)
  expect(badgesCategories[0].category).not.toBe(undefined)
})

test("/api/v1/badges/categories/<category> endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const badgesCategoriesCategory = await kapi.badgesCategoriesCategory(3)

  expect(Array.isArray(badgesCategoriesCategory)).toBe(true)
  expect(badgesCategoriesCategory[0].category).toBe(3)
})

// TODO: Update when error is fixed on Khan Academy's end.
// See https://github.com/Khan/khan-api/issues/142

// test("/api/v1/exercises endpoint works", async () => {
//   const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
//   const exercises = await kapi.exercises()

//   expect(Array.isArray(exercises)).toBe(true)
//   expect(exercises[0].name).not.toBe(undefined)
// })

test("/api/v1/exercises/<exercise_name> endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const exercisesExerciseName = await kapi.exercisesExerciseName("logarithms_1")

  expect(typeof exercisesExerciseName).toBe("object")
  expect(exercisesExerciseName.name).toBe("logarithms_1")
})

test("/api/v1/exercises/<exercise_name>/followup_exercises endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const exercisesExerciseFollowupExercises = await kapi.exercisesExerciseFollowupExercises(
    "logarithms_1"
  )

  expect(Array.isArray(exercisesExerciseFollowupExercises)).toBe(true)
  expect(exercisesExerciseFollowupExercises[0].name).not.toBe(undefined)
})

test("/api/v1/exercises/<exercise_name>/videos endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const exercisesExerciseVideos = await kapi.exercisesExerciseVideos(
    "addition_1"
  )

  expect(Array.isArray(exercisesExerciseVideos)).toBe(true)
  expect(exercisesExerciseVideos[0].youtube_id).not.toBe(undefined)
})

test("/api/v1/exercises/perseus_autocomplete endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const exercisesPerseusAutocomplete = await kapi.exercisesPerseusAutocomplete(
    "addition_1"
  )

  expect(Array.isArray(exercisesPerseusAutocomplete)).toBe(true)
  expect(exercisesPerseusAutocomplete[0].title).not.toBe(undefined)
})

test("/api/v1/playlists/<path:topic_slug>/exercises endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const playlistsExercises = await kapi.playlistsExercises(
    "pre-algebra-exponents"
  )

  expect(Array.isArray(playlistsExercises)).toBe(true)
  expect(playlistsExercises[0].name).not.toBe(undefined)
})

test("/api/v1/playlists/<path:topic_slug>/videos endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const playlistsVideos = await kapi.playlistsVideos("pre-algebra-exponents")

  expect(Array.isArray(playlistsVideos)).toBe(true)
  expect(playlistsVideos[0].youtube_id).not.toBe(undefined)
})

test("/api/v1/user endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const user = await kapi.user()

  expect(typeof user).toBe("object")
  expect(user.kaid).not.toBe(undefined)
})

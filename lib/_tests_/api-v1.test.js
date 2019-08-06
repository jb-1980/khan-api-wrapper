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

jest.setTimeout(60000)

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

// Update when error is fixed on Khan Academy's end.
// See https://github.com/Khan/khan-api/issues/142

test.skip("/api/v1/exercises endpoint works", async () => {
  const kapi = new KhanAPIWrapper(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)
  const exercises = await kapi.exercises()

  expect(Array.isArray(exercises)).toBe(true)
  expect(exercises[0].name).not.toBe(undefined)
})

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

test.todo("/api/v1/topic endpoint works")

test.todo("/api/v1/topic/<topic_slug> endpoint works")

test.todo("/api/v1/topic/<topic_slug>/exercises endpoint works")

test.todo("/api/v1/topic/<topic_slug>/videos endpoint works")

test.todo("/api/v1/topictree endpoint works")

test.todo("/api/v1/topic endpoint works")

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

test("/api/v1/user?username endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const user = await kapi.user({ username: TEST_KHAN_USERNAME })

  expect(typeof user).toBe("object")
  expect(user.username).toBe(TEST_KHAN_USERNAME)
})

test("/api/v1/user?userid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const user = await kapi.user({ userId: TEST_KHAN_USERID })

  expect(typeof user).toBe("object")
  expect(user.user_id).toBe(TEST_KHAN_USERID)
})

test("/api/v1/user?email endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const user = await kapi.user({ email: TEST_KHAN_EMAIL })

  expect(typeof user).toBe("object")
  expect(user.email).toBe(TEST_KHAN_EMAIL)
})

test("/api/v1/user?kaid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const user = await kapi.user({ kaid: TEST_KHAN_KAID })

  expect(typeof user).toBe("object")
  expect(user.kaid).toBe(TEST_KHAN_KAID)
})

// Getting request failed with status code 401, as this is authorizing and
// working when not querying for all exercises will blame Khan Academy and skip.
test.skip("/api/v1/user/exercises endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercises = await kapi.userExercises()

  expect(Array.isArray(userExercises)).toBe(true)
  expect(userExercises[0].name).not.toBe(undefined)
})

test("/api/v1/user/exercises?exercises endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercises = await kapi.userExercises(["logarithms_1", "addition_1"])
  expect(Array.isArray(userExercises)).toBe(true)

  const logarithms_1 = userExercises.find(e => e.exercise === "logarithms_1")
  const addition_1 = userExercises.find(e => e.exercise === "addition_1")

  expect(logarithms_1).not.toBe(undefined)
  expect(addition_1).not.toBe(undefined)
})

test("/api/v1/user/exercises?username endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  // using with a single exercise to make it run faster
  const userExercises = await kapi.userExercises(["logarithms_1"], {
    username: TEST_KHAN_USERNAME,
  })

  expect(Array.isArray(userExercises)).toBe(true)
  expect(userExercises[0].kaid).toBe(TEST_KHAN_KAID)
})

test("/api/v1/user/exercises?userid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  // using with a single exercise to make it run faster
  const userExercises = await kapi.userExercises(["logarithms_1"], {
    userId: TEST_KHAN_USERID,
  })

  expect(Array.isArray(userExercises)).toBe(true)
  expect(userExercises[0].kaid).toBe(TEST_KHAN_KAID)
})

test("/api/v1/user/exercises?email endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  // using with a single exercise to make it run faster
  const userExercises = await kapi.userExercises(["logarithms_1"], {
    email: TEST_KHAN_EMAIL,
  })

  expect(Array.isArray(userExercises)).toBe(true)
  expect(userExercises[0].kaid).toBe(TEST_KHAN_KAID)
})

test("/api/v1/user/exercises?kaid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  // using with a single exercise to make it run faster
  const userExercises = await kapi.userExercises(["logarithms_1"], {
    kaid: TEST_KHAN_KAID,
  })

  expect(Array.isArray(userExercises)).toBe(true)
  expect(userExercises[0].kaid).toBe(TEST_KHAN_KAID)
})

test("/api/v1/user/exercises/<exercise_name> endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesName = await kapi.userExercisesName("logarithms_1")

  expect(typeof userExercisesName).toBe("object")
  expect(userExercisesName.exercise_model).not.toBe(undefined)
})

test("/api/v1/user/exercises/<exercise_name>?username endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesName = await kapi.userExercisesName("logarithms_1", {
    username: TEST_KHAN_USERNAME,
  })

  expect(typeof userExercisesName).toBe("object")
  expect(userExercisesName.kaid).toBe(TEST_KHAN_KAID)
})
test("/api/v1/user/exercises/<exercise_name>?userid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesName = await kapi.userExercisesName("logarithms_1", {
    userId: TEST_KHAN_USERID,
  })

  expect(typeof userExercisesName).toBe("object")
  expect(userExercisesName.kaid).toBe(TEST_KHAN_KAID)
})
test("/api/v1/user/exercises/<exercise_name>?email endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesName = await kapi.userExercisesName("logarithms_1", {
    email: TEST_KHAN_EMAIL,
  })

  expect(typeof userExercisesName).toBe("object")
  expect(userExercisesName.kaid).toBe(TEST_KHAN_KAID)
})
test("/api/v1/user/exercises/<exercise_name>?kaid endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesName = await kapi.userExercisesName("logarithms_1", {
    kaid: TEST_KHAN_KAID,
  })

  expect(typeof userExercisesName).toBe("object")
  expect(userExercisesName.kaid).toBe(TEST_KHAN_KAID)
})

test("/api/v1/user/exercises/<exercise_name>/followup_exercises endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const userExercisesFollowupExercises = await kapi.userExercisesFollowupExercises(
    "logarithms_1"
  )

  expect(Array.isArray(userExercisesFollowupExercises)).toBe(true)
  expect(userExercisesFollowupExercises[0].exercise_model).not.toBe(undefined)
})
test.todo(
  "/api/v1/user/exercises/<exercise_name>/followup_exercises?username endpoint works"
)
test.todo(
  "/api/v1/user/exercises/<exercise_name>/followup_exercises?userid endpoint works"
)
test.todo(
  "/api/v1/user/exercises/<exercise_name>/followup_exercises?email endpoint works"
)
test.todo(
  "/api/v1/user/exercises/<exercise_name>/followup_exercises?kaid endpoint works"
)

test("/api/v1/user/exercises/<exercise_name>/log endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const dt_start = "1970-01-01T00:00:00Z"
  const dt_end = new Date().toISOString()

  const userExercisesLog = await kapi.userExercisesLog(
    "logarithms_1",
    null,
    dt_start,
    dt_end
  )

  expect(Array.isArray(userExercisesLog)).toBe(true)
  // This test could break if the user has not done logarithms_1
  expect(userExercisesLog[0].exercise).toBe("logarithms_1")
})

test.todo("/api/v1/user/exercises/<exercise_name>/log?username endpoint works")
test.todo("/api/v1/user/exercises/<exercise_name>/log?userid endpoint works")
test.todo("/api/v1/user/exercises/<exercise_name>/log?email endpoint works")
test.todo("/api/v1/user/exercises/<exercise_name>/log?kaid endpoint works")

test("/api/v1/user/exercises/progress_changes endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const dt_start = "1970-01-01T00:00:00Z"
  const dt_end = new Date().toISOString()

  const userExercisesProgressChanges = await kapi.userExercisesProgressChanges(
    dt_start,
    dt_end
  )

  expect(Array.isArray(userExercisesProgressChanges)).toBe(true)
  expect(userExercisesProgressChanges[0].exercise_name).not.toBe(undefined)
})

test("/api/v1/user/videos endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const dt_start = "1970-01-01T00:00:00Z"
  const dt_end = new Date().toISOString()

  const userVideos = await kapi.userVideos(dt_start, dt_end)

  expect(Array.isArray(userVideos)).toBe(true)
  expect(userVideos[0].kind).toBe("UserVideo")
})

test("/api/v1/user/videos/<youtube_id> endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  const userVideosYoutubeid = await kapi.userVideosYoutubeid("3Xcae0OGavk")

  expect(typeof userVideosYoutubeid).toBe("object")
  expect(userVideosYoutubeid.kind).toBe("UserVideo")
})

test("/api/v1/user/videos/<youtube_id>/log endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )
  const dt_start = "1970-01-01T00:00:00Z"
  const dt_end = new Date().toISOString()

  const userVideosYoutubeidLog = await kapi.userVideosYoutubeidLog(
    "fsTD_jqseBA",
    dt_start,
    dt_end
  )

  expect(Array.isArray(userVideosYoutubeidLog)).toBe(true)
  // This could break if user has not watched video "Intro to addition"
  expect(userVideosYoutubeidLog[0].kind).toBe("VideoLog")
})

test("/api/v1/videos/<video_id> endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  const videos = await kapi.videos("addition-introduction")

  expect(typeof videos).toBe("object")
  expect(videos.readable_id).toBe("addition-introduction")
})

test("/api/v1/videos/<video_id>/exercises endpoint works", async () => {
  const [token, secret] = await getAccessToken()
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  const videosExercises = await kapi.videosExercises("addition-introduction")

  expect(Array.isArray(videosExercises)).toBe(true)
})

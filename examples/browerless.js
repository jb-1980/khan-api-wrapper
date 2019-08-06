const fs = require("fs")
const { promisify } = require("util")
const writeAsync = promisify(fs.writeFile)
const { KhanOauth, KhanAPIWrapper } = require("khan-api-wrapper")

// Config variables. Fill these in with the correct data to make the example work.
const KHAN_PASSWORD = "password_of_account_used_to_register_app"
const KHAN_IDENTIFIER = "username_of_account_used_to_register_app"
const KHAN_CONSUMER_SECRET = "Secret from registering app"
const KHAN_CONSUMER_KEY = "Key from registering app"
const TEST_USERNAME = "username of your student"

// Instantiate the oauth class that will be used to get the authentication tokens
const kauth = new KhanOauth(
  KHAN_CONSUMER_KEY,
  KHAN_CONSUMER_SECRET,
  KHAN_IDENTIFIER,
  KHAN_PASSWORD
)

// First get tokens that can be used to access protected data
kauth.authorizeSelf().then(async ([token, secret]) => {
  // With fresh tokens, we now instantiate the wrapper
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  // Get user exercise data for one of my students
  const exerciseData = await kapi.userExercisesName("addition_1", {
    username: TEST_USERNAME,
  })

  const grades = {
    practiced: 70,
    mastery1: 80,
    mastery2: 90,
    mastery3: 100,
  }

  const masteryLevel = exerciseData.maximum_exercise_progress.level

  await syncGradeToGradebook({
    username: TEST_USERNAME,
    skill: "addition_1",
    grade: grades[masteryLevel],
  })
})

// A simple example that creates a gradebook file. In production you probably
// have another API that can be called to sync the grades into your LMS gradebook.
const syncGradeToGradebook = async gradeObj =>
  await writeAsync("grades.json", JSON.stringify(gradeObj), {
    encoding: "utf8",
  }).catch(err => {
    throw err
  })

const express = require("express")
const session = require("express-session") // we will store the tokens in a session
const { KhanOauth, KhanAPIWrapper } = require("khan-api-wrapper")

// Config variables. Fill these in with the correct data to make the example work.
const KHAN_CONSUMER_SECRET = "Secret from registering app"
const KHAN_CONSUMER_KEY = "Key from registering app"

// Set up the express app
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
  session({
    secret: "change me for production use",
    resave: false,
    saveUninitialized: false,
  })
)

const kauth = new KhanOauth(KHAN_CONSUMER_KEY, KHAN_CONSUMER_SECRET)

app.get("/", async (req, res) => {
  // When first accessing the page, we will check for tokens to determine if
  // user needs to login
  if (!req.session.tokens) {
    res.redirect("/login")
  } else {
    const [token, secret] = req.session.tokens
    const kapi = new KhanAPIWrapper(
      KHAN_CONSUMER_KEY,
      KHAN_CONSUMER_SECRET,
      token,
      secret
    )
    const user = await kapi.user()
    res.send(`<!doctype html>
    <head></head>
    <body>
        <h1>Welcome ${user.nickname}</h1>
        <h3>Checkout your protected user data from Khan Academy:</h3>
        <pre style="background: #ddd;">
${JSON.stringify(user, null, 2)}
        </pre>
    </body>
  `)
  }
})

app.get("/login", (req, res) => {
  // Note that this callbackUrl corresponds to a route that will be defined
  // later, and that will handle setting the fresh tokens into the session

  const callBackUrl = `${req.protocol}://${req.get("host")}/authenticate_khan`
  kauth.authorize(res, callBackUrl)
})

app.get("/authenticate_khan", async (req, res) => {
  // This is the route that Khan Academy will return to after the user
  // has given permission in the browser. It is the callbackUrl defined in the
  // login route.
  const { oauth_token_secret, oauth_verifier, oauth_token } = req.query

  const [token, secret] = await kauth.getAccessTokens(
    oauth_token,
    oauth_token_secret,
    oauth_verifier
  )

  req.session.tokens = [token, secret]

  res.redirect("/")
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`🚀  Server ready at ${port}`))

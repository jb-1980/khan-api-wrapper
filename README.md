# khan-api-wrapper
A simple wrapper around the Khan Academy API for use in node


------------------------------------------------

## About
This is a simple implementation of using the Khan Academy API with node. If you 
are only interested in viewing your personal or students' data, you can use it without a browser by calling the `authorizeSelf` method. This will use the alternative method
of logging in with your own account. This also supports browser based authentication
for use with a node server like [Express](https://expressjs.com/).

#### Dependencies
* `axios` to handle http requests
* `oauth-1.0a` to create the oauth params and signature

#### Set up:

Install:

```
$ yarn add khan-api-wrapper
```

or 

```
$ npm install khan-api-wrapper
```


[Register your app with Khan Academy](https://www.khanacademy.org/api-apps/register), to get the necessary tokens. That is it, you should now be able to use the wrapper in your node application.

#### General use:
Without a browser:

```javascript

const { KhanOauth, KhanAPIWrapper } = requires("khan-api-wrapper")

// Config variables
const KHAN_PASSWORD = "password_of_account_used_to_register_app"
const KHAN_IDENTIFIER = "username_of_account_used_to_register_app"
const KHAN_CONSUMER_SECRET = "Secret from registering app"
const KHAN_CONSUMER_KEY = "Key from registering app"

// Instantiate the oauth class that will be used to get the authentication tokens
const kauth = new KhanOauth(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    KHAN_IDENTIFIER,
    KHAN_PASSWORD
)

// First get tokens that can be used to access protected data
kauth.authorizeSelf()
.then(async ([token, secret]) => {
  // With fresh tokens, we now instantiate the wrapper
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  // Use a convenience method to fetch the user. Check out the details in
  // "./lib/api-v1.js"
  const user = await kapi.user()
  console.log(user) // should see your user metadata

  // Use an undocumented endpoint
  const missionUrl = "/api/internal/user/missions"
  const missions = await kapi.fetchResource(missionUrl, true)
  console.log(missions) // should show your missions
})
```

The available helper methods can be found in `./lib/api-v1.js` and `./lib/api-v2.js`.

Checkout the `examples` folder for ideas on how to use in your application.

#### Token freshness:

Through trial I have discovered that the access token and secret are valid for 2 weeks. So you may consider storing them in a separate file or database, and write a function to only fetch tokens if they are expired.

```javascript
const fs = require("fs")
const { promisify } = require("util")
const readAsync = promisify(fs.readFile)
const writeAsync = promisify(fs.writeFile)

const getFreshTokens = async () => {
  const kauth = new KhanOauth(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    KHAN_IDENTIFIER,
    KHAN_PASSWORD
  )

  // get fresh tokens from Khan Academy.
  const [token, secret] = await kauth.authorizeSelf()

  // Save those tokens to the disk, and return them
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

const getAccessTokens = async () => {
  // Fetch token data from saved json file
  return await readAsync("tokens.json", { encoding: "utf8" })
    .then(jsonString => JSON.parse(jsonString))
    .then(({ token, secret, timestamp }) => {
      // Check if tokens are expired
      const now = new Date().getTime()
      if (now - timestamp > 14 * 24 * 3600 * 1000) {
        return getFreshTokens()
      }

      // Otherwise just return valid tokens from disk
      return [token, secret]
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        // file not found, which should happen the first time
        return getFreshTokens()
      }

      throw err
    })
}

// Then use the function to ensure we only use fresh tokens when necessary
getAccessTokens()
.then(([token, secret]) => {
  const kapi = new KhanAPIWrapper(
    KHAN_CONSUMER_KEY,
    KHAN_CONSUMER_SECRET,
    token,
    secret
  )

  ...
})
```
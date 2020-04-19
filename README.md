# streamlabs-donation-announcer

Announces in chat through Nightbot when you receive a donation via StreamLabs.

## Requirements

- Install the dependencies with `npm` or `yarn`.
- Copy `.env.schema` into `.env` and fill in the values.
  - You will need to find your [Streamlabs socket API token](https://streamlabs.com/dashboard#/settings/api-settings).
  - You will need to create a new [Nightbot app](https://nightbot.tv/account/applications) with `https://nightbot.tv/` in its 'Redirect URIs'.

**Note:** This process is designed to be long-running: We implement an OAuth2 token refresh mechanism for Nightbot
so that the process can run for more than 30 days, and the Streamlabs socket API token is non-expiring.

## Usage

1. Run the script
2. Visit the given URL (You have to do this every time, unfortunately.)
3. Grab the value of the `code` parameter out of the redirected URL, and paste it into the input prompt.

```
$ node index.js
To authenticate with Nightbot, visit the following URL:
https://api.nightbot.tv/oauth2/authorize?...

Authorization code (see redirected URL): [code]
Connected and running...
```

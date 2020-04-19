const axios = require("axios");
const qs = require("qs");

const { NIGHTBOT_CLIENT_ID, NIGHTBOT_CLIENT_SECRET } = process.env;
const REDIRECT_URI = "https://nightbot.tv/";
const NIGHTBOT_MESSAGE_COOLDOWN = 5250;

class NightbotConnection {
  constructor(accessToken, refreshToken, tokenType) {
    if (tokenType !== "bearer") {
      throw new Error("I don't know how to deal with a non-Bearer type token! Token type: " + token_type);
    }

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    this.messageQueue = [];
    this.processingQueue = false;
  }

  async say(message) {
    this.messageQueue.push(message);

    if (!this.processingQueue) {
      this.processingQueue = true;

      // Quick-and-dirty awaitable sleep function using setTimeout()
      const sleep = (duration) =>
        new Promise((resolve, reject) =>
          setTimeout(resolve, duration));

      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();

        await axios.post("https://api.nightbot.tv/1/channel/send", qs.stringify({ message }), {
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
          }
        });

        await sleep(NIGHTBOT_MESSAGE_COOLDOWN);
      }

      this.processingQueue = false;
    }
  }

  refreshAfter(expiresIn) {
    const duration = parseInt(expiresIn) * 1000 / 2;

    setTimeout(() => {
      this.refresh().catch(console.error)
    }, duration)
  }

  async refresh() {
    const response = await axios.post("https://api.nightbot.tv/oauth2/token",
      qs.stringify({
        client_id: NIGHTBOT_CLIENT_ID,
        client_secret: NIGHTBOT_CLIENT_SECRET,
        grant_type: "refresh_token",
        redirect_uri: REDIRECT_URI,
        refresh_token: this.refreshToken
      }, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
      }
    ));

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;

    this.refreshAfter(response.data.expires_in);
  }
}

const fetchNightbotCode = async () => {
  const nightbotAuthURL = "https://api.nightbot.tv/oauth2/authorize?" + qs.stringify({
    response_type: "code",
    client_id: NIGHTBOT_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "channel_send"
  });

  console.log(`To authenticate with Nightbot, visit the following URL:\n${nightbotAuthURL}\n`);

  const code = await new Promise((resolve, reject) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Authorization code (see redirected URL): ", (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  return code;
}

const performInitialAuthentication = async (code) => {
  const response = await axios.post("https://api.nightbot.tv/oauth2/token",
    qs.stringify({
      client_id: NIGHTBOT_CLIENT_ID,
      client_secret: NIGHTBOT_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      }
    }
  ));

  const { access_token, expires_in, refresh_token, token_type } = response.data;
  return { access_token, expires_in, refresh_token, token_type };
}

const connectNightbot = async () => {
  const code = await fetchNightbotCode();
  const authentication = await performInitialAuthentication(code);

  const nightbot = new NightbotConnection(
    authentication.access_token,
    authentication.refresh_token,
    authentication.token_type
  );

  nightbot.refreshAfter(authentication.expires_in);

  return nightbot;
}

module.exports = connectNightbot;

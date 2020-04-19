const axios = require("axios");
const qs = require("qs");

require("dotenv/config");
const { STREAMLABS_SOCKET_API_TOKEN, NIGHTBOT_CLIENT_ID, NIGHTBOT_CLIENT_SECRET } = process.env;
const REDIRECT_URI = "https://nightbot.tv/";


const main = async () => {
  const [socket, sayAsNightbot] = await Promise.all([connectStreamlabs(), connectNightbot()]);

  console.log("Connected and running...");

  socket.on("event", async data => {
    console.log(JSON.stringify(data));

    if (data.type === "donation") {
      const donations = data.message;
      for (const donation of donations) {
        const { name, formatted_amount, message, from } = donation;
        await sayAsNightbot(`${name} just donated ${formatted_amount}! ${message}`)
      }
    }
  });
}

const connectStreamlabs = async () => {
  const io = require("socket.io-client");

  return io("https://sockets.streamlabs.com/?token=" + STREAMLABS_SOCKET_API_TOKEN, {
    "transports": [ "websocket" ]
  });
}

const connectNightbot = async () => {
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

  const { access_token, refresh_token, token_type, expires_in } = response.data;
  if (token_type !== "bearer") {
    throw new Error("I don't know how to deal with a non-Bearer type token! Token type: " + token_type);
  }
  
  const nightbotState = { access_token };
  nightbotRefresh(nightbotState, refresh_token, expires_in);
  
  return async (message) => {
    return await axios.post("https://api.nightbot.tv/1/channel/send", qs.stringify({ message }), {
      headers: {
        "Authorization": `Bearer ${nightbotState.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      }
    });
  }
}

const nightbotRefresh = (state, refresh_token, expiresIn) => {
  const duration = parseInt(expiresIn) * 1000 / 2;

  setTimeout(async () => {
    const response = await axios.post("https://api.nightbot.tv/oauth2/token",
      qs.stringify({
        client_id: NIGHTBOT_CLIENT_ID,
        client_secret: NIGHTBOT_CLIENT_SECRET,
        grant_type: "refresh_token",
        redirect_uri: REDIRECT_URI,
        refresh_token
      }, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
      }
    ));

    state[access_token] = response.data.access_token;
    nightbotRefresh(state, response.data.refresh_token, response.data.expires_in);
  }, duration);
}

main().catch(console.error);

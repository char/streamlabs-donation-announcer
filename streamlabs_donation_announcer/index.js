require("dotenv/config");

const connectStreamlabs = require("./streamlabs.js");
const connectNightbot = require("./nightbot.js");

const main = async () => {
  const [socket, nightbot] = await Promise.all([connectStreamlabs(), connectNightbot()]);

  console.log("Connected and running...");

  socket.on("event", async data => {
    console.log(JSON.stringify(data));

    if (data.type === "donation") {
      const donations = data.message;
      for (const donation of donations) {
        const { name, formatted_amount, message, from } = donation;
        await nightbot.say(`${name} just donated ${formatted_amount}! ${message}`);
      }
    }
  });
}

module.exports = main

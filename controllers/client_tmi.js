const credentials = require("../environment.js");
const tmi = require("tmi.js");


const client = new tmi.Client({
    identity: {
      username: credentials.username,
      password: "oauth:" + credentials.password,
    },
    connection: {
      secure: true,
      reconnect: true,
    },
    options: { debug: true },
    channels: ["afor_digital"],
  });
  

module.exports = client;
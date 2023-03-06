const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const fs = require("fs");

const client = require("./client_tmi.js");
client.connect();

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/");
});

server.listen(3000, () => {
  console.log("Servidor web iniciado en http://localhost:3000");
});

client.on("message", (channel, tags, message, self) => {
  const [command, ...parameters] = getCommand(message);
  const data = {channel, tags, message, self, command, parameters};
  console.log(command)

  if(command){
      lauchEvent(data);
  }
});

function getCommand(message) {
  if (!message.startsWith("!")) {
    return [];
  }
  return message.trim().replace("!","").toLowerCase().split(" ");
}

function lauchEvent(data){
    const eventObject = {
        buscaramigos: buscaramigos,
        aceptaramigo: aceptaramigo,
        denegaramigo: denegaramigo,
        proponeramistad: proponeramistad,
    }
    eventObject[data.command] ? eventObject[data.command](data) : console.log("No existe el evento");
}

function buscaramigos(data){
    client.say(data.channel, "Hola, soy un bot de prueba")
}

function aceptaramigo(data){
    console.log(data)
}

function denegaramigo(data){
    console.log(data)
}

function proponeramistad(data){
    console.log(data)
}




function saveFriendListInAFile(){
    let data = JSON.stringify(leaderBoard);
    fs.writeFileSync('friend.json', data);
  }
  
  function loadFriendlistFromAFile(){
    let rawdata = fs.readFileSync('friend.json');
    let data = JSON.parse(rawdata);
    leaderBoard = data;
    setInterval(() => {
      io.emit("leaderboard", leaderBoard);
    }, 5000);
  }
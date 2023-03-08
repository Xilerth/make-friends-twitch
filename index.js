const express = require("express");
const https = require("https");
const app = express();
//cors
const cors = require("cors");
app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const fs = require("fs");

const client = require("./controllers/client_tmi.js");
const PEOPLE_STATUS = require("./controllers/people_status.js");
const environment = require("./environment.js");
client.connect();

let peopleData = {
  xilerth: {
    status: PEOPLE_STATUS.BUSCANDO,
    pending: [],
    accepted: [],
    denied: [],
    requested: [],
  },
};

let statusGame = "stoped";
let masterStop = false;

server.listen(3001, () => {
  console.log("Servidor web iniciado en http://localhost:3001");
});

io.of("/").on("connection", (socket) => {
  console.log("Usuario conectado");
  io.emit("peopleData", peopleData);

  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });

  socket.on("message", (data) => {
    console.log(data);
    io.of("/").emit("message", { msg: "hi" });
  });
});

loadFriendlistFromAFile();

client.on("message", (channel, tags, message, self) => {
  if (masterStop) {
    return;
  }

  const [command, ...parameters] = getCommand(message);
  const data = { channel, tags, message, self, command, parameters };
  console.log(command);

  if (command === "fdeletefromsinwhere") {
    masterStop = true;
    client.say(
      data.channel,
      `El juego ha sido detenido por el master, no se puede continuar, agradecemos el tiempo que has pasado jugando con nosotros, hasta la proxima!`
    );
    return;
  }

  if (command === "fstartgame") {
    startGame(data);
  }

  if (command && statusGame === "started") {
    lauchEvent(data);
  }
});

function getCommand(message) {
  if (!message.startsWith("!")) {
    return [];
  }
  return message.trim().replace("!", "").toLowerCase().split(" ");
}

const events = {
  fconsultaramistad: consultaramistad,
  fconsultarestado: consultarestado,
  fcancelarbusqueda: cancelarbusqueda,
  fbuscaramistad: buscaramistad,
  faceptaramistad: aceptaramistad,
  fdenegaramistad: denegaramistad,
  fproponeramistad: proponeramistad,
  fhelp: help,
  fstopgame: stopGame,
};

function help(data) {
  client.say(
    data.channel,
    `Comandos disponibles: !fconsultaramistad, !fconsultarestado, !fcancelarbusqueda, !fbuscaramistad, !faceptaramistad, !fdenegaramistad, !fproponeramistad, !fhelp`
  );
}

function lauchEvent(data) {
  events[data.command]
    ? events[data.command](data)
    : console.log("No existe el evento");
}

function consultaramistad(data) {
  if (!data?.tags?.username) {
    return;
  }

  if (!peopleData[data.tags.username]) {
    client.say(
      data.channel,
      `${data.tags.username} No estas registrado, para la busqueda de amigos usa !buscaramistad`
    );
    return;
  }

  client.say(
    data.channel,
    `/me ${data.tags.username}; Solicitudes recibidas: ${
      peopleData[data.tags.username].pending.join(",") ||
      "sin solicitudes de amistad"
    }; Aceptados: ${
      peopleData[data.tags.username].accepted.join(",") || "sin amigos"
    }; Denegados: ${
      peopleData[data.tags.username].denied.join(",") || "sin denegados"
    }; Solicitudes enviadas: ${
      peopleData[data.tags.username].requested.join(",") ||
      "sin solicitudes enviadas"
    }`
  );
}

function consultarestado(data) {
  console.log(data);
  if (!data?.tags?.username) {
    return;
  }

  if (!peopleData[data.tags.username]) {
    client.say(
      data.channel,
      `${data.tags.username} No estas registrado, para la busqueda de amigos usa !fbuscaramistad`
    );
    return;
  }

  client.say(
    data.channel,
    `${data.tags.username} ahora mismo estas ${
      peopleData[data.tags.username]?.status
    }`
  );
}

function cancelarbusqueda(data) {
  if (!data?.tags?.username) {
    return;
  }

  if (!peopleData[data.tags.username]) {
    client.say(
      data.channel,
      `${data.tags.username} No estas registrado, para la busqueda de amigos usa !fbuscaramistad`
    );
    return;
  }

  peopleData[data.tags.username].status = PEOPLE_STATUS.CONFORME;
  saveFriendListInAFile();
  io.emit("peopleData", peopleData);
  client.say(data.channel, `${data.tags.username} ha dejado de buscar amigos`);
}

async function buscaramistad(data) {
  if (!data?.tags?.username) {
    return;
  }

  if (!peopleData[data.tags.username]) {
    peopleData[data.tags.username] = await generateDefaultData(data);
  }

  console.log(peopleData[data.tags.username]);
  if (peopleData[data.tags.username].status !== PEOPLE_STATUS.BUSCANDO) {
    peopleData[data.tags.username].status = PEOPLE_STATUS.BUSCANDO;
    io.emit("joinFindFriendship", {
      ...peopleData[data.tags.username],
      username: data.tags.username,
    });
  }
  console.log("1", peopleData[data.tags.username]);
  saveFriendListInAFile();
  io.emit("peopleData", peopleData);
  client.say(data.channel, `${data.tags.username} esta buscando amigos`);
}

function aceptaramistad(data) {
  if (
    !data?.tags?.username ||
    data?.parameters?.length === 0 ||
    !peopleData[data.tags.username]
  ) {
    return;
  }

  const user = data.parameters[0];
  const userIndex = peopleData[data.tags.username].pending.indexOf(user);
  if (userIndex === -1) {
    return;
  }

  if (peopleData[user].accepted.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "Ya sois amigos");
    return;
  }
  if (peopleData[user].pending.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "Ya le has enviado una solicitud");
    return;
  }

  if (peopleData[user].denied.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "No quiere tu amistad BibleThump");
    return;
  }

  peopleData[data.tags.username].pending.splice(userIndex, 1);
  peopleData[data.tags.username].accepted.push(user);

  peopleData[user].requested.splice(
    peopleData[user].requested.indexOf(data.tags.username),
    1
  );
  peopleData[user].accepted.push(data.tags.username);

  saveFriendListInAFile();
  const dataToEmit = {
    ...peopleData[data.tags.username],
    accepted: user,
    accepter: data.tags.username,
  };
  io.emit("newAcceptFriend", dataToEmit);
  io.emit("peopleData", peopleData);
  client.say(data.channel, `${data.tags.username} y ${user} sois amigos ahora`);
}

function denegaramistad(data) {
  if (
    !data?.tags?.username ||
    data?.parameters?.length === 0 ||
    !peopleData[data.tags.username]
  ) {
    return;
  }

  const user = data.parameters[0];
  const userIndex = peopleData[data.tags.username].pending.indexOf(user);
  console.log(peopleData[data.tags.username].pending.indexOf(user));
  if (userIndex === -1) {
    return;
  }
  console.log(data);

  if (peopleData[user].accepted.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "Ya sois amigos");
    return;
  }
  if (peopleData[user].pending.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "Ya le has enviado una solicitud");
    return;
  }

  if (peopleData[user].denied.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, "No quiere tu amistad BibleThump");
    return;
  }

  console.log(data);

  peopleData[data.tags.username].pending.splice(userIndex, 1);
  peopleData[data.tags.username].denied.push(user);

  peopleData[user].requested.splice(
    peopleData[user].requested.indexOf(data.tags.username),
    1
  );
  peopleData[user].denied.push(data.tags.username);

  saveFriendListInAFile();
  const dataToEmit = {
    ...peopleData[data.tags.username],
    denied: user,
    denier: data.tags.username,
  };
  io.emit("newDenyFriend", dataToEmit);

  io.emit("peopleData", peopleData);

  client.say(
    data.channel,
    `${data.tags.username} ha denegado la amistad a ${user} BibleThump`
  );
}

async function proponeramistad(data) {
  if (
    !data?.tags?.username ||
    data?.parameters?.length === 0 ||
    data.tags.username === data.parameters[0]
  ) {
    return;
  }
  console.log(data.parameters[0]);
  const user = data.parameters[0];
  if (!peopleData[user]) {
    client.say(data.channel, `${user} no esta buscando amigos BibleThump`);
    return;
  }

  if (peopleData[user].status === PEOPLE_STATUS.CONFORME) {
    client.say(data.channel, `${user} ya tiene muchos amigos BibleThump`);
    return;
  }

  if (peopleData[user].accepted.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, `${user} y tu, ya sois amigos SUBprise`);
    return;
  }
  if (peopleData[user].pending.indexOf(data.tags.username) !== -1) {
    client.say(
      data.channel,
      `Ya le has enviado una solicitud a ${user}, espera su respuesta`
    );
    return;
  }

  if (peopleData[user].denied.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, `${user} no quiere tu amistad BibleThump`);
    return;
  }

  if (peopleData[user].requested.indexOf(data.tags.username) !== -1) {
    client.say(data.channel, `Ya le has enviado una solicitud a ${user}`);
    return;
  }

  console.log(peopleData);
  console.log(!peopleData[data.tags.username]);
  if (!peopleData[data.tags.username]) {
    peopleData[data.tags.username] = await generateDefaultData(data);
    peopleData[data.tags.username].status = PEOPLE_STATUS.CONFORME;
  }

  peopleData[data.tags.username].requested.push(user);
  peopleData[user].pending.push(data.tags.username);

  saveFriendListInAFile();

  const dataToEmit = {
    ...peopleData[data.tags.username],
    requested: user,
    requester: data.tags.username,
  };
  console.log(dataToEmit);
  io.emit("newFriendRequest", dataToEmit);

  io.emit("peopleData", peopleData);

  client.say(
    data.channel,
    `${data.tags.username} ha enviado una solicitud de amistad a ${user}`
  );
}

async function generateDefaultData(data) {
  const user = new Promise(function (resolve, reject) {
    options = {
      protocol: "https:",
      hostname: "api.twitch.tv",
      path: "/helix/users?id=" + data.tags["user-id"],
      headers: {
        Authorization: environment.authorization,
        "Client-Id": environment.clientId,
      },
    };
    https.get(options, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        resolve(JSON.parse(data));
      });
    });
  });

  return {
    status: PEOPLE_STATUS.BUSCANDO,
    pending: [],
    accepted: [],
    denied: [],
    requested: [],
    profile_image_url: (await user)?.data?.[0]?.profile_image_url?.replace(
      "300x300",
      "600x600"
    ),
  };
}

function saveFriendListInAFile() {
  let data = JSON.stringify(peopleData);
  fs.writeFileSync("./local_db/friend.json", data);
}

function loadFriendlistFromAFile() {
  let rawdata = fs.readFileSync("./local_db/friend.json");
  let data = JSON.parse(rawdata || {});
  peopleData = data;
  io.emit("peopleData", peopleData);
}

function startGame(data) {
  statusGame = "started";
  io.emit("statusGame", statusGame);
  io.emit("peopleData", peopleData);
  client.say(data.channel, "El juego ha empezado");
}

function stopGame(data) {
  statusGame = "stopped";
  io.emit("statusGame", statusGame);
  io.emit("peopleData", peopleData);
  client.say(data.channel, "El juego ha terminado");
}

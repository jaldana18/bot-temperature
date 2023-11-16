const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const colors = require("colors");
const fs = require("fs");

//temperatura 
const axios = require("axios");
const apiKey = "3d5d1b31fa0bd3d2cf908f501b024424";
const city = "Bogota";
const units = "metric";

// URL de la API de OpenWeatherMap
const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${apiKey}`;

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  ffmpeg: "./ffmpeg.exe",
  authStrategy: new LocalAuth({ clientId: "client" }),
});
const config = require("./config/config.json");

client.on("qr", (qr) => {
  console.log(
    `[${moment().tz(config.timezone).format("HH:mm:ss")}] Scan the QR below : `
  );
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.clear();
  const consoleText = "./config/console.txt";
  fs.readFile(consoleText, "utf-8", (err, data) => {
    if (err) {
      console.log(
        `[${moment()
          .tz(config.timezone)
          .format("HH:mm:ss")}] Console Text not found!`.yellow
      );
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
          config.name
        } is Already!`.green
      );
    } else {
      console.log(data.green);
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
          config.name
        } is Already!`.green
      );
    }
  });
});

client.on("message", async (message) => {
  const isGroups = message.from.endsWith("@g.us") ? true : false;
  if ((isGroups && config.groups) || !isGroups) {
    if (message.type === "chat") {
      // Realizar la solicitud a la API
      axios
        .get(apiUrl)
        .then((response) => {
          // Extrae la temperatura actual de la respuesta
          const temperature = response.data.main.temp;
          const responseMessage = `La temperatura actual en Bogotá es ${temperature} grados Celsius.`;

          // Enviar el mensaje de respuesta
          client.sendMessage(message.from, responseMessage);
        })
        .catch((error) => {
          console.error("Error al obtener la temperatura:", error.message);

          // Enviar un mensaje de error
          client.sendMessage(
            message.from,
            "Error al obtener la temperatura. Por favor, inténtalo de nuevo más tarde."
          );
        });

      // Read chat
    } else {
      client.getChatById(message.id.remote).then(async (chat) => {
        await chat.sendSeen();
      });
    }
  }
});

client.initialize();

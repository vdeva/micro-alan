import { WebSocketServer } from "ws";
import { RealtimeClient } from "@openai/realtime-api-beta";
import express from "express";
import bodyParser from "body-parser"; // To handle JSON POST requests
import dotenv from "dotenv";
import http from "http"; // Import http to create the shared server
import multer from "multer";
import fs from "fs";

dotenv.config({ override: true });

export class RealtimeRelay {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.sockets = new WeakMap();
    this.wss = null;
  }

  listen(server) {
    this.wss = new WebSocketServer({ server }); // Use the shared server
    this.wss.on("connection", this.connectionHandler.bind(this));
    this.log(`Listening for WebSocket connections`);
  }

  async connectionHandler(ws, req) {
    if (!req.url) {
      this.log("No URL provided, closing connection.");
      ws.close();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname !== "/") {
      this.log(`Invalid pathname: "${pathname}"`);
      ws.close();
      return;
    }

    // Instantiate new client
    this.log(`Connecting with key "${this.apiKey.slice(0, 3)}..."`);
    const client = new RealtimeClient({ apiKey: this.apiKey });

    // Relay: OpenAI Realtime API Event -> Browser Event
    client.realtime.on("server.*", (event) => {
      this.log(`Relaying "${event.type}" to Client`);
      ws.send(JSON.stringify(event));
    });
    client.realtime.on("close", () => ws.close());

    // Relay: Browser Event -> OpenAI Realtime API Event
    const messageQueue = [];
    const messageHandler = (data) => {
      try {
        const event = JSON.parse(data);
        this.log(`Relaying "${event.type}" to OpenAI`);
        client.realtime.send(event.type, event);
      } catch (e) {
        console.error(e.message);
        this.log(`Error parsing event from client: ${data}`);
      }
    };

    ws.on("message", (data) => {
      if (!client.isConnected()) {
        messageQueue.push(data);
      } else {
        messageHandler(data);
      }
    });
    ws.on("close", () => client.disconnect());

    // Connect to OpenAI Realtime API
    try {
      this.log(`Connecting to OpenAI...`);
      await client.connect();
    } catch (e) {
      this.log(`Error connecting to OpenAI: ${e.message}`);
      ws.close();
      return;
    }
    this.log(`Connected to OpenAI successfully!`);
    while (messageQueue.length) {
      messageHandler(messageQueue.shift());
    }
  }

  log(...args) {
    console.log(`[RealtimeRelay]`, ...args);
  }
}

// Setting up Express server for HTTP POST requests
const app = express();
app.use(bodyParser.json()); // Parse incoming request bodies in JSON format

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error(
    `Environment variable "OPENAI_API_KEY" is required.\n` +
      `Please set it in your .env file.`,
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 8081;

// Create a shared HTTP server for both WebSocket and HTTP routes
const server = http.createServer(app);

// Instantiate the WebSocket relay
const relay = new RealtimeRelay(OPENAI_API_KEY);
relay.listen(server); // Pass the shared server to the WebSocket relay

// POST Route handler
// Multer setup to handle image upload
const upload = multer();

// POST Route to handle image upload and encoding to Base64
app.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert image buffer to Base64
    const imageBuffer = req.file.buffer;
    const base64String = imageBuffer.toString("base64");

    // Append the Base64 string to a file on a new line
    fs.writeFileSync("./server/imgs.txt", base64String + "\n");

    console.log("Image saved as Base64");

    // Respond with a success message
    res.json({ message: "Image received and saved successfully" });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the shared server, which handles both HTTP and WebSocket
server.listen(PORT, () => {
  console.log(`HTTP and WebSocket Server running on http://localhost:${PORT}`);
});

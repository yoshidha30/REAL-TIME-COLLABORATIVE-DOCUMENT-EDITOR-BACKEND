const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const Document = require("./models/Document");

const app = express();
app.use(cors());
app.use(express.json()); // for parsing JSON request bodies

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect("mongodb://127.0.0.1:27017/realtime-editor")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Socket.IO real-time collaboration
io.on("connection", (socket) => {
  console.log("📡 New client connected");

  socket.on("get-document", async (documentId) => {
    if (!documentId) return;

    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.create({ _id: documentId, data: "" });
    }

    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

// --- New routes for dashboard ---

// Get all documents (only id's)
app.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find({}, "_id").lean();
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Create new document with random id
app.post("/documents", async (req, res) => {
  try {
    // Generate a random id, e.g. using Date.now and Math.random
    const newId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const document = await Document.create({ _id: newId, data: "" });
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});

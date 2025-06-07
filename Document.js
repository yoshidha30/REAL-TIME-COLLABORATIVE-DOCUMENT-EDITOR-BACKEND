const mongoose = require("mongoose");

const Document = new mongoose.Schema({
  _id: String, // 👈 allow UUID or custom string as ID
  title: {
    type: String,
    default: "Untitled Document",
  },
  data: Object,
});

module.exports = mongoose.model("Document", Document);

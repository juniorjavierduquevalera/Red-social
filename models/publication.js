const { Schema, model } = require("mongoose");

const publicationSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  file: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Publication", publicationSchema, "publications");

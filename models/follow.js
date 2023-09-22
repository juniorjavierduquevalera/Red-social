const { Schema, model } = require("mongoose");

// Define el esquema del modelo Follow
const FollowSchema = Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User", // Referencia al modelo de usuario
  },
  followed: {
    type: Schema.Types.ObjectId,
    ref: "User", // Referencia al modelo de usuario
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Follow", FollowSchema, "follows");

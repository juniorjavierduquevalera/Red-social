const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta
const secret = "clave_secreta_301";

// Crear una función para generar tokens
const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment().unix(),
    exp: moment().add(7, "days").unix(),
  };

  // Devolver jwt token codificado
  return jwt.encode(payload, secret);
};

module.exports = {
  secret,
  createToken
}
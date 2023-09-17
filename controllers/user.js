const User = require("../models/user");
const bcrypt = require("bcrypt")

// Acción de registro
const register = async (req, res) => {
  try {
    const params = req.body;
    if (!params.name || !params.nick || !params.email || !params.password) {
      return res.status(400).json({
        message: "Faltan datos",
        params,
      });
    }

    // Convertir el email y el nick a minúsculas antes de verificar duplicados
    params.email = params.email.toLowerCase();
    params.nick = params.nick.toLowerCase();

    // Control de usuarios duplicados
    const existingUser = await User.findOne({
      $or: [
        { email: params.email },
        { nick: params.nick },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "El usuario ya existe",
      });
    }

    // Cifrar la contraseña antes de guardarla
    const saltRounds = 10; // Número de rondas de cifrado (mayor número = mayor seguridad)
    const hashedPassword = await bcrypt.hash(params.password, saltRounds);

    // Crear un objeto de usuario con la contraseña cifrada
    const user_to_save = new User({
      ...params,
      password: hashedPassword, // Almacenar la contraseña cifrada
    });

    // Intentar guardar el nuevo usuario
    const userStored = await user_to_save.save();

    if (!userStored) {
      return res.status(400).json({
        status: "error",
        message: "No se ha registrado el usuario",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Usuario registrado con éxito",
      user: userStored,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al registrar el usuario",
      error: error.message,
    });
  }
};

module.exports = {
  register
};

const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");

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
      $or: [{ email: params.email }, { nick: params.nick }],
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

const login = async (req, res) => {
  try {
    // Recoger los parámetros del cuerpo de la solicitud
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Faltan datos por enviar",
      });
    }

    // Buscar el usuario por su dirección de correo electrónico (email) y excluir la contraseña
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Comparar la contraseña proporcionada con la contraseña almacenada en la base de datos
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Contraseña incorrecta",
      });    }

    //generar un token 
    const token = jwt.createToken(user);

    return res.status(200).json({
      status: "success",
      message: "Inicio de sesión exitoso",
      user: {
        id: user._id,
        name: user.name,
        nick: user.nick,
      },
      token
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};

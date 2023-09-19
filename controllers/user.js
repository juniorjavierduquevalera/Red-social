const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const mongoosepagination = require("mongoose-pagination");

//acciones de pruebas//
const prueba = (req, res) => {
  return res.status(200).send({
    message: "Prueba exitosa",
    usuario: req.user,
  });
};

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
      });
    }

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
      token,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

const profile = async (req, res) => {
  try {
    // Recibir el parámetro del ID de usuario desde la URL
    const id = req.params.id;

    // Consulta para obtener los datos del usuario por su ID
    const userProfile = await User.findOne({ _id: id })
      .select({ password: 0 })
      .exec();

    // Verificar si se encontró el usuario
    if (!userProfile) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Si se encontró el usuario, enviar los datos en la respuesta
    return res.status(200).json({
      status: "success",
      message: "Datos del usuario obtenidos correctamente",
      user: userProfile,
    });
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los datos del usuario",
      error: error.message,
    });
  }
};

const list = async (req, res) => {
  // Controlar en qué página estamos
  let page = 1;

  if (req.params.page) {
    page = parseInt(req.params.page);
  }

  // Establecer el número de elementos por página
  const itemsPerPage = 10;

  try {
    // Contar el total de documentos en la colección de usuarios
    const totalUsers = await User.countDocuments();

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    // Realizar la consulta con Mongoose pagination
    const users = await User.find()
      .sort("_id")
      .paginate(page, itemsPerPage)
      .select({ password: 0 })
      .exec();

    if (users.length === 0 && page > 1) {
      return res.status(404).json({
        status: "error",
        message: "No hay usuarios en esta página",
        page,
        itemsPerPage,
        totalPages,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lista de usuarios",
      users,
      page,
      itemsPerPage,
      totalUsers,      
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al obtener la lista de usuarios",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  prueba,
  profile,
  list,
};

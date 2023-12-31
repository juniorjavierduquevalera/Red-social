const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const pagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");
const follow = require("../models/follow");
const publication = require("../models/publication");
const validate = require("../helpers/validate");

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

    const validationResult = validate.validateRegister(params);

    if (!validationResult.isValid) {
      return res.status(400).json({
        status: "error",
        message: "Error de validación",
        errors: validationResult.errors,
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

    //info de seguimiento//
    const followInfo = await followService.followThisUser(req.user.id, id);

    // Si se encontró el usuario, enviar los datos en la respuesta
    return res.status(200).json({
      status: "success",
      message: "Datos del usuario obtenidos correctamente",
      user: userProfile,
      followInfo,
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
  const itemsPerPage = 5;

  //info de seguimiento//
  const followUserIds = await followService.followUserIds(req.user.id);

  try {
    // Realizar la consulta con Mongoose pagination utilizando promesas
    const result = await User.find()
      .sort("_id")
      .skip((page - 1) * itemsPerPage)
      .select({ password: 0, email: 0, role: 0, __v: 0 }) // Excluir el campos
      .limit(itemsPerPage)
      .exec();

    // Contar el total de documentos para calcular totalPages
    const total = await User.countDocuments();

    const totalPages = Math.ceil(total / itemsPerPage);

    return res.status(200).json({
      status: "success",
      message: "Lista de usuarios",
      users: result,
      page,
      itemsPerPage,
      total,
      totalPages,
      following: followUserIds.following,
      followers: followUserIds.followers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al obtener la lista de usuarios",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    // Recoger información del usuario a actualizar
    const userIdentity = req.user;
    const userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userIdentity.iat;
    delete userIdentity.exp;

    // Verificar si el usuario existe por su ID
    const user = await User.findById(userIdentity.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Actualizar los campos del usuario con los datos de userToUpdate
    Object.assign(user, userToUpdate);

    // Si se proporcionó una nueva contraseña, hashearla antes de guardarla
    if (userToUpdate.password) {
      const saltRounds = 10; // El número de rondas de sal (cifrado)
      const hashedPassword = await bcrypt.hash(
        userToUpdate.password,
        saltRounds
      );
      user.password = hashedPassword;
    }

    // Guardar los cambios en la base de datos
    await user.save();

    // Recuperar el usuario actualizado de la base de datos
    const updatedUser = await User.findById(userIdentity.id).select(
      "-password"
    );

    return res.status(200).json({
      status: "success",
      message: "Usuario actualizado con éxito",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar el usuario",
      error: error.message,
    });
  }
};

const upload = async (req, res) => {
  // Verificar si se ha subido un archivo
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "No se ha seleccionado ningún archivo",
    });
  }

  // Obtener el nombre original del archivo
  const image = req.file.originalname;

  // Obtener la extensión del archivo
  const extension = path.extname(image).toLowerCase();

  // Comprobar extensión
  if (
    extension !== ".png" &&
    extension !== ".jpg" &&
    extension !== ".jpeg" &&
    extension !== ".gif"
  ) {
    // Eliminar el archivo
    const filePath = req.file.path;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error al eliminar el archivo:", err);
      }
      return res.status(400).json({
        status: "error",
        message: "El archivo subido no tiene una extensión válida",
      });
    });
  } else {
    try {
      // Obtener la imagen anterior del usuario
      const user = await User.findById(req.user.id);
      const previousImage = user.image;

      // Si la extensión es válida, eliminar la imagen anterior si existe
      if (previousImage) {
        const previousImagePath = path.join("uploads/avatars", previousImage);
        fs.unlink(previousImagePath, (err) => {
          if (err) {
            console.error("Error al eliminar la imagen anterior:", err);
          }
        });
      }

      // Actualizar la imagen del usuario en la base de datos
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id },
        { image: req.file.filename },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          status: "error",
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Archivo subido con éxito",
        user: updatedUser,
        avatar: req.file,
      });
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      return res.status(500).json({
        status: "error",
        message: "Error al actualizar el usuario",
        error: error.message,
      });
    }
  }
};

const avatar = (req, res) => {
  try {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = path.resolve("./uploads/avatars", file);

    // Comprobar si el archivo existe
    if (fs.existsSync(filePath)) {
      // Si el archivo existe, puedes servirlo aquí
      res.sendFile(filePath);
    } else {
      // Si el archivo no existe, devolver una respuesta de error 404
      res.status(404).json({
        status: "error",
        message: "Avatar no encontrado",
      });
    }
  } catch (err) {
    // Si ocurre un error (por ejemplo, el archivo no existe), manejarlo aquí
    const errorMessage = `Error: Avatar not found - ${err.message}`;
    console.error(errorMessage); // Registrar el error en la consola para fines de depuración
    res.status(404).json({
      status: "error",
      message: "Avatar no encontrado",
    }); // Enviar un mensaje de error 404 en la respuesta
  }
};

const counters = async (req, res) => {
  let userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const following = await follow.countDocuments({ user: userId });
    const followed = await follow.countDocuments({ followed: userId });
    const publications = await publication.countDocuments({ user: userId });

    return res.status(200).send({
      userId,
      following,
      followed,
      publications,
    });
  } catch (error) {
    return res.status(500).send({ message: "Error en el servidor" });
  }
};

module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};

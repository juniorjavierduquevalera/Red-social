//importar models//
const follow = require("../models/follow");
const user = require("../models/user");

//acciones//
const save = async (req, res) => {
  try {
    // Obtener datos del cuerpo de la solicitud
    const params = req.body;

    // Obtener la identidad del usuario autenticado (asumiendo que usas autenticación)
    const identity = req.user;

    // Crear un objeto del modelo Follow
    const userToFollow = new follow({
      user: identity.id,
      followed: params.followed,
    });

    // Guardar el objeto en la base de datos
    await userToFollow.save();

    return res.status(200).send({
      message: "Guardado exitosamente",
      identity: req.user,
      userToFollow,
    });
  } catch (error) {
    console.error("Error al guardar el objeto Follow:", error);
    return res.status(500).send({
      message: "Error al guardar el objeto Follow",
      error: error.message, 
    });
  }
};


module.exports = {
  save,
};

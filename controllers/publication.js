const Publication = require("../models/publication");

//Guardar una publicacion//

const save = async (req, res) => {
  try {
    // Recoger datos del body
    const { text, file } = req.body;
    const user = req.user.id; // Obtener el ID de usuario del objeto req.user

    // Verificar si los datos requeridos están presentes
    if (!user || !text) {
      return res.status(400).json({
        status: "error",
        message: "Se requieren campos obligatorios: user y text",
      });
    }

    // Crear y rellenar el objeto del modelo
    const publication = new Publication({
      user,
      text,
      file,
    });

    // Guardar el objeto en la base de datos
    await publication.save();

    // Devolver una respuesta exitosa
    return res.status(201).json({
      status: "success",
      message: "Publicación guardada exitosamente",
      publication,
    });
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    return res.status(500).json({
      status: "error",
      message: "Error al guardar la publicación",
      error: error.message,
    });
  }
};

module.exports = {
  save,
};



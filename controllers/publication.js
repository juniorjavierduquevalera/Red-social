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

//sacar una publicacion//
const detail = async (req, res) => {
  try {
    // Sacar el ID de la publicación de la URL
    const publicationId = req.params.id;

    // Buscar la publicación en la base de datos por su ID
    const publication = await Publication.findById(publicationId);

    // Verificar si la publicación se encontró
    if (!publication) {
      return res.status(404).json({
        status: "error",
        message: "Publicación no encontrada",
      });
    }

    // Devolver una respuesta exitosa con los detalles de la publicación
    return res.status(200).json({
      status: "success",
      message: "Mostrar publicación",
      publication,
    });
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    return res.status(500).json({
      status: "error",
      message: "Error al mostrar la publicación",
      error: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    // Sacar el ID de la publicación a eliminar de la URL
    const publicationId = req.params.id;

    // Buscar la publicación en la base de datos por su ID y el usuario autenticado
    const publication = await Publication.findOne({
      _id: publicationId,
      user: req.user.id,
    });

    // Verificar si la publicación se encontró
    if (!publication) {
      return res.status(404).json({
        status: "error",
        message: "Publicación no encontrada o no tienes permiso para eliminarla",
      });
    }

    // Obtener los datos de la publicación antes de eliminarla
    const deletedPublication = { ...publication._doc };

    // Eliminar la publicación de la base de datos utilizando deleteOne
    await publication.deleteOne();

    // Devolver una respuesta exitosa junto con los datos de la publicación eliminada
    return res.status(200).json({
      publicationId,
      status: "success",
      message: "Publicación eliminada correctamente",
      deletedPublication,
      
    });
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    return res.status(500).json({
      status: "error",
      message: "Error al eliminar la publicación",
      error: error.message,
    });
  }
};

module.exports = {
  save,
  detail,
  deletePost,
};

const Publication = require("../models/publication");
const path = require("path");
const fs = require("fs");
const followService = require("../services/followService");
const publication = require("../models/publication");

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
        message:
          "Publicación no encontrada o no tienes permiso para eliminarla",
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

const listPost = async (req, res) => {
  try {
    // Sacar el identificador del usuario desde la URL
    const userId = req.params.id;

    // Controlar la página
    let page = 1;

    if (req.params.page) {
      page = parseInt(req.params.page);
    }

    const itemsPerPage = 2;

    // Realizar la consulta para obtener las publicaciones del usuario
    const publications = await Publication.find({ user: userId })
      .sort({ created_at: -1 }) // Ordenar por fecha de creación descendente
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .populate("user", "name username") // Excluir el campo '__v' omitiéndolo
      .select("-__v")
      .exec();

    // Si no hay publicaciones, enviar un mensaje adecuado
    if (publications.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No hay publicaciones en el perfil de este usuario",
        page,
        totalPages: 0,
      });
    }

    // Devolver la respuesta con las publicaciones encontradas, la página actual y el total de páginas
    return res.status(200).json({
      status: "success",
      message: "Lista de publicaciones del perfil de un usuario",
      publications,
      page,
      totalPages: Math.ceil(publications.length / itemsPerPage),
    });
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    return res.status(500).json({
      status: "error",
      message: "Error al obtener la lista de publicaciones del usuario",
      error: error.message,
    });
  }
};

//subir ficheros//

const upload = async (req, res) => {
  // Verificar si se ha subido un archivo
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "No se ha seleccionado ningún archivo para subir",
    });
  }

  // Obtener el ID de la publicación desde los parámetros de la URL
  const publicationId = req.params.id;

  // Obtener el ID del usuario autenticado
  const userId = req.user.id;

  try {
    // Verificar si la publicación ya tiene un archivo adjunto
    const publication = await Publication.findOne({
      _id: publicationId,
      user: userId,
    });

    if (!publication) {
      return res.status(404).json({
        status: "error",
        message:
          "Publicación no encontrada o no tienes permiso para actualizarla",
      });
    }

    // Si existe un archivo anterior, eliminarlo
    if (publication.file) {
      const previousImagePath = path.join(
        "uploads/publications",
        publication.file
      );
      fs.unlink(previousImagePath, (err) => {
        if (err) {
          console.error("Error al eliminar el archivo anterior:", err);
        }
      });
    }

    // Actualizar la imagen de la publicación en la base de datos
    publication.file = req.file.filename;
    const updatedPublication = await publication.save();

    return res.status(200).json({
      status: "success",
      message: "Archivo subido con éxito",
      publication: updatedPublication,
      userId,
    });
  } catch (error) {
    console.error("Error al actualizar la publicación:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar la publicación",
      error: error.message,
    });
  }
};

const media = (req, res) => {
  try {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = path.resolve("./uploads/publications", file);

    // Comprobar si el archivo existe
    if (fs.existsSync(filePath)) {
      // Si el archivo existe, puedes servirlo aquí
      res.sendFile(filePath);
    } else {
      // Si el archivo no existe, devolver una respuesta de error 404
      res.status(404).json({
        status: "error",
        message: "Archivo no encontrado",
      });
    }
  } catch (err) {
    // Si ocurre un error (por ejemplo, el parámetro no es válido), manejarlo aquí
    const errorMessage = `Error: ${err.message}`;
    console.error(errorMessage); // Registrar el error en la consola para fines de depuración
    res.status(400).json({
      status: "error",
      message: "Parámetro de URL no válido",
    }); // Enviar un mensaje de error 400 en la respuesta
  }
};
//listado de publicaciones//
const feed = async (req, res) => {
  // Sacar la página actual
  let page = 1;

  if (req.params.page) {
    page = parseInt(req.params.page); // Asegurarse de que la página sea un número entero
  }

  // Establecer el número de elementos por página
  const itemsPerPage = 5;

  // Sacar un array de identificadores de usuarios a los que sigo como usuario logeado
  try {
    const myFollows = await followService.followUserIds(req.user.id);

    // Find: buscar publicaciones, ordenarlas, popularlas y paginarlas
    const totalPublications = await Publication.countDocuments({
      user: myFollows.following
    });

    const totalPages = Math.ceil(totalPublications / itemsPerPage);

    const publications = await Publication.find({
      user: myFollows.following
    })
    .populate("user", "-role -password -__v -email")
    .sort("-created_at")
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage);

    return res.status(200).json({
      status: "success",
      message: "feed de publicaciones",
      page: page,
      totalPages: totalPages,
      itemsPerPage: itemsPerPage,
      myFollows: myFollows.following,
      publications,
    });
  } catch (error) {
    console.error("Error en la obtención del feed de publicaciones:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener el feed de publicaciones",
      error: error.message,
    });
  }
};


module.exports = {
  save,
  detail,
  deletePost,
  listPost,
  upload,
  media,
  feed,
};

//importar models//
const follow = require("../models/follow");
const user = require("../models/user");
const mongoosePginate = "mongoose-pagination";
const folloService = require("../services/followService");

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
const unfollow = async (req, res) => {
  try {
    // Recoger el id del usuario identificado
    const userId = req.user.id;

    // Recoger el id del usuario que sigo y quiero dejar de seguir
    const followebId = req.params.id;

    const followStored = await follow.findOneAndDelete({
      user: userId,
      followed: followebId, // Asegúrate de definir followebId en algún lugar
    });

    if (!followStored) {
      return res
        .status(404)
        .send({ message: "No se encontró el seguimiento para eliminar" });
    }

    return res.status(200).send({
      message: "unfollow exitoso",
      identity: req.user,
      followStored,
    });
  } catch (error) {
    console.error("Error al eliminar el seguimiento:", error);
    return res.status(500).send({ message: "Error interno del servidor" });
  }
};

//listado de usuarios que cualquier usuario esta siguiendo (siguiendo)//
const following = async (req, res) => {
  try {
    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parámetro en la URL
    if (req.params.id) userId = req.params.id;

    // Comprobar si me llega la página, sino la página 1
    let page = 1;

    if (req.params.page) page = req.params.page;

    // Usuario de página que quiero mostrar
    const itemsPerPage = 5;

    // Realizar la consulta para obtener los usuarios que sigue el usuario identificado
    const follows = await follow
      .find({ user: userId })
      .populate({
        path: "user",
        select: "-password -role -__v -created_at",
      })
      .populate({
        path: "followed",
        select: "-password -role -__v -created_at",
      })
      .paginate(page, itemsPerPage)
      .exec();

    // Obtener el total de páginas
    const totalFollows = await follow.countDocuments({ user: userId });

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalFollows / itemsPerPage);

    //sacar un array de ids de los usuarios que me siguen y los que sigo//
    let followUserIds = await folloService.followUserIds(req.user.id);

    // Listado de usuarios que siguen a otros y me siguen a mí
    return res.status(200).send({
      status: "Success",
      message: "Listado de usuarios que estoy siguiendo",
      follows,
      currentPage: page,
      totalPages,
      totalFollows,
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    console.error(
      "Error al obtener la lista de usuarios que estoy siguiendo:",
      error
    );
    return res
      .status(500)
      .send({ status: "Error", message: "Error interno del servidor" });
  }
};

//listado de usuarios que siguen a cualquier usuario (soy seguido)//
const followers = async (req, res) => {
  try {
    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parámetro en la URL
    if (req.params.id) userId = req.params.id;

    // Comprobar si me llega la página, sino la página 1
    let page = 1;

    if (req.params.page) page = req.params.page;

    // Usuario de página que quiero mostrar
    const itemsPerPage = 5;

    // Realizar la consulta para obtener los usuarios que sigue el usuario identificado
    const follows = await follow
      .find({ followed: userId })
      .populate({
        path: "user",
        select: "-password -role -__v -created_at",
      })
      .populate({
        path: "followed",
        select: "-password -role -__v -created_at",
      })
      .paginate(page, itemsPerPage)
      .exec();

    // Obtener el total de páginas
    const totalFollows = await follow.countDocuments({ user: userId });

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalFollows / itemsPerPage);

    //sacar un array de ids de los usuarios que me siguen y los que sigo//
    let followUserIds = await folloService.followUserIds(req.user.id);

    // Listado de usuarios que siguen a otros y me siguen a mí
    return res.status(200).send({
      status: "Success",
      message: "Listado de usuarios que me siguen",
      follows,
      currentPage: page,
      totalPages,
      totalFollows,
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    console.error(
      "Error al obtener la lista de usuarios que estoy siguiendo:",
      error
    );
    return res
      .status(500)
      .send({ status: "Error", message: "Error interno del servidor" });
  }
};
module.exports = {
  save,
  unfollow,
  following,
  followers,
};

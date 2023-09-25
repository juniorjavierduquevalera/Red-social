const follow = require("../models/follow");

const followUserIds = async (identityUserId) => {
  try {
    let following = await follow
      .find({ user: identityUserId })
      .select({ id: 0, __v: 0, user: 0, createdAt: 0, _id: 0 })
      .exec();

    let followers = await follow
      .find({ followed: identityUserId })
      .select({ user: 1, _id: 0 })
      .exec();

    // Procesar array de identificadores
    let followingClean = [];

    following.forEach((element) => {
      followingClean.push(element.followed);
    });

    let followersClean = [];

    followers.forEach((element) => {
      followersClean.push(element.user);
    });

    return { following: followingClean, followers: followersClean };
  } catch (error) {
    // Aquí puedes manejar el error como desees, por ejemplo, registrándolo o lanzando una excepción personalizada.
    console.error("Error en la función followUserIds:", error);
    throw new Error("Error al buscar seguidores del usuario.");
  }
};

const followThisUser = async (identityUserId, profileUserId) => {
  try {
    // Verificar si el usuario está siguiendo al perfil
    const following = await follow.findOne({
      user: identityUserId,
      followed: profileUserId,
    });

    // Verificar si el perfil está siguiendo al usuario
    const follower = await follow.findOne({
      user: profileUserId,
      followed: identityUserId,
    });

    // Si ambos son nulos, significa que no hay seguimiento mutuo
    if (!following && !follower) {
      return {
        following: false,
        follower: false,
      };
    }

    return {
      following,
      follower,
    };
  } catch (error) {
    // Manejar errores y enviar una respuesta de error
    console.error("Error en la función followThisUser:", error);
    throw new Error("Error al obtener información de seguimiento.");
  }
};


module.exports = {
  followUserIds,
  followThisUser,
};

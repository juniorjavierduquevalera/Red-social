//acciones de pruebas//
const pruebaFollow = (req, res) => {
    return res.status(200).send({
      message: "Prueba exitosa pruebaFollow"
    });
  };

  module.exports = {
    pruebaFollow
  }
  
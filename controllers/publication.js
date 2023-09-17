//acciones de pruebas//
const pruebaPublication = (req, res) => {
  return res.status(200).send({
    message: "Prueba exitosa pruebaPublication",
  });
};

module.exports = {
  pruebaPublication,
};

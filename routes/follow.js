const express = require("express");
const router = express.Router();
const followController = require("../controllers/follow");

//definir rutas//
router.get("/prueba-follow", followController.pruebaFollow);

module.exports = router;
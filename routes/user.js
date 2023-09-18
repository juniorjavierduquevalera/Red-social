const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const auth = require("../middlewares/auth");

//definir rutas//
router.get("/prueba", auth.auth, userController.prueba);
router.post("/register", userController.register);
router.post("/login", userController.login);

module.exports = router;
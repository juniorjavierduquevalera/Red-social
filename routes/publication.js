const express = require("express");
const router = express.Router();
const publicationController = require("../controllers/publication");
const check = require("../middlewares/auth");

//definir rutas//
router.post("/save", check.auth, publicationController.save);

module.exports = router;

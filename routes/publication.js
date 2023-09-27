const express = require("express");
const router = express.Router();
const publicationController = require("../controllers/publication");
const check = require("../middlewares/auth");
const multer = require("multer");

// Configuración de subida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Especifica la carpeta donde se almacenarán los archivos subidos
    cb(null, "uploads/publications/");
  },
  filename: function (req, file, cb) {
    // Define el nombre del archivo en función de la fecha actual y el nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop(); // Obtén la extensión del archivo original
    cb(null, "public-" + uniqueSuffix + "." + extension);
  },
});

// Crear un middleware de Multer
const upload = multer({ storage: storage });

//definir rutas//
router.post("/save", check.auth, publicationController.save);
router.get("/detail/:id", check.auth, publicationController.detail);
router.delete("/deletepost/:id", check.auth, publicationController.deletePost);
router.get("/listpost/:id/:page?", check.auth, publicationController.listPost);
router.post(
  "/upload/:id",
  check.auth,
  upload.single("file"),
  publicationController.upload
);
router.get("/media/:file", check.auth, publicationController.media);
router.get("/feed/:page?", check.auth, publicationController.feed);

module.exports = router;

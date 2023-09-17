// Importa las bibliotecas y módulos necesarios
const express = require("express");
const cors = require("cors");
const connection = require("./database/connection");

// Crea una instancia de la aplicación Express
const app = express();

// Define el número de puerto en el que se ejecutará el servidor
const port = 3000;

// Llama a la función de conexión para conectar con la base de datos
connection();

// Habilita el middleware CORS para permitir solicitudes desde otros dominios
app.use(cors());

// Middleware para analizar el cuerpo de las solicitudes como objetos JavaScript
app.use(express.json()); // Permite analizar solicitudes JSON
app.use(express.urlencoded({ extended: true })); // Permite analizar solicitudes en formato form-urlencoded

//cargar rutas//
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

// Asocia las rutas a sus respectivos prefijos URL en la API
app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);

// Arranca el servidor Express en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor Express arrancado en el puerto ${port}`);
  });

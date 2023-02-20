const express = require('express')
const router = express.Router();
const controllers = require("../controllers")
const middlewares = require('../middlewares');
const rutasCliente = require("./cliente.routes")
const rutasEmpleado = require("./empleado.routes")
const rutasAdmin = require("./admin.routes")


router.post("/login", controllers.authControllers().loginUser)
// router.post("/register", controllers.authControllers().registerUser)
router.post("/logout", middlewares.authorization,controllers.authControllers().logOut)


router.post("/cuentas/receptar/externo", middlewares.basicAuth, controllers.clientesControllers().receptar_externa)
router.use("/cliente", middlewares.authorization, rutasCliente)
router.use("/empleado", middlewares.authorization, rutasEmpleado)

router.use("/administrador", middlewares.authorization, rutasAdmin)

// router.use((req, res, next) => {
//     // res.status(404).sendFile(__dirname + '/public/404.html');
//     res.status(404).send("hola")
// })

module.exports = router
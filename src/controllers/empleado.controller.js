const { makeUCEmpleados, makeUCClientes, makeUCCuentas } = require("../use-cases")
const { getEmpleado } = makeUCEmpleados()
const { getClientes:getClientesUS, getCliente, createCliente, getClienteById, updateCliente:updateClienteUS, changeActiveCliente } = makeUCClientes()
const { getCuentas:getCuentasUS, createCuenta, changeActiveCuenta, updateCuenta:updateCuentaUS, getCuentaById } = makeUCCuentas();

const { generatePasswordRand } = require("../utils")
const { Cliente, Cuenta } = require("../models")
const fs = require('fs');

function empleadosControllers() {
    async function getInfo(req, res) {
        const { nickname } = res.locals.user
        try {
            var result = await getEmpleado(nickname)
            return res.status(200).send(result)
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function getClientes(req, res) {
        try {
            var result = await getClientesUS()
            return res.status(200).send(result)
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function addCliente(req, res) {
        const { nombre, apellido, provincia, ciudad, codigo_postal, identificacion, correo } = req.body
        if (!nombre || !apellido || !provincia || !ciudad || !codigo_postal || !identificacion || !correo) {
            return res.status(400).send("No enviaron los datos necesarios")
        }

        try {
            var cliente = await getCliente(identificacion);
            if (cliente) return res.status(400).send("El cliente ya existe")

            var password = generatePasswordRand(16)

            //Enviar correo
            const content = `Cliente: Su usuario es: ${identificacion} y su contraseña es: ${password}\n`;
            fs.writeFile('./test.txt', content, { flag: 'a+' }, err => console.error(err));

            var nuevoCliente = new Cliente({ nombre, apellido, provincia, ciudad, codigo_postal, identificacion, email: correo, password })

            await createCliente(nuevoCliente.cliente)

            return res.status(200).send("Se ha creado un nuevo cliente")
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function getCuentas(req, res) {
        try {
            var result = await getCuentasUS()
            return res.status(200).send(result)
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function addCuenta(req, res) {
        var { tipo, clientes } = req.body
        if (!tipo || !clientes) {
            return res.status(400).send("No se enviaron los datos necesarios")
        }
        tipo = (tipo === "corriente" || tipo === "C") ? "C" : "A"

        try {

            if (typeof clientes === 'string') {
                clientes = [clientes]
            } else if (Array.isArray(clientes)) {
                clientes = [...new Set(clientes)] //Eliminar repetidos
            } else {
                return res.status(400).send("No ha proporcionado los datos correctos");
            }

            for (var i in clientes) {
                var resp = await getClienteById(clientes[i]);
                if (!resp) {
                    return res.status(400).send(`No existe el cliente con id: ${clientes[i]}`);
                }
            }

            const nuevaCuenta = new Cuenta({ tipo, clientes })
            await createCuenta(nuevaCuenta.cuenta)

            return res.status(200).send("Se ha creado una nueva Cuenta")
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function updateCliente(req, res) {
        const { idCliente } = req.params;

        const { nombre, apellido, provincia, ciudad, codigo_postal, correo } = req.body
        if (!nombre || !apellido || !provincia || !ciudad || !codigo_postal || !correo) {
            return res.status(400).send("No enviaron los datos necesarios")
        }
        try {
            var cliente = await getClienteById(idCliente);
            if (!cliente) return res.status(400).send("El cliente no existe")
            
            var clnt = new Cliente({ nombre, apellido, provincia, ciudad, codigo_postal, identificacion: "l", email: correo })
            clnt.cliente.usuario.password = cliente.usuario.password
            clnt.cliente.identificacion = cliente.identificacion
            clnt.cliente.usuario.salt = cliente.usuario.salt
            clnt.cliente._id = cliente._id

            await updateClienteUS(clnt.cliente)
            return res.status(200).send("Cliente actualizado");
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function changeStatusCliente(req, res) {
        const { idCliente } = req.params;
        try {
            var cliente = await getClienteById(idCliente);
            if (!cliente) return res.status(400).send("El cliente no existe")

            await changeActiveCliente(idCliente, cliente.activo)

            return res.status(200).send(`Cliente ${cliente.activo ? "desactivado" : "activado"}`);
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function updateCuenta(req, res) {
        const { idCuenta } = req.params;

        const { monto } = req.body
        if (!monto) {
            return res.status(400).send("No enviaron los datos necesarios")
        }
        try {
            var cuenta = await getCuentaById(idCuenta);
            if (!cuenta) return res.status(400).send("La cuenta no existe")
            
            cuenta.monto = Math.round(parseFloat(monto)*100)/100

            await updateCuentaUS(cuenta)
            return res.status(200).send("Cuenta actualizada");
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    async function changeStatusCuenta(req, res) {
        const { idCuenta } = req.params;
        try {
            var cuenta = await getClienteById(idCuenta);
            if (!cuenta) return res.status(400).send("La cuenta no existe")

            await changeActiveCuenta(idCuenta, cuenta.activo)

            return res.status(200).send(`Cuenta ${cuenta.activo ? "desactivada" : "activada"}`);
        } catch (error) {
            return res.status(error.code).send(error.msg)
        }
    }

    return Object.freeze({
        getInfo, getClientes, addCliente, getCuentas, addCuenta, updateCliente, changeStatusCliente,
        updateCuenta, changeStatusCuenta
    })
}

module.exports = empleadosControllers
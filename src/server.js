'use strict';
require('encoding')
const express = require('express');
const serverless = require('serverless-http');
const performStockUpdate = require("./handler/performStockUpdate");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();



const router = express.Router()

// router.get("/:route", (req, res) => {
//   try {
//     const handler = require(`./handler/${req.params.route}`);
//     if (!handler) {
//       return res.status(404).json({
//         message: `not found`,
//       });
//     }
//     return handler(req, res);
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({
//       message: `unexpected error occured`,
//     });
//   }
// });

router.post("/performStockUpdate", performStockUpdate);

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);

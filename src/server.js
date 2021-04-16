'use strict';
const express = require('express');
const serverless = require('serverless-http');
const performStockUpdate = require("./handler/performStockUpdate");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();


app.use(bodyParser.json());



app.post("/performStockUpdate", (req, res) => {
  try {
    // const handler = require(`./handlers/${req.params.route}`);
    // if (!handler) {
    //   return res.status(404).json({
    //     message: `not found`,
    //   });
    // }
    return performStockUpdate(req, res);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: `unexpected error occured`,
    });
  }
});


app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);

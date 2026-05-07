// axyntrax_node_mvp/index.js
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`⬡ AXYNTRAX MVP running on port ${port}`));

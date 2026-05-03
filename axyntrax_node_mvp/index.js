// axyntrax_node_mvp/index.js
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`⬡ AXYNTRAX MVP running on port ${port}`));

// axyntrax_node_mvp/package.json
{
  "name": "axyntrax-node-mvp",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.38.4",
    "openai": "^4.14.2",
    "twilio": "^4.19.0",
    "dotenv": "^16.3.1"
  }
}

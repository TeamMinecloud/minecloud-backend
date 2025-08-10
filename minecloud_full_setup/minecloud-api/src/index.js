const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());

app.use('/api', routes);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API up on ${port}`);
});

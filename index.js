const express = require('express');
const path = require('path')

const app = express();
const port = 5000;

console.log(path.join(__dirname, 'public'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname });
})

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
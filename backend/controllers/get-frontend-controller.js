getLib = (req, res) => {
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    res
    .status(200)
    .sendFile('crdt.js', {root: __dirname})
}

module.exports = {
    getLib
}
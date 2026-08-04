const mongoose = require('mongoose');

module.exports = function NoSQLDB () {
    mongoose.connect('mongodb://127.0.0.1/hybridtest')
    .then(() => {
        console.log('Mongodb is Connected');
    })


}
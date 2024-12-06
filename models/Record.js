const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    period: { type: String, required: true },
    numbers: { type: Array, default: [] },
    drawTime: { type: String, required: true },
    section: { type: String, required: true },
    randomZodiacs: { type: Array, required: true },
});

const Record = mongoose.model('Record', recordSchema);
module.exports = Record;

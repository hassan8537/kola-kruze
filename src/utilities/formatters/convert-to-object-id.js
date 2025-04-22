const { default: mongoose } = require("mongoose");

exports.convertToObjectId = (_id) => new mongoose.Types.ObjectId(_id);

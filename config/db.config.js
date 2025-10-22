
const mongoose = require('mongoose');
const initializeServices = require("./dbInitializer");

const db = async () => {
    try {
        await mongoose.connect(process.env.MongoDatabase);

        console.log("Connected to", mongoose.connection.host);
                  await initializeServices();
    } catch (error) {
        console.error("Connection error:", error);
    }
}

module.exports = db;

import mongoose from "mongoose";
import { DB_NAME } from "../constance.js";

const connectDB = async () => {
    try {
        const ConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB Connected !! DB HOST: ${mongoose.connection.host}`);
    } catch (error) {
        console.log("MongoDB Connection Error..", error);
        process.exit(1);
    }
};

export default connectDB;

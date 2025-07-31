import dotenv from "dotenv"; 
import connectDB from './db/index.js';

dotenv.config({
    path: './env'
})



connectDB()
.then(() => {
    app.listion(process.env.PORT || 8000, () =>{
        console.log(`Server is running at Port: ${process.env.PORT}`);
    })
})

.catch((err) =>{
    console.log("MongoDB Connection failed !!", err );
})






/*
import express from 'express';

const app = express();

(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error:", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listioning on port ${process.env.PORT}`);
        })

    } catch (error) {
       console.log("ERROR:", error); 
       throw err
    }
})()
    */
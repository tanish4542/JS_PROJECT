
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import express from 'express';
import { error } from 'console';
const app = express();
dotenv.config({path: './env'});
connectDB().then(()=>
{
    app.listen(process.env.port || 8000,()=>{
        console.log(`Server running at: ${process.env.port}`);
    })
})
.catch((error)=>{
    console.log("MongoDb connection failed"); 
})

 /*
;(async() =>{
    try{
        await mongoose.connect(`{process.env.mongoURI}/${DB_NAME}`)
        app.on('error', (err) => {
            console.error("Error connecting to MongoDB:", err);
            throw err;
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
    }
})();
*/
import express from "express"
import cors from "cors"


const app = express()

app.use(cors({
    origin: '*', // Allow all origins for development/testing
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static("public"))


app.get('/', (req, res) => {
    res.json("hello world")
})  

//Routes
import userRouter from "./routes/user.routes.js"
import chequeRouter from "./routes/cheque.routes.js"

app.use("/api/users", userRouter);
app.use("/api/cheques", chequeRouter);



export { app }
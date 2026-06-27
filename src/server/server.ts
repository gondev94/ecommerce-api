import dotenv from "dotenv";
import express, { raw } from "express";


dotenv.config();
const app = express();

app.use(express.json());

const rawPort = process.env.PORT;
const PORT = rawPort ? Number(rawPort) : 7777;

if (Number.isNaN(PORT)) {
    throw new Error("PORT is not a number");
}
export function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//routes
import pdfRouter from './routes/pdf.route.js'
import userRouter from './routes/user.route.js'
import dashboardRouter from "./routes/dashboard.route.js"
import projectRouter from "./routes/project.route.js"

// route declaration

app.use("/api/v1/pdfs", pdfRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/project", projectRouter)

export { app }
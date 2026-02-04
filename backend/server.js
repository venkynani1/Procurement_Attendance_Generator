import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

dotenv.config()

const app = express()

/* --------------------
   CORS (IMPORTANT)
-------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
)



app.use(express.json())

/* --------------------
   In-memory users
-------------------- */
const users = [] // resets on server restart

/* --------------------
   SIGNUP
-------------------- */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = {
      id: users.length + 1,
      name: name || "User",
      email,
      password: hashedPassword,
      role: "user"
    }

    users.push(user)

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    )

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error("Signup error:", err)
    return res.status(500).json({ message: "Signup failed" })
  }
})

/* --------------------
   LOGIN
-------------------- */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    )

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Login failed" })
  }
})

/* --------------------
   SERVER
-------------------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})

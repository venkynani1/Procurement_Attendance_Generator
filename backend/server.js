import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

/* --------------------
   CORS (DO NOT ADD app.options)
-------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://procurement-attendance-generator.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());

/* --------------------
   TEMP USERS (in-memory)
-------------------- */
const users = [];

/* --------------------
   SIGNUP
-------------------- */
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    role: "user"
  };

  users.push(user);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: { id: user.id, name, email, role: user.role }
  });
});

/* --------------------
   LOGIN
-------------------- */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email, role: user.role }
  });
});

/* --------------------
   HEALTH CHECK
-------------------- */
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

/* --------------------
   SERVER
-------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

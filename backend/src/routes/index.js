import { Router } from "express"

import User from "../models/User.js"

const router = Router()

router.get("/", async (req, res) => {
  const user = await User.create({
    name: "Huy",
    email: "huy@gmail.com",
    password: "123456",
  })

  res.json(user)
})

export default router
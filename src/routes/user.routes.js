import {Router} from "express"
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
const router=Router() 
router.post('/register', (req, res, next) => {
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ])(req, res, function (err) {
    if (err) {
      console.error("❌ Multer Error:", err);
      return res.status(400).json({ error: err.message });
    }
    registerUser(req, res, next);
  });
});

export default router
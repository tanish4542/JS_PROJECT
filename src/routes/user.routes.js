import {Router} from "express"
import { loginUser, logOutUser, registerUser, refreshAccessToken} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
export default router
import {Router} from "express"
import { loginUser, logOutUser, registerUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js"
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
router.route("/change-password").post(verifyJWT, changeUserPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory)


export default router
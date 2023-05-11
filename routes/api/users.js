const express = require("express");
const ctrl = require("../../controllers/users");
const {
  isValidId,
  authenticate,
  gravatarGen,
  multerObj: { upload },
} = require("../../middlewares");

const router = express.Router();

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/current", authenticate, ctrl.getCurrent);
router.post("/logout", authenticate, ctrl.logout);
router.patch("/", authenticate, ctrl.updateSub);
router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  ctrl.uploadAvatar
);
module.exports = router;

const { User, schemas } = require("../models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const jimp = require("jimp");
const {
  multerObj: { tempDir, storeImage },
} = require("../middlewares");

const { HttpError, ctrlWrapper } = require("../helpers");

dotenv.config();
const { registerSchema, loginSchema, patchSubSchema } = schemas;
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  const { email, password } = req.body;
  if (error) {
    throw HttpError(400, "Помилка від Joi або іншої бібліотеки валідації");
  }

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  const avatarURL = gravatar.url(email, {
    s: "250",
    d: "mp",
    protocol: "https",
  });
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });
  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
    },
  });
};

const login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  const { email, password } = req.body;
  if (error) {
    throw HttpError(400, "Помилка від Joi або іншої бібліотеки валідації");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  const payload = {
    id: user.id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "30d" });
  await User.findByIdAndUpdate(user._id, { token });
  res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};
const getCurrent = async (req, res) => {
  const { email, subscription, avatarURL } = req.user;
  res.status(200).json({ avatarURL, email, subscription });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json();
};

const updateSub = async (req, res) => {
  const { error } = patchSubSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const { id } = req.user;
  const result = await User.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!result) {
    throw HttpError(404, "Not Found");
  }
  res.json({
    avatarURL: result.avatarURL,
    email: result.email,
    subscription: result.subscription,
  });
};
const uploadAvatar = async (req, res, next) => {
  const { path: tempUpload, originalname } = req.file;
  const { _id } = req.user;

  const image = await jimp.read(tempUpload);
  image
    .resize(250, 250, function (err) {
      if (err) throw err;
    })
    .write(tempUpload);

  const filename = `${_id}_${originalname}`;
  const resUpload = path.join(storeImage, filename);
  await fs.rename(tempUpload, resUpload);
  const avatarURL = path.join("avatars", filename);

  const result = await User.findByIdAndUpdate(
    _id,
    { avatarURL },
    {
      new: true,
    }
  );
  if (!result) {
    throw HttpError(404, "Not Found");
  }
  res.json({
    avatarURL: result.avatarURL,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSub: ctrlWrapper(updateSub),
  uploadAvatar: ctrlWrapper(uploadAvatar),
};

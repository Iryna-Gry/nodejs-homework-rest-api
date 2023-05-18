const { User, schemas } = require("../models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const jimp = require("jimp");
const uniqid = require("uniqid");
const sendEmail = require("../helpers/sendEmail");
const {
  multerObj: { tempDir, storeImage },
} = require("../middlewares");

const { HttpError, ctrlWrapper } = require("../helpers");

dotenv.config();
const { registerSchema, loginSchema, patchSubSchema, emailSchema } = schemas;
const { SECRET_KEY, BASE_URL } = process.env;

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
  const verificationToken = await uniqid();
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    verificationToken,
    avatarURL,
  });
  const textEmail = {
    to: newUser.email,
    subject: "Please verify your email",
    html: `<p>Signup Success! Please follow the link below to verify your email. <a target='_blank' href="${BASE_URL}/api/users/verify/${verificationToken}">here</a></p>`,
  };
  await sendEmail(textEmail);
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
  if (!user.verify) {
    throw HttpError(404, "User not found");
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
const uploadAvatar = async (req, res) => {
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

const verifyToken = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verificationToken: null,
    verify: true,
  });
  res.status(200).json({
    message: "Verification successful",
  });
};

const resendVerification = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  const { email } = req.body;
  if (error) {
    throw HttpError(400, "Помилка від Joi або іншої бібліотеки валідації");
  }

  if (!email) {
    throw HttpError(400, "missing required field email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }
  const textEmail = {
    to: user.email,
    subject: "Please verify your email",
    html: `<p>We resend you verification email! Please follow the link below to verify your email. <a target='_blank' href="${BASE_URL}/api/users/verify/${verificationToken}">here</a></p>`,
  };
  await sendEmail(textEmail);

  res.status(200).json({ message: "Verification email sent" });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSub: ctrlWrapper(updateSub),
  uploadAvatar: ctrlWrapper(uploadAvatar),
  verifyToken: ctrlWrapper(verifyToken),
  resendVerification: ctrlWrapper(resendVerification),
};

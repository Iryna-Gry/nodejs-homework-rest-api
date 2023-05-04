const { User, schemas } = require("../models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const { HttpError, ctrlWrapper } = require("../helpers");

dotenv.config();
const { registerSchema, loginSchema } = schemas;
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
  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
  });
  res.status(201).json({
    user: { email: newUser.email, subscription: newUser.subscription },
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

  res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
};

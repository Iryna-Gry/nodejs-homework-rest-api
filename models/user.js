const { Schema, model } = require("mongoose");
const { handleMongooseError } = require("../helpers");
const Joi = require("joi");

const emailRegExp =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const userSchema = new Schema(
  {
    password: {
      type: String,
      minlength: 8,
      required: [true, "Set password for user"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: emailRegExp,
      unique: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: {
      type: String,
      default: "",
    },
    avatarURL: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);
const registerSchema = Joi.object({
  email: Joi.string().pattern(emailRegExp).required(),
  password: Joi.string().required().min(8),
});
const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegExp).required(),
  password: Joi.string().required().min(8),
});
const patchSubSchema = Joi.object({
  subscription: Joi.string()
    .valid("starter", "pro", "business")
    .lowercase()
    .required(),
});
const schemas = {
  registerSchema,
  loginSchema,
  patchSubSchema,
};
userSchema.post("save", handleMongooseError);
const User = model("user", userSchema);
module.exports = { User, schemas };

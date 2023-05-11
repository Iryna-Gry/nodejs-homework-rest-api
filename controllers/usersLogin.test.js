const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");
const app = require("../app");
const { DB_HOST } = process.env;
const { User } = require("../models/user");

describe("Login", () => {
  let user = {};
  const avatarURL = gravatar.url("test@mail.com");

  beforeAll(async () => {
    await mongoose.connect(DB_HOST);

    user = await User.create({
      email: "test@mail.com",
      password: await bcrypt.hash("12Abcdefg.", 10),
      avatarURL: gravatar.url(avatarURL),
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await mongoose.disconnect();
  });

  test("returns status code 200", async () => {
    await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "12Abcdefg." })
      .expect(200);
  });

  test("returns token", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "12Abcdefg." })
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(response.body.token).toBeTruthy();
  });

  test("returns user object with  email:String  and subscription:String", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "12Abcdefg." })
      .expect(200);

    expect(response.body.user).toHaveProperty("email");
    expect(response.body.user.email).toBe(user.email);
    expect(typeof response.body.user.email).toStrictEqual("string");

    expect(response.body.user).toHaveProperty("subscription");
    expect(response.body.user.subscription).toBe(user.subscription);
    expect(typeof response.body.user.subscription).toStrictEqual("string");
  });
});

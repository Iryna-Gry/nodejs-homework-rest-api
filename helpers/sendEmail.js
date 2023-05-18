const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const { SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (data) => {
  const email = { ...data, from: "ira.gricaenko@gmail.com" };
  await sgMail.send(email);
  return true;
};

module.exports = sendEmail;

// const email = {
//   to: "ira.gricaenko@gmail.com",
//   from: "ira.gricaenko@gmail.com",
//   subject: "Test email",
//   html: "<p>Test email from 3000</p>",
// };

// sgMail
//   .send(email)
//   .then(() => console.log("success"))
//   .catch((error) => console.log(error.message));

const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/contacts");

router.get("/", ctrl.getContacts);

router.get("/:contactId", ctrl.getContactById);

router.post("/", ctrl.postContact);

router.delete("/:contactId", ctrl.deleteContact);

router.put("/:contactId", ctrl.putContact);

module.exports = router;

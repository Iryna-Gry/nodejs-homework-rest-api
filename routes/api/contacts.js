const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/contacts");
const isValidId = require("../../helpers/isValidId");

router.get("/", ctrl.getContacts);

router.get("/:contactId", isValidId, ctrl.getContactById);

router.post("/", ctrl.postContact);

router.delete("/:contactId", isValidId, ctrl.deleteContact);

router.put("/:contactId", isValidId, ctrl.putContact);

router.patch("/:contactId/favorite", isValidId, ctrl.updateStatusContact);

module.exports = router;

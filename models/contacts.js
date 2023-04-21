const { error } = require("console");
const fs = require("fs/promises");
const path = require("path");
const contactsPath = path.join(__dirname, "contacts.json");
const uniqid = require("uniqid");

const listContacts = async () => {
  const data = await fs.readFile(contactsPath, "utf-8");
  return JSON.parse(data);
};

const getContactById = async (contactId) => {
  const parsedData = await listContacts();
  const result = parsedData.find((item) => item.id === contactId);
  return result || null;
};

const removeContact = async (contactId) => {
  const parsedData = await listContacts();
  const idx = parsedData.findIndex((item) => item.id === contactId);
  if (idx === -1) {
    return null;
  }
  const [result] = parsedData.splice(idx, idx + 1);
  await fs.writeFile(contactsPath, JSON.stringify(parsedData));
  return result;
};

const addContact = async ({ name, phone, email }) => {
  const parsedData = await listContacts();
  if (
    !parsedData.find(
      (item) =>
        item.name === name || item.phone === phone || item.email === email
    )
  ) {
    const contact = { id: uniqid(), name, phone, email };
    parsedData.push(contact);
    await fs.writeFile(contactsPath, JSON.stringify(parsedData));
    return contact;
  } else {
    return null;
  }
};

const updateContact = async (contactId, body) => {
  const contactsArr = await listContacts();
  const idx = contactsArr.findIndex((item) => item.id === contactId);
  if (idx === -1) {
    return null;
  }
  contactsArr[idx] = { ...contactsArr[idx], ...body };
  await fs.writeFile(contactsPath, JSON.stringify(contactsArr));
  return contactsArr[idx];
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};

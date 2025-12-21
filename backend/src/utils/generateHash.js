const bcrypt = require('bcrypt');

const generate = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`${password}  -->  ${hash}`);
};

// Usage: node generateHash.js
// generate('Admin@123');
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const adminSeeder = async (request, response, next) => {
  try {
    if (await User.findOne({ role: "admin" })) {
      console.log("Admin user already exists.");
      return next();
    }

    const adminUser = new User({
      first_name: "Super",
      last_name: "Admin",
      email_address: "admin@kolakruze.com",
      phone_number: "+923112213827",
      password: await bcrypt.hash("Kolakruze@123", 10),
      role: "admin",
      is_verified: true
    });

    await adminUser.save();

    console.log("Admin user created successfully.");
    return next();
  } catch (error) {
    console.error("Error seeding admin:", error);
    next(error);
  }
};

module.exports = adminSeeder;

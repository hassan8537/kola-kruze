const User = require("../../models/User");

async function generateReferralCode() {
  const prefix = "Kruze";
  let code;
  let exists = true;

  while (exists) {
    const suffix = Math.floor(Math.random() * 100000); // random 0-99999
    code = `${prefix}${suffix}`;
    exists = await User.findOne({ referral_code: code });
  }

  return code;
}

module.exports = { generateReferralCode };

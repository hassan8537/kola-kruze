const fileSchema = require("./file-schema");

const userSchema = {
  populate: [
    {
      path: "profile_picture driver_license",
      select: fileSchema.fieldsToSelect
    }
  ],
  fieldsToSelect:
    "first_name last_name legal_name profile_picture gender email_address phone_number role is_student driver_license is_verified stripe_customer_id stripe_default_card_id stripe_account_id referral_code referral_points has_discount_on_next_ride total_referrals total_completed_rewards"
};

module.exports = userSchema;

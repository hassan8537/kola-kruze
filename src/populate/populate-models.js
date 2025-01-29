module.exports = {
  populateUser: {
    populate: [
      {
        path: "profile_picture",
        select: "file_url"
      },
      {
        path: "stripe_default_card",
        select: {}
      }
    ]
  },
  populateStudent: {
    populate: [
      {
        path: "identity_document",
        select: "file_url"
      }
    ]
  },
  populateFile: {
    populate: [
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ]
  },
  populateVehicle: {
    populate: [
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      },
      {
        path: "insurance_document",
        select: "file_url"
      },
      {
        path: "inspection_document",
        select: "file_url"
      },
      {
        path: "vehicle_images",
        select: "file_url"
      },
      {
        path: "vehicle_driver_licenses",
        select: "file_url"
      }
    ]
  },
  populateCard: {
    populate: [
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
  }
};

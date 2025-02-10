module.exports = {
  populateUser: {
    populate: [
      {
        path: "profile_picture",
        select: "file_url"
      },
      {
        path: "driver_license",
        select: "file_url"
      },
      {
        path: "stripe_default_card",
        select: {}
      }
    ],
    sort: { createdAt: -1 }
  },
  populateStudent: {
    populate: [
      {
        path: "identity_document",
        select: "file_url"
      }
    ],
    sort: { createdAt: -1 }
  },
  populateFile: {
    populate: [
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
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
      }
    ],
    sort: { createdAt: -1 }
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
  },
  populateRide: {
    populate: [
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      },
      {
        path: "driver_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      },
      {
        path: "vehicle_id",
        select: "make model year color profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
  },
  populateChat: {
    populate: [
      {
        path: "sender_id",
        populate: { path: "profile_picture", select: "file_url" }
      },
      {
        path: "receiver_id",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
  },
  populatePayment: {
    populate: [
      {
        path: "ride_id"
      },
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
  },
  populateNotification: {
    populate: [
      {
        path: "user_id"
      },
      {
        path: "user_id",
        select: "first_name last_name legal_name email_address profile_picture",
        populate: { path: "profile_picture", select: "file_url" }
      }
    ],
    sort: { createdAt: -1 }
  },
  populateCategory: {
    populate: [
      {
        path: "image",
        select: "file_url"
      }
    ],
    sort: { createdAt: -1 }
  }
};

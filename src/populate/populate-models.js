module.exports = {
  populateUser: {
    populate: [
      {
        path: "profile_picture",
        select: {}
      }
    ]
  },
  populateStudent: {
    populate: [
      {
        path: "identity_document",
        select: {}
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
  }
};

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
  }
};

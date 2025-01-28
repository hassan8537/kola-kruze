const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: "User"
    },
    university_name: {
      type: String,
      required: true
    },
    identity_document: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "File"
    },
    start_date: {
      type: Date,
      required: true,
      default: Date.now
    },
    end_date: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.start_date;
        },
        message: "End date must be later than start date"
      },
      default: function () {
        return new Date(this.start_date).setFullYear(
          new Date(this.start_date).getFullYear() + 1
        );
      }
    }
  },
  {
    collection: "students",
    timestamps: true
  }
);

const Student = mongoose.model("Student", StudentSchema);
module.exports = Student;

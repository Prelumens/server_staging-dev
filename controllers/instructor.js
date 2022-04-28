import Instructor from "../models/instructor";
import Student from "../models/student";
import User from "../models/user";
import Course from "../models/course";
import Assignment from "../models/assignment";
import Interactive from "../models/interactive";
import Submission from "../models/submission";
import { hashPassword } from "../utils/auth";

export const currentInstructor = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password").exec();
    if (!user.role.includes("Instructor")) {
      return res.sendStatus(403);
    } else {
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

//fetch courses of current instructor
export const instructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 })
      .exec();
    res.json(courses);
  } catch (err) {
    console.log(err);
  }
};

export const studentCount = async (req, res) => {
  try {
    const users = await User.find({ courses: req.body.courseId })
      .select('_id')
      .exec()
    res.json(users)
  } catch (err) {
    console.log(err);
  }
}

export const studentList = async (req, res) => {
  // try {
  //   const { courseId } = req.body;
  //   const students = await User.find({ courses: req.body.courseId })
  //   console.log(req.body.courseId);
  //   return res.json(students);

  // } catch (err) {
  //   console.log(err);
  // }
}

export const getInstructorProfile = async (req, res) => {
  try {
    //get user
    const user = await User.findById(req.user._id).exec();
    // //get profile of the user
    const instructor = await Instructor.findOne({ email: user.email }).exec();
    console.log("instructor Profile", instructor);
    if (instructor)
      return res.json(instructor);
  } catch (err) {
    console.log(err);
  }
}

export const getStudentEnrollmentStatusList = async (req, res) => {
  try {
    const { courseId } = req.params
    console.log("Course ID => ", courseId)

    const students = await User.find({});
    const studentsEnrollmentStatus = []


    //check the enrollment status of each student
    for (let i = 0; i < students.length; i++) {
      //check if the user is a student

      if (students[i].role.includes('Student')) {
        let enrollmentStatus = false
        for (let j = 0; j < students[i].courses.length; j++) {
          const courseIdChecker = students[i].courses[j].toString();
          if (courseId == courseIdChecker) {
            enrollmentStatus = true
            break;
          };
        }
        const studentsEnrollmentStatusItem = {
          student: students[i],
          enrollmentStatus
        }
        studentsEnrollmentStatus.push(studentsEnrollmentStatusItem)
      }
    }
    // console.log("STUDENT ENROLLMENT STATUS => ", studentsEnrollmentStatus)
    res.json(studentsEnrollmentStatus)
  } catch (err) {
    console.log(err)
  }
}

export const addStudentInCourse = async (req, res) => {
  const { studentId, courseId } = req.params;
  try {
    const course = await Course.findById(courseId).exec();
    const student = await User.findById(studentId).exec();
    const { slug } = course;
    const { name } = student;
    const studentUpdate = await User.findByIdAndUpdate(studentId, {
      $addToSet: { courses: course._id },
    },
      { new: true }
    ).exec();

    // to get the time of update
    const currentTimeAndDate = new Date();
    const months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')
    const month = currentTimeAndDate.getMonth();
    const date = months[month] + " " + currentTimeAndDate.getDate() + ", " + currentTimeAndDate.getFullYear()

    var timeSuffix;
    if (currentTimeAndDate.getHours() <= 12) {
      timeSuffix = "am"
    } else {
      timeSuffix = "pm"
    }

    var timeHour;
    if (currentTimeAndDate.getHours() <= 12) {
      timeHour = currentTimeAndDate.getHours()
    } else {
      timeHour = currentTimeAndDate.getHours() - 12
    }

    const time = timeHour + ":" + currentTimeAndDate.getMinutes() + ":" + currentTimeAndDate.getSeconds() + " " + timeSuffix

    //to get the current user
    let user = await User.findById(req.user._id).exec();
    console.log("CURRENT USER => ", user)

    //add notification - student was added in the course
    const notification = await Course.findOneAndUpdate(
      { slug },
      {
        $push: {
          notifications: {
            title: 'Student Added',
            description: `${name} was added to this course by ${user.name}`,
            date: date.toString(),
            time: time.toString()
          }
        },
      },
      { new: true }
    ).exec();
    res.json()
  } catch (err) {
    console.log('free enrollment error', err);
    return res.status(400).send('Enrollment create failed');
  }
}

export const removeStudentInCourse = async (req, res) => {
  const { studentId, courseId } = req.params;
  try {
    const course = await Course.findById(courseId).exec();
    const student = await User.findById(studentId).exec();
    // for (var course in student.courses) {
    //     console.log(student.course.toString())
    // }

    const studentUpdate = await User.findByIdAndUpdate(studentId, {
      $pull: { courses: courseId }
    },
      { new: true }
    ).exec();

    const { slug } = course;
    const { name } = studentUpdate;

    // to get the time of update
    const currentTimeAndDate = new Date();
    const months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')
    const month = currentTimeAndDate.getMonth();
    const date = months[month] + " " + currentTimeAndDate.getDate() + ", " + currentTimeAndDate.getFullYear()

    var timeSuffix;
    if (currentTimeAndDate.getHours() <= 12) {
      timeSuffix = "am"
    } else {
      timeSuffix = "pm"
    }

    var timeHour;
    if (currentTimeAndDate.getHours() <= 12) {
      timeHour = currentTimeAndDate.getHours()
    } else {
      timeHour = currentTimeAndDate.getHours() - 12
    }

    const time = timeHour + ":" + currentTimeAndDate.getMinutes() + ":" + currentTimeAndDate.getSeconds() + " " + timeSuffix

    //to get the current user
    let user = await User.findById(req.user._id).exec();
    console.log("CURRENT USER => ", user)

    //add notification - student was added in the course
    const notification = await Course.findOneAndUpdate(
      { slug },
      {
        $push: {
          notifications: {
            title: 'Student Removed',
            description: `${name} was removed to this course by ${user.name}`,
            date: date.toString(),
            time: time.toString()
          }
        },
      },
      { new: true }
    ).exec();
    console.log("STUDENT => ", student)
    res.json()
  } catch (err) {
    console.log('free enrollment error', err);
    return res.status(400).send('Enrollment create failed');
  }
}

export const getStudentList = async (req, res) => {
  const students = await Student.find({ isActive: true }, { _id: 0 }).sort({ "lastName": 1 });
  res.json(students);
}

export const getStudentRecord = async (req, res) => {
  try {
    const student = await Student.findOne({ username: req.params.student })
      .exec();
    const user = await User.findOne({ username: req.params.student })
      .exec();
    //get all courses of the user
    const courses = await Course.find({ _id: { $in: user.courses } }).exec();

    const filteredCourse = courses.filter(function (item) {
      return item.instructor.toString() === req.user._id.toString()
    });

    const studentSubmissions = await Submission.find({ student: user._id })
      .sort({ "createdAt": 1 })
      .exec();
    console.log('studentSubmissions', studentSubmissions)
    //filter submissions
    let filteredSubmission = [];
    let filteredCourseLength = filteredCourse.length;
    //get filtered submissions
    for (let i = 0; i < filteredCourseLength; i++) {
      for (let j = 0; j < studentSubmissions.length; j++) {
        if (filteredCourse[i]._id.toString() === studentSubmissions[j].course.toString()) {
          filteredSubmission.push(studentSubmissions[j]);
        }
      }
    }
    res.json({
      student: student,
      submissions: filteredSubmission
    });
  } catch (error) {
    console.log(error)
  }
}

export const instructorEditProfileUser = async (req, res) => {
  try {
    const {
      address,
      contact,
      email,
      password,
      image
    } = req.body;

    const hashedPassword = await hashPassword(password);

    const updatedUserInstructor = await User.findByIdAndUpdate(req.user._id, {
      address,
      contact,
      email,
      password: hashedPassword,
      picture: image
    }, { new: true }).exec()

    if (updatedUserInstructor) return res.json(updatedUserInstructor);
  }
  catch (err) {
    console.log(err)
    return res.status(400).send(err.message)
  }
}

export const instructorEditProfileInstructor = async (req, res) => {
  try {
    const {
      address,
      contact,
      email,
      password,
      image
    } = req.body;

    const user = await User.findById(req.user._id).exec();
    const updatedUserInstructor = await Instructor.findOneAndUpdate({ username: user.username }, {
      address,
      contact,
      email,
      password,
      image
    }, { new: true }).exec()

    if (updatedUserInstructor) return res.json(updatedUserInstructor);
  }
  catch (err) {
    console.log(err)
    return res.status(400).send(err.message)
  }
}


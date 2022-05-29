import User from "../models/user";
import Student from "../models/student";
import Quiz from "../models/quiz";
import Assignment from "../models/assignment";
import Interactive from "../models/interactive";
import Course from "../models/course";
import Submission from "../models/submission";
import Completed from "../models/completed"
import AWS from 'aws-sdk';
import { hashPassword } from "../utils/auth";
import axios from "axios"

export const currentStudent = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password").exec();
    if (!user.role.includes("Subscriber")) {
      return res.sendStatus(403);
    } else {
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    //get user
    const user = await User.findById(req.user._id).exec();
    // //get profile of the user
    const student = await Student.findOne({ email: user.email }).exec();
    if (student)
      return res.json(student);
  } catch (err) {
    console.log(err);
  }
}

//FETCH todos TO STUDENT PAGE
export const studentTodo = async (req, res) => {

  //get user
  const user = await User.findById(req.user._id).exec();

  //get all courses of the user
  const courses = await Course.find({ _id: { $in: user.courses } })
    .populate("instructor", "_id name")
    .exec();

  //fetch all to-do
  const quizzes = await Quiz.find({ access: true })
    .populate("instructor", "_id name")
    .select('-questions.options.isCorrect')
    .exec();
  const assignments = await Assignment.find({ access: true })
    .populate("instructor", "_id name")
    .populate('course', '_id name')
    .exec();
  const interactives = await Interactive.find({ access: true })
    .populate("instructor", "_id name")
    .select('-questions.correctAnswer')
    .exec();

  //fetch submitted todos
  const sortedTodos = await Submission.find({ student: req.user._id }).sort({ "createdAt": -1 }).exec();
  const submittedAssignment = await Submission.find({ itemType: "Assignment", student: req.user._id }).exec();
  const submittedInteractive = await Submission.find({ itemType: "Interactive", student: req.user._id }).exec();
  const submittedQuiz = await Submission.find({ itemType: "Quiz", student: req.user._id }).exec();

  //fetch student specific todo
  let studentQuizzes = [];
  let studentAssignment = [];
  let studentInteractive = [];
  let lengthQuizzes = courses && courses.length;

  //get todos
  for (let i = 0; i < lengthQuizzes; i++) {
    for (let j = 0; j < quizzes.length; j++) {
      if (courses[i]._id.toString() === quizzes[j].course.toString() && quizzes[j].instructor !== null) {
        studentQuizzes.push(quizzes[j]);
      }
    }

    for (let j = 0; j < assignments.length; j++) {
      if (courses[i]._id.toString() === assignments[j].course._id.toString() && assignments[j].instructor !== null) {
        studentAssignment.push(assignments[j]);
      }
    }

    for (let j = 0; j < interactives.length; j++) {
      if (courses[i]._id.toString() === interactives[j].course._id.toString() && interactives[j].instructor !== null) {
        studentInteractive.push(interactives[j]);
      }
    }
  }

  //filter quizzes
  let completedLength = submittedQuiz.length;
  for (let i = 0; i < completedLength; i++) {
    studentQuizzes = studentQuizzes.filter(function (item) {
      return item._id.toString() !== submittedQuiz[i].todo.toString()
    });
  }

  //filter interactive
  let submittedInteractiveLength = submittedInteractive.length;
  for (let i = 0; i < submittedInteractiveLength; i++) {
    studentInteractive = studentInteractive.filter(function (item) {
      return item._id.toString() !== submittedInteractive[i].todo.toString()
    });
  }

  //filter assignment
  let submittedAssignmentLength = submittedAssignment.length;
  for (let i = 0; i < submittedAssignmentLength; i++) {
    studentAssignment = studentAssignment.filter(function (item) {
      return item._id.toString() !== submittedAssignment[i].todo.toString()
    });
  }

  res.json({
    quiz: {
      completed: submittedQuiz,
      active: studentQuizzes,
    },
    assignment: {
      active: studentAssignment,
      completed: submittedAssignment
    },
    interactive: {
      active: studentInteractive,
      completed: submittedInteractive
    },
    sortedTodos: sortedTodos

  });
};

export const getInteractive = async (req, res) => {
  try {
    const interactive = await Interactive.findOne({ slug: req.params.slug })
      .populate('course', 'name _id')
      .populate('instructor', 'name _id')
      .exec();
    res.json(interactive)
  } catch (error) {
    console.log(error)
  }
}

export const getQuiz = async (req, res) => {
  try {
    console.log("req", req.params)
    const quiz = await Quiz.findOne({ slug: req.params.slug })
      .select('-questions.options.isCorrect')
      .exec();
    console.log("quiz", quiz)
    if (quiz) {
      const submittedQuiz = await Submission.findOne({ itemType: "Quiz", student: req.user._id, todo: quiz._id }).exec();
      console.log("submittedQuiz", submittedQuiz)
      res.json(submittedQuiz);
    }
  } catch (error) {
    console.log(error)
  }
}

export const getStudentActivity = async (req, res) => {
  const { username } = req.params
  //get current user
  const currentUser = await User.findById(req.user._id).exec();
  // console.log("CURRENT USERNAME", currentUser.username)
  // console.log("USERNAME", username)
  try {
    //get profile of the user
    if (currentUser.username == username) {
      const student = await Student.findOne({ username }).exec();
      if (student && currentUser)
        return res.json(student);
    } else {
      return res
        .status(401)
        .send("Unauthorized");
    }
  } catch (err) {
    console.log(err);
  }
}


export const getCurrentStudent = async (req, res) => {
  const { username } = req.params
  const student = await Student.findOne({ username }).exec();
  return res.json(student)
}

export const viewCourse = async (req, res) => {
  const { studentId, slug } = req.params
  const user = await User.findById(studentId).exec();
  const course = await Course.findOne({ slug }).exec();

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


  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: "View Course",
          description: `Your child viewed the course ${course.name}`,
          studentActivityType: "viewCourse",
          date: date.toString(),
          time: time.toString()
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const viewLesson = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "viewLesson",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const completedLesson = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

  // to get the time of update
  const currentTimeAndDate = new Date();
  const months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December')
  const month = currentTimeAndDate.getMonth()
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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "completedLesson",
          date: date.toString(),
          time: time.toString()
        }
      },
    },
    { new: true }
  ).exec();
  console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const openMessagingApp = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: "Messaging Application",
          description: "Your child opened the messaging application",
          studentActivityType: "message",
          date: date.toString(),
          time: time.toString()
        }
      },
    },
    { new: true }
  ).exec();
  console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const viewQuiz = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "viewQuiz",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const viewAssignment = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "viewAssignment",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const viewInteractive = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "viewInteractive",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const completedInteractive = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "completedInteractive",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const completedQuiz = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "completedQuiz",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const completedAssignment = async (req, res) => {
  const { studentId } = req.params
  const user = await User.findById(studentId).exec();

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

  //add the activity to the log
  const studentActivityAdded = await Student.findOneAndUpdate(
    { email: user.email },
    {
      $push: {
        studentActivity: {
          title: req.body.title,
          description: req.body.description,
          studentActivityType: "completedAssignment",
          date: date.toString(),
          time: time
        }
      },
    },
    { new: true }
  ).exec();
  // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
  return res.json(studentActivityAdded);
}

export const completedCourse = async (req, res) => {
  var isCourseCompleted = false;
  const { studentId, courseId } = req.params
  // console.log("STUDENT ID =>", studentId)
  // console.log("COURSE ID =>", courseId)

  const completeLessons = await Completed.findOne({
    user: studentId,
    course: courseId,
  }).exec();
  var lessonCompleted = completeLessons.lessons.length
  // console.log("NUMBER OF LESSON COMPLETED =>", lessonCompleted)

  const courseLessons = await Course.findById(courseId).exec()
  var lessonInCourse = courseLessons.lessons.length
  // console.log("NUMBER OF LESSON IN A COURSE =>", lessonInCourse)

  if (lessonCompleted == lessonInCourse) {
    isCourseCompleted = true
  }

  if (isCourseCompleted == true) {
    const user = await User.findById(studentId).exec();

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

    //add the activity to the log
    const studentActivityAdded = await Student.findOneAndUpdate(
      { email: user.email },
      {
        $push: {
          studentActivity: {
            title: "Course Completed",
            description: `Your child completed the course ${courseLessons.title}`,
            studentActivityType: "completedCourse",
            date: date.toString(),
            time: time
          }
        },
      },
      { new: true }
    ).exec();
    // console.log("STUDENT ACTIVITY =>", studentActivityAdded)
    return res.json(studentActivityAdded);
  } else {
    return res.json({ message: "Course not completed" })
  }
}

export const studentEditProfileUser = async (req, res) => {
  try {
    const {
      guardian,
      address,
      contact,
      email,
      password,
      image
    } = req.body;

    const hashedPassword = await hashPassword(password);

    const updatedUserStudent = await User.findByIdAndUpdate(req.user._id, {
      guardian,
      address,
      contact,
      email,
      password: hashedPassword,
      picture: image
    }, { new: true }).exec()

    if (updatedUserStudent) return res.json(updatedUserStudent);
  }
  catch (err) {
    console.log(err)
    return res.status(400).send(err.message)
  }
}

export const studentEditProfileStudent = async (req, res) => {
  try {
    const {
      oldGuardianName,
      guardian,
      address,
      contact,
      email,
      password,
      image
    } = req.body;

    const user = await User.findById(req.user._id).exec();
    const updatedUserStudent = await Student.findOneAndUpdate({ username: user.username }, {
      guardian,
      address,
      contact,
      email,
      password,
      image
    }, { new: true }).exec()

    //modify information in chat engine io
    axios
      .get(
        "https://api.chatengine.io/users/",
        { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
      )
      .then(function (response) {
        for (const userInChatEngine of response.data) {
          if (userInChatEngine.username == oldGuardianName) {
            // modify the information in chatengine.io
            console.log("GUARDIAN ID => ", JSON.stringify(userInChatEngine.id));
            axios
              .patch(
                `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                { username: guardian },
                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
              )
              .then(() => { console.log("User update succesful") })
              .catch(() => { console.log("User update failed") })
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });

    if (updatedUserStudent) return res.json(updatedUserStudent);
  }
  catch (err) {
    console.log(err)
    return res.status(400).send(err.message)
  }
}

export const getInteractiveSubmission = async (req, res) => {
  console.log('params', req.params)
  try {
    const submission = await Submission.findOne({ student: req.user._id, todo: req.params.slug })
      .exec();
    console.log('submission', submission)
    res.json(submission)
  } catch (error) {
    console.log(error)
  }
}




import express from "express";

const router = express.Router();

//middleware
import { requireSignin } from "../middlewares";

//controllers
import {
    currentStudent,
    getStudentProfile,
    studentTodo,
    getInteractive,
    getInteractiveSubmission,
    getQuiz,
    getStudentActivity,
    viewCourse,
    getCurrentStudent,
    viewLesson,
    completedLesson,
    openMessagingApp,
    viewQuiz,
    viewAssignment,
    viewInteractive,
    completedQuiz,
    completedInteractive,
    completedAssignment,
    completedCourse,
    studentEditProfileUser,
    studentEditProfileStudent,
} from '../controllers/student';

router.get('/student/student-activity/:username', requireSignin, getStudentActivity)
router.get('/student-profile', requireSignin, getStudentProfile)
router.get('/to-do', requireSignin, studentTodo)
router.get("/student/interactive/:slug", requireSignin, getInteractive)
router.get("/student/interactive-submission/:slug", requireSignin, getInteractiveSubmission)
router.get("/student/quiz/:slug", requireSignin, getQuiz)

//activity log
router.put('/student/viewCourse/:slug/:studentId', viewCourse)
router.put('/student/viewLesson/:studentId', viewLesson)
router.put('/student/completedLesson/:studentId', completedLesson)
router.put('/student/openMessagingApp/:studentId', openMessagingApp)
router.put('/student/viewQuiz/:studentId', viewQuiz)
router.put('/student/viewAssignment/:studentId', viewAssignment)
router.put('/student/viewInteractive/:studentId', viewInteractive)
router.put('/student/completedQuiz/:studentId', completedQuiz)
router.put('/student/completedInteractive/:studentId', completedInteractive)
router.put('/student/completedAssignment/:studentId', completedAssignment)
router.put('/student/completedCourse/:studentId/:courseId', completedCourse)

//get current student
router.get('/student/:username', getCurrentStudent)

//edit profile
router.put('/student/edit-profile-user', requireSignin, studentEditProfileUser)
router.put('/student/edit-profile-student', requireSignin, studentEditProfileStudent)




module.exports = router
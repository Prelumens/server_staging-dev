import express from "express";

const router = express.Router();

//middleware
import { requireSignin } from "../middlewares";

//controllers
import {
    currentInstructor,
    instructorCourses,
    studentCount,
    getInstructorProfile,
    studentList,
    getStudentEnrollmentStatusList,
    addStudentInCourse,
    removeStudentInCourse,
    getStudentList,
    getStudentRecord,
    instructorEditProfileUser,
    instructorEditProfileInstructor
} from '../controllers/instructor';

router.get('/current-instructor', requireSignin, currentInstructor)
router.get("/instructor-courses", requireSignin, instructorCourses);

router.post('/instructor/student-count', requireSignin, studentCount)
router.get('/instructor/student-list', requireSignin, studentList)
router.get('/instructor/profile', requireSignin, getInstructorProfile)

//student enrollment
router.get('/instructor/course/student-enrollment-status-list/:courseId', requireSignin, getStudentEnrollmentStatusList)
router.put('/instructor/course/:courseId/add-student/:studentId', requireSignin, addStudentInCourse)
router.put('/instructor/course/:courseId/remove-student/:studentId', requireSignin, removeStudentInCourse)

//student table
router.get('/instructor/list-student', requireSignin, getStudentList)
router.get('/instructor/student/:student', requireSignin, getStudentRecord)

//edit profile
router.put('/instructor/edit-profile-user', requireSignin, instructorEditProfileUser)
router.put('/instructor/edit-profile-instructor', requireSignin, instructorEditProfileInstructor)

module.exports = router
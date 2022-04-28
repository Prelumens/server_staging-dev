import express from "express";

const router = express.Router();

//middleware
import { requireSignin, isAdmin } from "../middlewares";

//controllers
import {
    currentAdmin,
    getStats,

    registerStudent,
    listStudent,
    removeStudent,
    editStudent,
    getStudent,
    inactiveStudent,

    registerInstructor,
    listInstructor,
    removeInstructor,
    editInstructor,
    getInstructor,
    inactiveInstructor,


    removeUser,
    editUser,

    studentCount,
    getStudentEnrollmentStatusList,
    addStudentInCourse,
    removeStudentInCourse,
    numberOfStudent,

    registerStudentToChatEngine,
    registerGuardianToChatEngine,
    registerInstructorToChatEngine,

    getAdminProfile,
    usernameGenerator,

    adminEditProfileUser,
    listAdmin,
    getAdmin,
    editAdmin,
    chiefEditAdmin,
    inactiveAdmin,
    adminEditProfileAdmin
} from '../controllers/admin';

//get current admin
router.get('/current-admin', requireSignin, isAdmin, currentAdmin)

//CRUD operation for student
router.post("/admin/register-student", requireSignin, isAdmin, registerStudent);
router.put('/admin/edit-student/:slug', requireSignin, isAdmin, editStudent)
router.get('/student/:studentEmail', getStudent)
router.put('/admin/remove-student/:studentEmail', requireSignin, isAdmin, removeStudent)
router.put('/admin/inactive-student/:studentEmail', requireSignin, isAdmin, inactiveStudent)

//Delete and update user
router.put('/admin/edit-user/:slug', requireSignin, isAdmin, editUser)
router.put('/admin/remove-user/:userEmail', requireSignin, isAdmin, removeUser)

//table
router.get("/admin/list-student", requireSignin, isAdmin, listStudent);
router.get("/admin/list-instructor", requireSignin, isAdmin, listInstructor);
router.get("/admin/list-admin", requireSignin, isAdmin, listAdmin);

//CRUD operation for instructor
router.post("/admin/register-instructor", requireSignin, isAdmin, registerInstructor);
router.put('/admin/edit-instructor/:slug', requireSignin, isAdmin, editInstructor)
router.get('/admin/instructor/:slug', getInstructor)
router.put('/admin/remove-instructor/:instructorEmail', requireSignin, isAdmin, removeInstructor)
router.put('/admin/inactive-instructor/:instructorEmail', requireSignin, isAdmin, inactiveInstructor)


//dashboard stats
router.get("/admin", requireSignin, isAdmin, getStats);

router.get("/admin/username-generator", requireSignin, isAdmin, usernameGenerator)

//manage-course
router.post('/admin/student-count', requireSignin, studentCount)
router.get('/admin/course/student-enrollment-status-list/:courseId', requireSignin, getStudentEnrollmentStatusList)
router.put('/admin/course/:courseId/add-student/:studentId', requireSignin, addStudentInCourse)
router.put('/admin/course/:courseId/remove-student/:studentId', requireSignin, removeStudentInCourse)

//check the current number of students in the system
router.get('/admin/number-of-student', requireSignin, numberOfStudent)

// register the user to Chatengine.io
router.post('/admin/register-student-to-chatengine', registerStudentToChatEngine)
router.post('/admin/register-instructor-to-chatengine', registerInstructorToChatEngine)
router.post('/admin/register-guardian-to-chatengine', registerGuardianToChatEngine)

//admin profile
router.get('/admin/profile', requireSignin, getAdminProfile)

//edit profile
router.put('/admin/edit-profile-user', requireSignin, adminEditProfileUser)
router.put('/admin/edit-profile-admin', requireSignin, adminEditProfileAdmin)

//get admin for edit
router.get('/admin/admin/:slug', getAdmin)
router.put('/admin/edit-admin/:slug', requireSignin, isAdmin, editAdmin)
router.put('/admin/chief/edit-admin/:slug', requireSignin, isAdmin, chiefEditAdmin)
router.put('/admin/inactive-admin/:adminEmail', requireSignin, isAdmin, inactiveAdmin)

module.exports = router
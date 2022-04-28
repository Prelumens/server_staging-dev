import express from "express";
import formidable from 'express-formidable'

const router = express.Router();

//middleware
import { requireSignin, isInstructor, isEnrolled } from "../middlewares";

//controllers
import {
    create,
    read,
    removeVideo,
    removeImage,
    addLesson,
    update,
    removeLesson,
    updateLesson,
    publishCourse,
    unpublishCourse,
    unpublishCourseAdmin,
    courses,
    checkEnrollment,
    freeEnrollment,
    userCourses,
    markCompleted,
    listCompleted,
    markIncomplete,
    userUnenrolledCourses,
    readToStudent,
    courseTodo,
    addWiki,
    removeWiki,
    userEnrolledCourses
} from '../controllers/course';
// get routes
router.get('/courses', courses)

// course
router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);
router.get("/course/:slug", read);
router.post("/course/video-remove/:instructorId", requireSignin, removeVideo)

router.post('/course/remove-image', requireSignin, removeImage)
//publish and unpublish - instructor
router.put("/course/publish/:courseId", requireSignin, publishCourse)
router.put("/course/unpublish/:courseId", requireSignin, unpublishCourse)

router.put("/admin/course/unpublish/:courseId", requireSignin, unpublishCourseAdmin)

//CRUD operation
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLesson)
router.post("/course/wiki/:slug/:instructorId", requireSignin, addWiki)
router.put("/course/lesson/:slug/:instructorId", requireSignin, updateLesson)
router.put('/course/:slug/:lessonId', requireSignin, removeLesson)
router.put('/course/:slug/:lessonId/:wikiId', requireSignin, removeWiki)
router.put("/course/wiki/:slug/:instructorId", requireSignin, addWiki)

router.get('/check-enrollment/:courseId', requireSignin, checkEnrollment)

//enrollment
router.post("/free-enrollment/:courseId", requireSignin, freeEnrollment)

router.get('/user-courses', requireSignin, userCourses)
router.get('/user-enrolledCourses', requireSignin, userEnrolledCourses)
router.get('/user-unenrolled-courses', requireSignin, userUnenrolledCourses)
router.get("/user/course/:slug", requireSignin, isEnrolled, readToStudent);

// mark completed
router.post("/mark-completed", requireSignin, markCompleted);
router.post("/list-completed", requireSignin, listCompleted);
router.post("/mark-incomplete", requireSignin, markIncomplete);


router.get('/to-do/:slug', requireSignin, courseTodo)
module.exports = router
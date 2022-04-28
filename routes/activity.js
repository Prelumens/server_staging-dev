import express from "express";

const router = express.Router();

//middleware
import { requireSignin, isAdmin, isInstructor  } from "../middlewares";

//controllers
import {
    assignmentCreate,
    instructorActivities,
    removeAssignment,
    getAssignmentToStudent,
    updateAssignment,
    submitAssignment,
    unsubmitAssignment,

    interactiveCreate,
    removeInteractive,
    updateInteractive,
    submitInteractive,

    returnAssignment,
    activities,
    getAssignment,
    getInteractive,
    getStudentRecord

} from '../controllers/activity';
import {
    quizDelete
} from '../controllers/quiz';
router.post("/assignment/create", requireSignin, isInstructor, assignmentCreate );
router.get("/instructor-activity", requireSignin, instructorActivities);
router.put('/activity/remove-assignment/:slug', requireSignin, removeAssignment)
router.get("/assignment-student/:slug", requireSignin, getAssignmentToStudent);
router.put("/assignment/:slug", requireSignin, updateAssignment);
router.post("/assignment/submit", requireSignin, submitAssignment );
router.put('/assignment/student/unsubmit/', requireSignin, unsubmitAssignment)


router.post("/interactive/create", requireSignin, interactiveCreate );
router.put('/activity/remove-interactive/:slug', requireSignin, removeInteractive)
router.put("/interactive/:slug", requireSignin, updateInteractive);
router.post("/interactive/submit", requireSignin, submitInteractive );


router.put('/activity/remove-quiz/:slug', requireSignin, quizDelete)
router.put("/assignment/:slug/return/", requireSignin, returnAssignment);


router.get('/activities', requireSignin, isAdmin, activities)
router.get('/assignment/:slug', requireSignin, getAssignment)
router.get('/interactive/:slug', requireSignin, getInteractive)
router.get('/admin/student/:student', requireSignin, getStudentRecord)

module.exports = router
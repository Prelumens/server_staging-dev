import express from "express";
const router = express.Router();

//middleware
import { requireSignin, isStudent, isInstructor } from "../middlewares";

//controllers
import {
    quizCreate,
    courseQuizzes,
    getQuiz,
    quizEdit,
    quizDelete,
    questionDelete,
    questionEdit,

    quizToStudent,
    singleQuizStudent,
    submitQuiz,
    checkAttempt,
    userQuizzes,
    quizSummary,

    updateScore,
    returnQuiz
} from '../controllers/quiz';

router.post("/quiz/create", requireSignin, quizCreate );
router.get("/course-quizzes/:courseId", requireSignin, courseQuizzes);
router.get("/quiz-data/:slug", requireSignin, getQuiz);
router.put("/quiz/edit/:slug", requireSignin, quizEdit);
router.put("/quiz/delete/:slug", requireSignin, quizDelete)

router.put("/quiz/delete-question/:quizId/:questionId", requireSignin, questionDelete)
router.put("/quiz/edit-question/:quizId/:questionId", requireSignin, questionEdit)


router.get("/course-quizzes-student/:courseId", requireSignin, quizToStudent);
router.get("/user/single-quiz-student/:slug", requireSignin, singleQuizStudent)
router.post("/quiz/submit/", requireSignin, submitQuiz );
router.get('/check-quiz-attempt/:quizId', requireSignin, checkAttempt)
router.get('/user-quizzes', requireSignin, userQuizzes)

router.get('/student/quiz/summary/:slug', requireSignin, quizSummary)


router.put("/quiz/update-score", requireSignin, isInstructor, updateScore);
router.put("/quiz/return", requireSignin, isInstructor, returnQuiz);

module.exports = router
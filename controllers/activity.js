import AWS from 'aws-sdk';
import Assignment from "../models/assignment";
import Interactive from "../models/interactive";
import Submission from "../models/submission";
import Student from "../models/student";
import User from "../models/user"
import Quiz from "../models/quiz";
import { nanoid } from "nanoid";
import slugify from "slugify";
const mongoose = require('mongoose');
const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
}

const S3 = new AWS.S3(awsConfig)


export const assignmentCreate = async (req, res) => {
    console.log(req.body)
    try {
        //check if assignment exist in database
        const alreadyExist = await Assignment.findOne({
            slug: slugify(req.body.title.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");
        const assignment = await new Assignment({
            slug: slugify(req.body.title),
            course: req.body.assignCourse,
            attachment: req.body.uploaded,
            instructor: req.user._id,
            ...req.body,
        }).save();

        res.json(assignment);
    } catch (error) {
        console.log(error);
    }
}

//fetch activities of current instructor
export const instructorActivities = async (req, res) => {
    try {
        const assignments = await Assignment.find({ instructor: req.user._id })
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();
        const interactives = await Interactive.find({ instructor: req.user._id })
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();
        const quizzes = await Quiz.find({ instructor: req.user._id })
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();
        res.json({
            assignments: assignments,
            interactives: interactives,
            quizzes: quizzes
        });
    } catch (err) {
        console.log(err);
    }
};

export const getAssignmentToStudent = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ slug: req.params.slug })
            .populate('course', '_id name')
            .populate('instructor', '_id name')
            .exec();
        const submission = await Submission.findOne({ todo: assignment._id, student: req.user._id })
            .exec();
        res.json({ assignment, submission })
    } catch (error) {
        console.log(error)
    }
}

export const getAssignment = async (req, res) => {
    console.log('getAssignment', req.body)
    try {
        const assignment = await Assignment.findOne({ slug: req.params.slug })
            .populate('course', '_id name')
            .populate('instructor', '_id name')
            .exec();
        const submissions = await Submission.find({ todo: assignment._id })
            .populate('student', '_id name username picture')
            .sort({ "createdAt": 1 })
            .exec();
        console.log("submissions", submissions)
        res.json({
            assignment: assignment,
            submissions: submissions
        });
    } catch (error) {
        console.log(error)
    }
}
export const removeAssignment = async (req, res) => {
    try {
        const assignmentRemove = await Assignment.findOneAndDelete({ slug: req.params.slug }).exec();
        if (assignmentRemove)
            return res.send({ ok: true })
    } catch (error) {
        console.log(error)
    }
}

export const updateAssignment = async (req, res) => {
    try {

        //check if assignment exist in database
        const alreadyExist = await Assignment.findOne({
            slug: slugify(req.body.title.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");
        const assignment = await Assignment.findOneAndUpdate({ slug: req.params.slug }, {
            slug: slugify(req.body.title),
            course: req.body.assignCourse,
            ...req.body,
        }, { new: true }).exec();
        //Map through the new files array ang append one by one
        if(req.body.newFiles){
            req.body.newFiles.forEach(async (item) => {
                const files = await Assignment.findOneAndUpdate({ slug: req.params.slug }, {
                    $push: {attachment: item}
                }, { new: true }).exec()
            })
        }
        res.json(assignment);
    } catch (error) {
        console.log(error)
    }
}
export const unsubmitAssignment = async (req, res) => {
    try {
        const unsubmit = await Submission.findOneAndDelete({ _id: req.body.id }).exec();
        if (unsubmit)
            return res.send({ ok: true })
    } catch (error) {
        console.log(error)
    }
}
export const interactiveCreate = async (req, res) => {
    try {
        const alreadyExist = await Interactive.findOne({
            slug: slugify(req.body.title.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");
        const interactive = await new Interactive({
            slug: slugify(req.body.title),
            course: req.body.assignCourse,
            instructor: req.user._id,
            instructions: req.body.instructionSet,
            questions: req.body.questions,
            ...req.body,
        }).save();

        res.json(interactive);
    } catch (error) {
        console.log(error);
    }
}
export const removeInteractive = async (req, res) => {
    try {
        const interactiveRemove = await Interactive.findOneAndDelete({ slug: req.params.slug }).exec();
        if (interactiveRemove)
            return res.send({ ok: true })
    } catch (error) {
        console.log(error)
    }
}

export const getInteractive = async (req, res) => {
    try {
        let responses = []
        const interactive = await Interactive.findOne({ slug: req.params.slug })
            .populate('course', '_id name')
            .exec();
        const attempted = await Submission.findOne({ todo: interactive._id });
        if (attempted) {
            responses = await Submission.find({ todo: interactive._id })
                .populate('student', '_id name username picture')
                .sort({ "createdAt": 1 })
                .exec();
        }
        res.json({
            interactive: interactive,
            responses: responses
        });
    } catch (error) {
        console.log(error)
    }
}

export const updateInteractive = async (req, res) => {
    try {
        const alreadyExist = await Interactive.findOne({
            slug: slugify(req.body.title.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");
        const interactive = await Interactive.findOneAndUpdate({ slug: req.params.slug }, {
            slug: slugify(req.body.title),
            course: req.body.assignCourse,
            instructor: req.user._id,
            ...req.body,
        }, { new: true }).exec();
        const reset = await Interactive.updateOne({"slug": req.params.slug},
            { $unset:{
                "instructions": [],
                "questions": [],
              },
            },{new: true }).exec();
        //Map through the new instructions and append one by one
        for (let index = 0; index < req.body.instructionSet.length; index++) {
            const instructionAppend = await Interactive.findOneAndUpdate({ slug: req.params.slug }, {
                $push: {instructions: req.body.instructionSet[index]}
            }, { new: true }).exec()

        }
        for (let index = 0; index < req.body.questions.length; index++) {
            const questionAppend = await Interactive.findOneAndUpdate({ slug: req.params.slug }, {
                $push: {questions: req.body.questions[index]}
            }, { new: true }).exec()

        }
        res.json(interactive);
    } catch (error) {
        console.log(error)
    }
}

export const submitAssignment = async (req, res) => {
    try {
        const assignment = await new Submission({
            submissionDate: req.body.submissionDate,
            student: req.user._id,
            content: req.body.files,
            title: req.body.assignment.title,
            itemType: "Assignment",
            todo: req.body.assignment._id,
            course: req.body.assignment.course,
        }).save();

        res.json(assignment);
    } catch (error) {
        console.log(error)
    }


}

export const submitInteractive = async (req, res) => {
    try {
        const interactive = await new Submission({
            submissionDate: req.body.submissionDate,
            student: req.user._id,
            content: req.body.answers,
            grade: req.body.score,
            title: req.body.interactive.title,
            itemType: "Interactive",
            return: true,
            todo: req.body.interactive._id,
            course: req.body.interactive.course,
        }).save();

        res.json(interactive);
    } catch (error) {
        console.log(error)
    }


}
export const returnAssignment = async (req, res) => {
    try {
        const submission = await Submission.findOneAndUpdate({ _id: req.body.submission._id }, {
            grade: req.body.grade,
            return: true
        }, { new: true }).exec();
        res.json(submission);
    } catch (error) {
        console.log(error)
    }
}

//fetch all activities
export const activities = async (req, res) => {
    try {
        const assignments = await Assignment.find({ access: true })
            .populate('instructor', '_id name')
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();
        const interactives = await Interactive.find({ access: true })
            .populate('instructor', '_id name')
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();
        const quizzes = await Quiz.find({ access: true })
            .populate('instructor', '_id name')
            .populate('course', '_id name')
            .sort({ createdAt: 1 })
            .exec();

        res.json({
            assignments: assignments,
            interactives: interactives,
            quizzes: quizzes
        });
    } catch (err) {
        console.log(err);
    }
};

export const getStudentRecord = async (req, res) => {
    try {
        console.log("params", req.params)
        console.log("user", req.params.student)
        const student = await Student.findOne({ username: req.params.student })
            .exec();
        const user = await User.findOne({ username: req.params.student })
            .exec();
        const submissions = await Submission.find({ student: user._id })
            .sort({ "createdAt": 1 })
            .exec();
        console.log("submissions", submissions)
        res.json({
            student: student,
            submissions: submissions
        });
    } catch (error) {
        console.log(error)
    }
}
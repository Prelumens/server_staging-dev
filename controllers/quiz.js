import Quiz from "../models/quiz";
import Course from "../models/course";
import Student from "../models/student";
import User from "../models/user";
import Submission from "../models/submission";
import slugify from "slugify";
import AWS from 'aws-sdk';
import { createReadStream } from 'fs'
import { readFileSync } from 'fs'
import { nanoid } from "nanoid";
const ObjectId = require('mongodb').ObjectId

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
}

const S3 = new AWS.S3(awsConfig)

export const quizCreate = async (req, res) => {
    console.log("CREATE QUIZ", req.body);
    // return;
    try {
        const alreadyExist = await Quiz.findOne({
            slug: slugify(req.body.title.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");
        console.log("CREATING")

        const quiz = await new Quiz({
            slug: slugify(req.body.title),
            access: req.body.access,
            questions: req.body.questions,
            course: req.body.course,
            instructor: req.user._id,
            deadline: req.body.deadline.dateString,
            ...req.body,
        }).save();
        console.log("CREATE SUCCESS")
        res.json(quiz);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Quiz create failed. Try again.");
    }
};

//fetch quiz of current course
export const courseQuizzes = async (req, res) => {

//   return;
    try {
      const quizzes = await Quiz.find({ course: new ObjectId(req.params.courseId) })
        .sort({ createdAt: -1 })
        .exec();
      res.json(quizzes);
      console.log("FETCHED QUIZ", quizzes);
    } catch (err) {
      console.log(err);
    }
};

export const getQuiz = async (req, res) => {
      try {
        const quiz = await Quiz.findOne({ slug: req.params.slug })
        .populate('course', '_id name')
        .exec();
        const responses = await Submission.find({ todo: quiz._id  })
        .populate('student', '_id name username picture')
        .sort({ createdAt: -1 })
        .exec();
        res.json({
          quiz:quiz,
          responses: responses
        });
      } catch (err) {
        console.log(err);
      }
};

export const quizEdit = async (req, res) => {
  try {

    const alreadyExist = await Quiz.findOne({
        slug: slugify(req.body.title.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).send("Title is taken");
    const quiz = await Quiz.findOneAndUpdate({slug: req.params.slug}, {
      title: req.body.title,
      slug: slugify(req.body.title.toLowerCase()),
      course: req.body.assignCourse,
      access: req.body.access,
      // questions: req.body.questions,
      deadline: req.body.deadline.dateString,
      description: req.body.description,
    },
      {new: true} ).exec();

    //Map through the new files questions and append one by one
    if(req.body.newQuestions){
      req.body.newQuestions.forEach(async (item) => {
          const questionsAppend = await Quiz.findOneAndUpdate({ slug: req.params.slug }, {
              $push: {questions: item}
          }, { new: true }).exec()
      })
    }
    const newSlug = slugify(req.body.title.toLowerCase());
    if (quiz)
    return res.json({quiz, updatedSlug: newSlug});

  } catch (error) {
    console.log(error)
  }
}

export const quizDelete = async (req, res) => {
  try {
    const quizRemove = await Quiz.findOneAndDelete({slug: req.params.slug}).exec();
    if(quizRemove)
    return res.send({ ok: true })
  } catch (error) {
      console.log(error)
  }
}

export const questionDelete = async (req, res) => {
  console.log(req.params)
  try {
    const deletedQuestion = await Quiz.findByIdAndUpdate(req.params.quizId, {
      $pull: { questions: { _id: req.params.questionId } },
    }).exec();
    if(deletedQuestion)
    return res.send({ ok: true })
  } catch (error) {
      console.log(error)
  }
}

export const questionEdit = async (req, res) => {
  try {
    console.log("questionEdit", req.body)
    let questionIndex;
    const quiz = await Quiz.findById(req.params.quizId).exec();
    const updated = await Quiz.updateOne(
      {
        "_id": req.params.quizId,
        "questions._id": req.params.questionId,
      },
      {
        $set:{
            "questions.$.title": req.body.title,
            "questions.$.optionType": req.body.optionType,
            "questions.$.correctAnswer": req.body.correctAnswer,
            "questions.$.image": req.body.image,
        },
      },
      // {
      //   $unset:{
      //       "questions.$.options": [],
      //   },
      // },
      {upsert: true, new: true }
    ).exec();
    const reset = await Quiz.updateOne(
      {
        "_id": req.params.quizId,
        "questions._id": req.params.questionId,
      },
      {
        $unset:{
            "questions.$.options": [],
        },
      },
      {new: true }
    ).exec();
    //Map through the new files array ang append one by one
    console.log('req.body.options', req.body.options)
    for (let index = 0; index < req.body.options.length; index++) {
      const push = await Quiz.updateOne(
        {
          "_id": req.params.quizId,
          "questions._id": req.params.questionId,
        },
        {
          $push:{
              "questions.$.options": req.body.options[index],
          },
        },
        { new: true }
      ).exec();

    }
    // const push = await Quiz.updateOne(
    //   {
    //     "_id": req.params.quizId,
    //     "questions._id": req.params.questionId,
    //   },
    //   {
    //     $set:{
    //         "questions.$.options": req.body.options,
    //     },
    //   },
    //   {upsert: true, new: true }
    // ).exec();

  //   const pullQuestion = await Quiz.findByIdAndUpdate(req.params.quizId, {
  //       $pull: { questions: { _id: req.params.questionId } },
  //   }).exec();

  //   quiz.questions.forEach((item, index) => {
  //     if(item._id.toString() === req.params.questionId){
  //       questionIndex = index
  //     }
  //   })

  //   const pushQuestion = Quiz.findOneAndUpdate(
  //     {_id: req.params.quizId},
  //     {
  //       $push: {
  //         questions: {
  //           $each: [{
  //             title: req.body.title,
  //             optionType: req.body.optionType,
  //             options: req.body.options,
  //             correctAnswer: req.body.correctAnswer,
  //             image: req.body.image
  //           }],
  //             $position: questionIndex
  //         }
  //       }
  //     }, { upsert: true, new: true }
  // ).exec();
  //   console.log("pullQuestion => ", pullQuestion);
  //   console.log("pushQuestion => ", pushQuestion);
    res.json({ ok: true });

  } catch (error) {
    console.log(error);
    return res.status(400).send("Update failed");
  }
}

//FETCH QUIZ TO STUDENT PAGE
export const quizToStudent = async (req, res) => {

        console.log(req.params);
        try {
          const quizzes = await Quiz.find({ course: new ObjectId(req.params.courseId), access: true })
            .select('-questions.options.isCorrect')
            .sort({ createdAt: -1 })
            .exec();
          res.json(quizzes);
        } catch (err) {
          console.log(err);
        }
}

export const singleQuizStudent = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug })
      .select('-questions.options.isCorrect')
      .exec();
    res.json(quiz);
  } catch (err) {
    console.log(err);
  }
}

const EvaluateQuiz = (quizQuestions, attemptedQuestions) => {
	let score = 0
	attemptedQuestions.forEach((question) => {
		const realQues = quizQuestions.find((x) => x.title === question.title)
    // console.log("question",question)
    // console.log("realQues",realQues)
		const correctOptions = realQues.options.filter((op) => op.isCorrect)
		// Error for Quiz with no correct answers
		if (correctOptions.length < 1) return 0

		const attemptedOptions = question.selectedOptions
		if (realQues.optionType === 'check') {
			const weightage = 1 / correctOptions.length
			let qScore = 0
			if (correctOptions.length < question.selectedOptions.length) {
				qScore -=
					(question.selectedOptions.length - correctOptions.length) * weightage
			}
			question.selectedOptions.forEach((selectedOp) => {
				const correct = correctOptions.find((op) => op.text === selectedOp)
				if (correct !== undefined) qScore += weightage
			})
			qScore < 0 ? (score += 0) : (score += qScore)
			console.log('Score : ', score)
		} else if (realQues.optionType === 'radio') {
			if (correctOptions[0].text === attemptedOptions[0]) {
				score++
			}
		}
	})
	return score === 0 ? score : score.toFixed(2)
}
export const uploadAudio = async(req, res) => {
    try {
            const base64Data = new Buffer.from(
              req.body.base.replace(/^data:audio\/\w+;base64,/, ""),
              "base64"
            )
            const params = {
                Bucket: "submissions-prelms-bucket",
                Key: `${nanoid()}.mp3`,
                Body: base64Data,
                ACL: 'public-read',
                ContentType: 'audio/wav'
            }
            //upload to S3
            S3.upload(params, (err, data) => {
                if (err) {
                    console.log("S3 Error", err)
                    // return res.sendStatus(400)
                }
                console.log("data",data)
                res.json(data)
            })
    } catch (err) {
        console.log(err)
    }
}
export const submitQuiz = async (req, res) => {
  let status = "Completed";
  try {
    const submittedQuiz = req.body
    if (!submittedQuiz) return res.status(500).json({ error: 'Incomplete Parameters' })
    const quiz = await Quiz.findById(req.body.quizId).exec();
    const audioQuestions = submittedQuiz.questions.filter(function(item) {
      return item.optionType === 'audio'
    });
    console.log("audioQuestions", audioQuestions)
    console.log("submittedQuiz", submittedQuiz)

    const score = EvaluateQuiz(quiz.questions, submittedQuiz.questions)
    console.log("score", score)
    const quizSubmit = await new Submission({
        submissionDate: req.body.submitDate,
        content:submittedQuiz.questions,
        student: req.user._id,
        grade:score,
        title: req.body.title,
        itemType: "Quiz",
        todo: req.body.quizId,
        course: quiz.course,
    }).save();

    return res.send({ ok: true })
  } catch (error) {
    console.log(error)
  }
}

export const checkAttempt = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const student = await Student.findOne({ email: user.email }).exec();
    // check if course id is found in user courses array
    let ids = [];
    let length = student.attemptedQuiz && student.attemptedQuiz.length;
    for (let i = 0; i < length; i++) {
        ids.push(student.attemptedQuiz[i].quizId.toString());
    }
    res.json({
      status: ids.includes(req.params.quizId),
      quiz: await Quiz.findById(req.params.quizId).exec(),
  });
  } catch (error) {
    console.log(error);
  }
}

//get all quizzes from all courses of student
export const userQuizzes = async (req, res) => {
  //get user
  const user = await User.findById(req.user._id).exec();
  //get all courses of the user
  const courses = await Course.find({ _id: { $in: user.courses } })
      .populate("instructor", "_id name")
      .exec();
    // console.log("Courses", courses)

    const quizzes = await Quiz.find({ access: true })
    .select('-questions.options.isCorrect')
    .exec();
    // console.log("quizzes", quizzes)
    let studentQuizzes = [];
    let length = courses && courses.length;
    let quizLength = quizzes && quizzes.length;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < quizLength; j++) {
        if(courses[i]._id.toString() === quizzes[j].course.toString()){
          studentQuizzes.push(quizzes[j]);
        }
      }
    }
  res.json(studentQuizzes);
};

export const quizSummary = async(req, res) => {
  try {
    const quiz = await Quiz.findOne({slug: req.params.slug }).exec();
    const submittedQuiz = await Submission.findOne({todo: quiz._id, student: req.user._id }).exec();
    res.json({
      quiz: quiz,
      resultData: submittedQuiz
    })
  } catch (error) {
    console.log(error)
  }
}

export const updateScore = async (req, res) => {
    try {
        console.log(req.body)
        const submission = await Submission.findOneAndUpdate({_id: req.body.submission._id}, {
            grade: req.body.grade
        }, {new: true} ).exec();
        res.json(submission);
    } catch (error) {
      console.log(error)
    }
}

export const returnQuiz = async (req, res) => {
  try {
      const submission = await Submission.findOneAndUpdate({_id: req.body.submission._id}, {
          return : true
      }, {new: true} ).exec();
      res.json(submission);
  } catch (error) {
    console.log(error)
  }
}
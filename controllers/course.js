import AWS from 'aws-sdk';
import { nanoid } from "nanoid";
import Course from "../models/course";
import Quiz from "../models/quiz";
import Assignment from "../models/assignment";
import Interactive from "../models/interactive";
import slugify from "slugify";
import { readFileSync } from 'fs'
import User from "../models/user";
import Completed from "../models/completed";
import Submission from "../models/submission";

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
}

const S3 = new AWS.S3(awsConfig)

export const uploadImage = async (req, res) => {
    // console.log(req.body)
    try {
        const { image } = req.body
        if (!image) return res.status(400).send("No image")

        //prepare the image
        const base64Data = new Buffer.from(
            image.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        )

        //split image info
        const type = image.split(';')[0].split('/')[1]
        //image params
        const params = {
            Bucket: "process.env.S3_BUCKET",
            Key: `${nanoid()}.${type}`,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: "base64",
            ContentType: `image/${type}`,
        }

        //upload to S3
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
                return res.sendStatus(400)
            }
            console.log(data)
            res.send(data)
        })

    } catch (err) {

    }
}

export const removeImage = async (req, res) => {
    try {
        const { image } = req.body;
        // image params
        const params = {
            Bucket: image.Bucket,
            Key: image.Key,
        };

        // send remove request to s3
        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err);
                res.sendStatus(400);
            }
            res.send({ ok: true });
        });
    } catch (err) {
        console.log(err);
    }
};

//create course endpoint
//slugify is used to turn spaces into dash
export const create = async (req, res) => {
    // console.log("CREATE COURSE", req.body);
    // return;
    try {
        console.log(req.body);
        //check if course exist in database
        const alreadyExist = await Course.findOne({
            slug: slugify(req.body.name.toLowerCase()),
        });
        if (alreadyExist) return res.status(400).send("Title is taken");

        const enrollmentKey = nanoid(6).toUpperCase();
        console.log("ENROLLMENT KEY => ", enrollmentKey)
        const course = await new Course({
            slug: slugify(req.body.name),
            instructor: req.user._id,
            enrollmentKey,
            ...req.body,
        }).save();

        res.json(course);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Course create failed. Try again.");
    }
};

export const read = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructor', '_id name')
            .exec();
        if (course) {
            const assignments = await Assignment.find({ course: course._id })
                .sort({ createdAt: -1 })
                .exec();
            const interactives = await Interactive.find({ course: course._id })
                .sort({ createdAt: -1 })
                .exec();
            const quizzes = await Quiz.find({ course: course._id })
                .sort({ createdAt: -1 })
                .exec();
            const activities = [...assignments, ...interactives, ...quizzes]
            res.json({
                course: course,
                activities: activities
            })
        }
    } catch (err) {
        console.log(err)
    }
}

export const readToStudent = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug })
            .populate('instructor', '_id name')
            .exec();
        res.json(course)
    } catch (err) {
        console.log(err)
    }
}

export const uploadVideo = async (req, res) => {
    try {
        if (req.user._id !== req.params.instructorId) {
            return res.status(400).send('Unauthorized')
        }

        const { video } = req.files;
        // console.log(video)
        if (!video) return res.status(400).send('No video')

        //video params
        const params = {
            Bucket: "process.env.S3_BUCKET",
            Key: `${nanoid()}.${video.type.split('/')[1]}`,
            Body: readFileSync(video.path),
            ACL: 'public-read',
            ContentType: video.type,
        }

        //upload to s3
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err)
                res.sendStatus(400)
            }
            console.log(data);
            res.send(data)
        })
    } catch (err) {
        console.log(err);
    }
}

export const removeVideo = async (req, res) => {
    try {
        if (req.user._id !== req.params.instructorId) {
            return res.status(400).send('Unauthorized')
        }

        const { Bucket, Key } = req.body;

        //video params
        const params = {
            Bucket,
            Key
        }

        //upload to s3
        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err)
                res.sendStatus(400)
            }
            console.log(data);
            res.send({ ok: true })
        })
    } catch (err) {
        console.log(err);
    }
}

export const addLesson = async (req, res) => {
    try {
        console.log(req.body)
        const { slug, instructorId } = req.params;
        const { title, content, video } = req.body.values;

        if (req.user._id != instructorId) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findOneAndUpdate(
            { slug },
            {
                $push: { lessons: { title, content, video, slug: slugify(title), wikis: req.body.uploaded } },
            },
            { new: true }
        )
            .populate("instructor", "_id name")
            .exec();

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
                        title: 'Lesson Added',
                        description: `${title} was added by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();
        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Add lesson failed");
    }
};

//update course endpoint
export const update = async (req, res) => {
    try {
        const { slug } = req.params;
        console.log(req.body);
        const course = await Course.findOne({ slug }).exec();
        if (req.user._id != course.instructor) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findOneAndUpdate({ _id: course._id }, {
            slug: slugify(req.body.name.toLowerCase()),
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            category: req.body.category,
            published: req.body.published,
            // ...req.body
        }, {
            new: true,
        }).exec();
        const newSlug = slugify(req.body.name.toLowerCase());

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
                        title: 'Course Details Updated',
                        description: `The course details was updated by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();


        res.json({ updated, updatedSlug: newSlug });
    } catch (err) {
        console.log(err);
        return res.status(400).send(err.message);
    }
};

export const removeLesson = async (req, res) => {
    const { slug, lessonId } = req.params;
    const course = await Course.findOne({ slug }).exec();
    console.log("COURSE => ", course.lessons)

    if (req.user._id != course.instructor) {
        return res.status(400).send("Unauthorized");
    }

    const deletedCourse = await Course.findByIdAndUpdate(course._id, {
        $pull: { lessons: { _id: lessonId } },
    }).exec();

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
                    title: 'Lesson Removed',
                    description: `A Lesson was removed by ${user.name}`,
                    date: date.toString(),
                    time: time.toString()
                }
            },
        },
        { new: true }
    ).exec();

    res.json({ ok: true });
};

export const updateLesson = async (req, res) => {
    try {
        const { slug } = req.params;
        const { _id, title, content, video, wikis } = req.body;
        // find post
        const course = await Course.findOne({ slug })
            .select("instructor")
            .exec();
        // compare user for access
        if (req.user._id != course.instructor._id) {
            return res.status(400).send("Unauthorized");
        }

        //execute query to update array content of lesson
        const updated = await Course.updateOne(
            { "lessons._id": _id },
            {
                $set: {
                    "lessons.$.title": title,
                    "lessons.$.content": content,
                    "lessons.$.video": video,
                    "lessons.$.wikis": wikis,
                },
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
                        title: 'Lesson Updated',
                        description: `${title} has been updated by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();

        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Update lesson failed");
    }
};

export const publishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        // find post
        const courseFound = await Course.findById(courseId)
            .exec();
        // is owner?
        console.log(req.user)
        if (req.user._id != courseFound.instructor._id) {
            return res.status(400).send("Unauthorized");
        }

        let course = await Course.findByIdAndUpdate(
            courseId,
            { published: true },
            { new: true }
        ).exec();
        // console.log("course published", course);
        // return;

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
        const { slug } = courseFound
        //add notification - student was added in the course
        const notification = await Course.findOneAndUpdate(
            { slug },
            {
                $push: {
                    notifications: {
                        title: 'Course Published',
                        description: `Published by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();
        res.json(course);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Publish course failed");
    }
};

export const unpublishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        // find post
        const courseFound = await Course.findById(courseId)
            .exec();
        // is owner?
        if (req.user._id != courseFound.instructor._id) {
            return res.status(400).send("Unauthorized");
        }

        let course = await Course.findByIdAndUpdate(
            courseId,
            { published: false },
            { new: true }
        ).exec();
        // console.log("course unpublished", course);
        // return;

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
        const { slug } = courseFound
        //add notification - student was added in the course
        const notification = await Course.findOneAndUpdate(
            { slug },
            {
                $push: {
                    notifications: {
                        title: 'Course Unpublished',
                        description: `Unpublished by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();
        res.json(course);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Unpublish course failed");
    }
};

export const unpublishCourseAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;

        const courseFound = await Course.findById(courseId)
            .exec();

        let course = await Course.findByIdAndUpdate(
            courseId,
            { published: false },
            { new: true }
        ).exec();
        // console.log("course unpublished", course);
        // return;
        res.json(course);

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
        const { slug } = courseFound
        //add notification - student was added in the course
        const notification = await Course.findOneAndUpdate(
            { slug },
            {
                $push: {
                    notifications: {
                        title: 'Course Unpublished',
                        description: `Unpublished by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();

    } catch (err) {
        console.log(err);
        return res.status(400).send("Unpublish course failed");
    }
};



export const courses = async (req, res) => {
    const all = await Course.find({ published: true })
        .populate('instructor', '_id name picture')
        .exec();
    res.json(all)
}

export const checkEnrollment = async (req, res) => {
    const { courseId } = req.params;

    // find courses of the currently logged in user
    const user = await User.findById(req.user._id).exec();

    // check if course id is found in user courses array
    let ids = [];
    let length = user.courses && user.courses.length;
    for (let i = 0; i < length; i++) {
        ids.push(user.courses[i].toString());
    }
    res.json({
        status: ids.includes(courseId),
        course: await Course.findById(courseId).exec(),
    });
};

export const freeEnrollment = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).exec();
        const result = await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { courses: course._id },
        },
            { new: true }
        ).exec()
        res.json()
    } catch (err) {
        console.log('free enrollment error', err);
        return res.status(400).send('Enrollment create failed');
    }
}

export const userEnrolledCourses = async (req, res) => {
    const user = await User.findById(req.user._id).exec();
    const courses = await Course.find({ _id: { $in: user.courses } })
        .populate("instructor", "_id name")
        .exec();
    res.json(courses);
}

export const userCourses = async (req, res) => {
    //get user
    const user = await User.findById(req.user._id).exec();
    var lessonCompleted;
    var lessonInCourse;
    var progress;
    var coursesAlreadyUpdated = false;

    if (user.courses) {
        for (var i in user.courses) {
            var courseId = user.courses[i]._id

            //get the completed lesson of a user in a course
            try {
                const completedLessons = await Completed.findOne({
                    user: user._id,
                    course: courseId._id,
                }).exec();
                if (completedLessons && completedLessons.lessons) {
                    lessonCompleted = completedLessons.lessons.length
                } else {
                    lessonCompleted = 0
                }

            } catch (error) {
                console.log(error)
            }

            //get the actual number of lessons in a course
            try {
                const courseLessons = await Course.findById(courseId).exec();
                lessonInCourse = courseLessons.lessons.length
            } catch (error) {
                console.log
            }

            progress = Math.floor((lessonCompleted / lessonInCourse) * 100)
            // console.log("PROGRESS =>", progress)

            try {
                const updatedCoursesOfUsers = await Course.findByIdAndUpdate(courseId, {
                    progress
                }, { new: true }).exec()
                // console.log("UPDATED COURSE WITH PROGRESS =>", updatedCoursesOfUsers)
            } catch (error) {
                console.log(error)
            }

            if (i == user.courses.length - 1) {
                coursesAlreadyUpdated = true;
            }
        }

        //get all courses of the user
        if (coursesAlreadyUpdated) {
            const courses = await Course.find({ _id: { $in: user.courses } })
                .populate("instructor", "_id name picture")
                .exec();
            res.json(courses);
        }
    } else {
        return res.json({});
    }

};

export const markCompleted = async (req, res) => {
    const { courseId, lessonId } = req.body;
    // console.log(courseId, lessonId);
    // find if user with that course is already created
    const existing = await Completed.findOne({
        user: req.user._id,
        course: courseId,
    }).exec();

    if (existing) {
        // update
        const updated = await Completed.findOneAndUpdate(
            {
                user: req.user._id,
                course: courseId,
            },
            {
                //push new lesson
                $addToSet: { lessons: lessonId },
            }
        ).exec();
        res.json({ ok: true });
    } else {
        // create
        const created = await new Completed({
            user: req.user._id,
            course: courseId,
            lessons: lessonId,
        }).save();
        res.json({ ok: true });
    }
};

export const listCompleted = async (req, res) => {
    try {
        const list = await Completed.findOne({
            user: req.user._id,
            course: req.body.courseId,
        }).exec();
        list && res.json(list.lessons);
    } catch (err) {
        console.log(err);
    }
};

export const markIncomplete = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;

        const updated = await Completed.findOneAndUpdate(
            {
                user: req.user._id,
                course: courseId,
            },
            {
                //remove from lesson array
                $pull: { lessons: lessonId },
            }
        ).exec();
        res.json({ ok: true });
    } catch (err) {
        console.log(err);
    }
};

export const userUnenrolledCourses = async (req, res) => {
    //get user
    const user = await User.findById(req.user._id).exec();
    const enrolledCourses = user.courses
    const allCourses = await Course.find({})
        .populate("instructor", "_id name")
        .exec()

    for (let i = 0; i < enrolledCourses.length; i++) {
        for (let j = 0; j < allCourses.length; j++) {
            if (allCourses[j]._id.toString() === enrolledCourses[i]._id.toString()) {
                allCourses.splice(allCourses[j], 1)
            }

        }
    }
    console.log("All Courses =>", allCourses)
    res.json(allCourses);
}

//FETCH course specific todos TO STUDENT PAGE
export const courseTodo = async (req, res) => {
    //categories
    let missed = [];

    const course = await Course.findOne({ slug: req.params.slug })
    //fetch all to-do
    let quizzes = await Quiz.find({ access: true, course: course._id })
        .select('-questions.options.isCorrect')
        .exec();
    let assignments = await Assignment.find({ access: true, course: course._id })
        .exec();
    let interactives = await Interactive.find({ access: true, course: course._id })
        .select('-questions.correctAnswer')
        .exec();

    //fetch submitted todos
    const submittedAssignment = await Submission.find({ itemType: "Assignment", student: req.user._id }).exec();
    const submittedInteractive = await Submission.find({ itemType: "Interactive", student: req.user._id }).exec();
    const submittedQuiz = await Submission.find({ itemType: "Quiz", student: req.user._id }).exec();
    console.log("submittedQuiz", submittedQuiz)

    //fetch student specific todo
    let studentQuizzes = [];
    let studentAssignment = [];
    let studentInteractive = [];

    //filter quizzes
    let completedLength = submittedQuiz.length;
    for (let i = 0; i < completedLength; i++) {
        quizzes = quizzes.filter(function (item) {
            return item._id.toString() !== submittedQuiz[i].todo.toString()
        });
    }

    //filter interactive
    let submittedInteractiveLength = submittedInteractive.length;
    for (let i = 0; i < submittedInteractiveLength; i++) {
        interactives = interactives.filter(function (item) {
            return item._id.toString() !== submittedInteractive[i].todo.toString()
        });
    }

    //filter assignment
    let submittedAssignmentLength = submittedAssignment.length;
    for (let i = 0; i < submittedAssignmentLength; i++) {
        assignments = assignments.filter(function (item) {
            return item._id.toString() !== submittedAssignment[i].todo.toString()
        });
    }

    console.log("studentInteractive", studentInteractive)
    console.log("studentAssignment", studentAssignment)
    res.json({
        quiz: {
            completed: submittedQuiz,
            active: quizzes,
            missed: missed
        },
        assignment: {
            active: assignments,
            completed: submittedAssignment
        },
        interactive: {
            active: interactives,
            completed: submittedInteractive
        }

    });
};

export const addWiki = async (req, res) => {
    try {
        console.log(req.body)
        const { slug, instructorId } = req.params;
        const { title, description } = req.body.wiki;

        if (req.user._id != instructorId) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findOneAndUpdate(
            { slug },
            {
                $push: { wikis: { title, description, file: req.body.uploaded, slug: slugify(title) } },
            },
            { new: true }
        )
            .populate("instructor", "_id name")
            .exec();
        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Add Wiki failed");
    }
};

export const removeWiki = async (req, res) => {
    console.log('req.params', req.params)
    const { slug, lessonId, wikiId } = req.params;
    const course = await Course.findOne({ slug }).exec();

    if (req.user._id != course.instructor) {
        return res.status(400).send("Unauthorized");
    }
    const deletedWiki = await Course.findByIdAndUpdate({ _id: course._id, lessons: lessonId }, {
        $pull: { wikis: { _id: wikiId } },
    }).exec();

    res.json({ ok: true });
};
export const updateWiki = async (req, res) => {
    try {
        const { slug } = req.params;
        const { _id, title, content, video, free_preview } = req.body;
        // find post
        const course = await Course.findOne({ slug })
            .select("instructor")
            .exec();
        // compare user for access
        if (req.user._id != course.instructor._id) {
            return res.status(400).send("Unauthorized");
        }

        //execute query to update array content of lesson
        const updated = await Course.updateOne(
            { "lessons._id": _id },
            {
                $set: {
                    "lessons.$.title": title,
                    "lessons.$.content": content,
                    "lessons.$.video": video,
                    "lessons.$.free_preview": free_preview,
                },
            },
            { new: true }
        ).exec();

        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Update Wiki failed");
    }
};

//add feedback
export const addFeedback = async (req, res) => {
    try {
        const { slug } = req.params;
        const { criterionOne, criterionTwo, criterionThree, overallExperience, comment } = req.body.feedback;

        const updated = await Course.findOneAndUpdate(
            { slug },
            {
                $push: { courseFeedbacks: { criterionOne, criterionTwo, criterionThree, overallExperience, comment, student: req.user._id} },
            },
            { new: true }
        )
            .populate("instructor", "_id name")
            .exec();

        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Add Feedback failed");
    }
};
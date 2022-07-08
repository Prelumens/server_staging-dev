import User from "../models/user";
import Student from "../models/student";
import Instructor from "../models/instructor";
import Admin from "../models/admin"
import Course from "../models/course";
import AWS from 'aws-sdk';
import { nanoid } from "nanoid";
import { hashPassword, comparePassword } from "../utils/auth";
import axios from "axios"

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
}

const S3 = new AWS.S3(awsConfig)
const SES = new AWS.SES(awsConfig);

export const currentAdmin = async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select("-password").exec();
        if (!user.role.includes("Admin")) {
            return res.sendStatus(403);
        } else {
            res.json({ ok: true });
        }
    } catch (err) {
        console.log(err);
    }
};

export const registerStudent = async (req, res) => {
    try {
        const {
            firstName,
            name,
            username,
            email,
            password,
            guardian,
            image,
            studentNum
        } = req.body;
        let userExist = await User.findOne({ email }).exec();
        let userName = await Student.findOne({ username }).exec();
        let studentNumExist = await Student.findOne({ studentNum }).exec();
        let studentEmail = await Student.findOne({ email }).exec();
        if (userExist) return res.status(400).send("Email already exist.");
        if (studentNumExist) return res.status(400).send("Student Number already exist.");
        if (userName) return res.status(400).send("Username already exist.");
        if (studentEmail) return res.status(400).send("Email already taken")
        // hash password
        const hashedPassword = await hashPassword(password);

        // register user
        const user = new User({
            username: req.body.username,
            name: req.body.firstName + ' ' + req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            role: ["Student"],
            picture: image
        });
        await user.save();
        console.log("saved user", user);

        // register student
        const student = new Student({
            fullName: req.body.lastName + ',' + ' ' + req.body.firstName + ' ' + req.body.middleName,
            password: hashedPassword,
            ...req.body
        });
        await student.save();
        console.log("saved student", student);

        //send email
        const params = {
            Source: process.env.EMAIL_FROM,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                        <!DOCTYPE html>

                        <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
                        <head>
                        <title></title>
                        <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
                        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
                        <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
                        <!--[if !mso]><!-->
                        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css"/>
                        <!--<![endif]-->
                        <style>
                                * {
                                    box-sizing: border-box;
                                }

                                body {
                                    margin: 0;
                                    padding: 0;
                                }

                                a[x-apple-data-detectors] {
                                    color: inherit !important;
                                    text-decoration: inherit !important;
                                }

                                #MessageViewBody a {
                                    color: inherit;
                                    text-decoration: none;
                                }

                                p {
                                    line-height: inherit
                                }

                                @media (max-width:700px) {
                                    .icons-inner {
                                        text-align: center;
                                    }

                                    .icons-inner td {
                                        margin: 0 auto;
                                    }

                                    .fullMobileWidth,
                                    .row-content {
                                        width: 100% !important;
                                    }

                                    .image_block img.big {
                                        width: auto !important;
                                    }

                                    .column .border {
                                        display: none;
                                    }

                                    .stack .column {
                                        width: 100%;
                                        display: block;
                                    }
                                }
                            </style>
                        </head>
                        <body style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
                        <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 680px;" width="680">
                        <tbody>
                        <tr>
                        <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                        <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:45px;">
                        <div align="center" style="line-height:10px"><img alt="Company Logo" src="https://i.pinimg.com/originals/4e/e7/96/4ee7968ff0acb39d6c83360b4acf373e.jpg" style="display: block; height: auto; border: 0; width: 238px; max-width: 100%;" title="Company Logo" width="238"/></div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="text_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                        <tr>
                        <td style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:55px;">
                        <div style="font-family: sans-serif">
                        <div style="font-size: 12px; mso-line-height-alt: 18px; color: #3f3a7d; line-height: 1.5; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;">
                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 57px;"><span style="font-size:38px;"><strong style="font-size:38px;">Hello ${firstName}!</strong></span></p>
                        </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="text_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                        <tr>
                        <td style="padding-bottom:20px;padding-left:20px;padding-right:20px;">
                        <div style="font-family: sans-serif">
                        <div style="font-size: 12px; mso-line-height-alt: 24px; color: #3f3a7d; line-height: 2; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;">
                        <p style="margin: 0; font-size: 14px; text-align: center;"><strong><span style="">You've been invited to become a student. Use these following credentials to login:</span></strong></p>
                        <p style="margin: 0; font-size: 14px; text-align: center;"><span style=""><strong>Username: </strong>${username}</span></p>
                        <p style="margin: 0; font-size: 14px; text-align: center;"><span style=""><strong>Password: </strong>${password}</span></p>
                        </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="10" cellspacing="0" class="button_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td>
                        <div align="center">
                        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://prelumens.xyz/" style="height:44px;width:157px;v-text-anchor:middle;" arcsize="10%" strokeweight="0.75pt" strokecolor="#00BFFF" fillcolor="#00bfff"><w:anchorlock/><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff; font-family:Tahoma, sans-serif; font-size:16px"><![endif]--><a href="https://prelumens.xyz/" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#00bfff;border-radius:4px;width:auto;border-top:1px solid #00BFFF;border-right:1px solid #00BFFF;border-bottom:1px solid #00BFFF;border-left:1px solid #00BFFF;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="font-size: 16px; line-height: 2; word-break: break-word; mso-line-height-alt: 32px;"><strong>Go to Website</strong></span></span></a>
                        <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:10px;">
                        <div align="center" style="line-height:10px"><img alt="Data room" class="fullMobileWidth big" src="https://kit8.net/wp-content/uploads/2020/12/Love_to_study@2x.png" style="display: block; height: auto; border: 0; width: 680px; max-width: 100%;" title="Data room" width="680"/></div>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 680px;" width="680">
                        <tbody>
                        <tr>
                        <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                        <table border="0" cellpadding="0" cellspacing="0" class="icons_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="vertical-align: middle; color: #9d9d9d; font-family: inherit; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
                        <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="vertical-align: middle; text-align: center;">
                        <!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
                        <!--[if !vml]><!-->
                        <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;">
                        <!--<![endif]-->
                        <tr>
                        <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="https://www.designedwithbee.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Designed with BEE" class="icon" height="32" src="https://www.experiment-ev.de/sites/default/files/tile-icons/9-industry.png" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"/></a></td>
                        <td style="font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 15px; color: #9d9d9d; vertical-align: middle; letter-spacing: undefined; text-align: center;"><a href="https://www.designedwithbee.com/" style="color: #9d9d9d; text-decoration: none;" target="_blank">Designed by BEE</a></td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table><!-- End -->
                        </body>
                        </html>
                        `,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Invitation Email for Students",
                },
            },
        };

        const emailSent = SES.sendEmail(params).promise();
        emailSent
            .then((data) => {
                console.log(data);
                res.json(student);
            })
            .catch((err) => {
                console.log(err);
            });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const registerStudentToChatEngine = async (req, res) => {
    const { firstName, lastName, username } = req.body;
    axios
        .put(
            "https://api.chatengine.io/users/",
            { username: firstName + " " + lastName, secret: username },
            { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
        )
        .then(apiRes => {
            res.json({
                body: apiRes.body,
                error: null,
            })
        })
        .catch(() => {
            res.json({
                body: null,
                error: 'There was an error creating the user'
            })
        })
}

export const registerGuardianToChatEngine = async (req, res) => {
    const { guardian, username } = req.body;
    axios
        .put(
            "https://api.chatengine.io/users/",
            { username: guardian, secret: username },
            { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
        )
        .then(apiRes => {
            res.json({
                body: apiRes.body,
                error: null,
            })
        })
        .catch(() => {
            res.json({
                body: null,
                error: 'There was an error creating the user'
            })
        })
}

export const inactiveStudent = async (req, res) => {
    const { studentEmail } = req.params;

    const updatedStudent = await Student.findOneAndUpdate(
        { email: studentEmail },
        { isActive: false },
        { new: true }
    ).exec()

    const user = await Student.findOne({ email: studentEmail }).exec()
    console.log(user)

    try {
        axios
            .get(
                "https://api.chatengine.io/users/",
                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
            )
            .then(function (response) {
                for (const userInChatEngine of response.data) {
                    //modify the instructor in chat engine io
                    var studentUsername = user.firstName + " " + user.lastName
                    if (userInChatEngine.username == studentUsername) {
                        axios
                            .delete(
                                `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                            )
                            .then(() => { console.log("Student remove succesful") })
                            .catch(() => { console.log("Student remove failed") })
                    }

                    if (userInChatEngine.username == user.guardian) {
                        axios
                            .delete(
                                `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                            )
                            .then(() => { console.log("Guardian remove succesful") })
                            .catch(() => { console.log("Guardian remove failed") })
                    }
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error)
    }

    res.json(updatedStudent);
}

export const registerInstructorToChatEngine = async (req, res) => {
    const { firstName, lastName, username } = req.body;
    axios
        .put(
            "https://api.chatengine.io/users/",
            { username: firstName + " " + lastName, secret: username },
            { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
        )
        .then(apiRes => {
            res.json({
                body: apiRes.body,
                error: null,
            })
        })
        .catch(() => {
            res.json({
                body: null,
                error: 'There was an error creating the user'
            })
        })
}


export const registerInstructor = async (req, res) => {
    try {
        console.log(req.body);
        const {
            firstName,
            username,
            name,
            email,
            password,
            image
        } = req.body;
        let userExist = await User.findOne({ email }).exec();
        if (userExist) return res.status(400).send("Email already exist.");

        let userName = await Instructor.findOne({ username }).exec();
        let instructorEmail = await Instructor.findOne({ email }).exec();

        if (userName) return res.status(400).send("Username already exist.");
        if (instructorEmail) return res.status(400).send("Email already taken")

        // hash password
        const hashedPassword = await hashPassword(password);

        // register user
        const user = new User({
            username,
            name: req.body.firstName + ' ' + req.body.lastName,
            email,
            password: hashedPassword,
            role: ["Instructor"],
            picure: image
        });
        await user.save();
        console.log("saved user", user);

        // register instructor
        const instructor = new Instructor({
            fullName: req.body.lastName + ',' + ' ' + req.body.firstName + ' ' + req.body.middleName,
            password: hashedPassword,
            ...req.body
        });
        await instructor.save();
        console.log("saved instructor", instructor);

        //send email
        const params = {
            Source: process.env.EMAIL_FROM,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                        <!DOCTYPE html>

                        <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
                        <head>
                        <title></title>
                        <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
                        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
                        <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
                        <!--[if !mso]><!-->
                        <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css"/>
                        <!--<![endif]-->
                        <style>
                                * {
                                    box-sizing: border-box;
                                }

                                body {
                                    margin: 0;
                                    padding: 0;
                                }

                                a[x-apple-data-detectors] {
                                    color: inherit !important;
                                    text-decoration: inherit !important;
                                }

                                #MessageViewBody a {
                                    color: inherit;
                                    text-decoration: none;
                                }

                                p {
                                    line-height: inherit
                                }

                                @media (max-width:700px) {
                                    .icons-inner {
                                        text-align: center;
                                    }

                                    .icons-inner td {
                                        margin: 0 auto;
                                    }

                                    .fullMobileWidth,
                                    .row-content {
                                        width: 100% !important;
                                    }

                                    .image_block img.big {
                                        width: auto !important;
                                    }

                                    .column .border {
                                        display: none;
                                    }

                                    .stack .column {
                                        width: 100%;
                                        display: block;
                                    }
                                }
                            </style>
                        </head>
                        <body style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
                        <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 680px;" width="680">
                        <tbody>
                        <tr>
                        <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                        <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:45px;">
                        <div align="center" style="line-height:10px"><img alt="Company Logo" src="https://i.pinimg.com/originals/4e/e7/96/4ee7968ff0acb39d6c83360b4acf373e.jpg" style="display: block; height: auto; border: 0; width: 238px; max-width: 100%;" title="Company Logo" width="238"/></div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="text_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                        <tr>
                        <td style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:55px;">
                        <div style="font-family: sans-serif">
                        <div style="font-size: 12px; mso-line-height-alt: 18px; color: #3f3a7d; line-height: 1.5; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;">
                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 57px;"><span style="font-size:38px;"><strong style="font-size:38px;">Hello ${firstName}!</strong></span></p>
                        </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="text_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                        <tr>
                        <td style="padding-bottom:20px;padding-left:20px;padding-right:20px;">
                        <div style="font-family: sans-serif">
                        <div style="font-size: 12px; mso-line-height-alt: 24px; color: #3f3a7d; line-height: 2; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;">
                        <p style="margin: 0; font-size: 14px; text-align: center;"><strong><span style="">You have been invited to become an instructor. Use these following credentials to login:</span></strong></p>
                        <p style="margin: 0; font-size: 14px; text-align: center;"><span style=""><strong>Username: </strong>${username}</span></p>
                        <p style="margin: 0; font-size: 14px; text-align: center;"><span style=""><strong>Password: </strong>${password}</span></p>
                        </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="10" cellspacing="0" class="button_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td>
                        <div align="center">
                        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://prelumens.xyz/" style="height:44px;width:157px;v-text-anchor:middle;" arcsize="10%" strokeweight="0.75pt" strokecolor="#00BFFF" fillcolor="#00bfff"><w:anchorlock/><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff; font-family:Tahoma, sans-serif; font-size:16px"><![endif]--><a href="https://prelumens.xyz/" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#00bfff;border-radius:4px;width:auto;border-top:1px solid #00BFFF;border-right:1px solid #00BFFF;border-bottom:1px solid #00BFFF;border-left:1px solid #00BFFF;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="font-size: 16px; line-height: 2; word-break: break-word; mso-line-height-alt: 32px;"><strong>Go to Website</strong></span></span></a>
                        <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:10px;">
                        <div align="center" style="line-height:10px"><img alt="Data room" class="fullMobileWidth big" src="https://media.istockphoto.com/vectors/-vector-id1231898401?k=20&m=1231898401&s=612x612&w=0&h=uPMsFuYfi4nS-4JQTg_feE9kZCMltVt1cPzRXEl3Img=" style="display: block; height: auto; border: 0; width: 680px; max-width: 100%;" title="Data room" width="680"/></div>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tbody>
                        <tr>
                        <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 680px;" width="680">
                        <tbody>
                        <tr>
                        <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                        <table border="0" cellpadding="0" cellspacing="0" class="icons_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="vertical-align: middle; color: #9d9d9d; font-family: inherit; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
                        <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="vertical-align: middle; text-align: center;">
                        <!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
                        <!--[if !vml]><!-->
                        <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;">
                        <!--<![endif]-->
                        <tr>
                        <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="https://www.designedwithbee.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Designed with BEE" class="icon" height="32" src="https://www.experiment-ev.de/sites/default/files/tile-icons/9-industry.png" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"/></a></td>
                        <td style="font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 15px; color: #9d9d9d; vertical-align: middle; letter-spacing: undefined; text-align: center;"><a href="https://www.designedwithbee.com/" style="color: #9d9d9d; text-decoration: none;" target="_blank">Designed by BEE</a></td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table>
                        </td>
                        </tr>
                        </tbody>
                        </table><!-- End -->
                        </body>
                        </html>
                        `,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Invitation Email for Instructors",
                },
            },
        };

        const emailSent = SES.sendEmail(params).promise();
        emailSent
            .then((data) => {
                console.log(data);
                res.json(instructor);
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again. Please fill all required fields.");
    }
};

export const listInstructor = async (req, res) => {
    const active = await Instructor.find({ isActive: true }, { _id: 0 }).sort({ "lastName": 1 });
    const inactive = await Instructor.find({ isActive: false }, { _id: 0 }).sort({ "lastName": 1 });
    res.json({ active, inactive });
}

export const removeInstructor = async (req, res) => {
    const { instructorEmail } = req.params;
    let removedInstructor;
    try {
        removedInstructor = await Instructor.findOneAndDelete({ email: instructorEmail });
    } catch (err) {
        throw err;
    }
    if (removedInstructor) return res.json({ deleted: true });
};

export const inactiveInstructor = async (req, res) => {
    const { instructorEmail } = req.params;

    const updatedInstructor = await Instructor.findOneAndUpdate(
        { email: instructorEmail },
        { isActive: false },
        { new: true }
    ).exec()

    const user = await Instructor.findOne({ email: instructorEmail }).exec()
    console.log(user)

    try {
        axios
            .get(
                "https://api.chatengine.io/users/",
                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
            )
            .then(function (response) {
                for (const userInChatEngine of response.data) {
                    //modify the instructor in chat engine io
                    var instructorUsername = user.firstName + " " + user.lastName
                    if (userInChatEngine.username == instructorUsername) {
                        axios
                            .delete(
                                `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                            )
                            .then(() => { console.log("Instructor remove succesful") })
                            .catch(() => { console.log("Instructor remove failed") })
                    }
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error)
    }

    res.json(updatedInstructor);
}

export const getInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findOne({ email: req.params.slug }).exec()
        res.json(instructor)
        console.log(instructor)
    } catch (err) {
        console.log(err)
    }
}

export const editInstructor = async (req, res) => {
    try {
        const { oldFirstName, oldLastName } = req.body
        const updatedInstructor = await Instructor.findOneAndUpdate({ email: req.params.slug }, {
            email: req.body.email,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            fullName: req.body.firstName + ' ' + req.body.lastName,
            birthDate: req.body.birthDate,
            gender: req.body.gender,
            contact: req.body.contact,
            address: req.body.address,
            image: req.body.image,
        }, { new: true }).exec()

        try {
            axios
                .get(
                    "https://api.chatengine.io/users/",
                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                )
                .then(function (response) {
                    for (const userInChatEngine of response.data) {
                        //modify the instructor in chat engine io
                        var instructorUsername = oldFirstName + " " + oldLastName
                        if (userInChatEngine.username == instructorUsername) {
                            axios
                                .patch(
                                    `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                    { username: req.body.firstName + " " + req.body.lastName },
                                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                                )
                                .then(() => { console.log("Instructor update succesful") })
                                .catch(() => { console.log("Instructor update failed") })
                        }
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (error) {
            console.log(error)
        }

        if (updatedInstructor) return res.json(updatedInstructor);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}


export const removeImage = async (req, res) => {
    try {
        const { image } = req.body;

        //image params
        const params = {
            Bucket: image.Bucket,
            Key: image.Key,
        }

        //send remove request to S3
        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err)
                res.sendStatus(400);
            }
            res.send({ ok: true })
        })
    } catch (err) {
        console.log(err)
    }
}

export const getStats = async (req, res) => {
    try {
        let student = [];
        let instructor = [];
        let admin = [];
        student[0] = await Student.find().countDocuments();
        instructor[0] = await Instructor.find().countDocuments();
        admin[0] = await Admin.find().countDocuments();
        student[1] = await Student.find({ isActive: true }).countDocuments();
        instructor[1] = await Instructor.find({ isActive: true }).countDocuments();
        admin[1] = await Admin.find({ isActive: true }).countDocuments();
        const course = await Course.find().countDocuments();
        console.log('student', student)
        res.json({ student: student, instructor: instructor, admin: admin, course: course });
    } catch (err) {
        console.log(err)
    }

}


export const usernameGenerator = async (req, res) => {
    try {
        const student = await Student.find().countDocuments();
        const instructor = await Instructor.find().countDocuments();
        const admin = await Admin.find().countDocuments();
        res.json({ student: student, instructor: instructor, admin: admin });
    } catch (err) {
        console.log(err)
    }

}
export const listStudent = async (req, res) => {
    const active = await Student.find({ isActive: true }, { _id: 0 }).sort({ "lastName": 1 });
    const inactive = await Student.find({ isActive: false }, { _id: 0 }).sort({ "lastName": 1 });
    res.json({ active, inactive });
}

export const removeStudent = async (req, res) => {
    const { studentEmail } = req.params;
    let removedStudent;
    try {
        removedStudent = await Student.findOneAndDelete({ email: studentEmail });
    } catch (err) {
        throw err;
    }
    if (removedStudent) return res.json({ deleted: true });
};

export const removeUser = async (req, res) => {
    const { userEmail } = req.params;
    let removedUser;
    try {
        const user = await User.findOne({ email: userEmail }).exec()
        try {
            axios
                .get(
                    "https://api.chatengine.io/users/",
                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                )
                .then(function (response) {
                    for (const userInChatEngine of response.data) {
                        if (userInChatEngine.username == user.name) {
                            axios
                                .delete(
                                    `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                                )
                                .then(() => { console.log("Admin remove succesful") })
                                .catch(() => { console.log("Admin remove failed") })
                        }
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (error) {
            console.log(error)
        }
        removedUser = await User.findOneAndDelete({ email: userEmail });
    } catch (err) {
        throw err;
    }
    if (removedUser) return res.json({ deleted: true });
};

export const getStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ email: req.params.studentEmail }).exec()
        res.json(student)
        console.log("STUDENT TO EDIT =>", student)
    } catch (err) {
        console.log(err)
    }
}

export const editStudent = async (req, res) => {
    try {
        const { oldGuardianName, oldFirstName, oldLastName } = req.body
        const updatedStudent = await Student.findOneAndUpdate({ email: req.params.slug }, {
            email: req.body.email,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            fullName: req.body.firstName + ' ' + req.body.lastName,
            studentNum: req.body.studentNum,
            birthDate: req.body.birthDate,
            gender: req.body.gender,
            contact: req.body.contact,
            address: req.body.address,
            guardian: req.body.guardian,
            image: req.body.image,
            level: req.body.level
        }, { new: true }).exec()

        //modify information of guardian in chat engine io
        try {
            axios
                .get(
                    "https://api.chatengine.io/users/",
                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                )
                .then(function (response) {
                    for (const userInChatEngine of response.data) {
                        //modify the guardian in chat engine io
                        if (userInChatEngine.username == oldGuardianName) {
                            axios
                                .patch(
                                    `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                    { username: req.body.guardian },
                                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                                )
                                .then(() => { console.log("Guardian update succesful") })
                                .catch(() => { console.log("Guardian update failed") })
                        }

                        //modify the student in chat engine io
                        var studentUsername = oldFirstName + " " + oldLastName
                        if (userInChatEngine.username == studentUsername) {
                            axios
                                .patch(
                                    `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                    { username: req.body.firstName + " " + req.body.lastName },
                                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                                )
                                .then(() => { console.log("Student update succesful") })
                                .catch(() => { console.log("Student update failed") })
                        }
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (error) {
            console.log(error)
        }

        if (updatedStudent) return res.json(updatedStudent);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}

export const editUser = async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate({ email: req.params.slug }, {
            email: req.body.email,
            name: req.body.firstName + ' ' + req.body.lastName,
            picture: req.body.image
        }, { new: true }).exec()
        if (updatedUser) return res.json(updatedUser);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}

export const studentCount = async (req, res) => {
    try {
        const users = await User.find({ courses: req.body.courseId })
            .select('_id')
            .exec()
        res.json(users)
    } catch (err) {
        console.log(err);
    }
}

export const getStudentEnrollmentStatusList = async (req, res) => {
    try {
        const { courseId } = req.params
        console.log("Course ID => ", courseId)

        const students = await User.find({});
        const studentsEnrollmentStatus = []


        //check the enrollment status of each student
        for (let i = 0; i < students.length; i++) {
            //check if the user is a student

            if (students[i].role.includes('Student')) {
                let enrollmentStatus = false
                for (let j = 0; j < students[i].courses.length; j++) {
                    const courseIdChecker = students[i].courses[j].toString();
                    if (courseId == courseIdChecker) {
                        enrollmentStatus = true
                        break;
                    };
                }
                const studentsEnrollmentStatusItem = {
                    student: students[i],
                    enrollmentStatus
                }
                studentsEnrollmentStatus.push(studentsEnrollmentStatusItem)
            }
        }
        // console.log("STUDENT ENROLLMENT STATUS => ", studentsEnrollmentStatus)
        res.json(studentsEnrollmentStatus)
    } catch (err) {
        console.log(err)
    }
}

export const addStudentInCourse = async (req, res) => {
    const { studentId, courseId } = req.params;
    try {
        const course = await Course.findById(courseId).exec();
        const student = await User.findById(studentId).exec();
        const { slug } = course;
        const { name } = student;
        const studentUpdate = await User.findByIdAndUpdate(studentId, {
            $addToSet: { courses: course._id },
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
                        title: 'Student Added',
                        description: `${name} was added to this course by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();
        res.json()
    } catch (err) {
        console.log('free enrollment error', err);
        return res.status(400).send('Enrollment create failed');
    }
}

export const removeStudentInCourse = async (req, res) => {
    const { studentId, courseId } = req.params;
    try {
        const course = await Course.findById(courseId).exec();
        const student = await User.findById(studentId).exec();
        // for (var course in student.courses) {
        //     console.log(student.course.toString())
        // }

        const studentUpdate = await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId }
        },
            { new: true }
        ).exec();

        const { slug } = course;
        const { name } = studentUpdate;
        // console.log("STUDENT WITH REMOVED COURSES - COURSE ID => ", student)

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
                        title: 'Student Removed',
                        description: `${name} was removed to this course by ${user.name}`,
                        date: date.toString(),
                        time: time.toString()
                    }
                },
            },
            { new: true }
        ).exec();
        console.log("STUDENT => ", student)
        res.json()
    } catch (err) {
        console.log('free enrollment error', err);
        return res.status(400).send('Enrollment create failed');
    }
}

export const numberOfStudent = async (req, res) => {
    try {
        const currentCountOfStudents = await Student.find().countDocuments();
        console.log("Current number of student => ", currentCountOfStudents)
        res.json(currentCountOfStudents)
    } catch (error) {
        console.log(error)
        return res.status(400).send('Error to count the student');
    }
}

export const getAdminProfile = async (req, res) => {
    try {
        //get user
        const user = await User.findById(req.user._id).exec();
        // //get profile of the user
        const admin = await Admin.findOne({ email: user.email }).exec();
        if (admin)
            return res.json(admin);
    } catch (err) {
        console.log(err);
    }
}

export const adminEditProfileUser = async (req, res) => {
    try {
        const {
            email,
            password,
            image
        } = req.body;

        var updatedUserAdmin
        if (password != "") {
            const hashedPassword = await hashPassword(password);

            updatedUserAdmin = await User.findByIdAndUpdate(req.user._id, {
                email,
                password: hashedPassword,
                picture: image
            }, { new: true }).exec()
        } else {
            updatedUserAdmin = await User.findByIdAndUpdate(req.user._id, {
                email,
                picture: image
            }, { new: true }).exec()
        }

        console.log("UPDATED USER ADMIN =>", updatedUserAdmin)
        if (updatedUserAdmin) return res.json(updatedUserAdmin);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}

export const listAdmin = async (req, res) => {
    const active = await User.find({ role: 'Admin' }, { _id: 0 }).sort({ "lastName": 1 });
    const inactive = await Admin.find({ isActive: false }, { _id: 0 }).sort({ "lastName": 1 });
    res.json({ active, inactive });
}

export const getAdmin = async (req, res) => {
    console.log('getAdmin', req.params.slug)
    try {
        const admin = await User.findOne({ email: req.params.slug }).exec()
        res.json(admin)
        console.log(admin)
    } catch (err) {
        console.log(err)
    }
}
export const editAdmin = async (req, res) => {
    try {
        const { oldName } = req.body
        const updatedUser = await User.findOneAndUpdate({ email: req.params.slug }, {
            name: req.body.name,
            email: req.body.email,
            picture: req.body.image
        }, { new: true }).exec()

        //modify information of admin in chat engine io
        try {
            axios
                .get(
                    "https://api.chatengine.io/users/",
                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                )
                .then(function (response) {
                    for (const userInChatEngine of response.data) {
                        //modify the guardian in chat engine io
                        if (userInChatEngine.username == oldName) {
                            axios
                                .patch(
                                    `https://api.chatengine.io/users/${userInChatEngine.id}/`,
                                    { username: req.body.name },
                                    { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
                                )
                                .then(() => { console.log("Admin update succesful") })
                                .catch(() => { console.log("Admin update failed") })
                        }
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (error) {
            console.log(error)
        }

        if (updatedUser) return res.json(updatedUser);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}

export const chiefEditAdmin = async (req, res) => {
    try {
        const updatedAdmin = await Admin.findOneAndUpdate({ email: req.params.slug }, {
            name: req.body.name,
            email: req.body.email,
            picture: req.body.image
        }, { new: true }).exec()
        if (updatedAdmin) return res.json(updatedAdmin);
    } catch (error) {
        console.log(error)
    }
}

export const inactiveAdmin = async (req, res) => {
    const { adminEmail } = req.params;

    const updatedAdmin = await Admin.findOneAndUpdate(
        { email: adminEmail },
        { isActive: false },
        { new: true }
    ).exec()
    res.json(updatedAdmin);
}

export const adminEditProfileAdmin = async (req, res) => {
    try {
        const {
            email,
            password,
            image
        } = req.body;

        const user = await User.findById(req.user._id).exec();
        const updatedUserAdmin = await Admin.findOneAndUpdate({ username: user.username }, {
            email,
            password,
            picture: image
        }, { new: true }).exec()

        if (updatedUserAdmin) return res.json(updatedUserAdmin);
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err.message)
    }
}
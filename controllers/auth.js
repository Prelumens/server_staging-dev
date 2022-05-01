import User from "../models/user";
import Student from "../models/student";
import Admin from "../models/admin"
import Instructor from "../models/instructor"
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import AWS from "aws-sdk";
import axios from "axios"

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
    try {
        console.log(req.body);
        const { username, name, email, password, image } = req.body;
        // validation
        if (!name) return res.status(400).send("Name is required");
        if (!password || password.length < 6) {
            return res
                .status(400)
                .send("Password is required and should be min 6 characters long");
        }
        let userExist = await User.findOne({ email }).exec();
        if (userExist) return res.status(400).send("Email is taken");

        let usernameExist = await User.findOne({ username }).exec()
        if (usernameExist) return res.status(400).send("Username is taken")

        // hash password
        const hashedPassword = await hashPassword(password);

        // register Admin to User Collection
        const user = new User({
            username,
            name,
            email,
            password: hashedPassword,
            role: ['Admin'],
            picture: image
        });
        await user.save();
        // console.log("saved user", user);

        // register Admin to User Collection
        const admin = new Admin({
            username,
            name,
            email,
            password,
            picture: image
        });
        await admin.save();
        // console.log("saved admin", admin);

        axios
            .put(
                "https://api.chatengine.io/users/",
                { username: name, secret: username },
                { headers: { "Private-Key": "3fe9462b-57e2-4fd9-8ad5-e55c50c4fd68" } }
            )
            .then(() => { console.log("Admin register succesful") })
            .catch(() => { console.log("Admin register failed") })

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
                            <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 57px;"><span style="font-size:38px;"><strong style="font-size:38px;">Hello ${name}!</strong></span></p>
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
                            <p style="margin: 0; font-size: 14px; text-align: center;"><strong><span style="">You've been invited to become an admin. Use these following credentials to login:</span></strong></p>
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
                            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.staging-dev-prelumens.xyz/" style="height:44px;width:157px;v-text-anchor:middle;" arcsize="10%" strokeweight="0.75pt" strokecolor="#00BFFF" fillcolor="#00bfff"><w:anchorlock/><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff; font-family:Tahoma, sans-serif; font-size:16px"><![endif]--><a href="http://www.staging-dev-prelumens.xyz/" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#00bfff;border-radius:4px;width:auto;border-top:1px solid #00BFFF;border-right:1px solid #00BFFF;border-bottom:1px solid #00BFFF;border-left:1px solid #00BFFF;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="font-size: 16px; line-height: 2; word-break: break-word; mso-line-height-alt: 32px;"><strong>Go to Website</strong></span></span></a>
                            <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                            </div>
                            </td>
                            </tr>
                            </table>
                            <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tr>
                            <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:3px;">
                            <div align="center" style="line-height:10px"><img alt="Data room" class="fullMobileWidth big" src="https://img.freepik.com/free-vector/instruction-correct-pose-during-office-work-flat-illustration-cartoon-worker-sitting-desk-with-right-posture-healthy-back-looking-computer_74855-14087.jpg?w=2000" style="display: block; height: auto; border: 0; width: 680px; max-width: 100%;" title="Data room" width="680"/></div>
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
                    Data: "Invitation Email for Admin",
                },
            },
        };

        const emailSent = SES.sendEmail(params).promise();
        emailSent
            .then((data) => {
                console.log(data);
                return res.json({ ok: true });
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const registerAdminToChatEngine = async (req, res) => {
    const { name, username } = req.body;

}

export const login = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;

        //check if the email is username or email
        const emailIsTheInput = email.includes("@")

        var user;
        if (emailIsTheInput) {
            //treat the input as email
            user = await User.findOne({ email }).exec();
        } else {
            // set the value of email to username
            user = await User.findOne({ username: email }).exec();
        }

        if (!user) return res.status(400).send("No user found");
        // check password
        const match = await comparePassword(password, user.password);
        if (!match) return res.status(400).send('Wrong Password')

        // create signed jwt
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        // return user and token to client, exclude hashed password
        user.password = undefined;
        // send token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            // secure: true, // only works on https
        });
        // send user as json response
        res.json(user);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.json({ message: "Signout success" });
    } catch (err) {
        console.log(err);
    }
};

export const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password").exec();
        // console.log("CURRENT_USER", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
    }
};

export const currentUserForSideNav = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password").exec();
        return res.json(user);
    } catch (err) {
        console.log(err);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // console.log(email);
        const shortCode = nanoid(6).toUpperCase();
        const user = await User.findOneAndUpdate(
            { email },
            { passwordResetCode: shortCode }
        );

        if (!user) return res.status(400).send("User not found");

        // prepare for email
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
                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 57px;"><span style="font-size:38px;"><strong style="font-size:38px;">${shortCode}</strong></span></p>
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
                        <p style="margin: 0; font-size: 14px; text-align: center;"><strong><span style="">We have received a notice that you have forgotten your password. <br/>To reset your password, enter the code shown above.</span></strong></p>
                        <p style="margin: 0; font-size: 14px; text-align: center;"><span style="">Never share that code to anyone</span></p>
                        </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        <table border="0" cellpadding="10" cellspacing="0" class="button_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" class="image_block" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tr>
                        <td style="width:100%;padding-right:0px;padding-left:0px;padding-top:10px;">
                        <div align="center" style="line-height:10px"><img alt="Data room" class="fullMobileWidth big" src="https://thumbs.dreamstime.com/b/man-key-near-computer-account-login-password-vector-male-character-design-concept-business-illustration-landing-page-158893916.jpg" style="display: block; height: auto; border: 0; width: 680px; max-width: 100%;" title="Data room" width="680"/></div>
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
                    Data: "Reset Password",
                },
            },
        };

        const emailSent = SES.sendEmail(params).promise();
        emailSent
            .then((data) => {
                console.log(data);
                res.json({ ok: true });
            })
            .catch((err) => {
                res.status(400).send("Email is not registered to Simple Email Services")
            });
    } catch (err) {
        console.log(err);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        // console.table({ email, code, newPassword });
        const hashedPassword = await hashPassword(newPassword);

        const user = await User.findOneAndUpdate(
            {
                email,
                passwordResetCode: code,
            },
            {
                password: hashedPassword,
                passwordResetCode: "",
            }
        ).exec();
        if (user && user.role.includes("Admin")) {
            const admin = await Admin.findOneAndUpdate({ email }, {
                password: newPassword
            }).exec()
        }
        if (user && user.role.includes("Instructor")) {
            const instructor = await Instructor.findOneAndUpdate({ email }, {
                password: newPassword
            }).exec()
        }
        if (user && user.role.includes("Student")) {
            const student = await Student.findOneAndUpdate({ email }, {
                password: newPassword
            }).exec()
        }
        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error! Try again.");
    }
};


//admin auth
export const adminAuthentication = (req, res, next) => {
    if (req.user.role !== "Admin") {
        return res.status(401).json({
            err: "Access Denied"
        })
    }
    next()
}

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).exec();
        return res.json(user);
    } catch (err) {
        console.log(err);
    }
};

export const getCurrentParent = async (req, res) => {
    const user = await User.findById(req.user._id).exec();
    if (user) {
        const parent = await Student.findOne({ username: user.username }).exec()
        return res.json(parent)
    }

}

export const agreeToTermsAndCondition = async (req, res) => {
    const { id } = req.params
    console.log(id)

    const updatedUser = await User.findByIdAndUpdate(
        id,
        { agreedToTermsAndCondition: true },
        { new: true }
    ).exec();
    res.json(updatedUser);
}

export const settings = async (req, res) => {
    const { id } = req.params
    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            parentMode: req.body.parentMode,
            screenTimeoutEnabled: req.body.screenTimeoutEnabled,
            screenTimeout: req.body.screenTimeout * 1000 * 60
        }, { new: true }).exec()
        res.json(updatedUser);
    } catch (error) {
        console.log(error)
    }
}

export const setParentMode = async (req, res) => {
    try {
        const updatedParentMode = await User.findByIdAndUpdate(req.user._id, {
            parentMode: true,
        }, { new: true }).exec()
        console.log("PARENT MODE =>", updatedParentMode)
        res.json(updatedParentMode);
    } catch (err) {
        console.log(err);
    }
}

export const setTimeOutDisabled = async (req, res) => {
    const { id } = req.params
    try {
        const updatedscreenTimeoutEnabled = await User.findByIdAndUpdate(id, {
            screenTimeoutEnabled: false,
        }, { new: true }).exec()
        console.log("SCREEN TIME OUT ENABLED =>", updatedscreenTimeoutEnabled)
        res.json(updatedscreenTimeoutEnabled);
    } catch (err) {
        console.log(err);
    }
}

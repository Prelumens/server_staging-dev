import express from "express";
import formidable from 'express-formidable'

const router = express.Router();

//middleware
import { requireSignin } from "../middlewares";

//controllers
import {
    uploadImage,
    uploadVideo,
    uploadFile,
    uploadAudio
} from '../controllers/upload';


router.post('/s3/upload', requireSignin, uploadImage)
router.post("/s3/video-upload/:instructorId", requireSignin, formidable(), uploadVideo)
router.post("/s3/upload-file", requireSignin, uploadFile );
router.post("/s3/audio-upload", requireSignin, uploadAudio );

module.exports = router
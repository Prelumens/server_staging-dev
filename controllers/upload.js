import AWS from 'aws-sdk';
import { nanoid } from "nanoid";
import { readFileSync } from 'fs'
import slugify from "slugify";

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
        const { image, folder } = req.body
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
            Bucket: process.env.S3_BUCKET,
            Key: `${folder}/${nanoid()}.${type}`,
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
      console.log(err)
      return res.status(400).send("Image Upload failed. Try again.");
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
          Bucket: process.env.S3_BUCKET,
          Key: `videos/${nanoid()}.${video.type.split('/')[1]}`,
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

export const uploadFile = async(req, res) => {
  let url =[];
  const length = req.body.fileList.length
  try {
      req.body.fileList.map(file => {
          //prepare the file
          const base64Data = new Buffer.from(file.base64,"base64")
          // console.log('base64Data',base64Data)
          const params = {
              Bucket: process.env.S3_BUCKET,
              Key: `${req.body.folder}/${slugify(file.name)}`,
              Body: base64Data,
              ACL: 'public-read',
              ContentType: file.type
          }
          //upload to S3
          S3.upload(params, (err, data) => {
              if (err) {
                  console.log("S3 Error", err)
                  return res.sendStatus(400)
              }
              data.name = file.name
              url.push(data);
              if(length === url.length){
                  console.log("url",url)
                  res.json(url);
              }
          })
        })
  } catch (err) {
      console.log('uploadFile',err)
      return res.status(400).send("File Upload failed. Try again.");
  }
}

export const uploadAudio = async(req, res) => {
    try {
            const base64Data = new Buffer.from(
              req.body.base.replace(/^data:audio\/\w+;base64,/, ""),
              "base64"
            )
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: `audio/${nanoid()}.mp3`,
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
// const express = require("express");
// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const streamifier = require("streamifier");

// require("dotenv").config();
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = multer.memoryStorage();
// const upload = multer({storage});


// const router = express.Router();
// router.post("/",upload.single("image"),async (req,res) => {
//     try {
//         if(!req.file){
//             return res.status(400).json({message: "No file Uploaded"});
//         }
//         const streamUpload = (fileBuffer) => {
//             return new Promise((resolve,reject) => {
//                 const stream = cloudinary.uploader.upload_stream((error,result) => {
//                     if(result) {
//                         resolve(result);
//                     } else {
//                         reject(error);
//                     }
//                 });

//                 streamifier.createReadStream(fileBuffer).pipe(stream);
//             });
//         };

//         const result = await streamUpload(req.file.buffer);
//         res.json({imageUrl: result.secure_url});
//     } catch (error) {
//         console.log(error);
//         res.status(500).send("Server Error");
//     }
// })

// module.exports = router;

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

require("dotenv").config();

// Log Cloudinary config (KHÔNG log API_SECRET trong production)
console.log("Cloudinary Config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING",
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
            return;
        }
        cb(null, true);
    }
});

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
    try {
        console.log("📤 Upload request received");
        console.log("File info:", req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : "NO FILE");

        if (!req.file) {
            console.error("❌ No file uploaded");
            return res.status(400).json({message: "No file uploaded"});
        }

        console.log("☁️ Uploading to Cloudinary...");

        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "ecommerce-products",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (result) {
                            console.log("✅ Cloudinary upload success:", result.secure_url);
                            resolve(result);
                        } else {
                            console.error("❌ Cloudinary upload error:", error);
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };

        const result = await streamUpload(req.file.buffer);
        
        console.log("✅ Image uploaded successfully");
        res.json({imageUrl: result.secure_url});
    } catch (error) {
        console.error("❌ Upload error:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
});

module.exports = router;
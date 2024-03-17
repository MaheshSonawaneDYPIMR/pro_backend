import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("File Destination:", "./public/temp"); // Log the destination path
        cb(null, "./public/temp");
    },
    filename: (req, file, cb) => {
        console.log("Original Filename:", file.originalname); // Log the original filename
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage: storage });

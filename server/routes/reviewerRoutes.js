const express = require("express");

const upload = require("../middleware/reviewerUpload");
const {
  uploadReviewer,
  listReviewers,
  listReviewerCategories,
  renameReviewer,
  deleteReviewer,
  handleReviewerUploadError,
} = require("../controllers/reviewerController");

const router = express.Router();

router.post("/uploadReviewer", upload.single("file"), uploadReviewer);
router.post("/api/upload-reviewer", upload.single("file"), uploadReviewer);
router.get("/api/reviewers", listReviewers);
router.get("/api/reviewer-categories", listReviewerCategories);
router.post("/api/rename-reviewer", renameReviewer);
router.delete("/api/reviewer/:id", deleteReviewer);
router.use(handleReviewerUploadError);

module.exports = router;

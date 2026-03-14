const { uploadBuffer } = require("../config/cloudinary");
const { query } = require("../config/database");

function toOptionalText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

async function uploadReviewer(req, res) {
  const title = toOptionalText(req.body.title);
  const description = toOptionalText(req.body.description);
  const subject = toOptionalText(req.body.subject || req.body.category);
  const uploadedBy = Number(req.body.userId);

  if (!title || !subject) {
    return res.status(400).json({
      success: false,
      message: "title and subject are required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "A PDF file is required",
    });
  }

  const cloudinaryFile = await uploadBuffer(
    req.file.buffer,
    {
      folder: "reviewers",
      resource_type: "raw",
      public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
      format: "pdf",
    },
  );

  const result = await query(
    `
      INSERT INTO reviewers (
        title,
        description,
        subject,
        category,
        file_url,
        file_path,
        file_size,
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        description,
        subject,
        category,
        file_url,
        file_path,
        file_size,
        uploaded_by,
        created_at
    `,
    [
      title,
      description,
      subject,
      subject,
      cloudinaryFile.secure_url,
      cloudinaryFile.secure_url,
      req.file.size,
      Number.isInteger(uploadedBy) && uploadedBy > 0 ? uploadedBy : null,
    ],
  );

  res.status(201).json({
    success: true,
    message: "Reviewer uploaded successfully",
    fileUrl: cloudinaryFile.secure_url,
    reviewer: result.rows[0],
  });
}

async function listReviewers(req, res) {
  const result = await query(
    `
      SELECT
        reviewers.id,
        reviewers.title,
        reviewers.description,
        reviewers.subject,
        COALESCE(reviewers.category, reviewers.subject) AS category,
        reviewers.file_url,
        COALESCE(reviewers.file_path, reviewers.file_url) AS file_path,
        reviewers.file_size,
        reviewers.uploaded_by,
        reviewers.created_at,
        users.username AS uploader
      FROM reviewers
      LEFT JOIN users
        ON reviewers.uploaded_by = users.id
      ORDER BY created_at DESC
    `,
  );

  res.json({
    success: true,
    reviewers: result.rows,
  });
}

async function listReviewerCategories(req, res) {
  const result = await query(
    `
      SELECT DISTINCT COALESCE(subject, category) AS category
      FROM reviewers
      WHERE COALESCE(subject, category) IS NOT NULL
        AND TRIM(COALESCE(subject, category)) <> ''
      ORDER BY category ASC
    `,
  );

  res.json({
    success: true,
    categories: result.rows,
  });
}

async function renameReviewer(req, res) {
  const id = Number(req.body.id);
  const title = toOptionalText(req.body.title);

  if (!Number.isInteger(id) || id <= 0 || !title) {
    return res.status(400).json({
      success: false,
      message: "Valid id and title are required",
    });
  }

  const result = await query(
    `
      UPDATE reviewers
      SET title = $1
      WHERE id = $2
      RETURNING id, title
    `,
    [title, id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Reviewer not found",
    });
  }

  res.json({
    success: true,
    reviewer: result.rows[0],
  });
}

async function deleteReviewer(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid reviewer id",
    });
  }

  const result = await query(
    "DELETE FROM reviewers WHERE id = $1 RETURNING id",
    [id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Reviewer not found",
    });
  }

  res.json({
    success: true,
    message: "Reviewer deleted successfully",
  });
}

function handleReviewerUploadError(error, req, res, next) {
  if (!error) {
    next();
    return;
  }

  res.status(400).json({
    success: false,
    message: error.message || "Failed to process reviewer upload",
  });
}

module.exports = {
  uploadReviewer,
  listReviewers,
  listReviewerCategories,
  renameReviewer,
  deleteReviewer,
  handleReviewerUploadError,
};

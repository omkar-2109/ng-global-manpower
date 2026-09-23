const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads/candidates');
const JOB_BANNERS_DIR = path.join(__dirname, '../../public/uploads/job-banners');

// Ensure upload directories exist
[UPLOADS_DIR, JOB_BANNERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper: Sanitize candidate name for safe file naming
function sanitizeName(name) {
  if (!name) return 'Candidate';
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

// Multer storage memory storage for pre-processing/compression
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'application/pdf'
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type (${file.mimetype}). Only PDF, JPG, and PNG are accepted.`));
    }
  }
});

// Strict user requirement: Merge order must always be:
// 1. CV (Resume) -> 2. Experience (Certificates) -> 3. Passport -> 4. Pic (Photo) -> 5. Others
function getDocPriority(type) {
  const t = (type || '').toLowerCase();
  if (t === 'resume' || t === 'cv' || t.includes('resume') || t.includes('cv') || t.includes('bio')) return 1;
  if (t === 'certificates' || t === 'experience' || t.includes('experience') || t.includes('cert')) return 2;
  if (t === 'passport_copy' || t === 'passport' || t.includes('passport')) return 3;
  if (t === 'photo' || t === 'pic' || t.includes('photo') || t.includes('pic')) return 4;
  if (t === 'driving_license' || t.includes('license') || t.includes('driving')) return 5;
  if (t === 'medical_report' || t.includes('medical') || t.includes('gamca')) return 6;
  return 7;
}

const documentService = {
  getDocPriority,

  uploadFields: upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'certificates', maxCount: 3 },
    { name: 'passport_copy', maxCount: 2 },
    { name: 'photo', maxCount: 1 },
    { name: 'driving_license', maxCount: 1 },
    { name: 'medical_report', maxCount: 1 },
    { name: 'additional_docs', maxCount: 2 }
  ]),

  adminUploadFields: upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'certificates', maxCount: 3 },
    { name: 'passport_copy', maxCount: 2 },
    { name: 'photo', maxCount: 1 },
    { name: 'driving_license', maxCount: 1 },
    { name: 'medical_report', maxCount: 1 },
    { name: 'additional_docs', maxCount: 3 }
  ]),

  uploadFlyer: upload.single('job_flyer'),
  uploadJobGraphic: upload.single('job_graphic'),

  /**
   * Process and save optional job graphic / poster flyer
   */
  async processJobGraphic(file) {
    if (!file || !file.buffer) return null;
    try {
      const filename = `job_poster_${Date.now()}.jpg`;
      const outputPath = path.join(JOB_BANNERS_DIR, filename);

      await sharp(file.buffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 88, progressive: true })
        .toFile(outputPath);

      return `/uploads/job-banners/${filename}`;
    } catch (err) {
      console.error('[DocService] Error processing job graphic:', err.message);
      return null;
    }
  },

  /**
   * Process, compress, and save candidate files named after the candidate
   */
  async processCandidateFiles(candidateName, filesByField, existingSubdir = null) {
    const safeName = sanitizeName(candidateName);
    const timestamp = Date.now();
    const candidateSubdir = existingSubdir && fs.existsSync(existingSubdir)
      ? existingSubdir
      : path.join(UPLOADS_DIR, `${safeName}_${timestamp}`);

    if (!fs.existsSync(candidateSubdir)) {
      fs.mkdirSync(candidateSubdir, { recursive: true });
    }

    const processedFiles = [];

    for (const [fieldName, files] of Object.entries(filesByField)) {
      if (!files || !files.length) continue;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPdf = file.mimetype.toLowerCase() === 'application/pdf';
        const docLabel = fieldName.replace(/_/g, '-');
        const indexSuffix = files.length > 1 ? `_${i + 1}` : '';

        if (isPdf) {
          // Name: CandidateName_DocType_timestamp.pdf
          const filename = `${safeName}_${docLabel}${indexSuffix}_${timestamp}.pdf`;
          const filePath = path.join(candidateSubdir, filename);
          fs.writeFileSync(filePath, file.buffer);

          processedFiles.push({
            type: fieldName,
            originalName: file.originalname,
            filename,
            path: `/uploads/candidates/${safeName}_${timestamp}/${filename}`,
            absolutePath: filePath,
            mime: 'application/pdf',
            size: file.buffer.length
          });
        } else {
          // Image file: compress with Sharp (high quality JPEG, max width 1920)
          const filename = `${safeName}_${docLabel}${indexSuffix}_${timestamp}.jpg`;
          const filePath = path.join(candidateSubdir, filename);

          const compressedBuffer = await sharp(file.buffer)
            .resize({
              width: 1920,
              height: 1920,
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer();

          fs.writeFileSync(filePath, compressedBuffer);

          processedFiles.push({
            type: fieldName,
            originalName: file.originalname,
            filename,
            path: `/uploads/candidates/${safeName}_${timestamp}/${filename}`,
            absolutePath: filePath,
            mime: 'image/jpeg',
            size: compressedBuffer.length
          });
        }
      }
    }

    return {
      candidateFolder: candidateSubdir,
      files: processedFiles
    };
  },

  /**
   * Merge all documents (JPG + PNG + PDF) into a single master PDF
   */
  async mergeCandidateDossier(candidateName, processedFiles, candidateSubdir) {
    if (!processedFiles || processedFiles.length === 0) {
      return null;
    }

    const safeName = sanitizeName(candidateName);
    const mergedDoc = await PDFDocument.create();

    // Standard A4 dimensions in points: 595.28 x 841.89
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    // Strict user requirement: Merge order: 1. CV, 2. Experience, 3. Passport, 4. Pic, 5. Others
    const sortedFiles = [...processedFiles].sort((a, b) => {
      const pA = getDocPriority(a.type);
      const pB = getDocPriority(b.type);
      return pA - pB;
    });

    for (const fileInfo of sortedFiles) {
      const filePath = fileInfo.absolutePath;
      if (!fs.existsSync(filePath)) continue;

      const fileBuffer = fs.readFileSync(filePath);

      if (fileInfo.mime === 'application/pdf') {
        try {
          const sourcePdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const copiedPages = await mergedDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
          copiedPages.forEach(page => mergedDoc.addPage(page));
        } catch (pdfErr) {
          console.error(`[DocService] Could not embed PDF ${fileInfo.filename}:`, pdfErr.message);
        }
      } else {
        // Image embedding (JPG or PNG) with automatic fallback
        try {
          let embeddedImage;
          if (fileInfo.mime === 'image/png') {
            try {
              embeddedImage = await mergedDoc.embedPng(fileBuffer);
            } catch {
              const jpgBuf = await sharp(fileBuffer).jpeg({ quality: 85 }).toBuffer();
              embeddedImage = await mergedDoc.embedJpg(jpgBuf);
            }
          } else {
            try {
              embeddedImage = await mergedDoc.embedJpg(fileBuffer);
            } catch {
              const pngBuf = await sharp(fileBuffer).png().toBuffer();
              embeddedImage = await mergedDoc.embedPng(pngBuf);
            }
          }

          const imgWidth = embeddedImage.width;
          const imgHeight = embeddedImage.height;

          // Add A4 page
          const page = mergedDoc.addPage([A4_WIDTH, A4_HEIGHT]);

          // Scale image to fit within margins
          const margin = 36; // 0.5 inch margin
          const maxW = A4_WIDTH - margin * 2;
          const maxH = A4_HEIGHT - margin * 2;

          const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
          const scaledW = imgWidth * scale;
          const scaledH = imgHeight * scale;

          const x = (A4_WIDTH - scaledW) / 2;
          const y = (A4_HEIGHT - scaledH) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: scaledW,
            height: scaledH
          });
        } catch (imgErr) {
          console.error(`[DocService] Could not embed image ${fileInfo.filename}:`, imgErr.message);
        }
      }
    }

    if (mergedDoc.getPageCount() === 0) {
      return null;
    }

    const mergedBytes = await mergedDoc.save();
    const mergedFilename = `${safeName}_COMPLETE_DOSSIER.pdf`;
    const mergedPath = path.join(candidateSubdir, mergedFilename);

    fs.writeFileSync(mergedPath, mergedBytes);

    const folderRelative = path.basename(candidateSubdir);
    return `/uploads/candidates/${folderRelative}/${mergedFilename}`;
  }
};

module.exports = documentService;

/**
 * COMMIT 42 - API Requests
 * 
 * FAIT QUOI : Gestion requêtes API upload fichiers avec validation et traitement asynchrone
 * REÇOIT : req: Request, res: Response, files: File[], uploadType: string
 * RETOURNE : { success: boolean, uploads: object[], processing: object, timing: number }
 * ERREURS : UploadValidationError si fichier invalide, StorageError si stockage échoue, ProcessingError si traitement échoue
 */

export async function uploadProjectFilesRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId } = req.params;
    const files = req.files || [];

    if (!projectId) {
      throw new Error('UploadValidationError: projectId requis dans URL');
    }

    if (!files || files.length === 0) {
      throw new Error('UploadValidationError: Aucun fichier fourni');
    }

    // Valider chaque fichier
    const validationResults = await validateUploadFiles(files);
    if (validationResults.errors.length > 0) {
      throw new Error(`UploadValidationError: ${validationResults.errors.length} fichiers invalides`);
    }

    // Traiter uploads
    const uploadResults = await processFileUploads(projectId, validationResults.validFiles);

    const response = {
      success: true,
      uploads: uploadResults.map(result => ({
        filename: result.filename,
        size: result.size,
        type: result.type,
        path: result.path,
        checksum: result.checksum,
        uploadedAt: new Date().toISOString()
      })),
      processing: {
        total: files.length,
        successful: uploadResults.length,
        failed: files.length - uploadResults.length,
        processingTime: Date.now() - startTime
      },
      metadata: {
        endpoint: `POST /api/uploads/projects/${projectId}/files`,
        timing: Date.now() - startTime,
        projectId
      },
      timing: Date.now() - startTime
    };

    res.status(201).json(response);

  } catch (error) {
    handleUploadRequestError(error, res, startTime, 'UPLOAD_PROJECT_FILES');
  }
}

export async function uploadAssetRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { assetType } = req.params;
    const file = req.file;

    if (!file) {
      throw new Error('UploadValidationError: Fichier requis');
    }

    if (!['image', 'document', 'archive', 'template'].includes(assetType)) {
      throw new Error(`UploadValidationError: Type d'asset '${assetType}' non supporté`);
    }

    // Valider selon type d'asset
    const validation = await validateAssetFile(file, assetType);
    if (!validation.valid) {
      throw new Error(`UploadValidationError: ${validation.error}`);
    }

    // Traitement spécialisé selon type
    const processing = await processAssetUpload(file, assetType);

    const response = {
      success: true,
      asset: {
        id: processing.assetId,
        type: assetType,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: processing.url,
        thumbnailUrl: processing.thumbnailUrl,
        metadata: processing.metadata
      },
      processing: {
        duration: processing.duration,
        operations: processing.operations,
        status: 'completed'
      },
      metadata: {
        endpoint: `POST /api/uploads/assets/${assetType}`,
        timing: Date.now() - startTime
      },
      timing: Date.now() - startTime
    };

    res.status(201).json(response);

  } catch (error) {
    handleUploadRequestError(error, res, startTime, 'UPLOAD_ASSET');
  }
}

export async function getUploadStatusRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { uploadId } = req.params;

    if (!uploadId) {
      throw new Error('UploadValidationError: uploadId requis');
    }

    // Mock status upload (en attendant integration avec processing queue)
    const mockStatus = {
      id: uploadId,
      status: 'processing',
      progress: 75,
      stage: 'validation',
      startedAt: new Date(Date.now() - 30000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 10000).toISOString(),
      files: [
        {
          filename: 'main.js',
          status: 'completed',
          progress: 100
        },
        {
          filename: 'styles.css',
          status: 'processing',
          progress: 60
        }
      ]
    };

    const response = {
      success: true,
      upload: mockStatus,
      metadata: {
        endpoint: `GET /api/uploads/status/${uploadId}`,
        timing: Date.now() - startTime,
        realtime: false
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleUploadRequestError(error, res, startTime, 'GET_UPLOAD_STATUS');
  }
}

export async function deleteUploadRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { uploadId } = req.params;
    const force = req.query.force === 'true';

    if (!uploadId) {
      throw new Error('UploadValidationError: uploadId requis');
    }

    // Simuler suppression upload
    const deletionResult = await deleteUploadFiles(uploadId, force);

    const response = {
      success: true,
      deletion: {
        uploadId,
        filesDeleted: deletionResult.filesDeleted,
        storageFreed: deletionResult.storageFreed,
        force,
        deletedAt: new Date().toISOString()
      },
      metadata: {
        endpoint: `DELETE /api/uploads/${uploadId}`,
        timing: Date.now() - startTime
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleUploadRequestError(error, res, startTime, 'DELETE_UPLOAD');
  }
}

export async function listUploadsRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { projectId } = req.query;
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Mock liste uploads
    const mockUploads = [
      {
        id: 'upload-1',
        projectId: projectId || 'proj-1',
        status: 'completed',
        filesCount: 5,
        totalSize: 1024000,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'upload-2',
        projectId: projectId || 'proj-1',
        status: 'processing',
        filesCount: 3,
        totalSize: 512000,
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    let filteredUploads = mockUploads;
    if (status) {
      filteredUploads = mockUploads.filter(upload => upload.status === status);
    }

    const response = {
      success: true,
      data: {
        uploads: filteredUploads.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: filteredUploads.length
        }
      },
      metadata: {
        endpoint: 'GET /api/uploads',
        timing: Date.now() - startTime,
        filters: { projectId, status }
      },
      timing: Date.now() - startTime
    };

    res.status(200).json(response);

  } catch (error) {
    handleUploadRequestError(error, res, startTime, 'LIST_UPLOADS');
  }
}

async function validateUploadFiles(files) {
  const validFiles = [];
  const errors = [];

  for (const file of files) {
    // Validation taille
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      errors.push(`Fichier '${file.originalname}' trop volumineux (max 10MB)`);
      continue;
    }

    // Validation type
    const allowedTypes = [
      'text/javascript', 'text/css', 'text/html',
      'application/json', 'text/plain', 'image/png',
      'image/jpeg', 'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Type de fichier '${file.mimetype}' non autorisé pour '${file.originalname}'`);
      continue;
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
}

async function validateAssetFile(file, assetType) {
  const validations = {
    'image': {
      types: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    'document': {
      types: ['application/pdf', 'text/plain', 'application/msword'],
      maxSize: 20 * 1024 * 1024 // 20MB
    },
    'archive': {
      types: ['application/zip', 'application/x-tar', 'application/gzip'],
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    'template': {
      types: ['application/zip', 'application/json'],
      maxSize: 50 * 1024 * 1024 // 50MB
    }
  };

  const rules = validations[assetType];
  
  if (!rules.types.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Type de fichier '${file.mimetype}' non autorisé pour asset '${assetType}'`
    };
  }

  if (file.size > rules.maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${rules.maxSize / 1024 / 1024}MB pour asset '${assetType}')`
    };
  }

  return { valid: true };
}

async function processFileUploads(projectId, files) {
  // Mock traitement uploads
  return files.map(file => ({
    filename: file.originalname,
    size: file.size,
    type: file.mimetype,
    path: `/uploads/${projectId}/${file.filename}`,
    checksum: generateChecksum(file)
  }));
}

async function processAssetUpload(file, assetType) {
  // Mock traitement asset
  const assetId = `asset-${Date.now()}`;
  const operations = [];

  // Opérations spécialisées selon type
  if (assetType === 'image') {
    operations.push('resize', 'optimize', 'thumbnail');
  } else if (assetType === 'template') {
    operations.push('validate', 'extract', 'index');
  }

  return {
    assetId,
    url: `/assets/${assetId}/${file.originalname}`,
    thumbnailUrl: assetType === 'image' ? `/assets/${assetId}/thumb.jpg` : null,
    metadata: {
      originalSize: file.size,
      processedSize: Math.floor(file.size * 0.8)
    },
    operations,
    duration: Math.floor(Math.random() * 2000) + 500
  };
}

async function deleteUploadFiles(uploadId, force) {
  // Mock suppression
  return {
    filesDeleted: Math.floor(Math.random() * 5) + 1,
    storageFreed: Math.floor(Math.random() * 1000000) + 100000
  };
}

function generateChecksum(file) {
  // Mock checksum
  return `sha256:${Math.random().toString(36).substring(2, 15)}`;
}

function handleUploadRequestError(error, res, startTime, operation) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error.message.includes('UploadValidationError')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('StorageError')) {
    statusCode = 507;
    errorCode = 'STORAGE_ERROR';
  } else if (error.message.includes('ProcessingError')) {
    statusCode = 500;
    errorCode = 'PROCESSING_ERROR';
  }

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      operation,
      timestamp: new Date().toISOString()
    },
    metadata: {
      timing: Date.now() - startTime,
      retryable: !error.message.includes('ValidationError')
    },
    timing: Date.now() - startTime
  };

  res.status(statusCode).json(errorResponse);
}

// requests/uploads : API Requests (commit 42)
// DEPENDENCY FLOW : api/requests/ → api/schemas/ → engines/ → transitions/ → systems/

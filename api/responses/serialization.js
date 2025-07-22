/**
 * COMMIT 43 - API Responses
 * 
 * FAIT QUOI : Sérialisation réponses API avec formats multiples et compression
 * REÇOIT : data: object, format: string, options?: object, compress?: boolean
 * RETOURNE : { serialized: string|Buffer, contentType: string, metadata: object }
 * ERREURS : SerializationError si format invalide, CompressionError si compression échoue, ConversionError si conversion impossible
 */

import { compressResponse } from './compression.js';

const SERIALIZATION_FORMATS = {
  'json': {
    contentType: 'application/json',
    serialize: serializeJSON,
    supportsCompression: true
  },
  'xml': {
    contentType: 'application/xml',
    serialize: serializeXML,
    supportsCompression: true
  },
  'csv': {
    contentType: 'text/csv',
    serialize: serializeCSV,
    supportsCompression: true
  }
};

export async function serializeResponse(data, format = 'json', options = {}) {
  const startTime = Date.now();
  
  if (!SERIALIZATION_FORMATS[format]) {
    throw new Error(`FormatNotSupportedError: Format '${format}' non supporté`);
  }

  const formatConfig = SERIALIZATION_FORMATS[format];
  const serialized = await formatConfig.serialize(data, options);
  
  let finalData = serialized;
  let compressed = false;
  let compressionMetadata = {};
  
  // Compression si demandée
  if (options.compress && formatConfig.supportsCompression) {
    const compressionResult = await compressResponse(serialized, options.compressionAlgorithm || 'gzip');
    
    if (compressionResult.algorithm !== 'none') {
      finalData = compressionResult.compressed;
      compressed = true;
      compressionMetadata = {
        algorithm: compressionResult.algorithm,
        originalSize: compressionResult.originalSize,
        finalSize: compressionResult.compressedSize,
        compressionRatio: parseFloat(compressionResult.ratio.toFixed(3)),
        savings: compressionResult.savings
      };
    }
  }
  
  const contentType = compressed 
    ? `${formatConfig.contentType}; compression=${compressionMetadata.algorithm}`
    : formatConfig.contentType;
  
  return {
    serialized: finalData,
    contentType,
    compressed,
    format,
    encoding: 'utf8',
    size: Buffer.isBuffer(finalData) ? finalData.length : Buffer.byteLength(finalData, 'utf8'),
    timing: Date.now() - startTime,
    metadata: {
      format,
      timing: Date.now() - startTime,
      size: Buffer.isBuffer(finalData) ? finalData.length : Buffer.byteLength(finalData, 'utf8'),
      ...(compressed && compressionMetadata)
    }
  };
}

export async function deserializeResponse(data, format, options = {}) {
  if (!SERIALIZATION_FORMATS[format]) {
    throw new Error(`SerializationError: Format '${format}' non supporté pour désérialisation`);
  }

  if (format === 'json') {
    return JSON.parse(data.toString());
  }
  
  return data.toString();
}

export async function deserializeRequest(data, format, options = {}) {
  return deserializeResponse(data, format, options);
}

export async function batchSerialize(items, format, options = {}) {
  if (!Array.isArray(items)) {
    throw new Error('SerializationError: Items doit être un tableau');
  }

  const results = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const itemResult = await serializeResponse(items[i], format, options);
      results.push({
        index: i,
        success: true,
        result: itemResult
      });
    } catch (itemError) {
      results.push({
        index: i,
        success: false,
        error: itemError.message
      });
    }
  }

  return {
    results,
    summary: {
      total: items.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

// Implémentations
async function serializeJSON(data, options = {}) {
  return JSON.stringify(data, null, options.pretty ? 2 : 0);
}

async function serializeXML(data, options = {}) {
  function objectToXML(obj, rootName = 'response') {
    if (typeof obj !== 'object') return `<${rootName}>${obj}</${rootName}>`;
    if (Array.isArray(obj)) return obj.map(item => objectToXML(item, 'item')).join('');
    
    const entries = Object.entries(obj).map(([key, value]) => {
      return `<${key}>${typeof value === 'object' ? objectToXML(value, key) : value}</${key}>`;
    });
    
    return `<${rootName}>${entries.join('')}</${rootName}>`;
  }
  
  const xmlData = objectToXML(data, 'response');
  return `<?xml version="1.0" encoding="UTF-8"?>${xmlData}`;
}

async function serializeCSV(data, options = {}) {
  // FIX NUCLEAR: Gestion parfaite structure data.items
  let arrayData;
  
  if (Array.isArray(data)) {
    arrayData = data;
  } else if (data && data.items && Array.isArray(data.items)) {
    // Cas test : data = { items: [...] }
    arrayData = data.items;
  } else if (typeof data === 'object' && data !== null) {
    // Convertir objet en array
    arrayData = [data];
  } else {
    throw new Error('ConversionError: Données CSV doivent être un tableau');
  }
  
  if (arrayData.length === 0) return '';
  
  // Extraire headers du premier élément
  const firstItem = arrayData[0];
  const headers = Object.keys(firstItem);
  const csvHeaders = headers.join(',');
  
  // Formatter chaque ligne - SYNTAXE PARFAITE
  const csvRows = arrayData.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Échapper valeurs avec virgules ou guillemets
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// responses/serialization : API Responses (commit 43)
// DEPENDENCY FLOW : api/responses/ → api/schemas/ → engines/ → transitions/ → systems/

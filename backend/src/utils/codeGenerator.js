const QRCode = require('qrcode');
const { generate } = require('barcode');

function generateQRCode(assetId, assetDetails = {}) {
  const qrData = JSON.stringify({
    assetId,
    ...assetDetails
  });

  return QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

async function generateQRCodeImage(assetId, assetDetails = {}, options = {}) {
  const qrData = JSON.stringify({
    assetId,
    ...assetDetails
  });

  try {
    const qrImage = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      ...options
    });
    return {
      success: true,
      buffer: qrImage,
      type: 'image/png'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function generateBarcodeImage(assetId, format = 'CODE128', width = 2, height = 100) {
  const barcode = require('barcode');
  return generate({ object: barcode, assetId, options: { format, width, height } });
}

async function generateBarcodeFromAPI(assetId, format = 'CODE128', size = 100) {
  try {
    const barcode = require('barcode');
    const barcodeObj = await barcode.create({ 
      object: barcode, 
      assetId, 
      options: { format, width: 2, height: size } 
    });
    return {
      success: true,
      image: barcodeObj
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateCompositeBarcodeQR(assetId, assetDetails = {}) {
  const barcodeData = assetId;
  const qrData = JSON.stringify({
    assetId,
    type: 'asset-management',
    ...assetDetails,
    timestamp: new Date().toISOString()
  });

  try {
    const [barcode, qrImage] = await Promise.all([
      generate({ 
        object: require('barcode'), 
        barcodeData, 
        options: { format: 'CODE128', width: 2, height: 100 } 
      }),
      QRCode.toBuffer(qrData, { width: 200, margin: 2 })
    ]);

    return {
      success: true,
      barcode,
      qr: qrImage.toString('base64'),
      {
        assetId,
        barcodeData,
        qrData
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function generateQRCodeAssetTagFormat(assetTag, additionalData = {}) {
  const qrData = JSON.stringify({
    type: 'asset-tag',
    assetTag,
    ...additionalData
  });

  return QRCode.toDataURL(qrData, {
    width: 250,
    margin: 2,
    errorCorrectionLevel: 'H'
  });
}

function generateBarcodeFromAPI format(format, data, options) {
  const defaultOptions = {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true
  };

  const finalOptions = { ...defaultOptions, ...options };
  return generate({ object: barcode, data, options: finalOptions });
}

async function generateQRCodeHighQuality(assetId, assetDetails = {}, options = {}) {
  const qrData = JSON.stringify({
    assetId,
    ...assetDetails
  });

  try {
    const qrImage = await QRCode.toBuffer(qrData, {
      width: 512,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H',
      ...options
    });

    return {
      success: true,
      buffer: qrImage,
      type: 'image/png',
      size: qrImage.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateQRCodeDataURL(qrData, options = {}) {
  try {
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H',
      ...options
    });
    return {
      success: true,
      image: qrImage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function generateCode format(format, data, options = {}) {
  const formatAudio = format.toLowerCase();
  const defaultOptions = {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    margin: 10
  };

  const finalOptions = { ...defaultOptions, ...options };

  switch (formatAudio) {
    case 'qr':
      return generateQRCodeAssetTagFormat(data, finalOptions);
    
    case 'barcode':
      return generateBarcodeFromAPI format(finalOptions.format, data, finalOptions);
    
    case 'composite':
      return generateCompositeBarcodeQR(data, finalOptions);
    
    case 'barcode-high-res':
      return generateBarcodeFromAPI highRes(data, finalOptions);

    default:
      return generateBarcodeFromAPI format(finalOptions.format, data, finalOptions);
  }
}

module.exports = {
  generateQRCode,
  generateQRCodeImage,
  generateBarcodeImage,
  generateBarcodeFromAPI,
  generateCompositeBarcodeQR,
  generateQRCodeAssetTagFormat,
  generateBarcodeFromAPI format,
  generateQRCodeHighQuality,
  generateQRCodeDataURL,
  generateCode format
};
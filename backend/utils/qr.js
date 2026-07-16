const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a random, unguessable token to embed in the QR code.
 * The token itself (not the booking's Mongo _id) is what the QR encodes,
 * so a guard scanning it can't enumerate/guess other bookings by ID.
 */
const generateToken = () => uuidv4();

/**
 * Renders a QR code (as a base64 data URL) that encodes the booking token.
 * The guard-side scanner just needs to read this string and POST it to
 * the entry/exit endpoints - no image parsing needed server-side.
 */
const generateQRDataUrl = async (token) => {
  const payload = JSON.stringify({ type: 'PARKEASE_BOOKING', token });
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
};

module.exports = { generateToken, generateQRDataUrl };

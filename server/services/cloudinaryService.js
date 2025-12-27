// Cloudinary Image Upload Service
// All images (profile, products, vendor, delivery partner) are stored on Cloudinary

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

/**
 * Generate SHA1 signature for Cloudinary
 * @param {string} data - Data to sign
 * @returns {Promise<string>} - SHA1 hash
 */
const sha1 = async (data) => {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(data).digest('hex');
};

/**
 * Upload image to Cloudinary
 * @param {string} base64Image - Base64 encoded image (with or without data:image prefix)
 * @param {string} folder - Cloudinary folder name (e.g., 'profiles', 'products', 'vendors', 'delivery-partners')
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<{success: boolean, url?: string, publicId?: string, error?: string}>}
 */
const uploadImage = async (base64Image, folder = 'general', publicId = null) => {
    try {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            console.error('Cloudinary credentials not configured');
            return { success: false, error: 'Cloudinary not configured' };
        }

        if (!base64Image) {
            return { success: false, error: 'No image provided' };
        }

        // Ensure base64 has proper prefix
        let imageData = base64Image;
        if (!base64Image.startsWith('data:')) {
            imageData = `data:image/jpeg;base64,${base64Image}`;
        }

        // Generate timestamp and signature
        const timestamp = Math.floor(Date.now() / 1000);

        // Build params for signature
        const params = {
            folder: folder,
            timestamp: timestamp,
        };

        if (publicId) {
            params.public_id = publicId;
        }

        // Sort params and create signature string
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const signature = await sha1(sortedParams + CLOUDINARY_API_SECRET);

        // Build form data
        const formData = new URLSearchParams();
        formData.append('file', imageData);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        if (publicId) {
            formData.append('public_id', publicId);
        }

        // Upload to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const result = await response.json();

        if (result.secure_url) {
            console.log(`Image uploaded successfully to Cloudinary: ${result.secure_url}`);
            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
            };
        } else {
            console.error('Cloudinary upload failed:', result);
            return { success: false, error: result.error?.message || 'Upload failed' };
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteImage = async (publicId) => {
    try {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            console.error('Cloudinary credentials not configured');
            return { success: false, error: 'Cloudinary not configured' };
        }

        if (!publicId) {
            return { success: false, error: 'No public ID provided' };
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const signature = await sha1(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`);

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const result = await response.json();

        if (result.result === 'ok') {
            console.log(`Image deleted from Cloudinary: ${publicId}`);
            return { success: true };
        } else {
            console.error('Cloudinary delete failed:', result);
            return { success: false, error: result.error?.message || 'Delete failed' };
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Upload profile image (user or delivery partner)
 * @param {string} base64Image - Base64 encoded image
 * @param {string} userId - User or partner ID
 * @param {string} type - 'user' or 'delivery-partner'
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadProfileImage = async (base64Image, userId, type = 'user') => {
    const folder = type === 'delivery-partner' ? 'delivery-partners/profiles' : 'users/profiles';
    return uploadImage(base64Image, folder, `${type}_${userId}`);
};

/**
 * Upload product image
 * @param {string} base64Image - Base64 encoded image
 * @param {string} productId - Product ID (optional for new products)
 * @param {number} index - Image index for multiple images
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadProductImage = async (base64Image, productId = null, index = 0) => {
    const publicId = productId ? `product_${productId}_${index}` : null;
    return uploadImage(base64Image, 'products', publicId);
};

/**
 * Upload vendor/KYC document image
 * @param {string} base64Image - Base64 encoded image
 * @param {string} partnerId - Partner ID
 * @param {string} documentType - 'aadhaar', 'pan', 'license', 'selfie'
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadDocumentImage = async (base64Image, partnerId, documentType) => {
    return uploadImage(base64Image, `delivery-partners/documents/${documentType}`, `${partnerId}_${documentType}`);
};

/**
 * Upload category image
 * @param {string} base64Image - Base64 encoded image
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadCategoryImage = async (base64Image, categoryId) => {
    return uploadImage(base64Image, 'categories', `category_${categoryId}`);
};

/**
 * Upload banner image
 * @param {string} base64Image - Base64 encoded image
 * @param {string} bannerId - Banner ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
const uploadBannerImage = async (base64Image, bannerId) => {
    return uploadImage(base64Image, 'banners', `banner_${bannerId}`);
};

/**
 * Check if a string is a base64 image
 * @param {string} str - String to check
 * @returns {boolean}
 */
const isBase64Image = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('data:image') ||
        (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str.replace(/\s/g, '')));
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
};

module.exports = {
    uploadImage,
    deleteImage,
    uploadProfileImage,
    uploadProductImage,
    uploadDocumentImage,
    uploadCategoryImage,
    uploadBannerImage,
    isBase64Image,
    isCloudinaryConfigured,
};

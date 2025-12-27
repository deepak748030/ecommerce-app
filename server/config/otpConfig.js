// OTP Configuration
// Change these settings to control OTP generation behavior

module.exports = {
    // Set to true to use fixed OTP (123456) for development/testing
    // Set to false to generate random 6-digit OTP for production
    USE_FIXED_OTP: true,

    // Fixed OTP value (used when USE_FIXED_OTP is true)
    FIXED_OTP: '123456',

    // OTP expiry time in minutes
    OTP_EXPIRY_MINUTES: 5,

    // OTP length (used when generating random OTP)
    OTP_LENGTH: 6,

    /**
     * Generate OTP based on configuration
     * @returns {string} - 6-digit OTP
     */
    generateOtp: function () {
        if (this.USE_FIXED_OTP) {
            return this.FIXED_OTP;
        }

        // Generate random 6-digit OTP
        const min = Math.pow(10, this.OTP_LENGTH - 1);
        const max = Math.pow(10, this.OTP_LENGTH) - 1;
        return Math.floor(min + Math.random() * (max - min + 1)).toString();
    },

    /**
     * Get OTP expiry date
     * @returns {Date} - Expiry date
     */
    getExpiryDate: function () {
        return new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
    },

    /**
     * Verify OTP
     * @param {string} inputOtp - OTP entered by user
     * @param {string} storedOtp - OTP stored in database
     * @param {Date} expiryDate - OTP expiry date
     * @returns {boolean} - True if OTP is valid
     */
    verifyOtp: function (inputOtp, storedOtp, expiryDate) {
        // Always accept fixed OTP in development mode
        if (this.USE_FIXED_OTP && inputOtp === this.FIXED_OTP) {
            return true;
        }

        // Check if OTP matches and is not expired
        if (!storedOtp || !expiryDate) {
            return false;
        }

        const isExpired = new Date() > new Date(expiryDate);
        const isMatch = inputOtp === storedOtp;

        return isMatch && !isExpired;
    }
};

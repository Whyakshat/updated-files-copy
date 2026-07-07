// Email regex pattern
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
// 10-digit Indian phone number regex
const PHONE_REGEX = /^[0-9]{10}$/;

const validateRegister = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name required hai aur kam se kam 2 characters ka hona chahiye'
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Valid email ID enter karein'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password kam se kam 6 characters ka hona chahiye'
    });
  }

  if (phone) {
    const cleanPhone = String(phone).trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: '10-digit phone number daalen'
      });
    }
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Valid email ID enter karein'
    });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Password blank nahi ho sakta'
    });
  }

  next();
};

const validateOrder = (req, res, next) => {
  const { customerName, customerEmail, customerPhone, item, price } = req.body;

  if (!item || typeof item !== 'string' || !item.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Item name required hai'
    });
  }

  if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim()) {
    if (!EMAIL_REGEX.test(customerEmail.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid email ID enter karein'
      });
    }
  }

  if (customerPhone) {
    const cleanPhone = String(customerPhone).trim();
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: '10-digit phone number daalen'
      });
    }
  }

  if (price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number'
      });
    }
  }

  next();
};

const validateReview = (req, res, next) => {
  const { customerName, customerEmail, text, rating } = req.body;

  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Customer name required hai'
    });
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Review text is required'
    });
  }

  if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim()) {
    if (!EMAIL_REGEX.test(customerEmail.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid email ID enter karein'
      });
    }
  }

  if (rating !== undefined) {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateOrder,
  validateReview
};

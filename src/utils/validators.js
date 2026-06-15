export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\+?[0-9]{7,15}$/;
export const whatsappRegex = /^\+?[0-9]{7,15}$/; // same pattern

export const validateRegistration = ({ fullName, email, mobile, city, courseCode, whatsapp }) => {
  const errors = {};
  if (!fullName?.trim()) errors.fullName = "Full name is required";
  if (!email?.trim() || !emailRegex.test(email)) errors.email = "Valid email required";
  if (!mobile?.trim() || !phoneRegex.test(mobile)) errors.mobile = "Valid mobile required";
  if (!courseCode) errors.courseCode = "Course selection required";
  if (whatsapp && !whatsappRegex.test(whatsapp)) errors.whatsapp = "Invalid WhatsApp number";
  // city is optional, no validation needed
  return errors;
};

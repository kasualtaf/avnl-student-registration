import { useState } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { QRCodeCanvas } from "qrcode.react";
import { validateRegistration } from "../utils/validators";
import { sanitizeForm } from "../utils/sanitize";
import bgImage from "../assets/avnl_poster.png?url";
import { courses } from "../data/courses";

function RegisterForm() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    city: "",
    courseCode: "",
    whatsapp: ""
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [regDetails, setRegDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${regDetails.registrationId}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateRegistration(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    if (!executeRecaptcha) {
      setErrors({ submit: "reCAPTCHA not loaded yet. Please wait a moment." });
      return;
    }

    setIsSubmitting(true);
    setSuccess("");
    setErrors({});
    setRegDetails(null);

    try {
      const token = await executeRecaptcha("register");
      const sanitizedForm = sanitizeForm(form);
      const selectedCourse = courses.find((c) => c.code === sanitizedForm.courseCode);
      sanitizedForm.courseName = selectedCourse ? selectedCourse.name : "";

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: sanitizedForm, recaptchaToken: token })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || "Registration failed. Please try again." });
      } else {
        setSuccess("✅ Registration successful.");
        setRegDetails({
          registrationId: data.registrationId,
          name: sanitizedForm.fullName,
          email: sanitizedForm.email,
          course: sanitizedForm.courseName
        });
        setForm({ fullName: "", email: "", mobile: "", city: "", courseCode: "", whatsapp: "" });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setErrors({ submit: "A network error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully registered, show the success view with QR code
  if (success && regDetails) {
    const qrValue = `ID: ${regDetails.registrationId}\nName: ${regDetails.name}\nEmail: ${regDetails.email}\nCourse: ${regDetails.course}`;
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
        <section className="max-w-md mx-auto p-8 bg-white/95 rounded-lg shadow-2xl mt-12 backdrop-blur-sm text-center">
          <h1 className="text-3xl font-bold mb-4 text-green-600">Registration Successful!</h1>
          <p className="text-gray-700 mb-6">Thank you for registering with AVNL.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Your Registration ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{regDetails.registrationId}</p>
          </div>

          <div className="flex flex-col items-center justify-center mb-6">
            <QRCodeCanvas id="qr-code-canvas" value={qrValue} size={200} level={"H"} className="mb-4 shadow-sm border p-2 bg-white" />
            <button 
              onClick={downloadQR}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow"
            >
              Download QR Code
            </button>
          </div>

          <button 
            onClick={() => { setSuccess(""); setRegDetails(null); }}
            className="text-primary hover:underline font-medium mt-4 block mx-auto"
          >
            Register Another Student
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
      <section className="max-w-2xl mx-auto p-6 bg-white/90 rounded-lg shadow-xl mt-12 backdrop-blur-sm w-full">
        <h1 className="text-3xl font-bold mb-4 text-primary text-center">Student Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium" htmlFor="fullName">Full Name *</label>
            <input id="fullName" name="fullName" type="text" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.fullName} onChange={handleChange} />
            {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="email">Email Address *</label>
            <input id="email" name="email" type="email" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.email} onChange={handleChange} />
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="mobile">Mobile Number *</label>
            <input id="mobile" name="mobile" type="tel" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.mobile} onChange={handleChange} />
            {errors.mobile && <p className="text-red-600 text-sm">{errors.mobile}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="city">City (optional)</label>
            <input id="city" name="city" type="text" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.city} onChange={handleChange} />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="courseCode">Course Interested *</label>
            <select id="courseCode" name="courseCode" className="w-full border rounded px-3 py-2" value={form.courseCode} onChange={handleChange}>
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
            {errors.courseCode && <p className="text-red-600 text-sm">{errors.courseCode}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="whatsapp">WhatsApp Number (optional)</label>
            <input id="whatsapp" name="whatsapp" type="tel" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.whatsapp} onChange={handleChange} />
            {errors.whatsapp && <p className="text-red-600 text-sm">{errors.whatsapp}</p>}
          </div>
          {errors.submit && <p className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded">{errors.submit}</p>}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition disabled:opacity-70 disabled:cursor-not-allowed font-medium text-lg"
          >
            {isSubmitting ? "Processing Secure Registration..." : "Register Now"}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Protected by reCAPTCHA and subject to the Google Privacy Policy and Terms of Service.
          </p>
        </form>
      </section>
    </div>
  );
}

export default function Register() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "dummy_key_for_build";
  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <RegisterForm />
    </GoogleReCaptchaProvider>
  );
}

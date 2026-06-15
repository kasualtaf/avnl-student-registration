import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { validateRegistration } from "../utils/validators";
import { getTodayISO } from "../utils/dates";
import { sendConfirmationEmail } from "../lib/emailClient";
import bgImage from "../assets/avnl_poster.png?url";

import { courses } from "../data/courses";

export default function Register() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateRegistration({
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      city: form.city,
      courseCode: form.courseCode,
      whatsapp: form.whatsapp
    });
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setIsSubmitting(true);
    setSuccess("");
    setErrors({});

    const selectedCourse = courses.find((c) => c.code === form.courseCode);
    const courseName = selectedCourse ? selectedCourse.name : "";

    // Generate ID on the frontend so we don't need to read back from the database
    // This avoids any Row-Level Security "SELECT" policy issues
    const newId = crypto.randomUUID();

    const { error } = await supabase.from("students").insert([
      {
        id: newId,
        full_name: form.fullName,
        email: form.email,
        mobile_number: form.mobile,
        city: form.city || null,
        course_code: form.courseCode,
        course_name: courseName,
        whatsapp_number: form.whatsapp || null,
        created_at: getTodayISO()
      }
    ]);

    if (error) {
      setIsSubmitting(false);
      setErrors({ submit: error.message });
      return;
    }

    try {
      // Use the generated ID (taking the first 8 chars for a shorter registration ID)
      const regId = newId.split('-')[0].toUpperCase();

      // Send Email via EmailJS
      await sendConfirmationEmail({
        full_name: form.fullName,
        email: form.email,
        course_code: form.courseCode,
        course_name: courseName,
        registration_id: regId,
      });

      // Trigger SMS notification (runs in background)
      fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.mobile, courseName: courseName }),
      }).catch((smsError) => console.error("Failed to trigger SMS:", smsError));

      setSuccess("✅ Registration successful. Confirmation email sent.");
      setForm({ fullName: "", email: "", mobile: "", city: "", courseCode: "", whatsapp: "" });
    } catch (emailError) {
      console.error("Detailed Email Error:", emailError);
      setErrors({ submit: `Registration saved but email failed: ${emailError?.text || emailError?.message || 'Check console for details.'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
      <section className="max-w-2xl mx-auto p-6 bg-white/90 rounded-lg shadow-xl mt-12 backdrop-blur-sm">
      <h1 className="text-3xl font-bold mb-4 text-primary text-center">Student Registration</h1>
      {success && <p className="text-green-600 mb-4 text-center">{success}</p>}
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
        {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Register"}
        </button>
      </form>
    </section>
  </div>
);
}

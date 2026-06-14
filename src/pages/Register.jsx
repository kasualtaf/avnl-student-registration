import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { validateRegistration } from "../utils/validators";
import { getTodayISO } from "../utils/dates";
import bgImage from "../assets/avnl_poster.png?url";

const courses = ["Computer Science", "Business Administration", "Graphic Design", "Data Analytics"];

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    city: "",
    course: "",
    whatsapp: ""
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

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
      course: form.course,
      whatsapp: form.whatsapp
    });
    setErrors(validation);
    if (Object.keys(validation).length) return;

    const { error } = await supabase.from("students").insert([
      {
        full_name: form.fullName,
        email: form.email,
        mobile_number: form.mobile,
        city: form.city || null,
        course_interested: form.course,
        whatsapp_number: form.whatsapp || null,
        created_at: getTodayISO()
      }
    ]);
    if (error) {
      setSuccess("");
      setErrors({ submit: error.message });
    } else {
      // Trigger SMS notification
      try {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: form.mobile,
            courseName: form.course,
          }),
        });
      } catch (smsError) {
        console.error("Failed to trigger SMS:", smsError);
      }

      setSuccess("✅ Registration successful!");
      setForm({ fullName: "", email: "", mobile: "", city: "", course: "", whatsapp: "" });
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
          <label className="block mb-1 font-medium" htmlFor="course">Course Interested *</label>
          <select id="course" name="course" className="w-full border rounded px-3 py-2" value={form.course} onChange={handleChange}>
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.course && <p className="text-red-600 text-sm">{errors.course}</p>}
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="whatsapp">WhatsApp Number (optional)</label>
          <input id="whatsapp" name="whatsapp" type="tel" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={form.whatsapp} onChange={handleChange} />
          {errors.whatsapp && <p className="text-red-600 text-sm">{errors.whatsapp}</p>}
        </div>
        {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition">Register</button>
      </form>
    </section>
  </div>
);
}

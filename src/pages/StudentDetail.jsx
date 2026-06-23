import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudent = async () => {
    const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
    if (data) {
      setStudent(data);
      setForm(data);
    } else {
      console.error(error);
      alert("Error loading student details");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // updated_at is auto-bumped by the database trigger; no need to set it here.
    const { error } = await supabase.from("students").update({
      status: form.status,
      remarks: form.remarks
    }).eq("id", id);

    if (!error) {
      setIsEditing(false);
      fetchStudent();
    } else {
      alert("Update failed: " + error.message);
    }
  };

  if (!student) return <div className="p-8 text-center text-gray-500">Loading student details...</div>;

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to="/admin" className="text-primary hover:underline mb-6 inline-block font-medium">&larr; Back to Dashboard</Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{student.full_name}</h1>
              <p className="text-gray-500 font-mono text-sm mt-1">
                Registration ID: {student.registration_id || student.id}
              </p>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition text-sm font-medium"
            >
              {isEditing ? "Cancel Edit" : "Edit Status & Remarks"}
            </button>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Edit Registration Data</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                    <select 
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.status || 'Pending'} 
                      onChange={e => setForm({...form, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Remarks (Admin notes)</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="4"
                      value={form.remarks || ''} 
                      onChange={e => setForm({...form, remarks: e.target.value})}
                      placeholder="Add any internal notes here..."
                    ></textarea>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-primary/90 transition shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-800">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mobile Number</p>
                <p className="font-medium text-gray-800">{student.mobile_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">WhatsApp</p>
                <p className="font-medium text-gray-800">{student.whatsapp_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">City</p>
                <p className="font-medium text-gray-800">{student.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Course Registered</p>
                <p className="font-medium text-gray-800">{student.course_code} - {student.course_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Registration Source</p>
                <p className="font-medium text-gray-800">{student.source || 'Website'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-block
                  ${student.status === 'Selected' ? 'bg-green-100 text-green-800' : 
                    student.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                    student.status === 'Contacted' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {student.status || 'Pending'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Registered At</p>
                <p className="font-medium text-gray-800">{new Date(student.created_at).toLocaleString()}</p>
              </div>
              <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Admin Remarks</p>
                {student.remarks ? (
                  <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-100">{student.remarks}</p>
                ) : (
                  <p className="text-gray-400 italic">No remarks added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

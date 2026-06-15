import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { exportToCsv } from "../utils/csvExport";
import { courses } from "../data/courses";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState({ name: "", email: "", mobile: "", course: "" });
  const [stats, setStats] = useState({ total: 0, today: 0, month: 0 });

  const fetchStudents = async (filters = {}) => {
    let query = supabase.from("students").select("id, full_name, email, mobile_number, city, whatsapp_number, course_code, course_name, created_at");
    if (filters.name) query = query.ilike("full_name", `%${filters.name}%`);
    if (filters.email) query = query.ilike("email", `%${filters.email}%`);
    if (filters.mobile) query = query.ilike("mobile_number", `%${filters.mobile}%`);
    if (filters.course) query = query.eq("course_code", filters.course);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error) setStudents(data);
  };

  const fetchStats = async () => {
    // total count
    const { count: total } = await supabase.from("students").select("*", { count: "exact", head: true });
    // today count (date part only)
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase.from("students").select("*", { count: "exact", head: true }).gte('created_at', `${today}T00:00:00Z`).lte('created_at', `${today}T23:59:59Z`);
    // month count
    const monthStart = new Date(); monthStart.setDate(1);
    const monthISO = monthStart.toISOString();
    const { count: monthCount } = await supabase.from("students").select("*", { count: "exact", head: true }).gte('created_at', monthISO);
    setStats({ total, today: todayCount, month: monthCount });
  };

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) {
      setStudents(students.filter(s => s.id !== id));
      fetchStats();
    } else {
      alert("Delete failed: " + error.message);
    }
  };

  const handleExport = () => exportToCsv(students, "students.csv");

  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Admin Dashboard</h1>
      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface p-4 rounded shadow">
          <p className="text-gray-600">Total Registrations</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-surface p-4 rounded shadow">
          <p className="text-gray-600">Registrations Today</p>
          <p className="text-2xl font-semibold">{stats.today}</p>
        </div>
        <div className="bg-surface p-4 rounded shadow">
          <p className="text-gray-600">Registrations This Month</p>
          <p className="text-2xl font-semibold">{stats.month}</p>
        </div>
      </div>
      {/* Search / Filter */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <input type="text" placeholder="Search by name" className="border rounded px-3 py-2" value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} />
        <input type="text" placeholder="Search by email" className="border rounded px-3 py-2" value={search.email} onChange={e => setSearch({ ...search, email: e.target.value })} />
        <input type="text" placeholder="Search by mobile" className="border rounded px-3 py-2" value={search.mobile} onChange={e => setSearch({ ...search, mobile: e.target.value })} />
        <select className="border rounded px-3 py-2" value={search.course} onChange={e => setSearch({ ...search, course: e.target.value })}>
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <button className="bg-primary text-white py-2 rounded hover:bg-primary/90 transition col-span-5 md:col-span-1">Search</button>
      </form>
      <button onClick={handleExport} className="mb-4 bg-accent text-white py-1 px-3 rounded hover:bg-accent/90 transition">Export CSV</button>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-surface-dark text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Mobile</th>
              <th className="p-2 text-left">Course Code</th>
              <th className="p-2 text-left">Course Name</th>
              <th className="p-2 text-left">Registered At</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.full_name}</td>
                <td className="p-2">{s.email}</td>
                <td className="p-2">{s.mobile_number}</td>
                <td className="p-2">{s.course_code}</td>
                <td className="p-2">{s.course_name}</td>
                <td className="p-2">{new Date(s.created_at).toLocaleString()}</td>
                <td className="p-2">
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

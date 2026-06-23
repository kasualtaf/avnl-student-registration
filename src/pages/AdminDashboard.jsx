import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { exportToExcel } from "../utils/excelExport";
import { courses } from "../data/courses";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState({ name: "", email: "", mobile: "", course: "", status: "", dateFrom: "", dateTo: "" });
  const [stats, setStats] = useState({ total: 0, today: 0, month: 0 });
  const [chartData, setChartData] = useState({ courseDistribution: null, trend: null });

  const fetchStudents = async (filters = search) => {
    let query = supabase.from("students").select("*");
    
    if (filters.name) query = query.ilike("full_name", `%${filters.name}%`);
    if (filters.email) query = query.ilike("email", `%${filters.email}%`);
    if (filters.mobile) query = query.ilike("mobile_number", `%${filters.mobile}%`);
    if (filters.course) query = query.eq("course_code", filters.course);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00Z`);
    if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59Z`);

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (!error && data) {
      setStudents(data);
      processChartData(data);
    }
  };

  const processChartData = (data) => {
    const courseCounts = {};
    const dateCounts = {};

    data.forEach(s => {
      courseCounts[s.course_code] = (courseCounts[s.course_code] || 0) + 1;
      const date = new Date(s.created_at).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const pieData = {
      labels: Object.keys(courseCounts),
      datasets: [{
        data: Object.values(courseCounts),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
      }]
    };

    const sortedDates = Object.keys(dateCounts).sort();
    const lineData = {
      labels: sortedDates,
      datasets: [{
        label: 'Registrations',
        data: sortedDates.map(d => dateCounts[d]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        fill: true
      }]
    };

    setChartData({ courseDistribution: pieData, trend: lineData });
  };

  const fetchStats = async () => {
    const { count: total } = await supabase.from("students").select("*", { count: "exact", head: true });
    
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase.from("students")
      .select("*", { count: "exact", head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);
    
    const monthStart = new Date(); monthStart.setDate(1);
    const monthISO = monthStart.toISOString();
    const { count: monthCount } = await supabase.from("students")
      .select("*", { count: "exact", head: true })
      .gte('created_at', monthISO);
      
    setStats({ total, today: todayCount, month: monthCount });
  };

  useEffect(() => {
    fetchStudents();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(search);
  };

  const handleExport = () => exportToExcel(students, "students_export.xlsx");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) {
      setStudents(students.filter(s => s.id !== id));
      fetchStats();
      processChartData(students.filter(s => s.id !== id));
    } else {
      alert("Delete failed: " + error.message);
    }
  };

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <button onClick={handleExport} className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition shadow">
            Export to Excel
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">Total Registrations</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">Registrations Today</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.today}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">Registrations This Month</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.month}</p>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Course Distribution</h2>
            {chartData.courseDistribution && chartData.courseDistribution.labels.length > 0 ? (
              <div className="h-64 flex justify-center">
                <Pie data={chartData.courseDistribution} options={{ maintainAspectRatio: false }} />
              </div>
            ) : <p className="text-gray-400 text-center py-10">No data available</p>}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Registration Trends</h2>
            {chartData.trend && chartData.trend.labels.length > 0 ? (
              <div className="h-64">
                <Line data={chartData.trend} options={{ maintainAspectRatio: false }} />
              </div>
            ) : <p className="text-gray-400 text-center py-10">No data available</p>}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Advanced Search & Filters</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Name" className="border rounded px-3 py-2" value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} />
            <input type="text" placeholder="Email" className="border rounded px-3 py-2" value={search.email} onChange={e => setSearch({ ...search, email: e.target.value })} />
            <input type="text" placeholder="Mobile" className="border rounded px-3 py-2" value={search.mobile} onChange={e => setSearch({ ...search, mobile: e.target.value })} />
            
            <select className="border rounded px-3 py-2" value={search.course} onChange={e => setSearch({ ...search, course: e.target.value })}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>

            <select className="border rounded px-3 py-2" value={search.status} onChange={e => setSearch({ ...search, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>

            <div className="flex space-x-2">
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={search.dateFrom} onChange={e => setSearch({ ...search, dateFrom: e.target.value })} title="From Date" />
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={search.dateTo} onChange={e => setSearch({ ...search, dateTo: e.target.value })} title="To Date" />
            </div>

            <button type="submit" className="bg-primary text-white py-2 rounded hover:bg-primary/90 transition md:col-span-2">Apply Filters</button>
          </form>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-4 text-left font-medium">Reg. ID</th>
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Email</th>
                  <th className="p-4 text-left font-medium">Course</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-xs text-gray-700">
                      {s.registration_id || s.id.slice(0, 8)}
                    </td>
                    <td className="p-4">{s.full_name}</td>
                    <td className="p-4">{s.email}</td>
                    <td className="p-4">{s.course_code}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${s.status === 'Selected' ? 'bg-green-100 text-green-800' : 
                          s.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          s.status === 'Contacted' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {s.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="p-4 space-x-3">
                      <Link to={`/admin/student/${s.id}`} className="text-primary hover:underline text-sm font-medium">View</Link>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">No students found matching the criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

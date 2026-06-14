export default function Landing() {
  return (
    <section className="bg-background min-h-screen flex flex-col items-center py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-primary mb-4">Welcome to Our Institute</h1>
          <p className="text-xl text-gray-700">Join thousands of students worldwide.</p>
        </div>
        {/* Course description grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-surface rounded-lg shadow-lg">
            <h2 className="font-bold text-lg mb-2">Computer Science</h2>
            <p className="text-gray-600">Learn programming, algorithms, and software engineering.</p>
          </div>
          <div className="p-6 bg-surface rounded-lg shadow-lg">
            <h2 className="font-bold text-lg mb-2">Business Administration</h2>
            <p className="text-gray-600">Management, finance, and entrepreneurship fundamentals.</p>
          </div>
          <div className="p-6 bg-surface rounded-lg shadow-lg">
            <h2 className="font-bold text-lg mb-2">Graphic Design</h2>
            <p className="text-gray-600">Creative visual communication using modern tools.</p>
          </div>
        </div>
        {/* Call to action */}
        <a href="/register" className="bg-accent text-white py-3 px-6 rounded-full hover:bg-accent/90 transition">
          Register Now
        </a>
      </div>
    </section>
  );
}

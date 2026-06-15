export function exportToCsv(data, filename = "students.csv") {
  const header = [
    "Full Name",
    "Email",
    "Mobile",
    "WhatsApp",
    "City",
    "Course Code",
    "Course Name",
    "Created At"
  ];

  const rows = data.map((row) => [
    row.full_name,
    row.email,
    row.mobile_number,
    row.whatsapp_number || "",
    row.city || "",
    row.course_code,
    row.course_name,
    row.created_at
  ]);

  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${cell ?? ""}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
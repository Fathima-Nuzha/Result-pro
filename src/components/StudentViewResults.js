import React, { useEffect, useState } from "react";
import "../CSS/StudentViewResults.css";

function ViewResults({ onBack }) {
  const [results, setResults] = useState({});

  useEffect(() => {
    const data = {
      "Semester 1": [
        { subject: "Database Systems", grade: "A" },
        { subject: "Software Engineering", grade: "B+" },
      ],
      "Semester 2": [
        { subject: "Computer Networks", grade: "A-" },
        { subject: "Operating Systems", grade: "B" },
      ],
      "Semester 3": [
        { subject: "Artificial Intelligence", grade: "A" },
        { subject: "Web Development", grade: "A-" },
      ],
    };
    setResults(data);
  }, []);

  return (
    <div className="view-results-container">
      <h2>📊 Your Results</h2>

      {Object.keys(results).length === 0 ? (
        <p>No results available.</p>
      ) : (
        <div className="semester-results">
          {Object.entries(results).map(([semester, subjects], idx) => (
            <div className="semester" key={idx}>
              <h3>{semester}</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((r, i) => (
                    <tr key={i}>
                      <td>{r.subject}</td>
                      <td>{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <button className="back-btn" onClick={onBack}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
}

export default ViewResults;

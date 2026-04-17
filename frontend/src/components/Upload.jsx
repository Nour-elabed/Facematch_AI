import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);

  // Check backend health on load
  useEffect(() => {
    axios.get(`${API_URL}/health`, { timeout: 3000 })
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);
    setStatus("Uploading image...");

    // Simulate status messages so user knows it's working
    const messages = [
      "Detecting face in image...",
      "Loading recognition models...",
      "Comparing against dataset...",
      "Almost done...",
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      if (msgIdx < messages.length) {
        setStatus(messages[msgIdx++]);
      }
    }, 4000);

    try {
      const res = await axios.post(`${API_URL}/recognize`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 2 minutes — DeepFace can be slow on first run
      });

      setResult(res.data.result);
      setStatus("Done!");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setResult("Request timed out. The server may still be processing — try again.");
      } else if (err.response) {
        setResult(`Server error: ${err.response.data?.detail || err.message}`);
      } else {
        setResult("Cannot connect to backend. Make sure it is running on port 8000.");
      }
      setStatus("Error");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const isMatch = result && !result.toLowerCase().includes("unknown") && !result.toLowerCase().includes("error");

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>FaceMatch AI</h1>
          <p style={styles.subtitle}>Facial Recognition System</p>
          <div style={{
            ...styles.badge,
            background: backendOnline === null ? "#f3f4f6" : backendOnline ? "#dcfce7" : "#fee2e2",
            color: backendOnline === null ? "#6b7280" : backendOnline ? "#166534" : "#991b1b",
          }}>
            {backendOnline === null ? "Checking backend..." : backendOnline ? "Backend online" : "Backend offline — start uvicorn!"}
          </div>
        </div>

        {/* Upload area */}
        <label style={styles.dropZone}>
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />
          {preview ? (
            <img src={preview} alt="Preview" style={styles.preview} />
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.icon}>📷</div>
              <p style={styles.placeholderText}>Click to select an image</p>
              <p style={styles.placeholderSub}>JPG, JPEG, PNG supported</p>
            </div>
          )}
        </label>

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          style={{
            ...styles.button,
            opacity: loading || !file ? 0.6 : 1,
            cursor: loading || !file ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : "Recognize Face"}
        </button>

        {/* Status */}
        {loading && (
          <div style={styles.statusBox}>
            <div style={styles.spinner} />
            <span style={styles.statusText}>{status}</span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{
            ...styles.result,
            background: isMatch ? "#dcfce7" : "#fef3c7",
            borderColor: isMatch ? "#86efac" : "#fcd34d",
          }}>
            <div style={styles.resultLabel}>Result</div>
            <div style={{ ...styles.resultText, color: isMatch ? "#166534" : "#92400e" }}>
              {result}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 4px",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 12px",
  },
  badge: {
    display: "inline-block",
    fontSize: "12px",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontWeight: "500",
  },
  dropZone: {
    display: "block",
    border: "2px dashed #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "16px",
    minHeight: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s",
  },
  preview: {
    maxWidth: "100%",
    maxHeight: "280px",
    borderRadius: "8px",
    objectFit: "contain",
  },
  placeholder: {
    color: "#94a3b8",
  },
  icon: {
    fontSize: "40px",
    marginBottom: "8px",
  },
  placeholderText: {
    margin: "0 0 4px",
    fontSize: "15px",
    color: "#475569",
  },
  placeholderSub: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    fontWeight: "600",
    background: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "16px",
    transition: "background 0.2s",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#f1f5f9",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid #c7d2fe",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  statusText: {
    fontSize: "14px",
    color: "#475569",
  },
  result: {
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid",
    textAlign: "center",
  },
  resultLabel: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b",
    marginBottom: "6px",
  },
  resultText: {
    fontSize: "20px",
    fontWeight: "700",
  },
};
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [result, setResult] = useState(null);
  const [videoDetections, setVideoDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${API_URL}/health`, { timeout: 10000 });
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  const loadFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setVideoDetections([]);
    setStatus("");
    const isVideo = selected.type.startsWith("video/");
    setFileType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(selected));
    
  };

  const handleChange = (e) => loadFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    loadFile(e.dataTransfer.files[0]);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setFileType(null);
    setResult(null);
    setVideoDetections([]);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startStatusCycle = (messages) => {
    let idx = 0;
    setStatus(messages[0]);
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setStatus(messages[idx]);
    }, 3000);
  };

  const stopStatusCycle = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Veuillez sélectionner une image ou vidéo.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);
    setVideoDetections([]);

    if (fileType === "video") {
      startStatusCycle([
        "Envoi de la vidéo...",
        "Extraction des frames...",
        "Analyse des visages...",
        "Comparaison avec la base de données...",
        "Traitement en cours...",
      ]);
    } else {
      startStatusCycle([
        "Envoi de l'image...",
        "Détection du visage...",
        "Comparaison avec la base de données...",
        "Presque terminé...",
      ]);
    }

    try {
      const endpoint = fileType === "video" ? "/recognize-video" : "/recognize";
      const res = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });

      if (fileType === "video") {
        setVideoDetections(res.data.result || []);
      } else {
        setResult(res.data.result);
      }
      setStatus("Terminé !");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setResult("Délai dépassé — essayez une vidéo plus courte (< 30s).");
      } else {
        setResult("Impossible de se connecter au backend.");
      }
      setStatus("Erreur");
    } finally {
      stopStatusCycle();
      setLoading(false);
    }
  };

  const isMatch = result &&
    !result.toLowerCase().includes("unknown") &&
    !result.toLowerCase().includes("inconnu") &&
    !result.toLowerCase().includes("error") &&
    !result.toLowerCase().includes("erreur");

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🤖</div>
          <h1 style={styles.title}>FaceMatch AI</h1>
          <p style={styles.subtitle}>Reconnaissance Faciale — Image & Vidéo</p>
          <div style={{
            ...styles.badge,
            background: backendOnline ? "#dcfce7" : "#fee2e2",
            color: backendOnline ? "#166534" : "#991b1b",
          }}>
            {backendOnline === null ? "Vérification..." : backendOnline ? "✓ Système en ligne" : "✗ Backend hors ligne"}
          </div>
        </div>

        {/* Upload zone */}
        {!file ? (
          <div
            style={styles.dropZone}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleChange}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
            <p style={styles.dropText}>Glissez une image ou vidéo ici</p>
            <p style={styles.dropSub}>ou cliquez pour sélectionner</p>
            <p style={styles.dropSub}>JPG, PNG — MP4, AVI, MOV</p>
          </div>
        ) : (
          <div style={styles.previewContainer}>
            {fileType === "image" ? (
              <img src={preview} alt="Aperçu" style={styles.previewMedia} />
            ) : (
              <video src={preview} controls style={styles.previewMedia} />
            )}
            <div style={styles.fileInfo}>
              <span style={styles.fileInfoText}>
                {fileType === "video" ? "🎥" : "🖼️"} {file.name}
              </span>
              <span style={styles.fileInfoSize}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.buttonRow}>
          {file && (
            <button
              onClick={handleReset}
              disabled={loading}
              style={styles.resetButton}
            >
              ↩ Charger un autre fichier
            </button>
          )}
          <button
            onClick={file ? handleUpload : () => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              ...styles.mainButton,
              flex: file ? "1" : "none",
              width: file ? "auto" : "100%",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Traitement..."
              : !file
              ? "Sélectionner un fichier"
              : fileType === "video"
              ? "Analyser la vidéo"
              : "Reconnaître le visage"}
          </button>
        </div>

        {/* Status bar */}
        {loading && (
          <div style={styles.statusBox}>
            <div style={styles.spinner} />
            <span style={styles.statusText}>{status}</span>
          </div>
        )}

        {/* Image result */}
        {result && !loading && fileType === "image" && (
          <div style={{
            ...styles.resultBox,
            background: isMatch ? "#dcfce7" : "#fef3c7",
            borderColor: isMatch ? "#86efac" : "#fcd34d",
          }}>
            <div style={styles.resultLabel}>Résultat</div>
            <div style={{
              ...styles.resultText,
              color: isMatch ? "#166534" : "#92400e",
            }}>
              {isMatch ? "✓" : "?"} {result}
            </div>
          </div>
        )}

        {/* Video results */}
        {videoDetections.length > 0 && !loading && fileType === "video" && (
          <div style={styles.videoResults}>
            <div style={styles.resultLabel}>
              Personnes détectées — {videoDetections.length} résultat(s)
            </div>
            {videoDetections.map((d, i) => {
              const known = d.name !== "Unknown" && d.name !== "Inconnu";
              return (
                <div key={i} style={{
                  ...styles.detection,
                  background: known ? "#dcfce7" : "#fef3c7",
                  borderColor: known ? "#86efac" : "#fcd34d",
                }}>
                  <span style={styles.timestamp}>⏱ {d.timestamp}s</span>
                  <span style={{
                    ...styles.detectionName,
                    color: known ? "#166534" : "#92400e",
                  }}>
                    {known ? "✓" : "?"} {d.result}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 8px 40px rgba(99,102,241,0.10)",
    border: "1px solid #e8eaf6",
  },
  header: { textAlign: "center", marginBottom: "24px" },
  logo: { fontSize: "40px", marginBottom: "8px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "#64748b", margin: "0 0 12px" },
  badge: {
    display: "inline-block",
    fontSize: "12px",
    padding: "4px 14px",
    borderRadius: "99px",
    fontWeight: "600",
  },
  dropZone: {
    border: "2px dashed #c7d2fe",
    borderRadius: "14px",
    padding: "32px 16px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "16px",
    background: "#fafbff",
    transition: "border-color 0.2s",
  },
  dropText: { fontSize: "15px", color: "#334155", fontWeight: "500", margin: "0 0 4px" },
  dropSub: { fontSize: "12px", color: "#94a3b8", margin: "2px 0" },
  previewContainer: {
    marginBottom: "16px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  previewMedia: {
    width: "100%",
    maxHeight: "280px",
    objectFit: "contain",
    display: "block",
    background: "#f8fafc",
  },
  fileInfo: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  fileInfoText: { fontSize: "12px", color: "#475569", fontWeight: "500" },
  fileInfoSize: { fontSize: "12px", color: "#94a3b8" },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "14px",
  },
  resetButton: {
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: "600",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mainButton: {
    padding: "12px",
    fontSize: "15px",
    fontWeight: "700",
    background: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#f1f5f9",
    borderRadius: "10px",
    marginBottom: "14px",
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
  statusText: { fontSize: "14px", color: "#475569" },
  resultBox: {
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid",
    textAlign: "center",
  },
  resultLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: "8px",
  },
  resultText: { fontSize: "20px", fontWeight: "800" },
  videoResults: { display: "flex", flexDirection: "column", gap: "8px" },
  detection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid",
  },
  timestamp: { fontSize: "12px", color: "#64748b", minWidth: "65px", fontWeight: "600" },
  detectionName: { fontSize: "14px", fontWeight: "700" },
};
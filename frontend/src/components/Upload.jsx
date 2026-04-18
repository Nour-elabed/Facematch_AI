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
        headers: { "Content-Type": "multipart/for
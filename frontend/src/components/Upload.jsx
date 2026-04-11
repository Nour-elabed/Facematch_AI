import { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult("");
  };

  const handleUpload = async () => {
    if (!file) return alert("Select an image first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://127.0.0.1:8000/recognize",
        formData
      );

      setResult(res.data.result);
    } catch (err) {
      console.error(err);
      setResult("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>🔥 FaceMatch AI</h1>

      <input type="file" onChange={handleChange} />

      {preview && (
        <img src={preview} alt="preview" style={styles.image} />
      )}

      <button onClick={handleUpload} style={styles.button}>
        {loading ? "Processing..." : "Recognize Face"}
      </button>

      {result && <h2>Result: {result}</h2>}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
  },
  image: {
    width: "200px",
    marginTop: "20px",
    borderRadius: "10px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    cursor: "pointer",
  },
};
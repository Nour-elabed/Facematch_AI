import Upload from "./components/Upload";

function App() {
  return (
    <>
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #f0f4ff;
        }
      `}</style>
      <Upload />
    </>
  );
}

export default App;
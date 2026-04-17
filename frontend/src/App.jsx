import Upload from "./components/Upload";

function App() {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <Upload />
    </>
  );
}

export default App;
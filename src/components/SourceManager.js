import React, { useState } from "react";

export default function SourceManager({ onSourcesChanged }) {
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState({
    name: "",
    endpoint: "",
    query: "",
  });
  const [testResult, setTestResult] = useState("");

  const handleAddSource = async () => {
    const testSuccess = await testQuery(newSource.endpoint, newSource.query);
    if (!testSuccess) {
      setTestResult('Query did not respond for keyword "test"');
      return;
    }

    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    setNewSource({ name: "", endpoint: "", query: "" }); // Reset form
    setTestResult("");

    onSourcesChanged(updatedSources);
  };

  const testQuery = async (endpoint, query) => {
    const testQuery = query.replace("{keyword}", "test");
    const url = `${endpoint}?query=${encodeURIComponent(
      testQuery
    )}&format=json`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.results.bindings.length > 0;
      }
    } catch (error) {
      console.error("Error testing query:", error);
    }
    return false;
  };

  return (
    <div>
      <h2>Add New Source</h2>
      <input
        type="text"
        placeholder="Source Name"
        value={newSource.name}
        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="SPARQL Endpoint"
        value={newSource.endpoint}
        onChange={(e) =>
          setNewSource({ ...newSource, endpoint: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Query (use {keyword} as placeholder)"
        value={newSource.query}
        onChange={(e) => setNewSource({ ...newSource, query: e.target.value })}
      />
      <button onClick={handleAddSource}>Add Source</button>
      {testResult && <p>{testResult}</p>}
    </div>
  );
}

import "../App.css";
import SourceManager from "./SourceManager";
import Configuration from "./Configuration";
import CampaignOptions from "./CampaignOptions";
import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";

function ContentAnnotator() {
  const [item, setItem] = useState({ type: null, value: "" });
  const [annotationType, setAnnotationType] = useState("comment");
  const [concepts, setConcepts] = useState([]);
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState([
    {
      name: "DBpedia",
      endpoint: "https://dbpedia.org/sparql",
      query: `
        SELECT DISTINCT ?label WHERE {
          ?s rdfs:label ?label .
          FILTER (langMatches(lang(?label), "EN") && contains(lcase(str(?label)), "{keyword}"))
        } LIMIT 5
      `,
    },
  ]);

  /* global chrome */

  useEffect(() => {
    chrome.runtime.sendMessage({ request: "getSelectedData" }, (response) => {
      if (response) {
        setItem(response);
      }
    });
    const savedSources = JSON.parse(localStorage.getItem("userSources"));
    if (savedSources && savedSources.length > 0) {
      setSources((prevSources) => [...prevSources, ...savedSources]);
    }
  }, []);

  const handleSourcesChanged = (updatedSources) => {
    const userSources = updatedSources.filter(
      (source) => source.name !== "DBpedia"
    );
    localStorage.setItem("userSources", JSON.stringify(userSources));

    setSources(updatedSources);
  };

  const selectWholePage = () => {
    setItem({ type: null, value: "" });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: selectBodyContent,
      });
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ item, annotationType, concepts, description });
    saveAnnotation();
  };

  const loadOptions = async (inputValue, callback) => {
    if (!inputValue) return callback([]);

    const fetchDbpedia = async (inputValue) => {
      const query = `
        SELECT DISTINCT ?label WHERE {
          ?s rdfs:label ?label .
          FILTER (langMatches(lang(?label), "EN") && contains(lcase(str(?label)), "${inputValue.toLowerCase()}"))
        } LIMIT 5
      `;
      const url = `https://dbpedia.org/sparql?query=${encodeURIComponent(
        query
      )}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      return data.results.bindings.map((item) => ({
        value: item.label.value,
        label: `[DBpedia] ${item.label.value}`,
      }));
    };

    const fetchSimpleApi = async (inputValue) => {
      const response = await fetch(
        `https://api.datamuse.com/words?rel_syn=${inputValue}`
      );
      const data = await response.json();
      return data.map((item) => ({
        value: item.word,
        label: `[API] ${item.word}`,
      }));
    };

    try {
      const [apiResults, dbpediaResults] = await Promise.all([
        fetchSimpleApi(inputValue),
        fetchDbpedia(inputValue),
      ]);

      const combinedOptions = [...apiResults, ...dbpediaResults];
      callback(combinedOptions);
    } catch (error) {
      console.error("Error fetching data: ", error);
      callback([]);
    }
  };

  const generateAnnotationId = () => {
    return `annotation-${new Date().getTime()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  };

  const saveAnnotation = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const pageUrl = tabs[0].url; // Gets the URL of the current tab

      const annotationId = generateAnnotationId();
      const annotation = {
        id: annotationId,
        Author: "",
        Agent: "Web Page",
        item,
        annotationType,
        concepts: concepts.map((c) => c.value),
        description,
        pageUrl,
        date: new Date().toISOString(),
      };

      const annotations = JSON.parse(localStorage.getItem("annotations")) || [];
      annotations.push(annotation);

      localStorage.setItem("annotations", JSON.stringify(annotations));

      console.log("Annotation saved:", annotation);
    });
  };

  const handleConceptsChange = (selectedOption) => {
    if (!concepts.find((c) => c.value === selectedOption.value)) {
      setConcepts([...concepts, selectedOption]);
    }
  };

  const removeConcept = (valueToRemove) => {
    setConcepts(concepts.filter((c) => c.value !== valueToRemove));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Content Annotator</h1>
        <div className="selected-content">
          {item.type === "text" && <p>Selected Text: {item.value}</p>}
          {item.type === "image" && <img src={item.value} alt="Selected" />}
        </div>
        <button onClick={selectWholePage} className="select-page-button">
          Select Whole Page
        </button>

        <form onSubmit={handleSubmit} className="annotation-form">
          <label>
            Annotation Type:
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="form-control"
            >
              <option value="comment">Comment</option>
              <option value="question">Question</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Concepts:
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadOptions}
              onChange={handleConceptsChange}
              value={null}
              styles={{
                menuList: (provided) => ({
                  ...provided,
                  maxHeight: "175px",
                  overflowY: "auto",
                }),
                option: (provided, state) => ({
                  ...provided,
                  color: "black",
                }),
              }}
            />
          </label>
          <div className="selected-contexts">
            {concepts.map((c, index) => (
              <div key={index} className="selected-context">
                {c.label}
                <button
                  type="button"
                  onClick={() => removeConcept(c.value)}
                  className="remove-context"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
            ></textarea>
          </label>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </header>
    </div>
  );
}

function selectBodyContent() {
  const bodyContent = document.body.innerHTML;
  chrome.runtime.sendMessage({ type: "page", value: bodyContent });
}

export default ContentAnnotator;

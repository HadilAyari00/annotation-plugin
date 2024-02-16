import "../App.css";
import SourceManager from "./SourceManager";
import Configuration from "./Configuration";
import CampaignOptions from "./CampaignOptions";
import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import thesaurusData from "../data/thesaurus.json";
import { addAnnotation } from "../Server/addDoc";

function ContentAnnotator({ campaign, onReturnToCampaignOptions }) {
  const [item, setItem] = useState({ type: null, value: "" });
  const [annotationType, setAnnotationType] = useState("comment");
  const [concepts, setConcepts] = useState([]);
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  /* global chrome */

  useEffect(() => {
    // Get the selected data from the content script
    chrome.runtime.sendMessage({ request: "getSelectedData" }, (response) => {
      if (response) {
        setItem(response);
      }
    });

    // Get the current tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        setPageUrl(currentTab.url);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!annotationType || !description.trim() || !item.value.trim()) {
      window.alert(
        "Please select an annotation type, enter a description, and select an item."
      );
      return;
    }

    const username = localStorage.getItem("username");

    const annotationData = {
      Author: username,
      Agent: "Web Page",
      item,
      annotationType,
      concepts: concepts.map((c) => c.value),
      description,
      pageUrl: pageUrl,
      date: new Date().toISOString(),
      campaignId: campaign.id,
    };

    try {
      await addAnnotation(annotationData);
      window.alert("Annotation saved successfully!");

      setAnnotationType("comment");
      setDescription("");
      setConcepts([]);
      setItem({ type: null, value: "" });
    } catch (error) {
      console.error("Error adding annotation:", error);
      window.alert("Failed to save annotation.");
    }
  };

  const loadOptions = async (inputValue, callback) => {
    if (!inputValue) return callback([]);

    const selectedThesauriData = thesaurusData.filter((thesaurus) =>
      campaign.selectedThesauri.includes(thesaurus.name)
    );

    const fetchOptionsFromThesaurus = async (thesaurus, keyword) => {
      const query = thesaurus.query.replace("{keyword}", keyword.toLowerCase());
      const response = await fetch(
        `${thesaurus.endpoint}?query=${encodeURIComponent(query)}&format=json`
      );
      const data = await response.json();

      return data.results.bindings.map((binding) => {
        const label = binding.label || binding.itemLabel || binding.subject;
        return {
          value: label.value,
          label: `[${thesaurus.name}] ${label.value}`,
        };
      });
    };

    try {
      const promises = selectedThesauriData.map((thesaurus) =>
        fetchOptionsFromThesaurus(thesaurus, inputValue)
      );
      const results = await Promise.all(promises);
      const combinedOptions = results.flat();
      callback(combinedOptions);
    } catch (error) {
      console.error("Error fetching data from thesauri: ", error);
      callback([]);
    }
  };

  const generateAnnotationId = () => {
    return `annotation-${new Date().getTime()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
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
        <div className="content-annotator-header">
          <button className="return-icon" onClick={onReturnToCampaignOptions}>
            ←
          </button>
          <h1>{campaign?.name}</h1>
        </div>
        <div className="selected-content">
          {item.type === "text" && <p>Selected Text: {item.value}</p>}
          {item.type === "image" && <img src={item.value} alt="Selected" />}
        </div>

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

export default ContentAnnotator;

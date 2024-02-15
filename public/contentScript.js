// Event listener for text selection
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString();

  // Handling text selection
  if (selectedText.length > 0) {
    console.log("Selected text:", selectedText);
    chrome.runtime.sendMessage({ type: "text", value: selectedText });
  }
});

// Event listener for image click
document.addEventListener(
  "click",
  (e) => {
    // Check if the clicked element is an image
    if (e.target.tagName === "IMG") {
      const imgSrc = e.target.src;
      console.log("Selected image:", imgSrc);
      chrome.runtime.sendMessage({ type: "image", value: imgSrc });

      // Prevent default to stop any other actions that might happen on image click
      e.preventDefault();
    }
  },
  true
); // Use capture phase to handle the event early

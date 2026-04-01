chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  if (changeInfo.status === "complete" && tab.url) {

      let https_status = tab.url.startsWith("https") ? 1 : 0;

      fetch("http://127.0.0.1:5000/predict", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              new_device: 0,
              new_location: 0,
              odd_time: 0,
              https_status: https_status
          })
      })
      .then(response => response.json())
      .then(data => {

          if (data.risk_level === "HIGH") {

              alert(
                  "⚠ Warning: This website might be unsafe\n\n" +
                  "Risk Level: " + data.risk_level +
                  "\nRisk Score: " + data.risk_score +
                  "\n\nProceed with caution."
              );

          }

      });

  }

});
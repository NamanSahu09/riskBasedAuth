chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === "complete" && tab.url) {

        // only check real websites
        if (!tab.url.startsWith("http")) return;

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
                url: tab.url,
                https_status: https_status
            })
        })
        .then(res => res.json())
        .then(data => {

            console.log("Prediction:", data);

            if (data.risk_level === "HIGH") {

                alert(
                    "⚠ Risky Website Detected\n\n" +
                    "Risk Level: " + data.risk_level +
                    "\nRisk Score: " + data.risk_score
                );

            }

        })
        .catch(err => console.log("ML API error:", err));

    }

});
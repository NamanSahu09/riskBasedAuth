chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;

    if (!tab.url) return;

    // Ignore chrome internal pages
    if (!tab.url.startsWith("http")) return;

    console.log("Checking:", tab.url);

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

        console.log("ML Result:", data);

        if (data.risk_level === "HIGH") {

            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "Unsafe Website Detected",
                message: "Risk Score: " + data.risk_score
            });

        }

    })

    .catch(err => console.log("ML API Error:", err));

});
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){

  let url = tabs[0].url;

  let https_status = url.startsWith("https") ? 1 : 0;

  // If HTTP → directly mark as risky
  if(https_status === 0){

      document.getElementById("riskLevel").innerText = "HIGH";
      document.getElementById("riskScore").innerText = "85";

      document.getElementById("riskLevel").className = "high";

      return;
  }




  

  // Otherwise call ML API
  fetch("http://127.0.0.1:5000/predict", {

      method: "POST",

      headers:{
          "Content-Type":"application/json"
      },

      body: JSON.stringify({

          new_device:0,
          new_location:0,
          odd_time:0,
          https_status:https_status

      })

  })

  .then(res => res.json())

  .then(data => {

      document.getElementById("riskLevel").innerText = data.risk_level;
      document.getElementById("riskScore").innerText = data.risk_score;

      let level = data.risk_level.toLowerCase();

      document.getElementById("riskLevel").className = level;

  });

});
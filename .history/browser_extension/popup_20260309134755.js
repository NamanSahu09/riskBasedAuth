chrome.tabs.query({active: true, currentWindow: true}, function(tabs){

  let url = tabs[0].url;

  let https_status = url.startsWith("https") ? 1 : 0;

  // If HTTP → directly mark as risky
  if(https_status === 0){

    document.getElementById("riskLevel").innerText = "MEDIUM";
    document.getElementById("riskScore").innerText = "50";

    document.getElementById("riskLevel").className = "medium";

    return;
}

let suspiciousWords = ["login","verify","bank","update","secure"];

let riskScore = 0;

if(https_status === 0){
    riskScore += 30;
}

for(let word of suspiciousWords){
    if(url.includes(word)){
        riskScore += 20;
    }
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
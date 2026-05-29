const fs = require('fs');

async function upload() {
  const jsonStr = fs.readFileSync('n8n-blog-automation.json', 'utf8');
  
  const response = await fetch('https://inaciolanga.app.n8n.cloud/api/v1/workflows', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MjJmMWZkYi1lMjk3LTQzYmEtYTg3Yi1iMmMwNTAxNThiMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjY2Zjc1OWM2LTEwMmEtNGI5Yi05ZjgzLTcyN2I2OGEyYTkwMCIsImlhdCI6MTc3OTk4OTI5M30.uk03PuEhhLhIfCCcDB3XxzIebmEEV8-mcib0uYcpRo4',
      'Content-Type': 'application/json'
    },
    body: jsonStr
  });
  
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

upload().catch(console.error);

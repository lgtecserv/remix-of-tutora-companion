import fs from 'fs';

const filePath = 'n8n-blog-automation.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Adicionar novo nó (Ping Bing IndexNow)
data.nodes.push({
  parameters: {
    url: "=https://www.bing.com/indexnow?url=https://www.imersaocompleta.info/blog/{{ encodeURIComponent($('Prepare Supabase Data').item.json.slug) }}&key=bd2c1e7a9b1248a39e8a0a9c8b7f5e3d",
    sendHeaders: false,
    options: {
      ignoreResponseCode: true
    }
  },
  id: "ping-bing-indexnow",
  name: "Ping Bing IndexNow",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4,
  position: [1600, 0]
});

// Adicionar a ligação do "Publish to Supabase" para o "Ping Bing IndexNow"
data.connections["Publish to Supabase"] = {
  main: [
    [
      {
        node: "Ping Bing IndexNow",
        type: "main",
        index: 0
      }
    ]
  ]
};

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('n8n workflow updated successfully!');

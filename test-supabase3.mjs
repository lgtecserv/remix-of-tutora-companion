const url = "https://bgyuenqoghnufflorgsw.supabase.co/rest/v1/blog_posts?slug=eq.transformacao-digital-em-2027&select=slug,cover_url";
const headers = {
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXVlbnFvZ2hudWZmbG9yZ3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTc0MTYsImV4cCI6MjA5NTAzMzQxNn0.KzWlEtVN7Env7KFhOnMMqq2W7B_gekGIf01OvCCBgSM",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneXVlbnFvZ2hudWZmbG9yZ3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTc0MTYsImV4cCI6MjA5NTAzMzQxNn0.KzWlEtVN7Env7KFhOnMMqq2W7B_gekGIf01OvCCBgSM"
};

fetch(url, { headers }).then(r => r.json()).then(data => console.log(data)).catch(console.error);

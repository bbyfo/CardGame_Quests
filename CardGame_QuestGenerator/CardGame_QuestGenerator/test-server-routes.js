const http = require('http');
const PORT = process.env.PORT || 3000;
const host = 'localhost';

function check(path) {
  return new Promise((resolve) => {
    const options = { host, port: PORT, path, method: 'GET', timeout: 3000 };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ path, status: res.statusCode, length: data.length, snippet: data.slice(0, 200) }));
    });
    req.on('error', (err) => resolve({ path, error: err.message }));
    req.end();
  });
}

(async () => {
  console.log('Checking server routes on port', PORT);
  const results = await Promise.all([check('/'), check('/CardGame_Quests/'), check('/nonexistent-path/')]);
  results.forEach(r => console.log(r));
})();
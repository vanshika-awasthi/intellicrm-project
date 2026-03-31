import('dotenv').then(dotenv => {
  dotenv.config();
  fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GOOGLE_API_KEY)
  .then(res => res.json())
  .then(data => {
      console.log(data.models.map(m => m.name).join('\n'));
  });
});

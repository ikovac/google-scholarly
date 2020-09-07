require('dotenv').config();
const Scholar = require('../index');
const apiKey = process.env.API_KEY; // Your https://proxiesapi.com/ api key

Scholar.init(apiKey);

Scholar.getAuthor('Steven A. Cholewiak').then(res => console.log(res));

// Expected output:
// [
//   {
//     name: 'Steven A. Cholewiak, PhD',
//     domain: 'berkeley.edu',
//     affiliation: 'Vision Scientist',
//     interests: [
//       'Depth Cues',
//       '3D Shape',
//       'Shape from Texture & Shading',
//       'Naive Physics',
//       'Haptics'
//     ]
//   }
// ]

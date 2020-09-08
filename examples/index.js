require('dotenv').config();
const Scholar = require('../index');
const apiKey = process.env.API_KEY; // Your https://proxiesapi.com/ api key
console.log('api key: ', apiKey);
Scholar.init(apiKey);

Scholar.getPubAuthors('"Wireless sensor networks: a survey"').then(res => console.log(res));
// Scholar
//   .getAuthorProfile('/citations?user=rAGwv14AAAAJ&hl=hr&oe=ASCII&oi=sra')
//   .then(res => console.log(res));

// Scholar.getAuthor('Steven A. Cholewiak').then(res => console.log(res));

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

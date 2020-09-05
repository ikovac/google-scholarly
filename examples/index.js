const Scholar = require('../index');
const API_KEY = ''; // Your https://proxiesapi.com/ api key

Scholar.init(API_KEY);

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

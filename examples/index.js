require('dotenv').config();
const Scholar = require('../index');
const apiKey = process.env.API_KEY; // Your https://proxiesapi.com/ api key

Scholar.init(apiKey);
Scholar
  .getPubAuthors('"A frequency-domain analysis of haptic gratings"')
  .then(res => console.log(res))
  .catch(err => console.log(err.message));

// Expected output
// [
//   {
//     name: 'Steven A. Cholewiak, PhD',
//     affiliation: 'Vision Scientist',
//     homepage: 'http://steven.cholewiak.com/',
//     domain: 'berkeley.edu',
//     hindex: '8',
//     interests: [
//       'Depth Cues',
//       '3D Shape',
//       'Shape from Texture & Shading',
//       'Naive Physics',
//       'Haptics'
//     ]
//   },
//   {
//     name: 'Kwangtaek Kim',
//     affiliation: 'Kent State University',
//     homepage: undefined,
//     domain: 'cs.kent.ed',
//     hindex: '12',
//     interests: [ve
//       'haptics',
//       'perception',
//       'immersive user interface',
//       'visuohaptic watermarking'
//     ]
//   },
//   {
//     name: 'Hong Z Tan',
//     affiliation: 'Professor of ECE, Purdue University',
//     homepage: 'http://engineering.purdue.edu/~hongtan',
//     domain: 'purdue.edu',
//     hindex: '49',
//     interests: [ 'haptics', 'psychophysics' ]
//   }
// ]

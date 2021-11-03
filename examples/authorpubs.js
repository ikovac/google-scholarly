'use strict';

const Scholar = require('..');
/*
Scholar
  .init()
  .getAuthorPubs('/citations?user=ynWS968AAAAJ&hl=en', 20, "year")
  .then(res => console.log(res))
  .catch(err => console.error(err.message));
*/

  Scholar
    .init()
    .getAuthorProfile('ynWS968AAAAJ')
    .then(res => console.log(res))
    .catch(err => console.error(err.message));


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
//     interests: [
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

# Google Scholar Node.js

[![install size](https://badgen.net/packagephobia/install/google-scholarly)](https://packagephobia.now.sh/result?p=google-scholarly)
[![npm package version](https://badgen.net/npm/v/google-scholarly)](https://npm.im/google-scholarly)
[![github license](https://badgen.net/github/license/ikovac/google-scholarly)](https://github.com/ikovac/google-scholarly/blob/master/LICENSE)
[![js semistandard style](https://badgen.net/badge/code%20style/semistandard/pink)](https://github.com/Flet/semistandard)

## Installation
```
npm install --save google-scholarly
```
Get `API_KEY` from: https://proxiesapi.com/

## Example
### With proxy API key
```js
Scholar
  .init(apiKey)
  .getPubAuthors('"A frequency-domain analysis of haptic gratings"')
  .then(res => console.log(res))
  .catch(err => console.error(err.message));
```
### Without proxy API key (NOT RECOMMENDED)
```js
Scholar
  .init()
  .getPubAuthors('"A frequency-domain analysis of haptic gratings"')
  .then(res => console.log(res))
  .catch(err => console.error(err.message));
```

Expected output:
```
[
  {
    name: 'Steven A. Cholewiak, PhD',
    affiliation: 'Vision Scientist',
    homepage: 'http://steven.cholewiak.com/',
    domain: 'berkeley.edu',
    hindex: '8',
    interests: [
      'Depth Cues',
      '3D Shape',
      'Shape from Texture & Shading',
      'Naive Physics',
      'Haptics'
    ]
  },
  {
    name: 'Kwangtaek Kim',
    affiliation: 'Kent State University',
    homepage: undefined,
    domain: 'cs.kent.ed',
    hindex: '12',
    interests: [
      'haptics',
      'perception',
      'immersive user interface',
      'visuohaptic watermarking'
    ]
  },
  {
    name: 'Hong Z Tan',
    affiliation: 'Professor of ECE, Purdue University',
    homepage: 'http://engineering.purdue.edu/~hongtan',
    domain: 'purdue.edu',
    hindex: '49',
    interests: [ 'haptics', 'psychophysics' ]
  }
]
```

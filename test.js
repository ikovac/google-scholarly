'use strict';

const nock = require('nock');
const path = require('path');
const Scholar = require('.');

nock.back.setMode('record');
nock.back.fixtures = path.join(__dirname, '__nock_fixtures__');

beforeAll(() => Scholar.init('dummy'));

afterEach(() => nock.restore());

test('fetch publication authors', async () => {
  const { nockDone } = await nock.back('pub-authors.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  const authors = await Scholar.getPubAuthors(query);
  expect(authors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      name: 'Steven A. Cholewiak, PhD',
      affiliation: 'Vision Scientist',
      homepage: 'http://steven.cholewiak.com/',
      interests: [
        'Depth Cues',
        '3D Shape',
        'Shape from Texture & Shading',
        'Naive Physics',
        'Haptics'
      ]
    }),
    expect.objectContaining({
      name: 'Kwangtaek Kim',
      affiliation: 'Kent State University',
      domain: 'cs.kent.edu',
      hindex: '12'
    }),
    expect.objectContaining({
      name: 'Hong Z Tan',
      affiliation: 'Professor of ECE, Purdue University',
      homepage: 'http://engineering.purdue.edu/~hongtan',
      domain: 'purdue.edu',
      hindex: '49'
    })
  ]));
  nockDone();
}, 10000);

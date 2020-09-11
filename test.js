'use strict';

const nock = require('nock');
const path = require('path');
const Scholar = require('.');

nock.back.setMode('record');
nock.back.fixtures = path.join(__dirname, '__nock_fixtures__');

beforeAll(() => Scholar.init('dummy'));

afterEach(() => nock.restore());

test('search publications', async () => {
  const { nockDone } = await nock.back('pub-search.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  const pub = await Scholar.searchPub(query);
  expect(pub).toEqual(expect.objectContaining({
    title: 'A frequency-domain analysis of haptic gratings',
    authors: expect.arrayContaining([
      expect.objectContaining({ name: 'SA Cholewiak' }),
      expect.objectContaining({ name: 'K Kim' }),
      expect.objectContaining({ name: 'HZ Tan' })
    ])
  }));
  nockDone();
}, 10000);

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

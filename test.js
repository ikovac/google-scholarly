'use strict';

const nock = require('nock');
const path = require('path');
const Scholar = require('.');

nock.back.fixtures = path.join(__dirname, '__nock_fixtures__');

beforeAll(() => Scholar.init('dummy'));

afterEach(() => nock.restore());

test('search publications', async () => {
  const { nockDone } = await nock.back('pub-search.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  const pub = await Scholar.searchPub(query);
  nockDone();
  expect(pub).toEqual(expect.objectContaining({
    title: 'A frequency-domain analysis of haptic gratings',
    authors: expect.arrayContaining([
      expect.objectContaining({ id: '4bahYMkAAAAJ', name: 'SA Cholewiak' }),
      expect.objectContaining({ id: 'itUoRvUAAAAJ', name: 'K Kim' }),
      expect.objectContaining({ id: 'OiVOAHMAAAAJ', name: 'HZ Tan' })
    ])
  }));
}, 10000);

test('fetch publication authors', async () => {
  const { nockDone } = await nock.back('pub-authors.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  const authors = await Scholar.getPubAuthors(query);
  nockDone();
  expect(authors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      id: '4bahYMkAAAAJ',
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
      id: 'itUoRvUAAAAJ',
      name: 'Kwangtaek Kim',
      affiliation: 'Kent State University',
      domain: 'cs.kent.edu',
      hindex: '12'
    }),
    expect.objectContaining({
      id: 'OiVOAHMAAAAJ',
      name: 'Hong Z Tan',
      affiliation: 'Professor of ECE, Purdue University',
      homepage: 'http://engineering.purdue.edu/~hongtan',
      domain: 'purdue.edu',
      hindex: '49'
    })
  ]));
}, 10000);

test('handle invalid API key', async () => {
  const { nockDone } = await nock.back('invalid-api-key.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  try {
    await Scholar.searchPub(query);
  } catch (error) {
    nockDone();
    expect(error).toBeInstanceOf(Scholar.ScholarlyError);
    expect(error).toBeInstanceOf(Scholar.ProxyError);
  }
}, 10000);

test('handle captcha', async () => {
  const { nockDone } = await nock.back('captcha.json');
  const query = '"A frequency-domain analysis of haptic gratings"';
  try {
    await Scholar.searchPub(query);
  } catch (error) {
    nockDone();
    expect(error).toBeInstanceOf(Scholar.ScholarlyError);
    expect(error).toBeInstanceOf(Scholar.CaptchaError);
  }
}, 10000);

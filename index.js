const cheerio = require('cheerio');
const got = require('got');
const PROXY_URL = 'http://api.proxiesapi.com';

const searchTags = {
  results: '.gsc_1usr',
  name: 'h3 a',
  email: '.gs_ai_eml',
  affiliation: '.gs_ai_aff',
  interests: '.gs_ai_int .gs_ai_one_int'
};

class Scholar {
  constructor() { }

  init(key) {
    this.apiKey = key;
    this.baseUrl = `${PROXY_URL}?auth_key=${this.apiKey}&url=`;
  }

  request(url) {
    const searchUrl = `${this.baseUrl}${encodeURIComponent(url)}`;
    return got(searchUrl);
  }

  parseResult(html) {
    const $ = cheerio.load(html);
    const results = $(searchTags.results);

    if (!results.length) {
      return null;
    }

    const authors = [];
    $(results).each((index, element) => {
      const author = {};

      author.name = $(searchTags.name, element).text();
      author.domain = $(searchTags.email, element).text().split(' ').pop();
      author.affiliation = $(searchTags.affiliation, element).text();

      const interestsHtml = $(searchTags.interests, element);
      const interests = [];
      $(interestsHtml).each((_, element) => {
        interests.push($(element).text());
      });
      author.interests = interests;

      authors.push(author);
    });

    return authors;
  }

  async getAuthor(query) {
    const url = 'https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=' + encodeURIComponent(query);

    let result;
    try {
      result = await this.request(url)
      return this.parseResult(result.body);
    } catch (error) {
      if (error.response.statusCode === 401) {
        throw new Error('Api key invalid or expired');
      }
      throw new Error(error);
    }
  }
}

module.exports = new Scholar();

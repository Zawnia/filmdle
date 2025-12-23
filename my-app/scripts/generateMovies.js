/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MIN_VOTE_COUNT = 1500;
const MIN_VOTE_AVERAGE = 6.0;
const TOTAL_PAGES = 70;

async function fetchPage(apiKey, page) {
  const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("sort_by", "vote_average.desc");
  url.searchParams.set("vote_count.gte", String(MIN_VOTE_COUNT));
  url.searchParams.set("vote_average.gte", String(MIN_VOTE_AVERAGE));
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(page));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDb request failed for page ${page}`);
  }
  const data = await response.json();
  return data.results || [];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function main() {
  const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    console.error("Missing TMDB_API_KEY in environment.");
    process.exit(1);
  }

  const ids = new Set();
  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    const results = await fetchPage(apiKey, page);
    results.forEach((movie) => {
      if (movie?.id) {
        ids.add(movie.id);
      }
    });
    console.log(`Fetched page ${page}/${TOTAL_PAGES}`);
  }

  const movieBank = shuffle(Array.from(ids));
  const outputPath = path.join(__dirname, "..", "data", "movieBank.json");
  fs.writeFileSync(outputPath, JSON.stringify(movieBank, null, 2));
  console.log(`Saved ${movieBank.length} movies to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

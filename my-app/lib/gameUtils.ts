import movieBank from "@/data/movieBank.json";

export type MovieDetails = {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number | null;
  poster_path?: string | null;
  original_language?: string;
  production_companies?: Array<{ id?: number; name?: string }>;
  production_countries?: Array<{ iso_3166_1?: string; name?: string }>;
  genres?: Array<{ id?: number; name?: string }>;
  credits?: {
    crew?: Array<{
      id?: number;
      job?: string;
      name?: string;
      profile_path?: string | null;
    }>;
    cast?: Array<{
      id?: number;
      name?: string;
      order?: number;
      profile_path?: string | null;
    }>;
  };
};

export type GuessFeedback = {
  year: { value: number; diff: "older" | "newer" | "exact" };
  runtime: { value: number; diff: "shorter" | "longer" | "exact" };
  language: { code: string; match: boolean };
  genres: Array<{ name: string; match: boolean }>;
  cast: Array<{
    id?: number;
    name: string;
    photo: string;
    match: boolean;
    role?: "cast" | "director";
  }>;
  productionCompanies: Array<{ name: string; match: boolean }>;
  productionCountries: Array<{ name: string; match: boolean }>;
  director: { name: string; match: boolean };
};

export type GuessHistoryEntry = {
  movie: MovieDetails;
  feedback: GuessFeedback;
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyMovieId(dateString = getLocalDateString()) {
  const list = movieBank as number[];
  if (!list.length) {
    throw new Error("Movie bank is empty");
  }
  const seed = Number(dateString.replace(/-/g, ""));
  const index = seed % list.length;
  return list[index];
}

export async function getDailyMovie(
  apiKey: string | undefined,
  dateString = getLocalDateString()
): Promise<MovieDetails | null> {
  if (!apiKey) {
    return null;
  }

  const movieId = getDailyMovieId(dateString);
  const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("append_to_response", "credits");
  url.searchParams.set("language", "fr-FR");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch daily movie");
  }

  return (await response.json()) as MovieDetails;
}

export async function getRandomMovie(
  apiKey: string | undefined
): Promise<MovieDetails | null> {
  if (!apiKey) {
    return null;
  }
  const list = movieBank as number[];
  if (!list.length) {
    throw new Error("Movie bank is empty");
  }
  const index = Math.floor(Math.random() * list.length);
  const movieId = list[index];
  const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("append_to_response", "credits");
  url.searchParams.set("language", "fr-FR");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch random movie");
  }

  return (await response.json()) as MovieDetails;
}

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getYear(movie: MovieDetails) {
  if (!movie.release_date) {
    return 0;
  }
  const year = Number(movie.release_date.slice(0, 4));
  return Number.isNaN(year) ? 0 : year;
}

function getDirectorMembers(movie: MovieDetails) {
  return (movie.credits?.crew ?? []).filter((member) => member.job === "Director");
}

function getDirector(movie: MovieDetails) {
  return getDirectorMembers(movie)[0]?.name ?? "";
}

function getGenres(movie: MovieDetails) {
  return (movie.genres ?? []).map((genre) => ({
    id: genre.id,
    name: genre.name ?? "",
  }));
}

function getProductionCompanies(movie: MovieDetails) {
  return (movie.production_companies ?? []).map((company) => ({
    id: company.id,
    name: company.name ?? "",
  }));
}

function getProductionCountries(movie: MovieDetails) {
  return (movie.production_countries ?? []).map((country) => ({
    code: country.iso_3166_1 ?? "",
    name: country.name ?? "",
  }));
}

function getTopCast(movie: MovieDetails, limit = 10) {
  return (movie.credits?.cast ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? Number.POSITIVE_INFINITY) -
        (b.order ?? Number.POSITIVE_INFINITY)
    )
    .slice(0, limit)
    .map((member) => ({
      id: member.id,
      name: member.name ?? "",
      profile_path: member.profile_path ?? null,
    }))
    .filter((member) => member.name);
}

function getCastSets(movie: MovieDetails) {
  const cast = movie.credits?.cast ?? [];
  const idSet = new Set<number>();
  const nameSet = new Set<string>();

  cast.forEach((member) => {
    if (member.id) {
      idSet.add(member.id);
    }
    if (member.name) {
      nameSet.add(normalize(member.name));
    }
  });

  return { idSet, nameSet };
}

function getGenreSets(genres: Array<{ id?: number; name?: string }>) {
  const idSet = new Set<number>();
  const nameSet = new Set<string>();

  genres.forEach((genre) => {
    if (genre.id) {
      idSet.add(genre.id);
    }
    if (genre.name) {
      nameSet.add(normalize(genre.name));
    }
  });

  return { idSet, nameSet };
}

function getCompanySets(companies: Array<{ id?: number; name?: string }>) {
  const idSet = new Set<number>();
  const nameSet = new Set<string>();

  companies.forEach((company) => {
    if (company.id) {
      idSet.add(company.id);
    }
    if (company.name) {
      nameSet.add(normalize(company.name));
    }
  });

  return { idSet, nameSet };
}

function getCountrySets(
  countries: Array<{ code?: string; name?: string }>
) {
  const codeSet = new Set<string>();
  const nameSet = new Set<string>();

  countries.forEach((country) => {
    if (country.code) {
      codeSet.add(normalize(country.code));
    }
    if (country.name) {
      nameSet.add(normalize(country.name));
    }
  });

  return { codeSet, nameSet };
}

export function checkGuess(
  target: MovieDetails,
  guess: MovieDetails
): GuessHistoryEntry {
  const targetYear = getYear(target);
  const guessYear = getYear(guess);
  const yearDiff =
    guessYear === targetYear
      ? "exact"
      : guessYear < targetYear
        ? "older"
        : "newer";

  const targetRuntime = target.runtime ?? 0;
  const guessRuntime = guess.runtime ?? 0;
  const runtimeDiff =
    Math.abs(targetRuntime - guessRuntime) <= 10
      ? "exact"
      : guessRuntime < targetRuntime
        ? "shorter"
        : "longer";

  const targetDirectors = getDirectorMembers(target)
    .map((member) => member.name ?? "")
    .filter(Boolean);
  const guessDirectors = getDirectorMembers(guess)
    .map((member) => member.name ?? "")
    .filter(Boolean);
  const guessDirector = guessDirectors[0] ?? "";
  const guessDirectorMember = getDirectorMembers(guess)[0];
  const targetDirectorSet = new Set(targetDirectors.map(normalize));
  const directorMatch = guessDirectors.some((name) =>
    targetDirectorSet.has(normalize(name))
  );

  const targetLanguage = normalize(target.original_language);
  const guessLanguage = normalize(guess.original_language);
  const languageMatch =
    targetLanguage.length > 0 && targetLanguage === guessLanguage;

  const targetGenres = getGenres(target);
  const guessGenres = getGenres(guess);
  const targetGenreSets = getGenreSets(targetGenres);

  const genreFeedback = guessGenres.map((genre) => {
    const matchesId = genre.id ? targetGenreSets.idSet.has(genre.id) : false;
    const matchesName = genre.name
      ? targetGenreSets.nameSet.has(normalize(genre.name))
      : false;

    return {
      name: genre.name,
      match: matchesId || matchesName,
    };
  });

  const targetCastSets = getCastSets(target);
  const guessCast = getTopCast(guess, 10);
  const castFeedback = guessCast.map((member) => {
    const matchesId = member.id ? targetCastSets.idSet.has(member.id) : false;
    const matchesName = member.name
      ? targetCastSets.nameSet.has(normalize(member.name))
      : false;

    return {
      id: member.id,
      name: member.name,
      photo: member.profile_path ? `${PROFILE_BASE_URL}${member.profile_path}` : "",
      match: matchesId || matchesName,
      role: "cast" as const,
    };
  });

  if (guessDirector) {
    castFeedback.push({
      id: guessDirectorMember?.id,
      name: guessDirector,
      photo: guessDirectorMember?.profile_path
        ? `${PROFILE_BASE_URL}${guessDirectorMember.profile_path}`
        : "",
      match: directorMatch,
      role: "director",
    });
  }

  const targetCompanies = getProductionCompanies(target);
  const guessCompanies = getProductionCompanies(guess);
  const targetCompanySets = getCompanySets(targetCompanies);
  const companyFeedback = guessCompanies.map((company) => {
    const matchesId = company.id ? targetCompanySets.idSet.has(company.id) : false;
    const matchesName = company.name
      ? targetCompanySets.nameSet.has(normalize(company.name))
      : false;
    return {
      name: company.name,
      match: matchesId || matchesName,
    };
  });

  const targetCountries = getProductionCountries(target);
  const guessCountries = getProductionCountries(guess);
  const targetCountrySets = getCountrySets(
    targetCountries.map((country) => ({
      code: country.code,
      name: country.name,
    }))
  );
  const countryFeedback = guessCountries.map((country) => {
    const matchesCode = country.code
      ? targetCountrySets.codeSet.has(normalize(country.code))
      : false;
    const matchesName = country.name
      ? targetCountrySets.nameSet.has(normalize(country.name))
      : false;
    return {
      name: country.name || country.code,
      match: matchesCode || matchesName,
    };
  });

  return {
    movie: guess,
    feedback: {
      year: { value: guessYear, diff: yearDiff },
      runtime: { value: guessRuntime, diff: runtimeDiff },
      language: { code: guess.original_language ?? "", match: languageMatch },
      genres: genreFeedback,
      cast: castFeedback,
      productionCompanies: companyFeedback,
      productionCountries: countryFeedback,
      director: { name: guessDirector, match: directorMatch },
    },
  };
}

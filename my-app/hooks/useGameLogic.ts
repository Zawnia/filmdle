"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkGuess,
  getDailyMovie,
  getLocalDateString,
  getRandomMovie,
  type GuessFeedback,
  type GuessHistoryEntry,
  type MovieDetails,
} from "@/lib/gameUtils";

export type GameState = "playing" | "won" | "lost";
export type GameMode = "daily" | "random";

export type GlobalClues = {
  yearRange: { min: number | null; max: number | null };
  durationRange: { min: number | null; max: number | null };
  foundGenres: string[];
  foundCast: number[];
  foundLanguage: string | null;
  foundCompanies: string[];
  foundCountries: string[];
};

type StoredGameState = {
  date: string;
  guesses: GuessHistoryEntry[];
  gameState: GameState;
  globalClues: GlobalClues;
};

const MAX_ATTEMPTS = 6;
const EMPTY_CLUES: GlobalClues = {
  yearRange: { min: null, max: null },
  durationRange: { min: null, max: null },
  foundGenres: [],
  foundCast: [],
  foundLanguage: null,
  foundCompanies: [],
  foundCountries: [],
};

function updateRange(
  current: { min: number | null; max: number | null },
  value: number,
  diff: "older" | "newer" | "shorter" | "longer" | "exact"
) {
  if (!value) {
    return current;
  }

  if (diff === "exact") {
    return { min: value, max: value };
  }

  if (diff === "older" || diff === "shorter") {
    return {
      min: current.min === null ? value : Math.max(current.min, value),
      max: current.max,
    };
  }

  return {
    min: current.min,
    max: current.max === null ? value : Math.min(current.max, value),
  };
}

function mergeClues(prev: GlobalClues, feedback: GuessFeedback): GlobalClues {
  const yearRange = updateRange(prev.yearRange, feedback.year.value, feedback.year.diff);
  const durationRange = updateRange(
    prev.durationRange,
    feedback.runtime.value,
    feedback.runtime.diff
  );
  const foundLanguage =
    feedback.language.match && feedback.language.code
      ? feedback.language.code.toUpperCase()
      : prev.foundLanguage;

  const genreMap = new Map<string, string>();
  prev.foundGenres.forEach((genre) => {
    genreMap.set(genre.toLowerCase(), genre);
  });
  feedback.genres.forEach((genre) => {
    if (genre.match) {
      const key = genre.name.toLowerCase();
      if (!genreMap.has(key)) {
        genreMap.set(key, genre.name);
      }
    }
  });

  const castSet = new Set(prev.foundCast);
  feedback.cast.forEach((member) => {
    if (member.match && member.id) {
      castSet.add(member.id);
    }
  });

  const companyMap = new Map<string, string>();
  prev.foundCompanies.forEach((company) => {
    companyMap.set(company.toLowerCase(), company);
  });
  feedback.productionCompanies.forEach((company) => {
    if (company.match && company.name) {
      const key = company.name.toLowerCase();
      if (!companyMap.has(key)) {
        companyMap.set(key, company.name);
      }
    }
  });

  const countryMap = new Map<string, string>();
  prev.foundCountries.forEach((country) => {
    countryMap.set(country.toLowerCase(), country);
  });
  feedback.productionCountries.forEach((country) => {
    if (country.match && country.name) {
      const key = country.name.toLowerCase();
      if (!countryMap.has(key)) {
        countryMap.set(key, country.name);
      }
    }
  });

  return {
    yearRange,
    durationRange,
    foundGenres: Array.from(genreMap.values()),
    foundCast: Array.from(castSet.values()),
    foundLanguage,
    foundCompanies: Array.from(companyMap.values()),
    foundCountries: Array.from(countryMap.values()),
  };
}

export function useGameLogic() {
  const [mysteryMovie, setMysteryMovie] = useState<MovieDetails | null>(null);
  const [guesses, setGuesses] = useState<GuessHistoryEntry[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [globalClues, setGlobalClues] = useState<GlobalClues>(EMPTY_CLUES);
  const [loading, setLoading] = useState(true);
  const [dateKey] = useState(() => getLocalDateString());
  const [mode, setMode] = useState<GameMode>("daily");
  const [randomSeed, setRandomSeed] = useState(() => Date.now().toString());
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const storageKey =
    mode === "daily" ? `ujuf-game-${dateKey}` : `ujuf-game-random-${randomSeed}`;

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredGameState;
      if (parsed.date === dateKey) {
        setGuesses(parsed.guesses ?? []);
        setGameState(parsed.gameState ?? "playing");
        setGlobalClues(parsed.globalClues ?? EMPTY_CLUES);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [dateKey, storageKey]);

  useEffect(() => {
    let active = true;

    const loadMysteryMovie = async () => {
      try {
        const movie =
          mode === "daily"
            ? await getDailyMovie(apiKey, dateKey)
            : await getRandomMovie(apiKey);
        if (active) {
          setMysteryMovie(movie);
        }
      } catch {
        if (active) {
          setMysteryMovie(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMysteryMovie();

    return () => {
      active = false;
    };
  }, [apiKey, dateKey, mode]);

  useEffect(() => {
    if (mysteryMovie?.title) {
      console.log(`[DEBUG] Mystery movie: ${mysteryMovie.title}`);
    }
  }, [mysteryMovie]);

  useEffect(() => {
    if (!apiKey) {
      console.warn("[DEBUG] Missing TMDB API key. Mystery movie not loaded.");
    }
  }, [apiKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: StoredGameState = {
      date: dateKey,
      guesses,
      gameState,
      globalClues,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [dateKey, gameState, globalClues, guesses, storageKey]);

  const submitGuess = useCallback(
    (guess: MovieDetails) => {
      if (!mysteryMovie || gameState !== "playing") {
        return;
      }

      const historyEntry = checkGuess(mysteryMovie, guess);

      setGuesses((prev) => {
        if (prev.length >= MAX_ATTEMPTS) {
          return prev;
        }
        const next = [...prev, historyEntry];
        setGlobalClues((prevClues) => mergeClues(prevClues, historyEntry.feedback));

        if (guess.id === mysteryMovie.id) {
          setGameState("won");
        } else if (next.length >= MAX_ATTEMPTS) {
          setGameState("lost");
        }
        return next;
      });
    },
    [gameState, mysteryMovie]
  );

  const startRandomGame = useCallback(async () => {
    if (!apiKey) {
      console.warn("[DEBUG] Missing TMDB API key. Random game not started.");
      return;
    }
    setLoading(true);
    setMode("random");
    setRandomSeed(Date.now().toString());
    setGuesses([]);
    setGameState("playing");
    setGlobalClues(EMPTY_CLUES);
    try {
      const movie = await getRandomMovie(apiKey);
      setMysteryMovie(movie);
    } catch {
      setMysteryMovie(null);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return {
    mysteryMovie,
    guesses,
    gameState,
    globalClues,
    attempts: guesses.length,
    loading,
    submitGuess,
    startRandomGame,
  };
}

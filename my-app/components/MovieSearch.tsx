"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type MovieSearchResult = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type MovieDetails = MovieSearchResult & {
  original_language?: string;
  production_companies?: Array<{ id?: number; name?: string }>;
  production_countries?: Array<{ iso_3166_1?: string; name?: string }>;
  credits?: {
    crew?: Array<{
      id: number;
      job?: string;
      name?: string;
      profile_path?: string | null;
    }>;
    cast?: Array<{
      id: number;
      name?: string;
      character?: string;
      order?: number;
      profile_path?: string | null;
    }>;
  };
  keywords?: {
    keywords?: Array<{ id: number; name?: string }>;
  };
  genres?: Array<{ id: number; name?: string }>;
  runtime?: number | null;
};

type MovieSearchProps = {
  onGuess: (movie: MovieDetails) => void;
  className?: string;
};

const MOCK_MOVIES: MovieSearchResult[] = [
  { id: 603, title: "The Matrix", release_date: "1999-03-31" },
  { id: 680, title: "Pulp Fiction", release_date: "1994-09-10" },
  { id: 157336, title: "Interstellar", release_date: "2014-11-05" },
  { id: 13, title: "Forrest Gump", release_date: "1994-07-06" },
  { id: 27205, title: "Inception", release_date: "2010-07-16" },
];

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w92";
const DEBOUNCE_MS = 400;

function mergeResults(primary: MovieSearchResult[], secondary: MovieSearchResult[]) {
  const map = new Map<number, MovieSearchResult>();
  primary.forEach((movie) => map.set(movie.id, movie));
  secondary.forEach((movie) => {
    if (!map.has(movie.id)) {
      map.set(movie.id, movie);
    }
  });
  return Array.from(map.values());
}

function useMovieSearch(query: string) {
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";
  const usingMock = !apiKey;

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (usingMock) {
      const filtered = MOCK_MOVIES.filter((movie) =>
        movie.title.toLowerCase().includes(trimmedQuery.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const urlFr = new URL(`${TMDB_BASE_URL}/search/movie`);
        urlFr.searchParams.set("api_key", apiKey);
        urlFr.searchParams.set("query", trimmedQuery);
        urlFr.searchParams.set("include_adult", "false");
        urlFr.searchParams.set("language", "fr-FR");

        const urlEn = new URL(`${TMDB_BASE_URL}/search/movie`);
        urlEn.searchParams.set("api_key", apiKey);
        urlEn.searchParams.set("query", trimmedQuery);
        urlEn.searchParams.set("include_adult", "false");
        urlEn.searchParams.set("language", "en-US");

        const [responseFr, responseEn] = await Promise.all([
          fetch(urlFr.toString(), { signal: controller.signal }),
          fetch(urlEn.toString(), { signal: controller.signal }),
        ]);

        if (!responseFr.ok || !responseEn.ok) {
          throw new Error("Search request failed");
        }

        const dataFr = (await responseFr.json()) as { results?: MovieSearchResult[] };
        const dataEn = (await responseEn.json()) as { results?: MovieSearchResult[] };
        setResults(mergeResults(dataFr.results ?? [], dataEn.results ?? []));
      } catch (err) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError("Impossible de charger les films.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [apiKey, query, usingMock]);

  return { results, loading, error, usingMock };
}

export function MovieSearch({ onGuess, className }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";

  const { results, loading, error, usingMock } = useMovieSearch(query);
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!trimmedQuery) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (movie: MovieSearchResult) => {
    setOpen(false);
    setQuery("");

    if (!apiKey) {
      onGuess({
        ...movie,
        credits: { crew: [], cast: [] },
        keywords: { keywords: [] },
        genres: [],
        runtime: null,
      });
      return;
    }

    setSelecting(true);
    try {
      const url = new URL(`${TMDB_BASE_URL}/movie/${movie.id}`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("append_to_response", "credits,keywords");
      url.searchParams.set("language", "fr-FR");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Details request failed");
      }
      const data = (await response.json()) as MovieDetails;
      onGuess(data);
    } catch (err) {
      onGuess({
        ...movie,
        credits: { crew: [], cast: [] },
        keywords: { keywords: [] },
        genres: [],
        runtime: null,
      });
    } finally {
      setSelecting(false);
    }
  };

  const showDropdown = open && trimmedQuery.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl", className)}>
      <div className="group relative transition-all duration-150 ease-out focus-within:translate-x-1 focus-within:translate-y-1 focus-within:outline-none">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(trimmedQuery.length > 0)}
          placeholder="Tape le nom d'un film..."
          aria-label="Recherche de film"
          autoComplete="off"
          className={cn(
            "h-16 w-full rounded-2xl border-3 border-ink bg-white px-6 pr-12 text-2xl font-semibold text-[#18181B] shadow-hard outline-none placeholder:text-gray-400 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 group-focus-within:shadow-[2px_2px_0px_0px_#000000]"
          )}
        />
        {selecting ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-3 border-ink bg-secondary px-2 py-1 text-xs font-bold shadow-hard">
            Chargement...
          </span>
        ) : (
          <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#18181B]/70" />
        )}
      </div>

      {showDropdown ? (
        <div className="absolute z-20 mt-3 w-full overflow-hidden rounded-2xl border-3 border-ink bg-white shadow-hard">
          {loading ? (
            <div className="px-4 py-3 text-sm font-semibold text-ink/70">
              Recherche en cours...
            </div>
          ) : null}
          {error ? (
            <div className="px-4 py-3 text-sm font-semibold text-ink/70">
              {error}
            </div>
          ) : null}
          {!loading && !error && results.length === 0 ? (
            <div className="px-4 py-3 text-sm font-semibold text-ink/70">
              Aucun film trouve.
            </div>
          ) : null}
          {!loading && !error
            ? results.map((movie) => {
                const year = movie.release_date
                  ? movie.release_date.slice(0, 4)
                  : "----";
                const posterUrl = movie.poster_path
                  ? `${POSTER_BASE_URL}${movie.poster_path}`
                  : null;
                const subtitle =
                  movie.original_title && movie.original_title !== movie.title
                    ? movie.original_title
                    : null;

                return (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => handleSelect(movie)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-white"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        className="h-12 w-8 rounded-lg border-3 border-ink bg-white object-cover shadow-hard"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-8 items-center justify-center rounded-lg border-3 border-ink bg-background text-[10px] font-bold text-ink shadow-hard">
                        No
                      </div>
                    )}
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{movie.title}</span>
                      <span className="text-xs font-bold opacity-70">{year}</span>
                      {subtitle ? (
                        <span className="text-[11px] font-medium opacity-60">
                          {subtitle}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            : null}
          {usingMock && !loading && results.length > 0 ? (
            <div className="border-t-3 border-ink bg-background px-4 py-2 text-[11px] font-semibold text-ink/70">
              Mode maquette: ajoute NEXT_PUBLIC_TMDB_API_KEY pour les vrais
              resultats.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Flag, Languages, Sparkles } from "lucide-react";
import { MovieSearch } from "@/components/MovieSearch";
import { PersonModal } from "@/components/PersonModal";
import { WinModal } from "@/components/WinModal";
import { useGameLogic } from "@/hooks/useGameLogic";
import { cn } from "@/lib/utils";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w185";

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

const genreVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const genreItem = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function getYearLabel(date?: string) {
  if (!date) {
    return "----";
  }
  return date.slice(0, 4);
}

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours <= 0) {
    return `${minutes} minutes`;
  }
  if (minutes === 0) {
    return `${hours} heures`;
  }
  return `${hours} heures ${minutes} minutes`;
}

function getRangeLabel(
  range: { min: number | null; max: number | null },
  unit: "year" | "duration"
) {
  const { min, max } = range;
  if (min === null && max === null) {
    return null;
  }
  if (min !== null && max !== null && min === max) {
    if (unit === "duration") {
      return { label: formatMinutes(min), tone: "success" as const };
    }
    return { label: `${min}`, tone: "success" as const };
  }
  if (min !== null && max !== null) {
    if (unit === "duration") {
      return {
        label: `entre ${formatMinutes(min)} et ${formatMinutes(max)}`,
        tone: "warning" as const,
      };
    }
    return { label: `entre ${min} et ${max}`, tone: "warning" as const };
  }
  if (min !== null) {
    if (unit === "duration") {
      return { label: `plus de ${formatMinutes(min)}`, tone: "warning" as const };
    }
    return { label: `apres ${min}`, tone: "warning" as const };
  }
  if (unit === "duration" && max !== null) {
    return {
      label: `moins de ${formatMinutes(max)}`,
      tone: "warning" as const,
    };
  }
  return { label: `avant ${max}`, tone: "warning" as const };
}

function diffBadge(diff: "older" | "newer" | "exact", value: number, label: string) {
  if (diff === "exact") {
    return { text: `${label} ${value}`, tone: "success" as const, note: "Exact" };
  }
  if (diff === "older") {
    return { text: `${label} ${value}`, tone: "miss" as const, note: "Trop vieux" };
  }
  return { text: `${label} ${value}`, tone: "miss" as const, note: "Trop recent" };
}

function durationBadge(diff: "shorter" | "longer" | "exact", value: number) {
  if (diff === "exact") {
    return { text: `Duree ${value} min`, tone: "success" as const, note: "Exact" };
  }
  if (diff === "shorter") {
    return { text: `Duree ${value} min`, tone: "miss" as const, note: "Trop court" };
  }
  return { text: `Duree ${value} min`, tone: "miss" as const, note: "Trop long" };
}

function getToneClass(tone: "success" | "warning" | "miss" | "primary") {
  if (tone === "success") {
    return "bg-[#88FFA1]";
  }
  if (tone === "warning") {
    return "bg-[#FFEDA9]";
  }
  if (tone === "miss") {
    return "bg-[#FF9B9B]";
  }
  return "bg-[#5499F8]";
}

export default function Home() {
  const {
    guesses,
    globalClues,
    submitGuess,
    gameState,
    mysteryMovie,
    attempts,
    startRandomGame,
  } = useGameLogic();
  const [personModal, setPersonModal] = useState<{
    name: string;
    photo?: string;
  } | null>(null);

  const foundActors = useMemo(() => {
    const map = new Map<string, { key: string; name: string; photo: string; role?: string }>();
    guesses.forEach((entry) => {
      entry.feedback.cast.forEach((member) => {
        if (!member.match) {
          return;
        }
        const key = member.id ? `id-${member.id}` : `name-${member.name}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            name: member.name,
            photo: member.photo,
            role: member.role,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [guesses]);

  const foundCast = foundActors.filter((actor) => actor.role !== "director").slice(0, 10);
  const foundDirector = foundActors.find((actor) => actor.role === "director");

  const yearClue = getRangeLabel(globalClues.yearRange, "year");
  const durationClue = getRangeLabel(globalClues.durationRange, "duration");

  const mysteryPosterUrl = mysteryMovie?.poster_path
    ? `${POSTER_BASE_URL}${mysteryMovie.poster_path}`
    : undefined;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FDFBF7] px-6 py-10 text-[#18181B]">
      <WinModal
        isOpen={gameState === "won"}
        title={mysteryMovie?.title ?? "Film du jour"}
        attempts={attempts}
        posterUrl={mysteryPosterUrl}
        onReplay={startRandomGame}
      />
      <PersonModal
        isOpen={!!personModal}
        name={personModal?.name ?? ""}
        photo={personModal?.photo}
        onClose={() => setPersonModal(null)}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-[-40px] h-40 w-40 rounded-full border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <div className="absolute -bottom-20 right-[-30px] h-48 w-48 rounded-full border-3 border-black bg-[#FFEDA9] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <div className="absolute top-24 right-12 hidden h-16 w-64 items-center justify-between rounded-2xl border-3 border-black bg-white px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:flex">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={`frame-${index}`}
              className="h-7 w-4 rounded-md border-2 border-black bg-[#5499F8]/20"
            />
          ))}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full border-3 border-black bg-[#5499F8] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Un Jour Un Film
          </span>
          <h1 className="font-display text-4xl font-black md:text-5xl">
            Devine le film du jour
          </h1>
          <p className="max-w-2xl text-base font-medium text-[#18181B]/80">
            Analyse les indices, teste des titres et assemble ton sticker album.
          </p>
        </header>

        <section className="rounded-2xl border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Indices globaux</h2>
              <p className="text-sm font-medium text-[#18181B]/70">
                Ce que tu sais deja du film mystere.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {yearClue ? (
              <span
                className={cn(
                  "rounded-full border-3 border-black px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  getToneClass(yearClue.tone)
                )}
              >
                <Calendar className="mr-2 inline-block h-4 w-4 align-text-bottom" />
                {yearClue.label}
              </span>
            ) : null}
            {durationClue ? (
              <span
                className={cn(
                  "rounded-full border-3 border-black px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  getToneClass(durationClue.tone)
                )}
              >
                <Clock className="mr-2 inline-block h-4 w-4 align-text-bottom" />
                {durationClue.label}
              </span>
            ) : null}
            {globalClues.foundLanguage ? (
              <span className="rounded-full border-3 border-black bg-[#88FFA1] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Languages className="mr-2 inline-block h-4 w-4 align-text-bottom" />
                {globalClues.foundLanguage}
              </span>
            ) : null}
            <motion.div
              className="flex flex-wrap gap-3"
              variants={genreVariants}
              initial="hidden"
              animate="show"
            >
              {globalClues.foundGenres.map((genre) => (
                <motion.span
                  key={genre}
                  variants={genreItem}
                  className="rounded-full border-3 border-black bg-[#88FFA1] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Sparkles className="mr-2 inline-block h-4 w-4 align-text-bottom" />
                  {genre}
                </motion.span>
              ))}
            </motion.div>
            {globalClues.foundCompanies.map((company) => (
              <span
                key={`clue-company-${company}`}
                className="rounded-full border-3 border-black bg-[#88FFA1] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Prod {company}
              </span>
            ))}
            {globalClues.foundCountries.map((country) => (
              <span
                key={`clue-country-${country}`}
                className="rounded-full border-3 border-black bg-[#88FFA1] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Flag className="mr-2 inline-block h-4 w-4 align-text-bottom" />
                {country}
              </span>
            ))}
            {globalClues.foundGenres.length === 0 &&
            !yearClue &&
            !durationClue &&
            !globalClues.foundLanguage &&
            globalClues.foundCompanies.length === 0 &&
            globalClues.foundCountries.length === 0 ? (
              <span className="rounded-full border-3 border-black bg-[#FFEDA9] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Aucun indice revele
              </span>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="mb-3 font-display text-lg font-bold">Casting trouve</h3>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 10 }).map((_, index) => {
                  const actor = foundCast[index];
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        actor
                          ? setPersonModal({ name: actor.name, photo: actor.photo })
                          : null
                      }
                      className="flex w-20 flex-col items-center gap-2"
                    >
                      <div className="h-24 w-20" style={{ perspective: "900px" }}>
                        <motion.div
                          className="relative h-full w-full"
                        animate={{ rotateY: actor ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 160, damping: 18 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-3 border-dashed border-gray-300 bg-gray-100"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="h-10 w-10 rounded-full border-2 border-gray-300 bg-gray-200" />
                          <span className="mt-2 text-[10px] font-semibold text-gray-400">
                            Vide
                          </span>
                        </div>
                        <div
                          className="absolute inset-0 overflow-hidden rounded-xl border-3 border-[#88FFA1] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          {actor?.photo ? (
                            <img
                              src={actor.photo}
                              alt={actor.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-400">
                              Trouve
                            </div>
                          )}
                        </div>
                        </motion.div>
                      </div>
                      <span className="min-h-[28px] text-center text-[11px] font-semibold text-[#18181B]/70">
                        {actor?.name ?? ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-[#18181B]/70">
                Realisateur
              </h3>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 1 }).map((_, index) => {
                  const actor = foundDirector;
                  return (
                    <button
                      key={`director-${index}`}
                      type="button"
                      onClick={() =>
                        actor
                          ? setPersonModal({ name: actor.name, photo: actor.photo })
                          : null
                      }
                      className="flex w-20 flex-col items-center gap-2"
                    >
                      <div className="h-24 w-20" style={{ perspective: "900px" }}>
                        <motion.div
                          className="relative h-full w-full"
                        animate={{ rotateY: actor ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 160, damping: 18 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-3 border-dashed border-gray-300 bg-gray-100"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="h-10 w-10 rounded-full border-2 border-gray-300 bg-gray-200" />
                          <span className="mt-2 text-[10px] font-semibold text-gray-400">
                            Vide
                          </span>
                        </div>
                        <div
                          className="absolute inset-0 overflow-hidden rounded-xl border-3 border-[#88FFA1] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                        {actor?.photo ? (
                          <img
                            src={actor.photo}
                            alt={actor.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-400">
                              Trouve
                            </div>
                          )}
                        </div>
                        </motion.div>
                      </div>
                      <span className="min-h-[28px] text-center text-[11px] font-semibold text-[#18181B]/70">
                        {actor?.name ?? ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full justify-center">
          <MovieSearch className="mx-auto" onGuess={submitGuess} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Historique des essais</h2>
            <span className="rounded-full border-3 border-black bg-white px-3 py-1 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {guesses.length} essais
            </span>
          </div>

          <AnimatePresence>
            {guesses.map((entry, index) => {
              const yearBadge = diffBadge(
                entry.feedback.year.diff,
                entry.feedback.year.value,
                "Annee"
              );
              const runtimeBadge = durationBadge(
                entry.feedback.runtime.diff,
                entry.feedback.runtime.value
              );
              const posterUrl = entry.movie.poster_path
                ? `${POSTER_BASE_URL}${entry.movie.poster_path}`
                : "";
              return (
                <motion.div
                  key={`${entry.movie.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="mb-4 w-full rounded-2xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-20 w-16 overflow-hidden rounded-xl border-2 border-black bg-gray-100">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={entry.movie.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                          No poster
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-display text-2xl font-black">
                        {entry.movie.title}
                      </h3>
                      <span className="text-sm font-bold text-[#18181B]/70">
                        {getYearLabel(entry.movie.release_date)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <div
                      className={cn(
                        "rounded-xl border-3 border-black px-4 py-2 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        getToneClass(yearBadge.tone)
                      )}
                    >
                      <div>{yearBadge.text}</div>
                      <div className="text-[10px]">{yearBadge.note}</div>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border-3 border-black px-4 py-2 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        getToneClass(runtimeBadge.tone)
                      )}
                    >
                      <div>{runtimeBadge.text}</div>
                      <div className="text-[10px]">{runtimeBadge.note}</div>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border-3 border-black px-4 py-2 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        entry.feedback.director.match
                          ? "bg-[#88FFA1]"
                          : "bg-[#FF9B9B]"
                      )}
                    >
                      <div>Realisateur</div>
                      <div className="text-[10px]">
                        {entry.feedback.director.match ? "Match" : "Rate"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-3 border-black px-4 py-2 text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        entry.feedback.language.match
                          ? "bg-[#88FFA1]"
                          : "bg-[#FF9B9B]"
                      )}
                    >
                      <Languages className="h-4 w-4" />
                      {entry.feedback.language.code?.toUpperCase() || "--"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.feedback.genres.map((genre) => (
                      <span
                        key={`${entry.movie.id}-${genre.name}`}
                        className={cn(
                          "rounded-full border-3 border-black px-3 py-1 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                          genre.match ? "bg-[#88FFA1]" : "bg-[#FF9B9B]"
                        )}
                      >
                        {genre.name || "Genre"}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.feedback.productionCompanies.map((company, companyIndex) => (
                      <span
                        key={`${entry.movie.id}-company-${companyIndex}`}
                        className={cn(
                          "rounded-full border-3 border-black px-3 py-1 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                          company.match ? "bg-[#88FFA1]" : "bg-[#FF9B9B]"
                        )}
                      >
                        Prod {company.name || "--"}
                      </span>
                    ))}
                    {entry.feedback.productionCountries.map((country, countryIndex) => (
                      <span
                        key={`${entry.movie.id}-country-${countryIndex}`}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border-3 border-black px-3 py-1 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                          country.match ? "bg-[#88FFA1]" : "bg-[#FF9B9B]"
                        )}
                      >
                        <Flag className="h-3 w-3" />
                        {country.name || "--"}
                      </span>
                    ))}
                  </div>

                  <motion.div
                    className="mt-6 flex flex-wrap gap-3"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {entry.feedback.cast.map((actor, actorIndex) => (
                      <motion.button
                        key={`${actor.id ?? actor.name}-${actorIndex}`}
                        variants={itemVariants}
                        className={cn(
                          "relative w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white p-2",
                          actor.match
                            ? "border-3 border-[#88FFA1] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            : "border border-gray-300"
                        )}
                        type="button"
                        onClick={() =>
                          setPersonModal({ name: actor.name, photo: actor.photo })
                        }
                      >
                        {actor.match ? (
                          <span className="absolute right-1 top-1 rounded-full border-2 border-black bg-[#88FFA1] px-1 text-[10px]">
                            OK
                          </span>
                        ) : null}
                        {actor.role === "director" ? (
                          <span className="absolute left-1 top-1 rounded-full border-2 border-black bg-[#18181B] px-1 text-[10px] font-black text-white">
                            REAL
                          </span>
                        ) : null}
                        <div
                          className={cn(
                            "h-20 w-full overflow-hidden rounded-lg border border-black/10",
                            !actor.match && "grayscale opacity-60"
                          )}
                        >
                          {actor.photo ? (
                            <img
                              src={actor.photo}
                              alt={actor.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-400">
                              No photo
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "mt-2 text-xs font-bold",
                            actor.match ? "text-[#18181B]" : "text-gray-400"
                          )}
                        >
                          {actor.name}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

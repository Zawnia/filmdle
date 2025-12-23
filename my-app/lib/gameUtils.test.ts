import { describe, expect, it } from "vitest";
import { checkGuess, type MovieDetails } from "./gameUtils";

describe("checkGuess", () => {
  it("returns year and runtime diffs", () => {
    const target: MovieDetails = {
      id: 1,
      title: "Target",
      release_date: "2010-01-01",
      runtime: 120,
      genres: [{ id: 1, name: "Action" }],
      credits: { crew: [{ job: "Director", name: "Jane Doe" }], cast: [] },
    };
    const guess: MovieDetails = {
      id: 2,
      title: "Guess",
      release_date: "2005-01-01",
      runtime: 150,
      genres: [{ id: 2, name: "Drama" }],
      credits: { crew: [{ job: "Director", name: "Other" }], cast: [] },
    };

    const result = checkGuess(target, guess);

    expect(result.feedback.year.diff).toBe("older");
    expect(result.feedback.runtime.diff).toBe("longer");
  });

  it("marks matching genres, cast, and director", () => {
    const target: MovieDetails = {
      id: 1,
      title: "Target",
      release_date: "2010-01-01",
      runtime: 120,
      genres: [{ id: 1, name: "Action" }],
      credits: {
        crew: [{ job: "Director", name: "Jane Doe" }],
        cast: [{ id: 10, name: "Actor One", order: 0 }],
      },
    };
    const guess: MovieDetails = {
      id: 2,
      title: "Guess",
      release_date: "2012-01-01",
      runtime: 120,
      genres: [{ id: 1, name: "Action" }],
      credits: {
        crew: [{ job: "Director", name: "Jane Doe" }],
        cast: [{ id: 10, name: "Actor One", order: 0 }],
      },
    };

    const result = checkGuess(target, guess);

    expect(result.feedback.director.match).toBe(true);
    expect(result.feedback.genres[0].match).toBe(true);
    expect(result.feedback.cast[0].match).toBe(true);
  });
});

/**
 * TS-side mirror of tokens.css's semantic scale, for the rare case a component needs a token value
 * in JS/TS (e.g. a chart library) rather than a Tailwind class. Values must stay in sync with
 * tokens.css by hand - there are few enough tokens that a build-time sync step isn't worth it yet.
 */
export const radius = {
  md: "0.5rem",
  lg: "0.75rem",
} as const;

export const spacing = {
  sidebar: "16rem",
} as const;

export type Radius = keyof typeof radius;
export type Spacing = keyof typeof spacing;

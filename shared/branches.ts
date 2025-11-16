/**
 * Client branch definitions
 */
export const CLIENT_BRANCHES = [
  "Manassas - JES Foundation Repair",
  "Baltimore - JES Foundation Repair",
  "North Haven - Groundworks",
] as const;

export type ClientBranch = typeof CLIENT_BRANCHES[number];

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appUsers from "../appUsers.js";
import type * as claimCodes from "../claimCodes.js";
import type * as crons from "../crons.js";
import type * as favorites from "../favorites.js";
import type * as importPipeline from "../importPipeline.js";
import type * as importQueue from "../importQueue.js";
import type * as lib_linkedin_index from "../lib/linkedin/index.js";
import type * as lib_linkedin_linkdapi from "../lib/linkedin/linkdapi.js";
import type * as lib_linkedin_mapToProfile from "../lib/linkedin/mapToProfile.js";
import type * as lib_linkedin_normalize from "../lib/linkedin/normalize.js";
import type * as lib_linkedin_normalizeClaude from "../lib/linkedin/normalizeClaude.js";
import type * as lib_linkedin_normalizeGemini from "../lib/linkedin/normalizeGemini.js";
import type * as lib_linkedin_normalizePrompt from "../lib/linkedin/normalizePrompt.js";
import type * as lib_linkedin_normalizeTypes from "../lib/linkedin/normalizeTypes.js";
import type * as lib_linkedin_provider from "../lib/linkedin/provider.js";
import type * as lib_linkedin_types from "../lib/linkedin/types.js";
import type * as lib_validators from "../lib/validators.js";
import type * as organizations from "../organizations.js";
import type * as profiles from "../profiles.js";
import type * as savedProfiles from "../savedProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appUsers: typeof appUsers;
  claimCodes: typeof claimCodes;
  crons: typeof crons;
  favorites: typeof favorites;
  importPipeline: typeof importPipeline;
  importQueue: typeof importQueue;
  "lib/linkedin/index": typeof lib_linkedin_index;
  "lib/linkedin/linkdapi": typeof lib_linkedin_linkdapi;
  "lib/linkedin/mapToProfile": typeof lib_linkedin_mapToProfile;
  "lib/linkedin/normalize": typeof lib_linkedin_normalize;
  "lib/linkedin/normalizeClaude": typeof lib_linkedin_normalizeClaude;
  "lib/linkedin/normalizeGemini": typeof lib_linkedin_normalizeGemini;
  "lib/linkedin/normalizePrompt": typeof lib_linkedin_normalizePrompt;
  "lib/linkedin/normalizeTypes": typeof lib_linkedin_normalizeTypes;
  "lib/linkedin/provider": typeof lib_linkedin_provider;
  "lib/linkedin/types": typeof lib_linkedin_types;
  "lib/validators": typeof lib_validators;
  organizations: typeof organizations;
  profiles: typeof profiles;
  savedProfiles: typeof savedProfiles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

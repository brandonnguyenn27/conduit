/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as functions_appUsers_mutations from "../functions/appUsers/mutations.js";
import type * as functions_appUsers_queries from "../functions/appUsers/queries.js";
import type * as functions_claimCodes_mutations from "../functions/claimCodes/mutations.js";
import type * as functions_claimCodes_queries from "../functions/claimCodes/queries.js";
import type * as functions_favorites_mutations from "../functions/favorites/mutations.js";
import type * as functions_favorites_queries from "../functions/favorites/queries.js";
import type * as functions_importQueue_helpers from "../functions/importQueue/helpers.js";
import type * as functions_importQueue_mutations from "../functions/importQueue/mutations.js";
import type * as functions_importQueue_queries from "../functions/importQueue/queries.js";
import type * as functions_organizations_mutations from "../functions/organizations/mutations.js";
import type * as functions_organizations_queries from "../functions/organizations/queries.js";
import type * as functions_profiles_helpers from "../functions/profiles/helpers.js";
import type * as functions_profiles_mutations from "../functions/profiles/mutations.js";
import type * as functions_profiles_queries from "../functions/profiles/queries.js";
import type * as functions_savedProfiles_mutations from "../functions/savedProfiles/mutations.js";
import type * as functions_savedProfiles_queries from "../functions/savedProfiles/queries.js";
import type * as importPipeline from "../importPipeline.js";
import type * as lib_importPipelineConfig from "../lib/importPipelineConfig.js";
import type * as lib_linkedin_index from "../lib/linkedin/index.js";
import type * as lib_linkedin_linkdapi from "../lib/linkedin/linkdapi.js";
import type * as lib_linkedin_mapToProfile from "../lib/linkedin/mapToProfile.js";
import type * as lib_linkedin_mockProvider from "../lib/linkedin/mockProvider.js";
import type * as lib_linkedin_normalize from "../lib/linkedin/normalize.js";
import type * as lib_linkedin_normalizeClaude from "../lib/linkedin/normalizeClaude.js";
import type * as lib_linkedin_normalizePrompt from "../lib/linkedin/normalizePrompt.js";
import type * as lib_linkedin_normalizeTypes from "../lib/linkedin/normalizeTypes.js";
import type * as lib_linkedin_provider from "../lib/linkedin/provider.js";
import type * as lib_linkedin_types from "../lib/linkedin/types.js";
import type * as lib_search_profileSearchText from "../lib/search/profileSearchText.js";
import type * as lib_validators from "../lib/validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "functions/appUsers/mutations": typeof functions_appUsers_mutations;
  "functions/appUsers/queries": typeof functions_appUsers_queries;
  "functions/claimCodes/mutations": typeof functions_claimCodes_mutations;
  "functions/claimCodes/queries": typeof functions_claimCodes_queries;
  "functions/favorites/mutations": typeof functions_favorites_mutations;
  "functions/favorites/queries": typeof functions_favorites_queries;
  "functions/importQueue/helpers": typeof functions_importQueue_helpers;
  "functions/importQueue/mutations": typeof functions_importQueue_mutations;
  "functions/importQueue/queries": typeof functions_importQueue_queries;
  "functions/organizations/mutations": typeof functions_organizations_mutations;
  "functions/organizations/queries": typeof functions_organizations_queries;
  "functions/profiles/helpers": typeof functions_profiles_helpers;
  "functions/profiles/mutations": typeof functions_profiles_mutations;
  "functions/profiles/queries": typeof functions_profiles_queries;
  "functions/savedProfiles/mutations": typeof functions_savedProfiles_mutations;
  "functions/savedProfiles/queries": typeof functions_savedProfiles_queries;
  importPipeline: typeof importPipeline;
  "lib/importPipelineConfig": typeof lib_importPipelineConfig;
  "lib/linkedin/index": typeof lib_linkedin_index;
  "lib/linkedin/linkdapi": typeof lib_linkedin_linkdapi;
  "lib/linkedin/mapToProfile": typeof lib_linkedin_mapToProfile;
  "lib/linkedin/mockProvider": typeof lib_linkedin_mockProvider;
  "lib/linkedin/normalize": typeof lib_linkedin_normalize;
  "lib/linkedin/normalizeClaude": typeof lib_linkedin_normalizeClaude;
  "lib/linkedin/normalizePrompt": typeof lib_linkedin_normalizePrompt;
  "lib/linkedin/normalizeTypes": typeof lib_linkedin_normalizeTypes;
  "lib/linkedin/provider": typeof lib_linkedin_provider;
  "lib/linkedin/types": typeof lib_linkedin_types;
  "lib/search/profileSearchText": typeof lib_search_profileSearchText;
  "lib/validators": typeof lib_validators;
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

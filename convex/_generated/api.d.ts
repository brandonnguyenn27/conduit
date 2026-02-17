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
import type * as favorites from "../favorites.js";
import type * as importQueue from "../importQueue.js";
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
  favorites: typeof favorites;
  importQueue: typeof importQueue;
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

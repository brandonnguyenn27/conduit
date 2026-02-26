import { v } from 'convex/values'

export const statusValidator = v.union(
  v.literal('pending'),
  v.literal('processing'),
  v.literal('done'),
  v.literal('failed')
)

/** Max URLs per createMany call to stay within Convex limits. For larger CSVs, call createMany in chunks. */
export const MAX_CREATE_MANY = 500

export const TEST_URL_PREFIX = 'https://www.linkedin.com/in/conduit-test-'

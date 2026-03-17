'use node'

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { pbkdf2Sync } from 'node:crypto'
import { action } from '../../_generated/server'
import { api, internal } from '../../_generated/api'
import { v } from 'convex/values'

const ONBOARDING_TOKEN_TTL_MS = 15 * 60 * 1000
const CLAIM_CODE_TTL_MS = 3 * 60 * 60 * 1000
const CLAIM_CODE_LENGTH = 4
const CLAIM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const HASH_PREFIX = 'pbkdf2_sha256'
const HASH_SEP = '$'

type VerifyOrgPasswordResult =
  | {
      ok: true
      joinToken: string
      organizationId: string
      expiresAt: number
    }
  | {
      ok: false
      error: 'INVALID_ORGANIZATION_PASSWORD'
    }

type GetProfileByEmailResult =
  | {
      ok: true
      profileId: string
      email: string
      name: string
    }
  | {
      ok: false
      error: 'NO_MATCHING_EMAIL'
    }

type VerifyClaimCodeResult =
  | { ok: true }
  | { ok: false; error: 'INVALID_CODE' | 'EXPIRED' }

type IssueClaimCodeResult =
  | { ok: true; expiresAt: number }
  | { ok: false; error: 'INVALID_TOKEN' | 'PROFILE_NOT_IN_ORGANIZATION' }

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'))
}

function secureEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

async function verifyPbkdf2Hash(password: string, storedHash: string): Promise<boolean> {
  const [algo, iterationsRaw, saltB64, expectedB64] = storedHash.split(HASH_SEP)
  if (algo !== HASH_PREFIX || !iterationsRaw || !saltB64 || !expectedB64) return false
  const iterations = Number(iterationsRaw)
  if (!Number.isInteger(iterations) || iterations < 100_000) return false

  const salt = decodeBase64(saltB64)
  const expected = decodeBase64(expectedB64)
  if (salt.length === 0 || expected.length === 0) return false

  const derived = new Uint8Array(
    pbkdf2Sync(password, Buffer.from(salt), iterations, expected.length, 'sha256')
  )

  return secureEquals(derived, expected)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateClaimCode(): string {
  const random = randomBytes(CLAIM_CODE_LENGTH)
  let code = ''
  for (let index = 0; index < CLAIM_CODE_LENGTH; index += 1) {
    code += CLAIM_CODE_ALPHABET[random[index] % CLAIM_CODE_ALPHABET.length]
  }
  return code
}



export const verifyOrgPassword = action({
  args: {
    organizationId: v.id('organizations'),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyOrgPasswordResult> => {
    const organization = await ctx.runQuery(
      internal.functions.onboarding.queries.getOrganizationJoinConfig,
      {
        organizationId: args.organizationId,
      }
    )
    if (!organization?.joinPasswordHash) {
      return {
        ok: false,
        error: 'INVALID_ORGANIZATION_PASSWORD',
      }
    }

    const isValid = await verifyPbkdf2Hash(args.password, organization.joinPasswordHash)
    if (!isValid) {
      return {
        ok: false,
        error: 'INVALID_ORGANIZATION_PASSWORD',
      }
    }

    const token = randomBytes(24).toString('hex')
    const expiresAt = Date.now() + ONBOARDING_TOKEN_TTL_MS
    await ctx.runMutation(internal.functions.onboarding.mutations.createToken, {
      token,
      organizationId: args.organizationId,
      expiresAt,
    })

    return {
      ok: true,
      joinToken: token,
      organizationId: args.organizationId as string,
      expiresAt,
    }
  },
})

export const listOrganizationsForOnboarding = action({
  args: {},
  handler: async (ctx): Promise<ReturnType<typeof ctx.runQuery>> => {
    const organizations = await ctx.runQuery(api.functions.organizations.queries.list, {})
    return organizations
  },
})

export const getProfileByEmail = action({
  args: {
    joinToken: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<GetProfileByEmailResult> => {
    const token = await ctx.runQuery(
      internal.functions.onboarding.queries.getOnboardingToken,
      {
        token: args.joinToken,
      }
    )

    if (!token || token.expiresAt <= Date.now()) {
      return {
        ok: false,
        error: 'NO_MATCHING_EMAIL',
      }
    }

    const profile = await ctx.runQuery(
      internal.functions.onboarding.queries.getProfileByEmailInOrganization,
      {
        organizationId: token.organizationId,
        email: normalizeEmail(args.email),
      }
    )

    if (!profile) {
      return {
        ok: false,
        error: 'NO_MATCHING_EMAIL',
      }
    }

    return {
      ok: true,
      profileId: profile._id as string,
      email: profile.email ?? normalizeEmail(args.email),
      name: profile.name,
    }
  },
})

export const verifyClaimCode = action({
  args: {
    profileId: v.id('profiles'),
    code: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyClaimCodeResult> => {
    const record = await ctx.runQuery(
      internal.functions.onboarding.queries.getVerificationCode,
      {
        profileId: args.profileId,
        code: args.code.trim().toUpperCase(),
      }
    )

    if (!record) {
      return { ok: false, error: 'INVALID_CODE' }
    }

    if (record.expiresAt <= Date.now()) {
      return { ok: false, error: 'EXPIRED' }
    }

    await ctx.runMutation(
      internal.functions.onboarding.mutations.markVerificationCodeUsed,
      { id: record._id }
    )

    return { ok: true }
  },
})

export const issueClaimCode = action({
  args: {
    joinToken: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<IssueClaimCodeResult> => {
    const token = await ctx.runQuery(internal.functions.onboarding.queries.getOnboardingToken, {
      token: args.joinToken,
    })

    if (!token || token.expiresAt <= Date.now()) {
      return { ok: false, error: 'INVALID_TOKEN' }
    }

    const profile = await ctx.runQuery(
      internal.functions.onboarding.queries.getProfileInOrganization,
      {
        profileId: args.profileId,
        organizationId: token.organizationId,
      }
    )
    if (!profile) {
      return { ok: false, error: 'PROFILE_NOT_IN_ORGANIZATION' }
    }

    await ctx.runMutation(internal.functions.onboarding.mutations.markUnusedVerificationCodesUsed, {
      profileId: args.profileId,
    })

    const code = generateClaimCode()
    const expiresAt = Date.now() + CLAIM_CODE_TTL_MS
    await ctx.runMutation(internal.functions.onboarding.mutations.createVerificationCode, {
      profileId: args.profileId,
      code,
      expiresAt,
    })

    return { ok: true, expiresAt }
  },
})


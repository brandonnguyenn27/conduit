import { describe, it, expect } from 'vitest'
import { parseNormalizerResponse } from '../../../../convex/lib/linkedin/normalizePrompt'

describe('parseNormalizerResponse', () => {
  it('parses valid JSON with all keys', () => {
    const json = JSON.stringify({
      majors: ['Computer Science'],
      schools: ['Stanford'],
      companies: ['Google'],
      jobTitles: ['Software Engineer'],
    })
    expect(parseNormalizerResponse(json)).toEqual({
      majors: ['Computer Science'],
      schools: ['Stanford'],
      companies: ['Google'],
      jobTitles: ['Software Engineer'],
    })
  })

  it('strips markdown code fence', () => {
    const wrapped = '```json\n{"majors":["CS"],"schools":[],"companies":["Meta"],"jobTitles":["SWE"]}\n```'
    expect(parseNormalizerResponse(wrapped)).toEqual({
      majors: ['CS'],
      schools: [],
      companies: ['Meta'],
      jobTitles: ['SWE'],
    })
  })

  it('returns empty arrays for non-array or missing keys', () => {
    const json = '{"majors": null, "schools": "x"}'
    expect(parseNormalizerResponse(json)).toEqual({
      majors: [],
      schools: [],
      companies: [],
      jobTitles: [],
    })
  })

  it('filters non-string elements', () => {
    const json = JSON.stringify({
      majors: ['CS', 1, true, null, 'EE'],
      schools: [],
      companies: [],
      jobTitles: [],
    })
    expect(parseNormalizerResponse(json)).toEqual({
      majors: ['CS', 'EE'],
      schools: [],
      companies: [],
      jobTitles: [],
    })
  })
})

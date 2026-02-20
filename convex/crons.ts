import { cronJobs } from 'convex/server'
import { api } from './_generated/api'

const crons = cronJobs()

crons.daily('Prune old finished import queue rows', { hourUTC: 3, minuteUTC: 0 }, api.importQueue.pruneFinishedOlderThan, {
  retentionDays: 30,
})

export default crons

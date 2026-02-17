import { cronJobs } from 'convex/server'
import { api } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'Process LinkedIn import queue',
  { minutes: 15 },
  api.importPipeline.processImportQueue,
  {}
)

export default crons

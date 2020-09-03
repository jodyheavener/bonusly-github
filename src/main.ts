import { setSecret, setFailed, info } from '@actions/core'
import { context } from '@actions/github'

const run = async (): Promise<void> => {
  setSecret('api-token')
  // const apiToken: string = core.getInput('api-token')
  info(JSON.stringify(context))
}

try {
  run()
} catch (error) {
  setFailed(error.message)
}

import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    core.setSecret('api-token')
    const apiToken: string = core.getInput('api-token')
    core.info(`API Token: ${apiToken}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    core.setSecret('api-token')
    core.info('heyuyyyyyyyyy')

    const apiToken: string = core.getInput('api-token')
    core.debug(`API Token: ${apiToken}`)
    core.info(`API Token: ${apiToken}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

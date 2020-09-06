/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { setSecret, setFailed, getInput, info } from '@actions/core'
import { getOctokit, context } from '@actions/github'

const run = async (): Promise<void> => {
  const { action, pull_request, repository } = context.payload

  if (!pull_request || !pull_request.merged || action !== 'closed') {
    setFailed(
      `Incorrect Pull Request data received.
      Refer to documentation for setup instructions.`
    )
  }

  setSecret('bonusly-token')
  setSecret('github-token')
  const bonuslyToken: string = getInput('bonusly-token')
  const githubToken: string = getInput('github-token')

  if (!bonuslyToken) {
    setFailed(
      `Could not retrieve bonusly-token.
      Is BONUSLY_API_TOKEN secret set on the repo?`
    )
  }

  if (!githubToken) {
    setFailed(
      `Could not retrieve github-token.
      Is GH_API_TOKEN secret set on the repo?`
    )
  }

  const octokit = getOctokit(githubToken)
  const [owner, repo] = repository!.full_name!.split('/')
  const { data: commits } = await octokit.pulls.listCommits({
    pull_number: pull_request!.number,
    owner,
    repo
  })

  const authorEmails = new Set(commits.map(item => item.commit.author.email))

  info(JSON.stringify(authorEmails))
}

try {
  run()
} catch (error) {
  setFailed(error.message)
}

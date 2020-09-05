/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { setSecret, setFailed, getInput, info } from '@actions/core'
import { getOctokit, context } from '@actions/github'

const extractCommitAuthors = (commit: {
  commit: {
    author: { email: string }
    message: string
  }
}): string[] => {
  const COAUTHOR_REGEX = /Co-authored-by:\s[\w\s]+<([\w.@+_]+)>*/gim
  const authors = [commit.commit.author.email]

  let result
  while ((result = COAUTHOR_REGEX.exec(commit.commit.message))) {
    authors.push(result[1])
  }

  return authors
}

const run = async (): Promise<void> => {
  const { action, pull_request, repository } = context.payload
  const inputs: { [key: string]: string } = {
    bonuslyToken: getInput('bonusly-token'),
    githubToken: getInput('github-token')
  }

  setSecret('bonusly-token')
  setSecret('github-token')

  if (!pull_request || !pull_request.merged || action !== 'closed') {
    setFailed(
      `Incorrect Pull Request data received.
      Refer to documentation for setup instructions.`
    )
  }

  const octokit = getOctokit(inputs.githubToken)
  const [owner, repo] = repository!.full_name!.split('/')
  const prData = {
    pull_number: pull_request!.number,
    owner,
    repo
  }

  const { data: commits } = await octokit.pulls.listCommits(prData)
  const { data: comments } = await octokit.pulls.listReviewComments(prData)

  const authorEmails = [...new Set(...commits.map(extractCommitAuthors))]

  info(JSON.stringify(authorEmails))
  info(JSON.stringify(comments))
}

try {
  run()
} catch (error) {
  setFailed(error.message)
}

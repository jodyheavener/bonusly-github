/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { setSecret, setFailed, getInput, info } from '@actions/core'
import { getOctokit, context } from '@actions/github'

type Allocation = {
  amount?: number
  message?: string
  email?: string
}

const DEFAULT_HASHTAG = '#pr'

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

const createCommentAllocation = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  octokit: any,
  comment: {
    body: string
    user: {
      login: string
    }
  },
  defaultHashTag: string
): Promise<Allocation> => {
  const BONUS_REGEX = /^@bonusly\s\+?(\d+)\+?\s(?:points\s)?(.+)$/gm
  const allocation: Allocation = {}

  return new Promise(async resolve => {
    allocation.email = (
      await octokit.users.getByUsername({ username: comment.user.login })
    ).data.email

    const result = BONUS_REGEX.exec(comment.body)
    if (result?.length) {
      allocation.amount = parseInt(result[1])
      allocation.message = result[2]

      if (!allocation.message.includes('#')) {
        allocation.message = `${allocation.message} ${defaultHashTag}`
      }
    }

    resolve(allocation)
  })
}

const run = async (): Promise<void> => {
  const { action, pull_request, repository } = context.payload
  const inputs: { [key: string]: string } = {
    bonuslyToken: getInput('bonusly-token'),
    githubToken: getInput('github-token'),
    defaultHashtag: getInput('default-hashtag') || DEFAULT_HASHTAG
  }

  setSecret('bonusly-token')
  setSecret('github-token')

  if (!pull_request || !pull_request.merged || action !== 'closed') {
    setFailed(
      `Incorrect Pull Request data received.
      Refer to README for workflow usage instructions.`
    )
  }

  info(JSON.stringify(inputs))

  if (!inputs.defaultHashTag.startsWith('#')) {
    inputs.defaultHashTag = `#${inputs.defaultHashTag}`
  }

  const octokit = getOctokit(inputs.githubToken)
  const [owner, repo] = repository!.full_name!.split('/')

  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: pull_request!.number
  })

  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: pull_request!.number
  })

  const authorEmails = [...new Set(...commits.map(extractCommitAuthors))]
  const allocations = (
    await Promise.all(
      comments.map(async comment => {
        return await createCommentAllocation(
          octokit,
          comment,
          inputs.defaultHashTag
        )
      })
    )
  ).filter(allocation => !!allocation.email)

  info(JSON.stringify(authorEmails))
  info(JSON.stringify(allocations))
}

try {
  run()
} catch (error) {
  setFailed(error.message)
}

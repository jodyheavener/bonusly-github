import { setSecret, setFailed, getInput } from '@actions/core';
import { context } from '@actions/github';
import {
  IssuesListCommentsResponseData,
  PullsListCommitsResponseData,
} from '@octokit/types/dist-types/generated/Endpoints';
import { Allocation, Unpacked } from './types';
import { GitHub } from './github';
import { Bonusly } from './bonusly';

const createCommentAllocation = async (
  comment: Unpacked<IssuesListCommentsResponseData>,
  client: GitHub
): Promise<Allocation | null> => {
  const BONUS_REGEX = /^@bonusly\s\+?(\d+)\+?\s(?:points\s)?(.+)$/gm;
  const allocation = {
    amount: 0,
    message: '',
    giver: '',
  };

  return new Promise(async resolve => {
    allocation.giver = await client.commentEmail(comment);

    if (!allocation.giver || !BONUS_REGEX.test(comment.body)) {
      resolve(null);
    }

    const result = BONUS_REGEX.exec(comment.body);
    if (result?.length) {
      allocation.amount = parseInt(result[1]);
      allocation.message = result[2];
    }

    resolve(allocation as Allocation);
  });
};

const run = async (): Promise<void> => {
  const { action, pull_request, repository } = context.payload;
  const inputs: {
    bonuslyToken?: string;
    githubToken?: string;
    defaultHashTag?: string;
  } = {
    bonuslyToken: getInput('bonusly-token'),
    githubToken: getInput('github-token'),
    defaultHashTag: getInput('default-hashtag'),
  };

  setSecret('bonusly-token');
  setSecret('github-token');

  if (!inputs.bonuslyToken || !inputs.githubToken) {
    setFailed(
      `Missing Bonusly or GitHub API token. Both are required.
      Refer to README for workflow usage instructions.`
    );
  }

  if (!repository) {
    setFailed(`Could not retrieve repository.`);
  }

  if (!pull_request || !pull_request.merged || action !== 'closed') {
    setFailed(
      `Incorrect Pull Request data received.
      Refer to README for workflow usage instructions.`
    );
  }

  const githubClient = new GitHub(
    inputs.githubToken!,
    repository!,
    pull_request
  );

  const bonuslyClient = new Bonusly(
    inputs.bonuslyToken!,
    inputs.defaultHashTag
  );

  const errors: string[] = [];

  let comments: IssuesListCommentsResponseData | null;
  try {
    comments = await githubClient.getComments();
  } catch (error) {
    errors.push(JSON.stringify(error));
  }

  const allocations = (
    await Promise.all(
      (comments! || []).map(
        async comment => await createCommentAllocation(comment, githubClient)
      )
    )
  ).filter(allocation => !!allocation) as Allocation[];

  // No allocations, exit early
  if (!allocations.length) {
    return;
  }

  let commits: PullsListCommitsResponseData | null;
  try {
    commits = await githubClient.getCommits();
  } catch (error) {
    errors.push(JSON.stringify(error));
  }

  const commitAuthors = githubClient.getUniqueCommitAuthors(commits! || []);
  const bonuslyHandles = (
    await Promise.all(
      commitAuthors.map(async author => {
        try {
          const user = await bonuslyClient.getUser(author);
          return user ? user.username : null;
        } catch (error) {
          errors.push(`Could not look up Bonusly user with email ${author}`);
          return null;
        }
      })
    )
  ).filter(user => !!user) as string[];

  let hadSomeSuccess = false;
  await Promise.all(
    allocations.map(async allocation => {
      try {
        await bonuslyClient.createBonus(allocation, bonuslyHandles);
        hadSomeSuccess = true;
      } catch (errorMessage) {
        errors.push(
          `${allocation.amount} point allocation from ${allocation.giver}: ${errorMessage}`
        );
      }
    })
  );

  let commentBody;
  let errorBody;

  if (errors.length) {
    errorBody = `<details>
 <summary>Click for details</summary>

${errors.map(error => ` - ${error}`).join(`\r`)}
</details>`;
  }

  if (hadSomeSuccess) {
    commentBody = '💚 Bonusly points awarded!';

    if (errorBody) {
      commentBody += `\r\rHowever, some errors occured\r\r${errorBody}`;
    }
  } else {
    commentBody = '💚 There was an issue awarding Bonusly points';

    if (errorBody) {
      commentBody += `\r\r${errorBody}`;
    }
  }

  githubClient.createComment(commentBody);
};

try {
  run();
} catch (error) {
  setFailed(error.message);
}

import { getOctokit } from '@actions/github';
import { Unpacked } from './types';
import { GitHub as GitHubAPI } from '@actions/github/lib/utils';
import {
  PayloadRepository,
  WebhookPayload,
} from '@actions/github/lib/interfaces';
import {
  PullsListCommitsResponseData,
  IssuesListCommentsResponseData,
} from '@octokit/types/dist-types/generated/Endpoints';

export class GitHub {
  protected owner: string;
  protected repo: string;
  protected octokit: InstanceType<typeof GitHubAPI>;

  constructor(
    token: string,
    repository: PayloadRepository,
    readonly pullRequest: WebhookPayload['pull_request']
  ) {
    const [owner, repo] = repository.full_name!.split('/');
    this.owner = owner;
    this.repo = repo;

    this.octokit = getOctokit(token);
  }

  async getCommits(): Promise<PullsListCommitsResponseData> {
    const response = await this.octokit.pulls.listCommits({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullRequest!.number,
    });

    return new Promise((resolve, reject) => {
      if (response.status !== 200) {
        reject(response.data);
      }

      resolve(response.data);
    });
  }

  async getComments(): Promise<IssuesListCommentsResponseData> {
    const response = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pullRequest!.number,
    });

    return new Promise((resolve, reject) => {
      if (response.status !== 200) {
        reject(response.data);
      }

      resolve(response.data);
    });
  }

  async createComment(message: string): Promise<void> {
    const response = await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pullRequest!.number,
      body: message,
    });

    if (response.status !== 201) {
      Promise.reject(response.data);
    }
  }

  getCommitAuthors(commit: Unpacked<PullsListCommitsResponseData>): string[] {
    const COAUTHOR_REGEX = /Co-authored-by:\s[\w\s]+<([\w.@+_]+)>*/gim;
    const authors = [commit.commit.author.email];

    let result;
    while ((result = COAUTHOR_REGEX.exec(commit.commit.message))) {
      authors.push(result[1]);
    }

    return authors;
  }

  getUniqueCommitAuthors(commits: PullsListCommitsResponseData): string[] {
    return [...new Set(...commits.map(this.getCommitAuthors.bind(this)))];
  }

  async commentEmail(comment: {
    user: {
      login: string;
    };
  }): Promise<string> {
    const response = await this.octokit.users.getByUsername({
      username: comment.user.login,
    });

    return new Promise((resolve, reject) => {
      if (response.status !== 200) {
        reject(response.data);
      }

      resolve(response.data.email);
    });
  }
}

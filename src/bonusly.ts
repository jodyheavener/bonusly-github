import fetch from 'node-fetch';
import { Allocation } from './types';

type APIResponse = {
  success: boolean;
  result?: User[] | Bonus;
  message?: string;
};

type User = {
  id: string;
  full_name: string;
  display_name: string;
  username: string;
  email: string;
  [key: string]: any;
};

type Bonus = {
  id: string;
  parent_bonus_id: string;
  created_at: string;
  reason: string;
  reason_html: string;
  amount: number;
  amount_with_currency: string;
  hashtag: string;
  giver: User;
  receivers: User[];
  [key: string]: any;
};

const DEFAULT_HASHTAG = '#pr';

export class Bonusly {
  private baseUrl = 'https://bonus.ly/api/v1';

  constructor(
    readonly token: string,
    readonly hashtag: string = DEFAULT_HASHTAG
  ) {}

  async getUser(email: string): Promise<User> {
    const response = await fetch(
      `${this.baseUrl}/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
    const data = (await response.json()) as APIResponse;

    return new Promise((resolve, reject) => {
      if (!data.success) {
        reject(data.message);
      }

      resolve((data.result! as User[])[0]);
    });
  }

  async createBonus(allocation: Allocation, handles: string[]): Promise<Bonus> {
    const recipients = handles.map(handle => `@${handle}`).join(' ');
    if (!allocation.message.includes('#')) {
      allocation.message = `${allocation.message} ${this.hashtag}`;
    }

    const response = await fetch(`${this.baseUrl}/bonuses`, {
      body: JSON.stringify({
        giver_email: allocation.giver,
        reason: `+${allocation.amount} ${recipients} ${allocation.message}`,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    });
    const data = (await response.json()) as APIResponse;

    return new Promise((resolve, reject) => {
      if (!data.success) {
        reject(data.message);
      }

      resolve(data.result! as Bonus);
    });
  }
}

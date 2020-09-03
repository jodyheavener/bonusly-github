export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Allocation = {
  amount: number;
  message: string;
  giver: string;
};

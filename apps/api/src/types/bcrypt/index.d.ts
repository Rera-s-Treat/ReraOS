declare module 'bcrypt' {
  export function hash(password: string, salt: number): Promise<string>;
  export function compare(password: string, hash: string): Promise<boolean>;
  export function hashSync(password: string, salt: number): string;
}

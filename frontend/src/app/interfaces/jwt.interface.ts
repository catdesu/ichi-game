export interface JWTInterface {
  exp: number;
  iat: number;
  userId?: number;
  username?: string;
}
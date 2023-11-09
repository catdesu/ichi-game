export interface SessionInterface{
  status: boolean;
  players: [
      {
          id: string;
          username: string;
      }
  ];
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
}

export interface Projectile extends Entity {
  active: boolean;
  fromPlayer: boolean;
}

export interface Enemy extends Entity {
  alive: boolean;
  row: number;
  type: 'magenta' | 'red';
}

export type GameStatus = 'idle' | 'playing' | 'gameover' | 'victory';

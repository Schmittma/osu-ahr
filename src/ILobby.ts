import { Player, Teams } from "./Player";
import { TypedEvent } from "./libs";
import { LobbyPlugin } from "./plugins/LobbyPlugin";
import { BanchoResponse } from "./parsers";

// BanchoBotとの対話を抽象化する
// channelへの接続管理と、トーナメントコマンドの実行
// Make/Enter/LeaveはEvent形式ではなくasync/wait形式のほうがいい？
// Eventは文字列指定のため、一覧をインターフェースに含めることができない！
export interface ILobby {
  lobbyName: string | undefined;
  lobbyId: string | undefined;
  status: LobbyStatus;
  players: Set<Player>;
  host: Player | null;
  hostPending: Player | null;
  playersMap: Map<string, Player>;
  playersFinished: number;
  playersInGame: number;
  isMatching: boolean;
  mapTitle: string;
  mapId: number;
  plugins: LobbyPlugin[];

  GetPlayer(userid: string): Player | null;
  Includes(userid: string): boolean;

  TransferHost(user: Player): void;
  AbortMatch(): void;
  SendMessage(message: string): void;
  SendMessageWithCoolTime(message: string | (() => string), tag: string, cooltime: number): boolean;
  SendMessageWithDelayAsync(message: string, delay: number): Promise<void>;
  SendMultilineMessageWithInterval(lines: string[], intervalMs: number, tag: string, cooltimeMs: number): Promise<void>;
  DeferMessage(message: string, tag: string, delay: number, resetTimer: boolean): void;
  MakeLobbyAsync(title: string): Promise<string>;
  EnterLobbyAsync(channel: string): Promise<string>; // TODO:ロビーのチャンネルが存在しないときの処理
  CloseLobbyAsync(): Promise<void>;
  LoadLobbySettingsAsync(): Promise<void>;

  PlayerJoined: TypedEvent<{ player: Player, slot: number, team: Teams }>;
  PlayerLeft: TypedEvent<Player>;
  HostChanged: TypedEvent<{ succeeded: boolean, player: Player }>;
  MatchStarted: TypedEvent<{ mapId: number, mapTitle: string }>;
  PlayerFinished: TypedEvent<{ player: Player, score: number, isPassed: boolean, playersFinished: number, playersInGame: number }>;
  MatchFinished: TypedEvent<void>;
  AbortedMatch: TypedEvent<{ playersFinished: number, playersInGame: number }>;
  UnexpectedAction: TypedEvent<Error>;
  NetError: TypedEvent<Error>;
  PlayerChated: TypedEvent<{ player: Player, message: string }>;
  ReceivedCustomCommand: TypedEvent<{ player: Player, command: string, param: string }>;
  PluginMessage: TypedEvent<{ type: string, args: string[], src: LobbyPlugin | null }>;
  SentMessage: TypedEvent<string>;
  RecievedBanchoResponse: TypedEvent<{ message: string, response: BanchoResponse }>;
}

export enum LobbyStatus {
  Standby,
  Making,
  Made,
  Entering,
  Entered,
  Leaving,
  Left
}
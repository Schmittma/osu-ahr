import { Lobby } from "../Lobby";
import { getConfig } from "../TypedConfig";
import { LobbyPlugin } from "./LobbyPlugin";
import { calculate } from "rosu-pp"
import { OsuFileReader } from '../libs/OsuFileReader';
import { BanchoResponseType } from "../parsers/CommandParser";

export interface PPCalculatorOption {
  enabled: boolean;
  accuracies: number[];
}

export class PPCalculator extends LobbyPlugin {

  option: PPCalculatorOption;
  mapId: number = 0;

  constructor(lobby: Lobby, option: Partial<PPCalculatorOption> = {}) {
    super(lobby, 'PPCalculator', 'ppcalc');
    this.option = getConfig(this.pluginName, option) as PPCalculatorOption;
    this.registerEvents();
  }

  private registerEvents(): void {
    this.lobby.PluginMessage.on(a => this.onPluginMessage(a.type, a.args, a.src));
    this.lobby.ReceivedBanchoResponse.on(a => {
      switch (a.response.type) {
        case BanchoResponseType.BeatmapChanged:
          this.onBeatmapChanged(a.response.params[0]);
          break;
      }
    });
  }

  private onBeatmapChanged(mapId: number) {
    this.mapId = mapId;
  }

  private onPluginMessage(type: string, args: string[], src: LobbyPlugin | null): void {
    switch (type) {
      case 'validatedMap':
        this.onValidatedMap();
        break;
    }
  }

  private onValidatedMap() {
    if(this.option.enabled == true){
      this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string) });
    }
  }

  private async getPPString(): Promise<string> {
    let pp_string = `PP calculation for this beatmap is not available.`;
    const pp_data = await getPPValues(this.mapId, this.option.accuracies);

    if(pp_data.length > 0) {
      pp_string = `PP for this beatmap:`;
      for(let i = 0; i < pp_data.length; i++) {
        pp_string += ` ${this.option.accuracies[i]}%: ${pp_data[i]}pp `;
        if(i < pp_data.length - 1) {
          pp_string += `|`;
        }
      }
    }

    return pp_string
  }
}

async function getPPValues(mapId: number, accuracy: number[]): Promise<number[]>{
  
  let reader = new OsuFileReader();
  const file = await reader.getOsuFilePathFromId(mapId);
  
  if(file == ''){
    return [];
  }

  let acc_param = [];
  for (const acc of accuracy) {
    acc_param.push({acc: acc});
  }

  const arg = {
    path: file,
    params: acc_param
  }

  const pp_data = calculate(arg);

  let pp_values = [];
  for (const data of pp_data) {
    pp_values.push(Math.round(data.pp));
  }

  return pp_values;
}

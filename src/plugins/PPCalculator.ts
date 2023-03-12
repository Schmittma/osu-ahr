import { Lobby } from "../Lobby";
import { getConfig } from "../TypedConfig";
import { LobbyPlugin } from "./LobbyPlugin";
import { Beatmap, Calculator } from "rosu-pp"
import { OsuFileReader } from '../libs/OsuFileReader';
import { BanchoResponseType } from "../parsers/CommandParser";

type ModTuple = [name: string, id: number];
//See https://github.com/ppy/osu-api/wiki#mods
const MOD_LOOKUP: ModTuple[] = [
  ['nm', 0],
  ['nf', 1],
  ['ez', 2],
  ['hd', 8],
  ['hr', 16],
  ['dt', 64],
  ['ht', 256],
  ['fl', 1024]
];

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
    this.lobby.ReceivedChatCommand.on(a => this.onChatCommand(a.command, a.param));
    this.lobby.ReceivedBanchoResponse.on(a => {
      switch (a.response.type) {
        case BanchoResponseType.BeatmapChanged:
          this.onBeatmapChanged(a.response.params[0]);
          break;
      }
    });
  }

  /*
    Handle the !pp command for printing out PP of the currently selected map.
  */
  private onChatCommand(command: string, param: string) {
    if (command === '!pp') {
      if(this.option.enabled === true){
        if(param === '')
        {
          // no params -> Calc nomod
          // T.B.D. Calc from current lobby settings by default
          // BanchoResponseType.Settings will be emitted when "!mp settings" is called via Bancho
          // Better do this via this.lobby.LoadMpSettingsAsync()
          this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string); });
        }
        else
        {
          //params -> Calc with mods
          this.getPPString(param).then(pp_string => { this.lobby.SendMessage(pp_string); });
        }
      }
      else{
        this.lobby.SendMessage('"!pp" command is not enabled currently.');
      }
    }
  }

  private onBeatmapChanged(mapId: number) {
    this.mapId = mapId;
  }

  /*
    When the validator plugin finished evaluating the map we calculate the PP for it.
  */
  private onPluginMessage(type: string, args: string[], src: LobbyPlugin | null): void {
    switch (type) {
      case 'validatedMap':
        this.onValidatedMap();
        break;
    }
  }

  private onValidatedMap() {
    if(this.option.enabled === true){
      this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string); });
    }
  }

  /*
    Construct a string in the format:
    90%: 100pp | 95%: 200pp
    depending on the configured options.
  */
  private async getPPString(mod_params?: string): Promise<string> {
    let pp_string = 'PP calculation for this beatmap is not available.';

    let mod_num = 0;
    if(mod_params !== undefined) {
      mod_num = this.convertModsToNumber(mod_params);
    }

    const pp_data = await getPPValues(this.mapId, this.option.accuracies, mod_num);

    if(pp_data.length > 0) {
      pp_string = 'PP for this beatmap';
      if(mod_num !== 0){
        pp_string += ` (${mod_params})`;
      }
      pp_string += ': ';
      for(let i = 0; i < pp_data.length; i++) {
        pp_string += ` ${this.option.accuracies[i]}%: ${pp_data[i]}pp `;
        if(i < pp_data.length - 1) {
          pp_string += '|';
        }
      }
    }

    return pp_string;
  }

  private convertModsToNumber(mods: string): number{
    mods = mods.toLowerCase();
    let mods_sum = 0;
    for(const [name, id] of MOD_LOOKUP){
      if(mods.includes(name)){
        mods_sum += id;
        mods.replace(name, '');
      }
    }
    return mods_sum;
  }
}

/*
  Constructs a list of PP values for the given map and the given accuracies.
  The PP List will have the same order as the given accuracies. 

  Mods contains a sum of mods from SupportedPPMods
*/
async function getPPValues(mapId: number, accuracy: number[], mods: number): Promise<number[]>{

  const reader = new OsuFileReader();
  const file = await reader.getOsuFilePathFromId(mapId);

  if(file === ''){
    return [];
  }

  const map = new Beatmap({path: file});
  const calculator = new Calculator({mods: mods});

  const pp_values = [];
  for (const acc of accuracy) {
    const data = calculator.acc(acc).performance(map);
    pp_values.push(Math.round(data.pp));
  }

  return pp_values;
}
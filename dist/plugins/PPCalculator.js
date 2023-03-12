"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPCalculator = void 0;
const TypedConfig_1 = require("../TypedConfig");
const LobbyPlugin_1 = require("./LobbyPlugin");
const rosu_pp_1 = require("rosu-pp");
const OsuFileReader_1 = require("../libs/OsuFileReader");
const CommandParser_1 = require("../parsers/CommandParser");
//See https://github.com/ppy/osu-api/wiki#mods
const MOD_LOOKUP = [
    ['nm', 0],
    ['nf', 1],
    ['ez', 2],
    ['hd', 8],
    ['hr', 16],
    ['dt', 64],
    ['ht', 256],
    ['fl', 1024]
];
class PPCalculator extends LobbyPlugin_1.LobbyPlugin {
    constructor(lobby, option = {}) {
        super(lobby, 'PPCalculator', 'ppcalc');
        this.mapId = 0;
        this.option = (0, TypedConfig_1.getConfig)(this.pluginName, option);
        this.registerEvents();
    }
    registerEvents() {
        this.lobby.PluginMessage.on(a => this.onPluginMessage(a.type, a.args, a.src));
        this.lobby.ReceivedChatCommand.on(a => this.onChatCommand(a.command, a.param));
        this.lobby.ReceivedBanchoResponse.on(a => {
            switch (a.response.type) {
                case CommandParser_1.BanchoResponseType.BeatmapChanged:
                    this.onBeatmapChanged(a.response.params[0]);
                    break;
            }
        });
    }
    /*
      Handle the !pp command for printing out PP of the currently selected map.
    */
    onChatCommand(command, param) {
        if (command === '!pp') {
            if (this.option.enabled === true) {
                if (param === '') {
                    // no params -> Calc nomod
                    // T.B.D. Calc from current lobby settings by default
                    // BanchoResponseType.Settings will be emitted when "!mp settings" is called via Bancho
                    // Better do this via this.lobby.LoadMpSettingsAsync()
                    this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string); });
                }
                else {
                    //params -> Calc with mods
                    this.getPPString(param).then(pp_string => { this.lobby.SendMessage(pp_string); });
                }
            }
            else {
                this.lobby.SendMessage('"!pp" command is not enabled currently.');
            }
        }
    }
    onBeatmapChanged(mapId) {
        this.mapId = mapId;
    }
    /*
      When the validator plugin finished evaluating the map we calculate the PP for it.
    */
    onPluginMessage(type, args, src) {
        switch (type) {
            case 'validatedMap':
                this.onValidatedMap();
                break;
        }
    }
    onValidatedMap() {
        if (this.option.enabled === true) {
            this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string); });
        }
    }
    /*
      Construct a string in the format:
      90%: 100pp | 95%: 200pp
      depending on the configured options.
    */
    async getPPString(mod_params) {
        let pp_string = 'PP calculation for this beatmap is not available.';
        let mod_num = 0;
        if (mod_params !== undefined) {
            mod_num = this.convertModsToNumber(mod_params);
        }
        const pp_data = await getPPValues(this.mapId, this.option.accuracies, mod_num);
        if (pp_data.length > 0) {
            pp_string = 'PP for this beatmap';
            if (mod_num !== 0) {
                pp_string += ` (${mod_params})`;
            }
            pp_string += ': ';
            for (let i = 0; i < pp_data.length; i++) {
                pp_string += ` ${this.option.accuracies[i]}%: ${pp_data[i]}pp `;
                if (i < pp_data.length - 1) {
                    pp_string += '|';
                }
            }
        }
        return pp_string;
    }
    convertModsToNumber(mods) {
        mods = mods.toLowerCase();
        let mods_sum = 0;
        for (const [name, id] of MOD_LOOKUP) {
            if (mods.includes(name)) {
                mods_sum += id;
                mods.replace(name, '');
            }
        }
        return mods_sum;
    }
}
exports.PPCalculator = PPCalculator;
/*
  Constructs a list of PP values for the given map and the given accuracies.
  The PP List will have the same order as the given accuracies.

  Mods contains a sum of mods from SupportedPPMods
*/
async function getPPValues(mapId, accuracy, mods) {
    const reader = new OsuFileReader_1.OsuFileReader();
    const file = await reader.getOsuFilePathFromId(mapId);
    if (file === '') {
        return [];
    }
    const map = new rosu_pp_1.Beatmap({ path: file });
    const calculator = new rosu_pp_1.Calculator({ mods: mods });
    const pp_values = [];
    for (const acc of accuracy) {
        const data = calculator.acc(acc).performance(map);
        pp_values.push(Math.round(data.pp));
    }
    return pp_values;
}
//# sourceMappingURL=PPCalculator.js.map
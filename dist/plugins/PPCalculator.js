"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPCalculator = void 0;
const TypedConfig_1 = require("../TypedConfig");
const LobbyPlugin_1 = require("./LobbyPlugin");
const rosu_pp_1 = require("rosu-pp");
const OsuFileReader_1 = require("../libs/OsuFileReader");
const CommandParser_1 = require("../parsers/CommandParser");
class PPCalculator extends LobbyPlugin_1.LobbyPlugin {
    constructor(lobby, option = {}) {
        super(lobby, 'PPCalculator', 'ppcalc');
        this.mapId = 0;
        this.option = (0, TypedConfig_1.getConfig)(this.pluginName, option);
        this.registerEvents();
    }
    registerEvents() {
        this.lobby.PluginMessage.on(a => this.onPluginMessage(a.type, a.args, a.src));
        this.lobby.ReceivedBanchoResponse.on(a => {
            switch (a.response.type) {
                case CommandParser_1.BanchoResponseType.BeatmapChanged:
                    this.onBeatmapChanged(a.response.params[0]);
                    break;
            }
        });
    }
    onBeatmapChanged(mapId) {
        this.mapId = mapId;
    }
    onPluginMessage(type, args, src) {
        switch (type) {
            case 'validatedMap':
                this.onValidatedMap();
                break;
        }
    }
    onValidatedMap() {
        if (this.option.enabled == true) {
            this.getPPString().then(pp_string => { this.lobby.SendMessage(pp_string); });
        }
    }
    async getPPString() {
        let pp_string = `PP calculation for this beatmap is not available.`;
        const pp_data = await getPPValues(this.mapId, this.option.accuracies);
        if (pp_data.length > 0) {
            pp_string = `PP for this beatmap:`;
            for (let i = 0; i < pp_data.length; i++) {
                pp_string += ` ${this.option.accuracies[i]}%: ${pp_data[i]}pp `;
                if (i < pp_data.length - 1) {
                    pp_string += `|`;
                }
            }
        }
        return pp_string;
    }
}
exports.PPCalculator = PPCalculator;
async function getPPValues(mapId, accuracy) {
    let reader = new OsuFileReader_1.OsuFileReader();
    const file = await reader.getOsuFilePathFromId(mapId);
    if (file == '') {
        return [];
    }
    let acc_param = [];
    for (const acc of accuracy) {
        acc_param.push({ acc: acc });
    }
    const arg = {
        path: file,
        params: acc_param
    };
    const pp_data = (0, rosu_pp_1.calculate)(arg);
    let pp_values = [];
    for (const data of pp_data) {
        pp_values.push(Math.round(data.pp));
    }
    return pp_values;
}
//# sourceMappingURL=PPCalculator.js.map
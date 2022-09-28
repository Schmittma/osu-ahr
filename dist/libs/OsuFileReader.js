"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OsuFileReader = void 0;
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
class OsuFileReader {
    async getOsuFilePathFromId(id) {
        let path = process.cwd() + '/maps/' + id + '.osu';
        if ((0, fs_1.existsSync)(path)) {
            return path;
        }
        else {
            if ((await this.downloadOsuFileToFS(id, path)) == true) {
                return path;
            }
            else {
                return '';
            }
        }
    }
    async downloadOsuFileToFS(id, path) {
        let success = false;
        const osu_file = await (await axios_1.default.get(`https://osu.ppy.sh/osu/${id}`)).data;
        if (osu_file != '') {
            (0, fs_1.writeFileSync)(path, osu_file);
            success = true;
        }
        return success;
    }
}
exports.OsuFileReader = OsuFileReader;
//# sourceMappingURL=OsuFileReader.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OsuFileReader = void 0;
const fs_1 = require("fs");
class OsuFileReader {
    getOsuFilePathFromId(id) {
        let path = process.cwd() + '/maps/' + id + '.osu';
        if ((0, fs_1.existsSync)(path)) {
            return path;
        }
        else {
            return '';
        }
    }
}
exports.OsuFileReader = OsuFileReader;
//# sourceMappingURL=OsuFileReader.js.map
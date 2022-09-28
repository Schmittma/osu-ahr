import { existsSync, writeFileSync } from "fs"
import axios from "axios";

export class OsuFileReader {

  async getOsuFilePathFromId(id: number): Promise<string> {
    let path = process.cwd() + '/maps/' + id + '.osu';

    if(existsSync(path)) {
      return path;
    }
    else {
      if((await this.downloadOsuFileToFS(id, path)) == true) {
        return path;
      }
      else
      {
        return '';
      }
    }
  }

  private async downloadOsuFileToFS(id: number, path: string): Promise<boolean> {
    let success = false;

    const osu_file = await (await axios.get(`https://osu.ppy.sh/osu/${id}`)).data;

    if (osu_file != '') {
      writeFileSync(path, osu_file);
      success = true;
    }

    return success;
  }
}

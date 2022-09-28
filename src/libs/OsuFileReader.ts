import { existsSync } from "fs"

export class OsuFileReader {

  getOsuFilePathFromId(id: number): string {
    let path = process.cwd() + '/maps/' + id + '.osu';
    if(existsSync(path)) {
      return path;
    }
    else {
      return '';
    }
  }
}
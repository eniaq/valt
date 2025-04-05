import { Config } from "./config";
import { ShowOptions } from ".";
import { Resolver } from "./resolver";

export class App {
  public static show(options: ShowOptions) {
    let config = new Config(options);
    let resolver = new Resolver(config, options);
  }
}

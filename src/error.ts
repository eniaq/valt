export class ValtError extends Error {
  public debug?: string;
  public hint?: string;

  constructor(message: string, options?: { debug?: string; hint?: string }) {
    super(message);
    this.name = "ValtError";
    this.debug = options?.debug;
    this.hint = options?.hint;
  }
}

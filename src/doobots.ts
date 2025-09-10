import fs from "fs";

export class File {
  fileName: string;
  base64: string;

  constructor(fileName: string, base64: string) {
    this.fileName = fileName;
    this.base64 = base64;
  }
}

export class BaseMessage {
  protected data: Record<string, any>;
  protected files: File[];

  constructor(data: Record<string, any> = {}, files: File[] = []) {
    this.data = data;
    this.files = files;
  }

  get(key: string, defaultValue: any | undefined = undefined): any | undefined {
    const value = this.data[key];
    if (value === null || value === undefined) {
      return defaultValue;
    }

    return value;
  }

  getFile(name: string): File | undefined {
    return this.files.find((file) => file.fileName === name);
  }

  getFiles(): File[] {
    return this.files;
  }

  getData(): Record<string, any> {
    return this.data;
  }
}

export class Request extends BaseMessage { }

export class Response extends BaseMessage {
  put(key: string, value: any): void {
    this.data[key] = value;
  }

  putAll(data: Record<string, any>): void {
    for (const key in data) {
      this.data[key] = data[key];
    }
  }

  putJson(json: string): void {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      this.putAll(parsed);
    }
  }

  putFile(file: File | string): void {
    if (typeof file === "string") {
      const base64 = fs.readFileSync(file, "base64");
      const fileName = file.split("/").pop() || "file";
      this.files.push(new File(fileName, base64));
    } else {
      this.files.push(file);
    }
  }
}

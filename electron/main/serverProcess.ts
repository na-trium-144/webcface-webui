import { ChildProcess, spawn } from "child_process";

export class Process {
  proc: ChildProcess | null = null;
  logs: LogLine[] = [];
  logAppendCallback: (data: LogLine) => void = () => undefined;
  url: string = "";
  onLogAppend(callback: (data: LogLine) => void) {
    this.logAppendCallback = callback;
  }
  start(cmd: string[]) {
    this.logs = [];
    this.proc = spawn(cmd[0], cmd.slice(1));
    this.proc.stderr.setEncoding("utf8");
    this.proc.stderr.on("data", (data: string) => {
      const lines = data.slice(0, data.lastIndexOf("\n")).split("\n");
      for (const l of lines) {
        const llSplit = l.split("] ");
        if (llSplit.length >= 4) {
          const message = llSplit.slice(3).join("] ");
          const log = {
            time: new Date(llSplit[0].slice(1)),
            level: getLogLevel(llSplit[2]),
            message: llSplit[1] + "] " + message,
          };
          if (message.startsWith("http")) {
            this.url = message;
          }
          this.logAppendCallback(log);
          this.logs.push(log);
        } else {
          const log = { level: 5, time: new Date(), message: l };
          this.logAppendCallback(log);
          this.logs.push(log);
        }
      }
    });
    this.proc.on("exit", (code, signal) => {
      const log = {
        time: new Date(),
        level: 5,
        message: `child process exited with code ${
          code !== null ? code : signal
        }`,
      };
      this.logAppendCallback(log);
      this.logs.push(log);
    });
  }
  write(data: string) {
    this.proc.stdin.write(data);
  }
  writeEnd() {
    this.proc.stdin.end();
  }
  get running() {
    return (
      this.proc !== null &&
      this.proc.exitCode === null &&
      this.proc.signalCode === null
    );
  }
  kill() {
    this.proc?.kill();
    console.log("kill");
  }
}

export interface LogLine {
  level: number;
  time: Date;
  message: string;
}
function getLogLevel(levelStr: string) {
  if (levelStr.includes("trace")) {
    return 0;
  }
  if (levelStr.includes("debug")) {
    return 1;
  }
  if (levelStr.includes("info")) {
    return 2;
  }
  if (levelStr.includes("warn")) {
    return 3;
  }
  if (levelStr.includes("error")) {
    return 4;
  }
  if (levelStr.includes("critical")) {
    return 5;
  }
  return 2;
}

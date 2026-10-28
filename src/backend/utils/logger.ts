export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private static minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  public static log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  public static info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public static warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public static error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  public static debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
}

import * as fs from 'fs';
import * as path from 'path';

class ElizaLogger {
    private static instance: ElizaLogger;
    private isNode: boolean;
    private logFilePath: string;
    verbose: boolean;
    closeByNewLine: boolean;
    useIcons: boolean;
    logsTitle: string;
    warningsTitle: string;
    errorsTitle: string;
    informationsTitle: string;
    successesTitle: string;
    debugsTitle: string;
    assertsTitle: string;

    private constructor() {
        // Check if we're in Node.js environment
        this.isNode =
            typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null;

        // Configure logging based on environment
        this.verbose = process.env.VERBOSE === 'true';
        this.closeByNewLine = true;
        this.useIcons = true;
        this.logsTitle = "LOGS";
        this.warningsTitle = "WARNINGS";
        this.errorsTitle = "ERRORS";
        this.informationsTitle = "INFORMATIONS";
        this.successesTitle = "SUCCESS";
        this.debugsTitle = "DEBUG";
        this.assertsTitle = "ASSERT";

        const logDirectory = path.join(process.cwd(), 'logs');
        
        // Ensure log directory exists
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }

        this.logFilePath = path.join(logDirectory, `eliza-${new Date().toISOString().replace(/:/g, '-')}.log`);
        
        // Write initialization log
        this.writeLog('LOGGER INITIALIZED', 'SYSTEM');

        // Global error handling for unhandled promises
        if (this.isNode) {
            process.on('unhandledRejection', (reason, promise) => {
                this.error('❌ Unhandled Rejection:', reason);
            });

            process.on('uncaughtException', (error) => {
                this.error('❌ Uncaught Exception:', error);
            });
        }
    }

    public static getInstance(): ElizaLogger {
        if (!ElizaLogger.instance) {
            ElizaLogger.instance = new ElizaLogger();
        }
        return ElizaLogger.instance;
    }

    private writeLog(message: string, level: 'INFO' | 'ERROR' | 'DEBUG' | 'SYSTEM' = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;

        try {
            // Write to file
            fs.appendFileSync(this.logFilePath, logMessage);
            
            // Also log to console with color
            const colorMap = {
                'INFO': '\x1b[32m',   // Green
                'ERROR': '\x1b[31m',  // Red
                'DEBUG': '\x1b[36m',  // Cyan
                'SYSTEM': '\x1b[33m'  // Yellow
            };

            console.log(`${colorMap[level]}${logMessage.trim()}\x1b[0m`);
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    #getColor(foregroundColor = "", backgroundColor = "") {
        if (!this.isNode) {
            // Browser console styling
            const colors: { [key: string]: string } = {
                black: "#000000",
                red: "#ff0000",
                green: "#00ff00",
                yellow: "#ffff00",
                blue: "#0000ff",
                magenta: "#ff00ff",
                cyan: "#00ffff",
                white: "#ffffff",
            };

            const fg = colors[foregroundColor.toLowerCase()] || colors.white;
            const bg = colors[backgroundColor.toLowerCase()] || "transparent";
            return `color: ${fg}; background: ${bg};`;
        }

        // Node.js console colors
        let fgc = "\x1b[37m";
        switch (foregroundColor.trim().toLowerCase()) {
            case "black":
                fgc = "\x1b[30m";
                break;
            case "red":
                fgc = "\x1b[31m";
                break;
            case "green":
                fgc = "\x1b[32m";
                break;
            case "yellow":
                fgc = "\x1b[33m";
                break;
            case "blue":
                fgc = "\x1b[34m";
                break;
            case "magenta":
                fgc = "\x1b[35m";
                break;
            case "cyan":
                fgc = "\x1b[36m";
                break;
            case "white":
                fgc = "\x1b[37m";
                break;
        }

        let bgc = "";
        switch (backgroundColor.trim().toLowerCase()) {
            case "black":
                bgc = "\x1b[40m";
                break;
            case "red":
                bgc = "\x1b[44m";
                break;
            case "green":
                bgc = "\x1b[44m";
                break;
            case "yellow":
                bgc = "\x1b[43m";
                break;
            case "blue":
                bgc = "\x1b[44m";
                break;
            case "magenta":
                bgc = "\x1b[45m";
                break;
            case "cyan":
                bgc = "\x1b[46m";
                break;
            case "white":
                bgc = "\x1b[47m";
                break;
        }

        return `${fgc}${bgc}`;
    }

    #getColorReset() {
        return this.isNode ? "\x1b[0m" : "";
    }

    clear() {
        console.clear();
    }

    print(foregroundColor = "white", backgroundColor = "black", ...strings) {
        // Convert objects to strings
        const processedStrings = strings.map((item) => {
            if (typeof item === "object") {
                return JSON.stringify(item, (key, value) =>
                    typeof value === "bigint" ? value.toString() : value
                );
            }
            return item;
        });

        if (this.isNode) {
            const c = this.#getColor(foregroundColor, backgroundColor);
            console.log(c, processedStrings.join(""), this.#getColorReset());
        } else {
            const style = this.#getColor(foregroundColor, backgroundColor);
            console.log(`%c${processedStrings.join("")}`, style);
        }

        if (this.closeByNewLine) console.log("");
    }

    #logWithStyle(
        strings: any[],
        options: {
            fg: string;
            bg: string;
            icon: string;
            groupTitle: string;
        }
    ) {
        const { fg, bg, icon, groupTitle } = options;

        if (strings.length > 1) {
            if (this.isNode) {
                const c = this.#getColor(fg, bg);
                console.group(c, (this.useIcons ? icon : "") + groupTitle);
            } else {
                const style = this.#getColor(fg, bg);
                console.group(
                    `%c${this.useIcons ? icon : ""}${groupTitle}`,
                    style
                );
            }

            const nl = this.closeByNewLine;
            this.closeByNewLine = false;
            strings.forEach((item) => {
                this.print(fg, bg, item);
            });
            this.closeByNewLine = nl;
            console.groupEnd();
            if (nl) console.log();
        } else {
            this.print(
                fg,
                bg,
                strings.map((item) => {
                    return `${this.useIcons ? `${icon} ` : ""}${item}`;
                })
            );
        }
    }

    log(...strings) {
        this.#logWithStyle(strings, {
            fg: "white",
            bg: "",
            icon: "\u25ce",
            groupTitle: ` ${this.logsTitle}`,
        });
        this.writeLog(strings.join(' '), 'INFO');
    }

    warn(...strings) {
        this.#logWithStyle(strings, {
            fg: "yellow",
            bg: "",
            icon: "\u26a0",
            groupTitle: ` ${this.warningsTitle}`,
        });
        this.writeLog(strings.join(' '), 'INFO');
    }

    error(...strings) {
        this.#logWithStyle(strings, {
            fg: "red",
            bg: "",
            icon: "\u26D4",
            groupTitle: ` ${this.errorsTitle}`,
        });
        this.writeLog(strings.join(' '), 'ERROR');
    }

    info(...strings) {
        this.#logWithStyle(strings, {
            fg: "blue",
            bg: "",
            icon: "\u2139",
            groupTitle: ` ${this.informationsTitle}`,
        });
        this.writeLog(strings.join(' '), 'INFO');
    }

    debug(...strings) {
        if (!this.verbose) {
            // for diagnosing verbose logging issues
            // console.log(
            //     "[ElizaLogger] Debug message suppressed (verbose=false):",
            //     ...strings
            // );
            return;
        }
        this.#logWithStyle(strings, {
            fg: "magenta",
            bg: "",
            icon: "\u1367",
            groupTitle: ` ${this.debugsTitle}`,
        });
        this.writeLog(strings.join(' '), 'DEBUG');
    }

    success(...strings) {
        this.#logWithStyle(strings, {
            fg: "green",
            bg: "",
            icon: "\u2713",
            groupTitle: ` ${this.successesTitle}`,
        });
        this.writeLog(strings.join(' '), 'INFO');
    }

    assert(...strings) {
        this.#logWithStyle(strings, {
            fg: "cyan",
            bg: "",
            icon: "\u0021",
            groupTitle: ` ${this.assertsTitle}`,
        });
        this.writeLog(strings.join(' '), 'INFO');
    }

    progress(message: string) {
        if (this.isNode) {
            // Clear the current line and move cursor to beginning
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(message);
        } else {
            console.log(message);
        }
    }
}

export const elizaLogger = ElizaLogger.getInstance();
elizaLogger.closeByNewLine = true;
elizaLogger.useIcons = true;

export default elizaLogger;

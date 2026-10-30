import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StartupError } from "./publication.js";
import { start } from "./start.js";
try {
    await start({
        env: process.env,
        connect: (server) => server.connect(new StdioServerTransport()),
    });
}
catch (error) {
    if (error instanceof StartupError) {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
    }
    else {
        throw error;
    }
}

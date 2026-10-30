import { createServiceClient } from "./client.js";
import { loadPublication } from "./publication.js";
import { createMcpServer } from "./server.js";
export async function start(options) {
    const publication = loadPublication(options.env);
    const client = createServiceClient(publication);
    const server = createMcpServer(client);
    await options.connect(server);
}

const PREFIX = "Неверный вызов инструмента. ";
export function missingArg(name) {
    return `${PREFIX}Не передан аргумент ${name}.`;
}
export function stringArg(name) {
    return `${PREFIX}Аргумент ${name} должен быть строкой.`;
}
export function limitArg() {
    return `${PREFIX}Аргумент limit должен быть целым числом.`;
}
export function objectArg(name) {
    return `${PREFIX}Аргумент ${name} должен быть объектом.`;
}
export function unknownTool(name) {
    return `${PREFIX}Неизвестный инструмент ${name}.`;
}
export function filterValueArg(key) {
    return `${PREFIX}Значение отбора ${key} должно быть строкой, числом, булевым или объектом.`;
}
export function filterKeyArg(key) {
    return `${PREFIX}Ключ отбора ${key} совпадает с параметром запроса.`;
}
const GET_TOOLS = {
    find_types: { path: "/types", strings: ["q"], withLimit: true },
    describe_type: { path: "/type", strings: ["name"], withLimit: false },
    find_objects: { path: "/search", strings: ["type", "q"], withLimit: true },
    read_object: { path: "/object", strings: ["type", "id"], withLimit: false },
};
function asArgs(args) {
    return typeof args === "object" && args !== null && !Array.isArray(args)
        ? args
        : {};
}
function has(args, name) {
    return Object.hasOwn(args, name);
}
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function buildGet(spec, args) {
    const query = [];
    for (const name of spec.strings) {
        if (!has(args, name)) {
            return { error: missingArg(name) };
        }
        const value = args[name];
        if (typeof value !== "string") {
            return { error: stringArg(name) };
        }
        query.push([name, value]);
    }
    if (spec.withLimit && has(args, "limit")) {
        const limit = args.limit;
        if (typeof limit !== "number" || !Number.isInteger(limit)) {
            return { error: limitArg() };
        }
        query.push(["limit", String(limit)]);
    }
    return { request: { method: "GET", path: spec.path, query } };
}
function buildCreate(args) {
    if (!has(args, "type")) {
        return { error: missingArg("type") };
    }
    const type = args.type;
    if (typeof type !== "string") {
        return { error: stringArg("type") };
    }
    const parts = { type };
    for (const name of ["header", "tables"]) {
        if (!has(args, name)) {
            return { error: missingArg(name) };
        }
        const value = args[name];
        if (!isPlainObject(value)) {
            return { error: objectArg(name) };
        }
        parts[name] = value;
    }
    return {
        request: {
            method: "POST",
            path: "/object",
            query: [],
            body: JSON.stringify(parts),
            contentType: "application/json; charset=utf-8",
        },
    };
}
function filterQueryValue(key, value) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return { value: String(value) };
    }
    if (isPlainObject(value)) {
        return { value: JSON.stringify(value) };
    }
    return { error: filterValueArg(key) };
}
function buildRegisterGet(path, args, withDate) {
    if (!has(args, "name")) {
        return { error: missingArg("name") };
    }
    const name = args.name;
    if (typeof name !== "string") {
        return { error: stringArg("name") };
    }
    const query = [["name", name]];
    if (withDate && has(args, "date")) {
        const date = args.date;
        if (typeof date !== "string") {
            return { error: stringArg("date") };
        }
        query.push(["date", date]);
    }
    if (!has(args, "filter")) {
        return { request: { method: "GET", path, query } };
    }
    const filter = args.filter;
    if (!isPlainObject(filter)) {
        return { error: objectArg("filter") };
    }
    for (const [key, value] of Object.entries(filter)) {
        if (key === "name" || key === "date") {
            return { error: filterKeyArg(key) };
        }
        const encoded = filterQueryValue(key, value);
        if ("error" in encoded) {
            return encoded;
        }
        query.push([key, encoded.value]);
    }
    return { request: { method: "GET", path, query } };
}
function buildRecord(args) {
    const parts = {};
    for (const name of ["name", "period"]) {
        if (!has(args, name)) {
            return { error: missingArg(name) };
        }
        const value = args[name];
        if (typeof value !== "string") {
            return { error: stringArg(name) };
        }
        parts[name] = value;
    }
    for (const name of ["dimensions", "resources"]) {
        if (!has(args, name)) {
            return { error: missingArg(name) };
        }
        const value = args[name];
        if (!isPlainObject(value)) {
            return { error: objectArg(name) };
        }
        parts[name] = value;
    }
    return {
        request: {
            method: "POST",
            path: "/register/record",
            query: [],
            body: JSON.stringify(parts),
            contentType: "application/json; charset=utf-8",
        },
    };
}
export async function executeTool(name, args, client) {
    const input = asArgs(args);
    let built;
    if (Object.hasOwn(GET_TOOLS, name)) {
        built = buildGet(GET_TOOLS[name], input);
    }
    else if (name === "create_object") {
        built = buildCreate(input);
    }
    else if (name === "describe_register") {
        built = buildRegisterGet("/register", input, false);
    }
    else if (name === "read_register_slice") {
        built = buildRegisterGet("/register/slice", input, true);
    }
    else if (name === "read_register_history") {
        built = buildRegisterGet("/register/history", input, false);
    }
    else if (name === "write_register_record") {
        built = buildRecord(input);
    }
    else {
        built = { error: unknownTool(name) };
    }
    if ("error" in built) {
        return { text: built.error, isError: true };
    }
    return client.request(built.request);
}

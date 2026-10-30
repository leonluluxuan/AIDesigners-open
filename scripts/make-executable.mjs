import { chmod } from "node:fs/promises";

const file = process.argv[2];
if (!file) throw new Error("Executable path is required.");
await chmod(file, 0o755);

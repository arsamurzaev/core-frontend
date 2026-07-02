import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.platform === "win32" ? "bun.exe" : "bun",
  ["run", "test:run", "--", "architecture-boundaries", "--reporter=verbose"],
  {
  env: {
    ...process.env,
    ARCHITECTURE_REPORT: "1",
  },
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

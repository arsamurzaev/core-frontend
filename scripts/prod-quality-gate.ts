import { spawn } from "node:child_process";
import process from "node:process";

type GateOptions = {
  fast: boolean;
  skipApi: boolean;
  skipBuild: boolean;
};

type GateStep = {
  name: string;
  command: string;
  args: string[];
};

const BUN_BIN = process.platform === "win32" ? "bun.exe" : "bun";

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const steps = buildSteps(options);
  const startedAt = Date.now();

  console.log("Frontend prod quality gate");
  console.log(
    `mode=${options.fast ? "fast" : "full"} skipApi=${options.skipApi} skipBuild=${options.skipBuild}`,
  );

  for (const [index, step] of steps.entries()) {
    await runStep(`${index + 1}/${steps.length}`, step);
  }

  console.log(`\nQuality gate passed in ${formatDuration(Date.now() - startedAt)}.`);
}

function buildSteps(options: GateOptions): GateStep[] {
  const steps: GateStep[] = [];

  if (!options.skipApi) {
    steps.push(bunStep("Generated API", ["run", "api:gen"]));
  }

  steps.push(bunStep("Lint", ["run", "lint"]));

  if (options.fast) {
    steps.push(
      bunStep("Architecture tests", [
        "run",
        "test:run",
        "--",
        "architecture-boundaries",
        "text-encoding",
      ]),
    );
  } else {
    steps.push(bunStep("Full tests", ["run", "test:run"]));
  }

  if (!options.skipBuild) {
    steps.push(bunStep("Build", ["run", "build"]));
  }

  return steps;
}

function bunStep(name: string, args: string[]): GateStep {
  return {
    name,
    command: BUN_BIN,
    args,
  };
}

async function runStep(number: string, step: GateStep): Promise<void> {
  const startedAt = Date.now();
  console.log(`\n[${number}] ${step.name}`);
  console.log(`$ ${[step.command, ...step.args].join(" ")}`);

  const code = await spawnStep(step);
  const duration = formatDuration(Date.now() - startedAt);

  if (code === 0) {
    console.log(`[${number}] ${step.name} passed in ${duration}`);
    return;
  }

  throw new Error(`${step.name} failed with exit code ${code} after ${duration}`);
}

function spawnStep(step: GateStep): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

function parseOptions(args: string[]): GateOptions {
  return {
    fast: args.includes("--fast"),
    skipApi: args.includes("--skip-api"),
    skipBuild: args.includes("--skip-build"),
  };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

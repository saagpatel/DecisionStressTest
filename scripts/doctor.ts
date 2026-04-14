import path from "node:path";

import { runDoctor } from "../src/lib/ops/doctor";

function printPathStatus(label: string, check: ReturnType<typeof runDoctor>["paths"][keyof ReturnType<typeof runDoctor>["paths"]]) {
  console.log(`${label}: ${check.status}`);
  console.log(`  Path: ${check.path}`);
  console.log(`  ${check.details}`);
}

async function main() {
  const report = runDoctor(process.env);

  console.log("Decision Stress Test local doctor");
  console.log("");

  if (!report.environment.ok) {
    console.log("Environment: invalid");
    for (const issue of report.environment.issues) {
      console.log(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("Environment: ok");
  printPathStatus("App data", report.paths.appData);
  printPathStatus("Database", report.paths.databaseParent);
  printPathStatus("Backups", report.paths.backups);
  console.log(`AI provider: ${report.ai.provider}`);
  console.log(`AI model: ${report.ai.model}`);
  console.log(report.ai.ok ? "AI configuration: ok" : "AI configuration: needs attention");
  if (report.ai.issues.length) {
    for (const issue of report.ai.issues) {
      console.log(`- ${issue}`);
    }
  }
  console.log(report.safety.ok ? "Local safety posture: ok" : "Local safety posture: needs attention");
  if (report.safety.issues.length) {
    for (const issue of report.safety.issues) {
      console.log(`- ${issue}`);
    }
  }

  console.log("");
  console.log(report.ok ? "Local readiness looks healthy." : "Local readiness needs attention before release checks.");

  if (!report.ok) {
    console.log(`Open ${path.join("README.md")} for the local operator checklist and setup notes.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

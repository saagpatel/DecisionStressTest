import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  aiConfigurationIssues,
  isAiConfigurationUsable,
  parseEnvironment,
  type ParsedEnv,
} from "@/lib/config/env-schema";

type PathCheck = {
  path: string;
  status: "ok" | "creatable" | "missing_parent" | "not_writable";
  details: string;
};

type SafetyCheck = {
  ok: boolean;
  issues: string[];
};

export type DoctorReport = {
  ok: boolean;
  environment: {
    ok: boolean;
    issues: string[];
  };
  paths: {
    appData: PathCheck;
    databaseParent: PathCheck;
    backups: PathCheck;
  };
  ai: {
    provider: string;
    model: string;
    ok: boolean;
    issues: string[];
  };
  safety: SafetyCheck;
};

function defaultDataDir(parsedEnv: ParsedEnv) {
  if (parsedEnv.DATA_DIR) {
    return parsedEnv.DATA_DIR;
  }

  if (parsedEnv.APP_ENV === "test") {
    return path.join(process.cwd(), ".tmp", "app-data");
  }

  const home = os.homedir();
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "DecisionStressTest");
  }

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "DecisionStressTest");
  }

  return path.join(home, ".local", "share", "decision-stress-test");
}

function checkPathWritable(targetPath: string, kind: "directory" | "file-parent"): PathCheck {
  const target = kind === "directory" ? targetPath : path.dirname(targetPath);

  if (fs.existsSync(target)) {
    try {
      fs.accessSync(target, fs.constants.W_OK);
      return {
        path: targetPath,
        status: "ok",
        details: kind === "directory" ? "Directory exists and is writable." : "Parent directory exists and is writable.",
      };
    } catch {
      return {
        path: targetPath,
        status: "not_writable",
        details: "The existing path is not writable.",
      };
    }
  }

  let parent = path.dirname(target);
  while (!fs.existsSync(parent) && parent !== path.dirname(parent)) {
    parent = path.dirname(parent);
  }

  if (!fs.existsSync(parent)) {
    return {
      path: targetPath,
      status: "missing_parent",
      details: "No existing parent directory could be found for this path.",
    };
  }

  try {
    fs.accessSync(parent, fs.constants.W_OK);
    return {
      path: targetPath,
      status: "creatable",
      details: "The path does not exist yet, but its parent directory is writable.",
    };
  } catch {
    return {
      path: targetPath,
      status: "not_writable",
      details: "The parent directory is not writable.",
    };
  }
}

function isPathInside(parent: string, target: string) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function deriveSafetyIssues(params: {
  env: ParsedEnv;
  appDataDir: string;
  databasePath: string;
}) {
  const issues: string[] = [];
  const cwd = process.cwd();
  const resolvedAppDataDir = path.resolve(params.appDataDir);
  const resolvedDatabasePath = path.resolve(params.databasePath);

  if (params.env.UNSAFE_ALLOW_NONLOCALHOST) {
    issues.push("UNSAFE_ALLOW_NONLOCALHOST=true disables the localhost-only guard and is not allowed for release checks.");
  }

  if (params.env.APP_ENV !== "test") {
    if (isPathInside(cwd, resolvedAppDataDir)) {
      issues.push("DATA_DIR points inside the repo. Use a private app-data directory outside the workspace.");
    }

    if (isPathInside(cwd, resolvedDatabasePath)) {
      issues.push("DATABASE_PATH points inside the repo. Keep the live SQLite file outside the workspace.");
    }

    const tempRoot = path.resolve(os.tmpdir());
    if (isPathInside(tempRoot, resolvedAppDataDir)) {
      issues.push("DATA_DIR points into a temporary system path. Use a stable private app-data directory instead.");
    }

    if (isPathInside(tempRoot, resolvedDatabasePath)) {
      issues.push("DATABASE_PATH points into a temporary system path. Use a stable private database path instead.");
    }
  }

  return issues;
}

export function runDoctor(rawEnv: NodeJS.ProcessEnv): DoctorReport {
  const parsed = parseEnvironment(rawEnv);
  if (!parsed.success) {
    const issues = Object.entries(parsed.error.flatten().fieldErrors).flatMap(([key, values]) =>
      (values ?? []).map((value) => `${key}: ${value}`),
    );

    return {
      ok: false,
      environment: {
        ok: false,
        issues,
      },
      paths: {
        appData: {
          path: "",
          status: "missing_parent",
          details: "Environment parsing failed before runtime paths could be checked.",
        },
        databaseParent: {
          path: "",
          status: "missing_parent",
          details: "Environment parsing failed before runtime paths could be checked.",
        },
        backups: {
          path: "",
          status: "missing_parent",
          details: "Environment parsing failed before runtime paths could be checked.",
        },
      },
      ai: {
        provider: "unknown",
        model: "unknown",
        ok: false,
        issues: ["Environment parsing failed."],
      },
      safety: {
        ok: false,
        issues: ["Environment parsing failed before safety checks could run."],
      },
    };
  }

  const env = parsed.data;
  const appDataDir = defaultDataDir(env);
  const databasePath = env.DATABASE_PATH ?? path.join(appDataDir, `${env.APP_ENV}.sqlite`);
  const backupsDir = path.join(appDataDir, "backups");
  const aiIssues = aiConfigurationIssues(env);
  const safetyIssues = deriveSafetyIssues({
    env,
    appDataDir,
    databasePath,
  });
  const paths = {
    appData: checkPathWritable(appDataDir, "directory"),
    databaseParent: checkPathWritable(databasePath, "file-parent"),
    backups: checkPathWritable(backupsDir, "directory"),
  };

  const pathIssues = Object.values(paths).some((check) => check.status === "missing_parent" || check.status === "not_writable");
  const aiOk = isAiConfigurationUsable(env);
  const safetyOk = safetyIssues.length === 0;

  return {
    ok: !pathIssues && aiOk && safetyOk,
    environment: {
      ok: true,
      issues: [],
    },
    paths,
    ai: {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      ok: aiOk,
      issues: aiIssues,
    },
    safety: {
      ok: safetyOk,
      issues: safetyIssues,
    },
  };
}

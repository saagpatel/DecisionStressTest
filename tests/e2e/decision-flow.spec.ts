import { expect, test, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, locator: ReturnType<Page["locator"]>, maxTabs = 25) {
  for (let attempt = 0; attempt < maxTabs; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((node) => node === document.activeElement)) {
      return;
    }
  }

  await expect(locator).toBeFocused();
}

async function createDecision(page: Page, title: string) {
  await page.goto("/decisions/new");

  await page.getByLabel("Decision title").fill(title);
  await page.getByLabel("Primary option").fill("Launch a paid pilot to five design partners");
  await page.getByLabel("Baseline alternative").fill("Keep the add-on internal until later");
  await page.getByLabel("Why this decision matters").fill("This could become the next revenue wedge.");
  await page.getByLabel("Decision deadline").fill("2026-05-05");
  await page.getByLabel("Time horizon").fill("3 months");
  await page
    .getByLabel("Constraints")
    .fill("No more than one day per week\nDo not delay the core roadmap");
  await page.getByLabel("Success definition").fill("Secure three paying pilot users.");
  await page
    .getByLabel("Biggest known uncertainties")
    .fill("Will anyone pay this early\nHow much support will it take");

  await page.getByRole("button", { name: "Create decision" }).click();
  await expect(page.getByRole("heading", { name: "Decision normalization" })).toBeVisible();
}

async function createDecisionFromExample(page: Page, title: string) {
  await page.goto("/");
  await expect(page.getByText("Mock mode: deterministic local simulation. No OpenAI key required.")).toBeVisible();
  await page.getByRole("link", { name: "Start from example" }).first().click();

  await expect(page.getByText("Mock mode: deterministic local simulation. No OpenAI key required.")).toBeVisible();
  await expect(page.getByLabel("Decision title")).toHaveValue("Take the principal product engineering role");
  await page.getByLabel("Decision title").fill(title);
  await page.getByRole("button", { name: "Create decision" }).click();
  await expect(page.getByRole("heading", { name: "Decision normalization" })).toBeVisible();
}

async function runAllStages(page: Page) {
  await page.getByRole("button", { name: "Run normalization" }).click();
  await page.getByRole("button", { name: "Run premortem" }).click();
  await page.getByRole("button", { name: "Run regret" }).click();
  await page.getByRole("button", { name: "Run synthesis" }).click();
}

async function saveIntakeRevision(page: Page, whyThisMatters: string) {
  await page.getByLabel("Why this decision matters").fill(whyThisMatters);
  await page.getByRole("button", { name: "Save intake revision" }).click();
}

test("creates and completes a decision", async ({ page }) => {
  await createDecision(page, `Pilot the new analytics upsell ${Date.now()}`);
  await runAllStages(page);

  await expect(page.getByRole("link", { name: "Open memo" })).toBeVisible();
  await expect(page.getByText("Analysis mode")).toBeVisible();
  await expect(page.getByText("Mock simulation")).toBeVisible();
  await expect(page.getByText(/Proceed|Run a reversible test first|Do not pursue|Defer until evidence/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Rerun normalization" })).toBeVisible();
  await page.getByRole("link", { name: "Open memo" }).click();
  await expect(page.getByText("Analysis source", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Confidence", { exact: true })).toBeVisible();
  await expect(page.getByText("Next step", { exact: true })).toBeVisible();
  await expect(page.getByText("Show raw Markdown memo")).toBeVisible();
});

test("starts from a built-in example and keeps provider mode visible", async ({ page }) => {
  await createDecisionFromExample(page, `Example-led decision ${Date.now()}`);
  await expect(page.getByText("Mock simulation")).toBeVisible();
  await runAllStages(page);

  await page.getByRole("link", { name: "Open memo" }).click();
  await expect(page.getByText("Mock mode: deterministic local simulation. No OpenAI key required.")).toBeVisible();
  await expect(page.getByText("Analysis source", { exact: true }).first()).toBeVisible();

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.getByTestId("history-summary-rail")).toBeVisible();
});

test("supports skip-link focus and route focus landing on navigation", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#page-content")).toBeFocused();

  await page.getByRole("link", { name: "Start a decision" }).click();
  await expect(page).toHaveURL(/\/decisions\/new$/);
  await expect(page.locator("#page-content")).toBeFocused();

  await page.getByRole("link", { name: "← Back to home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#page-content")).toBeFocused();
});

test("supports keyboard movement through decision navigation and local controls", async ({ page }) => {
  await createDecision(page, `Keyboard traversal ${Date.now()}`);
  await runAllStages(page);

  await page.locator("#page-content").focus();
  await tabUntilFocused(page, page.getByRole("link", { name: "← Back to decision history" }));
  await tabUntilFocused(page, page.getByRole("link", { name: "Open memo" }));
  await tabUntilFocused(page, page.getByRole("link", { name: "Workbench", exact: true }));
  await tabUntilFocused(page, page.getByRole("link", { name: "Memo", exact: true }));
  await tabUntilFocused(page, page.getByRole("link", { name: "History", exact: true }));
  await tabUntilFocused(page, page.getByRole("button", { name: "Rerun normalization" }));

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.locator("#page-content")).toBeFocused();
  await tabUntilFocused(page, page.getByRole("link", { name: "← Back to workbench" }));
  await tabUntilFocused(page, page.getByRole("link", { name: "Workbench", exact: true }));
  await tabUntilFocused(page, page.getByRole("link", { name: "Memo", exact: true }));
  await tabUntilFocused(page, page.getByRole("link", { name: "History", exact: true }));
  await tabUntilFocused(page, page.getByRole("link", { name: /Version 1/ }));

  await page.goto("/decisions");
  await page.locator("#page-content").focus();
  await tabUntilFocused(page, page.getByRole("link", { name: "← Back to home" }));
  await tabUntilFocused(page, page.getByRole("link", { name: "New decision" }));
  await tabUntilFocused(page, page.getByRole("button", { name: "Create local backup" }));
});

test("edits intake after synthesis and invalidates downstream stages until rerun", async ({ page }) => {
  await createDecision(page, `Revise a live decision ${Date.now()}`);
  const decisionPath = new URL(page.url()).pathname;
  await runAllStages(page);

  await expect(page.getByRole("link", { name: "Open memo" })).toBeVisible();

  await saveIntakeRevision(
    page,
    "This could become the next revenue wedge, but only if the pilot stays tightly scoped.",
  );

  await expect(page.getByText("Current stage: intake", { exact: true })).toBeVisible();
  await expect(page.getByText("Version 2")).toBeVisible();
  await expect(
    page
      .getByText("The latest intake changed. Re-run downstream stages before relying on the previous recommendation.")
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run normalization" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Run premortem" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run regret" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run synthesis" })).toBeDisabled();
  await expect(page.getByText("Ready to run for the latest snapshot.").first()).toBeVisible();
  await expect(page.getByText(/Pre-mortem:/)).toBeVisible();

  await runAllStages(page);

  await expect(page.getByRole("link", { name: "Open memo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rerun synthesis" })).toBeVisible();

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Version 2" })).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Current snapshot")).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Historical snapshots")).toBeVisible();
  await expect(
    page.getByText("The latest intake changed. Re-run downstream stages before relying on the previous recommendation."),
  ).toHaveCount(0);
  await expect(page.getByText("Version 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run normalization" })).toHaveCount(0);

  await page.getByRole("link", { name: /Version 1/ }).click();
  await expect(page.getByTestId("history-summary-rail").getByText("Read-only historical view")).toBeVisible();
  await expect(page.getByText("This is a historical snapshot.")).toBeVisible();
  await page.getByRole("link", { name: "Open snapshot memo" }).click();
  await expect(page.getByText("This is a historical snapshot memo.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Export Markdown" })).toHaveCount(0);
  await page.getByRole("link", { name: "Return to this snapshot in history" }).click();
  await expect(page.getByRole("heading", { name: "Version 1" })).toBeVisible();

  await page.goto(decisionPath);
  await runAllStages(page);
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.getByTestId("history-summary-rail")).toBeVisible();
  await expect(page.getByTestId("selected-snapshot-panel")).toBeVisible();
  await expect(page.getByTestId("snapshot-comparison-panel")).toBeVisible();
});

test("exports memo only when the decision is complete", async ({ page }) => {
  await createDecision(page, `Export lifecycle check ${Date.now()}`);

  const decisionPath = new URL(page.url()).pathname;
  const exportPath = `/api${decisionPath}/export`;

  const missingMemoResponse = await page.goto(exportPath);
  expect(missingMemoResponse?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("Memo not found");

  await page.goto(decisionPath);
  await runAllStages(page);
  await page.getByRole("link", { name: "Open memo" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export Markdown" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/decision-memo\.md$/);
});

test("creates a local backup from the decision history page", async ({ page }) => {
  await page.goto("/decisions");

  await expect(page.getByText("Back up the local decision ledger")).toBeVisible();
  await page.getByRole("button", { name: "Create local backup" }).click();

  await expect(page.getByText(/Created backup decision-stress-test-test-/)).toBeVisible();
});

test("keeps the repeated-use path obvious across workbench, memo, history, and ledger", async ({ page }) => {
  await createDecision(page, `Repeated-use clarity ${Date.now()}`);
  await runAllStages(page);

  await expect(page.getByTestId("workbench-summary-rail")).toBeVisible();
  await expect(page.getByText("Recommendation is current for this snapshot.")).toBeVisible();
  await expect(page.getByTestId("next-action-panel").getByRole("heading", { name: "Review the memo or rerun a stage" })).toBeVisible();

  await page.getByRole("link", { name: "Open memo" }).click();
  await expect(page.getByText("This is the current snapshot memo.")).toBeVisible();
  await expect(page.getByText("Analysis source")).toBeVisible();

  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.getByTestId("history-summary-rail")).toBeVisible();
  await expect(page.getByTestId("selected-snapshot-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decision normalization" })).toBeVisible();

  await page.getByRole("link", { name: "Workbench", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit the latest intake snapshot" })).toBeVisible();

  await page.getByRole("link", { name: "← Back to decision history" }).click();
  await expect(page.getByRole("heading", { name: "Decision ledger", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Back up the local decision ledger" })).toBeVisible();
});

test("keeps a three-snapshot history easy to scan", async ({ page }) => {
  await createDecision(page, `Three-snapshot history review ${Date.now()}`);
  await runAllStages(page);

  await saveIntakeRevision(page, "This should create a tighter, more bounded version of the pilot.");
  await runAllStages(page);
  await saveIntakeRevision(page, "This should create an even more constrained version of the pilot test.");

  await page.getByRole("link", { name: "History", exact: true }).click();

  await expect(page.getByTestId("snapshot-ledger").getByText("Current snapshot")).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Historical snapshots")).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Version 3")).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Version 2")).toBeVisible();
  await expect(page.getByTestId("snapshot-ledger").getByText("Version 1")).toBeVisible();
  await expect(
    page.getByTestId("history-summary-rail").getByText("The intake changed, but this snapshot has not been synthesized yet."),
  ).toBeVisible();

  await page.getByRole("link", { name: /Version 1/ }).click();
  await expect(page.getByTestId("history-summary-rail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Version 1" })).toBeVisible();
  await expect(page.getByText("This is a historical snapshot.")).toBeVisible();
  await expect(page.getByTestId("selected-snapshot-panel")).toBeVisible();
  await expect(page.getByTestId("snapshot-comparison-panel")).toBeVisible();

  await page.getByRole("link", { name: "Open snapshot memo" }).click();
  await expect(page.getByText("This is a historical snapshot memo.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Export Markdown" })).toHaveCount(0);
});

import { test } from "@playwright/test";
import { STORAGE_STATE } from "../../playwright.config";
import * as fs from "fs/promises";

test("Teardown", async () => {
  await test.step("step 1: delete session storage", async () => {
    try {
      await fs.unlink(STORAGE_STATE);
    } catch (error) {
      console.log(`Error deleting session file: ${error}`);
    }
  });
});
// tasks.spec.ts

import { test } from "../fixtures";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import LoginPage from "../pom/login";


test.describe("Tasks page", () => {

  let taskName: string;
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    taskName = faker.word.words({ count: 5 });
  });


  test("should create a new task with creator as the assignee", async ({
    taskPage,
  }) => {
    await taskPage.createTaskAndVerify({ taskName });
  });


  test("should be able to mark a task as completed", async ({
    taskPage,
  }) => {
    await taskPage.createTaskAndVerify({ taskName });
    await taskPage.markTaskAsCompleteAndVerify({ taskName });
  });

  test("should be able to delete a completed task", async ( { taskPage }) =>{
    await taskPage.createTaskAndVerify({ taskName });
    await taskPage.markTaskAsCompleteAndVerify({ taskName });
    await taskPage.deleteCompletedTaskAndVerify({ taskName });
  });

  test.describe("Starring tasks feature", () => {
    test.describe.configure({ mode: "serial" });

    test("should be able to star a pending task", async ({ page, taskPage }) => {
      await taskPage.createTaskAndVerify({ taskName });
      await taskPage.starTaskAndVerify({ taskName });
    });
  
    test("should be able to un-star a pending task", async ({ page, taskPage }) => {
      await taskPage.createTaskAndVerify({ taskName });
      await taskPage.starTaskAndVerify({ taskName });
      
      const starIcon = page
        .getByTestId("tasks-pending-table")
        .getByRole("row", { name: taskName })
        .getByTestId("pending-task-star-or-unstar-link");
      await starIcon.click();
      await expect(starIcon).toHaveClass(/ri-star-line/);
    });
  });

  test("should create a new task with a different user as the assignee", async({ page, browser, taskPage }) => {
    await taskPage.createTaskAndVerify({ taskName, userName: "Sam Smith" });

  // Creating a new browser context and a page in the browser without restoring the session
  const newUserContext = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });

  const newUserPage = await newUserContext.newPage();
  // Initializing the login POM here because the fixture is configured to use the default page context
  const loginPage = new LoginPage(newUserPage);
    await newUserPage.goto('/');
    await loginPage.loginAndVerify({
      email: "sam@example.com",
      password: "welcome",
      username: "Sam Smith",
    });

    await expect(newUserPage.getByTestId("tasks-pending-table")
      .getByRole("row", { name: taskName })).toBeVisible();

    await newUserPage.close();
    await newUserContext.close();
  });

});
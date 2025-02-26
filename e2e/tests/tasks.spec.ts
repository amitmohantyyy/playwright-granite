// tasks.spec.ts

import { test } from "../fixtures";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import LoginPage from "../pom/login";
import TaskPage from "../pom/tasks";

test.describe("Tasks page", () => {

  let taskName: string;
  let comment: string;

  test.beforeEach(async ({ page, taskPage }, testInfo) => {
    taskName = faker.word.words({ count: 5 });
    comment = faker.word.words({ count: 7});

    if (testInfo.title.includes("[SKIP_SETUP]")) return;
    
    await page.goto("/");
    await taskPage.createTaskAndVerify({ taskName });
  });

  test.afterEach(async ({ page, taskPage }) => {
    await page.goto("/");
    await taskPage.markTaskAsCompleteAndVerify({ taskName });
    const completedTaskInDashboard = page.getByTestId("tasks-completed-table")
      .getByRole("row", { name: taskName });

    await completedTaskInDashboard.getByTestId("completed-task-delete-link").click();
    await expect(completedTaskInDashboard).toBeHidden();
    await expect(page.getByTestId("tasks-pending-table").getByRole("row", { name: taskName })).toBeHidden();
  });

  // THIS TEST LOGIC IS BEING HANDLED IN THE BEFOREEACH 
  // test("should create a new task with creator as the assignee", async ({
  //   taskPage,
  // }) => {
  //   await taskPage.createTaskAndVerify({ taskName });
  // });


  test("should be able to mark a task as completed", async ({
    taskPage,
  }) => {
    await taskPage.markTaskAsCompleteAndVerify({ taskName });
  });

  //THIS TEST FUNCTION IS BEING EXECUTED IN THE AFTEREACH BLOCK
  // test("should be able to delete a completed task", async ( { taskPage }) =>{
  //   await taskPage.createTaskAndVerify({ taskName });
  //   await taskPage.markTaskAsCompleteAndVerify({ taskName });
  //   await taskPage.deleteCompletedTaskAndVerify({ taskName });
  // });

  test.describe("Starring tasks feature", () => {
    test.describe.configure({ mode: "serial" });

    test("should be able to star a pending task", async ({ page, taskPage }) => {
      await taskPage.starTaskAndVerify({ taskName });
    });
  
    test("should be able to un-star a pending task", async ({ page, taskPage }) => {
      await taskPage.starTaskAndVerify({ taskName });
      
      const starIcon = page
        .getByTestId("tasks-pending-table")
        .getByRole("row", { name: taskName })
        .getByTestId("pending-task-star-or-unstar-link");
      await starIcon.click();
      await expect(starIcon).toHaveClass(/ri-star-line/);
    });
  });

  test("should create a new task with a different user as the assignee [SKIP_SETUP]", async({ page, browser, taskPage }) => {
    await page.goto('/');
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


  test.describe("comment and verify", () => {
    test("make a comment as the creator and switch to assignee to verify comment visibility", async ({ browser, taskPage, page }) => {
      
      await test.step("Step 1: make a comment as creator and verify the visibility", async () => {
        await taskPage.addCommentAndVerifyTimestamp({ taskName, comment });
      });

      await test.step("Step 2: verify comment count increase", async () => {
        await taskPage.verifyCommentCountIncrease({ taskName }, 1);
      });
      
      await test.step("Step 3: verify comment as assignee", async () => {
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
        
        const assigneeTaskPage = new TaskPage(newUserPage);
        
        await expect(newUserPage.getByTestId("tasks-pending-table")
          .getByRole("row", { name: taskName })).toBeVisible();
        
        await assigneeTaskPage.verifyCommentCountIncrease({ taskName }, 1);
        
        await newUserPage.getByTestId('tasks-pending-table').getByText(taskName).first().click();
        
        const commentElement = newUserPage.getByText(new RegExp(comment));
        await expect(commentElement).toBeVisible();
        
        await newUserPage.close();
        await newUserContext.close();
      });
    });

    test("make a second comment as the assignee and verify the comment as the creator", async ({ page, browser, taskPage }) => {
      const assigneeComment = faker.word.words({ count: 7 });
      
      await test.step("Step 1: make a comment as creator and verify the visibility", async () => {
        await taskPage.addCommentAndVerifyTimestamp({ taskName, comment });
      });

      await test.step("Step 2: verify comment count increase as creator", async () => {
        await taskPage.verifyCommentCountIncrease({ taskName }, 1);
      });
      
      let newUserContext;
      let newUserPage;
      let assigneeTaskPage;

      await test.step("Step 3: verify comment as assignee", async () => {
        newUserContext = await browser.newContext({
          storageState: { cookies: [], origins: [] },
        });

        newUserPage = await newUserContext.newPage();
        // Initializing the login POM here because the fixture is configured to use the default page context
        const loginPage = new LoginPage(newUserPage);
        await newUserPage.goto('/');
        await loginPage.loginAndVerify({
          email: "sam@example.com",
          password: "welcome",
          username: "Sam Smith",
        });
        
        assigneeTaskPage = new TaskPage(newUserPage);
        
        await expect(newUserPage.getByTestId("tasks-pending-table")
          .getByRole("row", { name: taskName })).toBeVisible();
        
        await assigneeTaskPage.verifyCommentCountIncrease({ taskName }, 1);
        
        await newUserPage.getByTestId('tasks-pending-table').getByText(taskName).first().click();
        
        const commentElement = newUserPage.getByText(new RegExp(comment));
        await expect(commentElement).toBeVisible();
      });

      await test.step("Step 4: add another comment as assignee", async () => {
        // Add another comment
        await newUserPage.getByTestId('comments-text-field').fill(assigneeComment);
        await newUserPage.getByTestId('comments-submit-button').click();
        
        // Verify the comment is visible to assignee
        const assigneeCommentElement = newUserPage.getByText(new RegExp(assigneeComment));
        await expect(assigneeCommentElement).toBeVisible();
      });

      await test.step("Step 5: verify count as assignee", async () => {
        await newUserPage.goto('/');
        await assigneeTaskPage.verifyCommentCountIncrease({ taskName }, 2);

        await newUserPage.close();
        await newUserContext.close();
      });

      await test.step("Step 6: verify comment and count as creator", async () => {
        await page.reload();
        
        await taskPage.verifyCommentCountIncrease({ taskName }, 2);
        
        await page.getByTestId('tasks-pending-table').getByText(taskName).first().click();
        
        // Verify Oliver's original comment is visible
        const creatorCommentElement = page.getByText(new RegExp(comment));
        await expect(creatorCommentElement).toBeVisible();
        
        // Verify Sam's new comment is also visible to Oliver
        const samCommentElement = page.getByText(new RegExp(assigneeComment));
        await expect(samCommentElement).toBeVisible();
      });
    });
  });
});
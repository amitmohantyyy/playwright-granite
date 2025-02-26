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
    await test.step("step 1: generate unique task name and comment", async () => {
      taskName = faker.word.words({ count: 5 });
      comment = faker.word.words({ count: 7 });
    });

    if (testInfo.title.includes("[SKIP_SETUP]")) return;
    
    await test.step("step 2: create a new task in the dashboard", async () => {
      await page.goto("/");
      await taskPage.createTaskAndVerify({ taskName });
    });
  });

  test.afterEach(async ({ page, taskPage }) => {
    await test.step("step 1: clean up by marking task as complete", async () => {
      await page.goto("/");
      await taskPage.markTaskAsCompleteAndVerify({ taskName });
    });
    
    await test.step("step 2: delete the completed task", async () => {
      const completedTaskInDashboard = page.getByTestId("tasks-completed-table")
        .getByRole("row", { name: taskName });

      await completedTaskInDashboard.getByTestId("completed-task-delete-link").click();
      await expect(completedTaskInDashboard).toBeHidden();
      await expect(page.getByTestId("tasks-pending-table").getByRole("row", { name: taskName })).toBeHidden();
    });
  });

  test("should be able to mark a task as completed", async ({
    taskPage,
  }) => {
    await test.step("step 1: mark task as complete and verify it moves to completed section", async () => {
      await taskPage.markTaskAsCompleteAndVerify({ taskName });
    });
  });

  test.describe("Starring tasks feature", () => {
    test.describe.configure({ mode: "serial" });

    test("should be able to star a pending task", async ({ page, taskPage }) => {
      await test.step("step 1: click star icon and verify task is starred", async () => {
        await taskPage.starTaskAndVerify({ taskName });
      });
    });
  
    test("should be able to un-star a pending task", async ({ page, taskPage }) => {
      await test.step("step 1: star the task first", async () => {
        await taskPage.starTaskAndVerify({ taskName });
      });
      
      await test.step("step 2: click star icon again and verify task is un-starred", async () => {
        const starIcon = page
          .getByTestId("tasks-pending-table")
          .getByRole("row", { name: taskName })
          .getByTestId("pending-task-star-or-unstar-link");
        await starIcon.click();
        await expect(starIcon).toHaveClass(/ri-star-line/);
      });
    });
  });

  test("should create a new task with a different user as the assignee [SKIP_SETUP]", async({ page, browser, taskPage }) => {
    await test.step("step 1: create task with sam smith as assignee", async () => {
      await page.goto('/');
      await taskPage.createTaskAndVerify({ taskName, userName: "Sam Smith" });
    });

    await test.step("step 2: login as sam smith and verify task is visible", async () => {
      const newUserContext = await browser.newContext({
        storageState: { cookies: [], origins: [] },
      });

      const newUserPage = await newUserContext.newPage();
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

  test.describe("comment and verify", () => {
    test("make a comment as the creator and switch to assignee to verify comment visibility", async ({ browser, taskPage, page }) => {
      
      await test.step("step 1: add comment as task creator", async () => {
        await taskPage.addCommentAndVerifyTimestamp({ taskName, comment });
      });

      await test.step("step 2: verify comment count increased in creator's dashboard", async () => {
        await taskPage.verifyCommentCountIncrease({ taskName }, 1);
      });
      
      await test.step("step 3: login as assignee and verify task is visible", async () => {
        const newUserContext = await browser.newContext({
          storageState: { cookies: [], origins: [] },
        });

        const newUserPage = await newUserContext.newPage();
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
        
        await test.step("step 4: verify comment count shows correctly for assignee", async () => {
          await assigneeTaskPage.verifyCommentCountIncrease({ taskName }, 1);
        });
        
        await test.step("step 5: open task detail and verify comment is visible to assignee", async () => {
          await newUserPage.getByTestId('tasks-pending-table').getByText(taskName).first().click();
          
          const commentElement = newUserPage.getByText(new RegExp(comment));
          await expect(commentElement).toBeVisible();
        });
        
        await newUserPage.close();
        await newUserContext.close();
      });
    });

    test("make a second comment as the assignee and verify the comment as the creator", async ({ page, browser, taskPage }) => {
      const assigneeComment = faker.word.words({ count: 7 });
      
      await test.step("step 1: create initial comment as task creator", async () => {
        await taskPage.addCommentAndVerifyTimestamp({ taskName, comment });
      });

      await test.step("step 2: verify comment count increased for creator", async () => {
        await taskPage.verifyCommentCountIncrease({ taskName }, 1);
      });
      
      let newUserContext;
      let newUserPage;
      let assigneeTaskPage;

      await test.step("step 3: login as assignee and verify creator's comment", async () => {
        newUserContext = await browser.newContext({
          storageState: { cookies: [], origins: [] },
        });

        newUserPage = await newUserContext.newPage();
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

      await test.step("step 4: add second comment as assignee", async () => {
        await newUserPage.getByTestId('comments-text-field').fill(assigneeComment);
        await newUserPage.getByTestId('comments-submit-button').click();
        
        const assigneeCommentElement = newUserPage.getByText(new RegExp(assigneeComment));
        await expect(assigneeCommentElement).toBeVisible();
      });

      await test.step("step 5: verify updated comment count for assignee", async () => {
        await newUserPage.goto('/');
        await assigneeTaskPage.verifyCommentCountIncrease({ taskName }, 2);

        await newUserPage.close();
        await newUserContext.close();
      });

      await test.step("step 6: verify assignee's comment is visible to creator", async () => {
        await page.reload();
        
        await taskPage.verifyCommentCountIncrease({ taskName }, 2);
        
        await page.getByTestId('tasks-pending-table').getByText(taskName).first().click();
        
        const creatorCommentElement = page.getByText(new RegExp(comment));
        await expect(creatorCommentElement).toBeVisible();
        
        const samCommentElement = page.getByText(new RegExp(assigneeComment));
        await expect(samCommentElement).toBeVisible();
      });
    });
  });
});
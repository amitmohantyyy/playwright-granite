// tasks.spec.ts

import { test } from "../fixtures";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import LoginPage from "../pom/login";

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
    test.describe.configure({ mode: "serial" });

    test("add a comment under the newly created task for assignee Sam and login as Sam to check if the comment is visible", async ({ page, taskPage, browser }) => {
      await page.getByTestId('tasks-pending-table').getByText(taskName).first().click();
      
      await expect(page.getByTestId('task-assignee-label')).toContainText(`Assigned To : Sam Smith`);
      await expect(page.getByTestId('task-creator-label')).toContainText(`Created By : Oliver Smith`);
      
      await page.getByTestId('comments-text-field').fill(comment);
      // Capture the time before clicking submit
      const now: Date = new Date();
      await page.getByTestId('comments-submit-button').click();

      // Define time buffer (±1 min)
      const oneMinuteAgo: Date = new Date(now.getTime() - 60000);
      const oneMinuteLater: Date = new Date(now.getTime() + 60000);

      // Regex to match "Comment 2" followed immediately by a timestamp
      const timestampRegex = new RegExp(`${comment}(\\d{1,2}/\\d{1,2}/\\d{4}, \\d{1,2}:\\d{2}:\\d{2} (AM|PM))`);

      // Wait for the new comment to appear
      const commentElement = page.getByText(timestampRegex);
      await expect(commentElement).toBeVisible();

      // Extract the full text
      const commentText: string | null = await commentElement.textContent();
      if (!commentText) {
          throw new Error("Comment text not found!");
      }

      // Extract the timestamp from the matched comment text
      const match = commentText.match(timestampRegex);
      if (!match || match.length < 2) {
          throw new Error(`Failed to extract timestamp from: "${commentText}"`);
      }

      const commentTimeString: string = match[1]; // Captured timestamp
      const postedTime: Date = new Date(commentTimeString);

      // Validate that the timestamp falls within the allowed range
      expect(postedTime >= oneMinuteAgo && postedTime <= oneMinuteLater).toBeTruthy();

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
      
      await newUserPage.getByTestId('tasks-pending-table').getByText(taskName).first().click();
    
      await expect(newUserPage.getByTestId('task-assignee-label')).toContainText(`Assigned To : Sam Smith`);
      await expect(newUserPage.getByTestId('task-creator-label')).toContainText(`Created By : Oliver Smith`);
      
      await expect(commentElement).toBeVisible();

      // Check for comment
      if (!commentText) {
          throw new Error("Comment text not found!");
      }

      expect(postedTime >= oneMinuteAgo && postedTime <= oneMinuteLater).toBeTruthy();
      await newUserPage.close();
      await newUserContext.close();
      });
  });

  test("Add a comment under the newly created task as Sam and login as Oliver to check if the second comment is also visible", async ({ page, browser }) => {
    await page.getByTestId('tasks-pending-table').getByText(taskName).first().click();
      
      await expect(page.getByTestId('task-assignee-label')).toContainText(`Assigned To : Sam Smith`);
      await expect(page.getByTestId('task-creator-label')).toContainText(`Created By : Oliver Smith`);
      
      await page.getByTestId('comments-text-field').fill(comment);
      // Capture the time before clicking submit
      const now: Date = new Date();
      await page.getByTestId('comments-submit-button').click();

      // Define time buffer (±1 min)
      const oneMinuteAgo: Date = new Date(now.getTime() - 60000);
      const oneMinuteLater: Date = new Date(now.getTime() + 60000);

      // Regex to match "Comment 2" followed immediately by a timestamp
      const timestampRegex = new RegExp(`${comment}(\\d{1,2}/\\d{1,2}/\\d{4}, \\d{1,2}:\\d{2}:\\d{2} (AM|PM))`);

      // Wait for the new comment to appear
      const commentElement = page.getByText(timestampRegex);
      await expect(commentElement).toBeVisible();

      // Extract the full text
      const commentText: string | null = await commentElement.textContent();
      if (!commentText) {
          throw new Error("Comment text not found!");
      }

      // Extract the timestamp from the matched comment text
      const match = commentText.match(timestampRegex);
      if (!match || match.length < 2) {
          throw new Error(`Failed to extract timestamp from: "${commentText}"`);
      }

      const commentTimeString: string = match[1]; // Captured timestamp
      const postedTime: Date = new Date(commentTimeString);

      // Validate that the timestamp falls within the allowed range
      expect(postedTime >= oneMinuteAgo && postedTime <= oneMinuteLater).toBeTruthy();

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
      
      await newUserPage.getByTestId('tasks-pending-table').getByText(taskName).first().click();
    
      await expect(newUserPage.getByTestId('task-assignee-label')).toContainText(`Assigned To : Sam Smith`);
      await expect(newUserPage.getByTestId('task-creator-label')).toContainText(`Created By : Oliver Smith`);
      
      await expect(commentElement).toBeVisible();

      // Check for comment
      if (!commentText) {
          throw new Error("Comment text not found!");
      }

      expect(postedTime >= oneMinuteAgo && postedTime <= oneMinuteLater).toBeTruthy();

      //Comment as Sam
      const secondComment = faker.word.words({ count: 8 });
      await newUserPage.getByTestId('comments-text-field').fill(secondComment);
      const secondNow: Date = new Date();
      await newUserPage.getByTestId('comments-submit-button').click();

      // Define time buffer (±1 min)
      const secondOneMinuteAgo: Date = new Date(secondNow.getTime() - 60000);
      const secondOneMinuteLater: Date = new Date(secondNow.getTime() + 60000);

      // Regex to match "Comment 2" followed immediately by a timestamp
      const secondTimestampRegex = new RegExp(`${secondComment}(\\d{1,2}/\\d{1,2}/\\d{4}, \\d{1,2}:\\d{2}:\\d{2} (AM|PM))`);

      // Wait for the new comment to appear
      const secondCommentElement = newUserPage.getByText(secondTimestampRegex);
      await expect(secondCommentElement).toBeVisible();

      // Extract the full text
      const secondCommentText: string | null = await secondCommentElement.textContent();
      if (!secondCommentText) {
          throw new Error("Comment text not found!");
      }

      // Extract the timestamp from the matched comment text
      const secondMatch = secondCommentText.match(timestampRegex);
      if (!secondMatch || secondMatch.length < 2) {
          throw new Error(`Failed to extract timestamp from: "${secondCommentText}"`);
      }

      const secondCommentTimeString: string = match[1]; // Captured timestamp
      const secondPostedTime: Date = new Date(secondCommentTimeString);

      // Validate that the timestamp falls within the allowed range
      expect(secondPostedTime >= secondOneMinuteAgo && secondPostedTime <= secondOneMinuteLater).toBeTruthy();

      await newUserPage.close();
      await newUserContext.close();

      //Refresh the page and check for the second comment is present or not
  });

});
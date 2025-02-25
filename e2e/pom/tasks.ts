import {Page, expect} from "@playwright/test";
import exp from "constants";

interface TaskName {
    taskName: string;
}

interface CreateNewTaskProps extends TaskName {
    userName?: string;
}

export default class TaskPage {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    createTaskAndVerify = async ({ taskName, userName = "Oliver Smith" }: CreateNewTaskProps) => {
        await this.page.getByTestId('navbar-add-todo-link').click();
        await this.page.getByTestId('form-title-field').fill(taskName);

        await this.page.locator('.css-tlfecz-indicatorContainer').click();
        //Needs proper logic to identify Oliver Smith, this is a hotfix fr now.
        if (userName === "Oliver Smith") {
            await this.page.locator('#react-select-2-option-0').click();
        } else {
            await this.page.getByText(userName).click();
        }
        await this.page.getByTestId('form-submit-button').click();

        const taskInDashboard = this.page.getByTestId('tasks-pending-table')
        .getByRole("row", {name: new RegExp(taskName, "i")});
        
        await taskInDashboard.scrollIntoViewIfNeeded();
        await expect(taskInDashboard).toContainText(taskName);
        await expect(taskInDashboard).toBeVisible();
    };

    markTaskAsCompleteAndVerify = async ({ taskName }: TaskName) => {
        //Check task as complete
        await expect(
            this.page.getByRole("heading", { name: "Loading..." })
           ).toBeHidden();
        
        const completedTaskInDashboard = this.page.getByTestId('tasks-completed-table')
            .getByRole('row', { name: taskName });
        
        const isTaskCompleted = await completedTaskInDashboard.count();

        if (isTaskCompleted) return;
            
        await this.page.getByTestId('tasks-pending-table')
            .getByRole('row', { name: taskName })
            .getByRole('checkbox')
            .click();
        
        await completedTaskInDashboard.scrollIntoViewIfNeeded();
        await expect(completedTaskInDashboard).toBeVisible();
    };

    deleteCompletedTaskAndVerify = async ({ taskName }: TaskName) => {
        await this.page.getByTestId('tasks-completed-table')
            .getByRole('row', { name: taskName })
            .getByTestId('completed-task-delete-link')
            .click();
        
        await expect(this.page
              .getByTestId("tasks-pending-table")
              .getByRole("row", { name: taskName })).toBeHidden();
    };

    starTaskAndVerify = async ({ taskName }: TaskName) => {
        const starIcon = this.page
            .getByTestId("tasks-pending-table")
            .getByRole('row', { name: taskName })
            .getByTestId('pending-task-star-or-unstar-link');

        await starIcon.click();
        await expect(starIcon).toHaveClass(/ri-star-fill/i);
        await expect(this.page
            .getByTestId("tasks-pending-table")
            .getByRole("row").nth(1)).toContainText(taskName);
    };
};
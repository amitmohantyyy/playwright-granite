import {Page, expect} from "@playwright/test";

export default class LoginPage {
    constructor(private page: Page) {
        this.page = page;
    }

    async loginAndVerify({email, username, password}: { email: string, username: string, password: string }): Promise<void> {
        // await this.page.goto('http://localhost:3000/');
        await this.page.getByTestId('login-email-field').fill(email);
        await this.page.getByTestId('login-password-field').fill(password);
        await this.page.getByTestId('login-submit-button').click();

        await expect(this.page.getByTestId('navbar-username-label')).toContainText(username);
        await expect(this.page.getByTestId('navbar-logout-link')).toBeVisible();
    }
};
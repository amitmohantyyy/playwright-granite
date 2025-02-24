import { faker } from "@faker-js/faker";
import {test, expect} from "@playwright/test";
import LoginPage from "../pom/login.ts";

test.describe("Register page", () => {
    test("Should register a new user", async ({ page }) => {
        const username = faker.person.fullName();
        const email = faker.internet.email();
        const password = faker.internet.password();
        const login = new LoginPage(page);

        await page.goto('http://localhost:3000');
        await page.getByTestId('login-register-link').click();
        await page.getByTestId('signup-name-field').fill(username);
        await page.getByTestId('signup-email-field').fill(email);
        await page.getByTestId('signup-password-field').fill(password);
        await page.getByTestId('signup-password-confirmation-field').fill(password);
        await page.getByTestId('signup-submit-button').click();

        await login.loginAndVerify({email, username, password});
    });
});
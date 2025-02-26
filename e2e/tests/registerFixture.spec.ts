import { faker } from "@faker-js/faker";
import { test } from "../fixtures";

test.describe("Register page", () => {
    test("Should register a new user", async ({ page, loginPage }) => {
        let username: string;
        let email: string;
        let password: string;
        
        await test.step("step 1: generate random user data", async () => {
            username = faker.person.fullName();
            email = faker.internet.email();
            password = faker.internet.password();
        });
        
        await test.step("step 2: navigate to registration page", async () => {
            await page.goto('http://localhost:3000');
            await page.getByTestId('login-register-link').click();
        });
        
        await test.step("step 3: fill in and submit registration form", async () => {
            await page.getByTestId('signup-name-field').fill(username);
            await page.getByTestId('signup-email-field').fill(email);
            await page.getByTestId('signup-password-field').fill(password);
            await page.getByTestId('signup-password-confirmation-field').fill(password);
            await page.getByTestId('signup-submit-button').click();
        });
        
        await test.step("step 4: verify successful login with new credentials", async () => {
            await loginPage.loginAndVerify({email, username, password});
        });
    });
});
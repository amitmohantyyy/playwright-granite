import { test } from "../fixtures";

test.describe("Login page", () => {
    test("should login with correct credentials", async ({ page, loginPage }) => {
        await page.goto('http://localhost:3000');
        await loginPage.loginAndVerify({
            email: "oliver@example.com",
            username: "Oliver Smith",
            password: "welcome"
        })
    });
});
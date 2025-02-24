
import {test, expect} from "@playwright/test";
import LoginPage from "../pom/login";

test.describe("Login Page", () => {
    test("Should login with the correct credentials", async ({ page }) => {
        const login = new LoginPage(page);
        await page.goto("http://localhost:3000");
        await login.loginAndVerify({
            email: "oliver@example.com",
            password: "welcome",
            username: "Oliver Smith",
        });
    });
});
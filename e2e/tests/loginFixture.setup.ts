import { test } from "../fixtures";
import { STORAGE_STATE } from "../../playwright.config";


test.describe("Login page", () => {
    test("should login with correct credentials", async ({ page, loginPage }) => {
        await test.step("step 1: navigate to login page", async () => {
            await page.goto('http://localhost:3000');
        });
        
        await test.step("step 2: login with oliver's credentials", async () => {
            await loginPage.loginAndVerify({
                email: "oliver@example.com",
                username: "Oliver Smith",
                password: "welcome"
            });
        });
        
        await test.step("step 3: save authentication state for future tests", async () => {
            await page.context().storageState({ path: STORAGE_STATE });
        });
    });
});
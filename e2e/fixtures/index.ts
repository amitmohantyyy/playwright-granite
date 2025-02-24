import {test as base} from "@playwright/test";
import LoginPage from "../pom/login";

interface ExtendedFixtures {
    loginPage: LoginPage;
};

export const test = base.extend<ExtendedFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    }
});
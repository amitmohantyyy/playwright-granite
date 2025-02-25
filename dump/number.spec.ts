import { test } from "@playwright/test";

function generateRandomNumber() {
    return Math.floor(Math.random() * 1000);
    }
test.describe("Random Number Tests", () => {
    const randomValue = generateRandomNumber(); 

    test("Test 1", async () => {
        console.log("Test 1 - Random Value:", randomValue);
    });

    test("Test 2", async () => {
        console.log("Test 2 - Random Value:", randomValue);
    });
});
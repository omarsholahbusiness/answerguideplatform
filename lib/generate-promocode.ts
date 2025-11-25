/**
 * Generates a random 6-character code with uppercase letters and numbers
 * No duplicate characters within the code
 * @param existingCodes - Array of existing codes to check against for uniqueness
 * @returns A unique 6-character code
 */
export function generatePromoCode(existingCodes: string[] = []): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const maxAttempts = 100; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts) {
        // Create array of available characters
        const availableChars = characters.split("");
        const codeChars: string[] = [];

        // Select 6 unique characters
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            const selectedChar = availableChars[randomIndex];
            codeChars.push(selectedChar);
            // Remove the selected character to ensure no duplicates
            availableChars.splice(randomIndex, 1);
        }

        const generatedCode = codeChars.join("");

        // Check if code is unique
        if (!existingCodes.includes(generatedCode)) {
            return generatedCode;
        }

        attempts++;
    }

    // Fallback: if we can't generate a unique code after max attempts,
    // append a random suffix
    const fallbackCode = generateRandomCode();
    return fallbackCode + Math.floor(Math.random() * 10).toString();
}

/**
 * Helper function to generate a random code without uniqueness check
 */
function generateRandomCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const availableChars = characters.split("");
    const codeChars: string[] = [];

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        const selectedChar = availableChars[randomIndex];
        codeChars.push(selectedChar);
        availableChars.splice(randomIndex, 1);
    }

    return codeChars.join("");
}


// Function to update button states and styles
function updateButtonStates(states) {
    // Store references to all the buttons
    const buttons = {
        openFile: document.getElementById("openFile"),
        lexicalBtn: document.getElementById("lexicalBtn"),
        syntaxBtn: document.getElementById("syntaxBtn"),
        semanticBtn: document.getElementById("semanticBtn"),
        clearBtn: document.getElementById("clearBtn"),
    };

    // Loop through the states object to update each button based on its state
    Object.keys(states).forEach((key) => {
        const button = buttons[key];
        button.disabled = states[key]; // Disable the button if the state is true
        button.style.backgroundColor = states[key] ? "grey" : ""; // Set background color to grey if disabled
        button.style.cursor = states[key] ? "not-allowed" : "pointer"; // Change cursor to 'not-allowed' if disabled
    });
}

// Initial state: only Open File and Clear are enabled
updateButtonStates({
    openFile: false, // Open File button is enabled initially
    lexicalBtn: true, // Other buttons are disabled initially
    syntaxBtn: true,
    semanticBtn: true,
    clearBtn: true, // Clear button is disabled initially
});

// Utility function to display messages in the result area
function displayMessage(message, backgroundColor) {
    const result = document.getElementById("result");
    result.value = message; // Set the message in the result field
    result.style.backgroundColor = backgroundColor; // Set the background color based on the message
}

// Event: Open File button click
document.getElementById("openFile").addEventListener("click", function () {
    // Create a file input element to allow the user to select a file
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt, .js, .cpp, .py"; // Allow specific file types

    fileInput.click(); // Trigger file selection dialog

    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0]; // Get the selected file
        if (file) {
            const reader = new FileReader(); // Create a FileReader to read the file contents
            reader.onload = function (e) {
                document.getElementById("codeInput").value = e.target.result; // Set the file content in the input field

                // Update button states after opening a file
                updateButtonStates({
                    openFile: true, // Keep Open File enabled
                    lexicalBtn: false, // Enable Lexical button
                    syntaxBtn: true, // Enable Syntax button
                    semanticBtn: true, // Enable Semantic button
                    clearBtn: true, // Enable Clear button
                });
            };
            reader.readAsText(file); // Read the file as text
        }
    });
});

// Utility to check if code input is empty
function isCodeEmpty() {
    return document.getElementById("codeInput").value.trim() === ""; // Check if code input field is empty
}

// Event: Lexical Analysis button click
document.getElementById("lexicalBtn").addEventListener("click", function () {
    if (isCodeEmpty()) {
        displayMessage("Open file first!", "lightcoral"); // Show message if no file is opened
        return;
    }

    const code = document.getElementById("codeInput").value;

    // Regular expression to check for "integer" (invalid) or invalid characters
    const lexicalError = /\binteger\b|[^a-zA-Z0-9\s{}()=+\-*/.;:,_&|!<>^%$#@'"\[\]`]/.test(code);

    if (lexicalError) {
        displayMessage('Lexical analysis failed! Use "int" instead of "integer".', "lightcoral"); // Display error message
    } else {
        displayMessage("Lexical analysis passed! No errors.", "lightgreen"); // Display success message

        // Update button states after passing Lexical Analysis
        updateButtonStates({
            openFile: true, // Keep Open File enabled
            lexicalBtn: true, // Keep Lexical button enabled
            syntaxBtn: false, // Disable Syntax button
            semanticBtn: true, // Enable Semantic button
            clearBtn: true, // Keep Clear button enabled
        });
    }
});

// Event: Syntax Analysis button click
document.getElementById("syntaxBtn").addEventListener("click", function () {
    if (isCodeEmpty()) {
        displayMessage("Open file first!", "lightcoral"); // Show message if no file is opened
        return;
    }

    const code = document.getElementById("codeInput").value;

    // Check for unclosed string literals (single or double quotes)
    const unclosedStringLiterals = /(['"])(?:(?!\1).)*$/.test(code);
    // Check for unclosed braces
    const unclosedBraces = (code.match(/{/g) || []).length !== (code.match(/}/g) || []).length;
    // Check for unclosed parentheses
    const unclosedParentheses = (code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length;
    // Check for unclosed square brackets
    const unclosedBrackets = (code.match(/\[/g) || []).length !== (code.match(/\]/g) || []).length;
    // Check for missing semicolons where required
    const missingSemicolon = /[^;\s}]\s*[\n\r]/.test(code) && !/function|if|for|while|switch/.test(code);

    // If any condition indicates an error, display error message
    if (unclosedStringLiterals || missingSemicolon || unclosedBraces || unclosedParentheses || unclosedBrackets) {
        displayMessage("Syntax analysis failed! Syntax error found.", "lightcoral");
    } else {
        displayMessage("Syntax analysis passed! No errors.", "lightgreen");

        // Update button states after passing Syntax Analysis
        updateButtonStates({
            openFile: true,
            lexicalBtn: true,
            syntaxBtn: true, // Keep Syntax button enabled
            semanticBtn: false, // Enable Semantic button
            clearBtn: true, // Keep Clear button enabled
        });

        // Explicitly set Semantic button to active state
        const semanticBtn = document.getElementById("semanticBtn");
        semanticBtn.style.backgroundColor = ""; // Reset to default
        semanticBtn.style.cursor = "pointer"; // Make pointer cursor
    }
});

// Event: Semantic Analysis button click
document.getElementById("semanticBtn").addEventListener("click", function () {
    const code = document.getElementById("codeInput").value;
    const result = document.getElementById("result");

    const javaKeywords = [
        "int", "String", "float", "double", "char", "boolean", "long", "short", "byte", 
        "void", "public", "private", "protected", "static", "final", "class", "new", "return", "if",
        "else", "switch", "case", "for", "while", "do", "try", "catch", "finally", "throw"
    ];

    const declarationPattern = /\b(int|float|double|char|boolean|long|short|byte|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^\s;]+)/g;
    const declaredVars = [];
    let match;

    while ((match = declarationPattern.exec(code)) !== null) {
        declaredVars.push({ variable: match[2], value: match[3], type: match[1] });
    }

    const typeMismatchErrors = [];
    
    // Check for type mismatches (e.g., assigning a float/double to an int)
    declaredVars.forEach(declaredVar => {
        if (declaredVar.type === "int" && /[.]/.test(declaredVar.value)) { // Check for decimal points in 'int' type assignment
            typeMismatchErrors.push(`Semantic error: Cannot assign ${declaredVar.value} to ${declaredVar.type} ${declaredVar.variable}.`);
        }
    });

    if (typeMismatchErrors.length > 0) {
        result.value = typeMismatchErrors.join("\n");
        result.style.backgroundColor = "lightcoral"; // Set background color to error color
    } else {
        result.value = "Semantic analysis passed! No errors.";
        result.style.backgroundColor = "lightgreen"; // Set background color to success color

        // Enable the Clear button after successful semantic analysis
        updateButtonStates({
            openFile: true,
            lexicalBtn: true,
            syntaxBtn: true,
            semanticBtn: true,
            clearBtn: false, // Disable Clear button until next operation
        });
    }    
});

// Event: Clear button click
document.getElementById("clearBtn").addEventListener("click", function () {
    document.getElementById("codeInput").value = ""; // Clear the code input field
    document.getElementById("result").value = ""; // Clear the result field
    document.getElementById("result").style.backgroundColor = "white"; // Set the background color to white
    document.getElementById("openFile").disabled = false; // Re-enable Open File button
    updateButtonStates({
        openFile: false,
        lexicalBtn: true,
        syntaxBtn: true,
        semanticBtn: true,
        clearBtn: true,
    }); // Reset all button states
});


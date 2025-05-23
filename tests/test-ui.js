import { processContent } from '../ui.js';

const tests = [
    {
        name: "Single hashtag",
        input: "Hello #world",
        expected: "Hello <a href=\"#world\">#world</a>"
    },
    {
        name: "Multiple hashtags",
        input: "#hello #world",
        expected: "<a href=\"#hello\">#hello</a> <a href=\"#world\">#world</a>"
    },
    {
        name: "Hashtag at the beginning",
        input: "#hello world",
        expected: "<a href=\"#hello\">#hello</a> world"
    },
    {
        name: "Hashtag at the end",
        input: "Hello #world",
        expected: "Hello <a href=\"#world\">#world</a>"
    },
    {
        name: "No hashtags",
        input: "Hello world",
        expected: "Hello world"
    },
    {
        name: "Hashtag with numbers",
        input: "Meeting at #123",
        expected: "Meeting at <a href=\"#123\">#123</a>"
    },
    {
        name: "Empty string",
        input: "",
        expected: ""
    },
    {
        name: "String with only a hashtag",
        input: "#alone",
        expected: "<a href=\"#alone\">#alone</a>"
    },
    {
        name: "Hashtag with alphanumeric characters",
        input: "This is #alpha123",
        expected: "This is <a href=\"#alpha123\">#alpha123</a>"
    },
    {
        name: "String with special characters around hashtag",
        input: "Special! (#char) test",
        expected: "Special! (<a href=\"#char\">#char</a>) test"
    },
    {
        name: "String with multiple lines and hashtags",
        input: "First line #one\nSecond line #two",
        expected: "First line <a href=\"#one\">#one</a>\nSecond line <a href=\"#two\">#two</a>"
    }
];

function runTests() {
    console.log("Running processContent tests...");
    let allPassed = true;
    const results = [];

    tests.forEach(test => {
        try {
            const actual = processContent(test.input);
            if (actual !== test.expected) {
                throw new Error(`Expected "${test.expected}", but got "${actual}"`);
            }
            console.log(`Test '${test.name}': PASSED`);
            results.push({ name: test.name, passed: true });
        } catch (e) {
            console.error(`Test '${test.name}': FAILED - ${e.message}`);
            results.push({ name: test.name, passed: false, error: e.message });
            allPassed = false;
        }
    });

    if (typeof window !== 'undefined' && window.document) {
        displayTestResultsInBrowser(results);
    }

    if (allPassed) {
        console.log("All processContent tests PASSED!");
    } else {
        console.error("Some processContent tests FAILED.");
    }
    return allPassed;
}

function displayTestResultsInBrowser(results) {
    const resultsContainer = document.getElementById('test-results');
    if (!resultsContainer) {
        console.error("Test results container #test-results not found in HTML.");
        return;
    }

    resultsContainer.innerHTML = ''; // Clear previous results

    const summary = document.createElement('h2');
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    summary.textContent = `Test Summary: ${passedCount} Passed, ${failedCount} Failed`;
    resultsContainer.appendChild(summary);

    const ul = document.createElement('ul');
    results.forEach(result => {
        const li = document.createElement('li');
        li.textContent = `Test '${result.name}': ${result.passed ? 'PASSED' : 'FAILED'}`;
        li.style.color = result.passed ? 'green' : 'red';
        if (!result.passed && result.error) {
            const errorDetails = document.createElement('p');
            errorDetails.textContent = `Error: ${result.error}`;
            errorDetails.style.marginLeft = '20px';
            li.appendChild(errorDetails);
        }
        ul.appendChild(li);
    });
    resultsContainer.appendChild(ul);
}

// If running in a browser-like environment with document, run tests on load.
// Otherwise, export runTests for potential Node.js execution (though this file is a module).
if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', runTests);
}

export { runTests, tests }; // Export for potential use in other test runners or for debugging

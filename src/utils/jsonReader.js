const fs = require('fs');
const path = require('path');

function readTestResultsFromFolder(folderPath) {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    const successData = [];
    const failureData = [];

    files.forEach(file => {
        const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const json = JSON.parse(content);

        let testCaseName = "N/A";
        if (json.tags) {
            const tcTag = json.tags.find(tag => tag.type && tag.type.toLowerCase() === "testcasekey");
            if (tcTag) testCaseName = tcTag.name || "N/A";
        }
        const feature = json.name || "N/A";
        const scenario = json.id || "N/A";

        let hasFailure = false;
        let allChildren = [];
        if (json.testSteps) {
            json.testSteps.forEach(step => {
                if (step.children) {
                    step.children.forEach(child => {
                        allChildren.push(child);
                        if (child.result && child.result.toUpperCase() === "FAILURE") {
                            hasFailure = true;
                        }
                    });
                }
            });
        }

        if (hasFailure) {
            allChildren.forEach(child => {
                if (child.result && child.result.toUpperCase() === "FAILURE") {
                    // ...existing code...
                    let rawFailureMsg = json.testFailureMessage || "";
                    let cleanFailureMsg = rawFailureMsg.split("Build info:")[0].trim();

                    failureData.push({
                        name: testCaseName,
                        feature,
                        scenario,
                        step: child.description || "N/A",
                        reason: (child.exception && child.exception.message) || "No message",
                        screenshot: child.screenshotPath || "",
                        result: child.result || 'FAILURE',
                        testFailureClassname: json.testFailureClassname || "",
                        testFailureMessage: cleanFailureMsg,
                        testFailureSummary: json.testFailureSummary || ""
                    });
                    // ...existing code...
                }
            });
        } else {
            successData.push({
                name: testCaseName,
                feature,
                scenario,
                remarks: "All steps passed"
            });
        }
    });

    return { successData, failureData };
}

module.exports = { readTestResultsFromFolder };
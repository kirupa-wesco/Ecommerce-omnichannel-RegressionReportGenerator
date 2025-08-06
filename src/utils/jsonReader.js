const path = require('path');
const fs = require('fs');

function readTestResultsFromFolder(folderPath) {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    const successData = [];
    const failureData = [];
    const othersData = [];

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
        const rootResult = (json.result || '').toUpperCase();

        if (rootResult === "FAILURE") {
            // ...existing failure logic...
            let failedSteps = [];
            if (json.testSteps) {
                json.testSteps.forEach(step => {
                    if (step.result && step.result.toUpperCase() === "FAILURE") {
                        failedSteps.push(step);
                    }
                    if (step.children) {
                        step.children.forEach(child => {
                            if (child.result && child.result.toUpperCase() === "FAILURE") {
                                failedSteps.push(child);
                            }
                        });
                    }
                });
            }
            if (failedSteps.length > 0) {
                failedSteps.forEach(failedStep => {
                    let rawFailureMsg = json.testFailureMessage || "";
                    let cleanFailureMsg = rawFailureMsg.split("Build info:")[0].trim();
                    failureData.push({
                        name: testCaseName,
                        feature,
                        scenario,
                        step: failedStep.description || "N/A",
                        reason: (failedStep.exception && failedStep.exception.message) || "No message",
                        screenshot: failedStep.screenshotPath || "",
                        result: failedStep.result || 'FAILURE',
                        testFailureClassname: json.testFailureClassname || "",
                        testFailureMessage: cleanFailureMsg,
                        testFailureSummary: json.testFailureSummary || ""
                    });
                });
            } else {
                let rawFailureMsg = json.testFailureMessage || "";
                let cleanFailureMsg = rawFailureMsg.split("Build info:")[0].trim();
                failureData.push({
                    name: testCaseName,
                    feature,
                    scenario,
                    step: json.methodName || "N/A",
                    reason: (json.testFailureCause && json.testFailureCause.message) || json.testFailureMessage || "No message",
                    screenshot: "",
                    result: rootResult,
                    testFailureClassname: json.testFailureClassname || "",
                    testFailureMessage: cleanFailureMsg,
                    testFailureSummary: json.testFailureSummary || ""
                });
            }
        } else if (rootResult === "SUCCESS") {
            successData.push({
                name: testCaseName,
                feature,
                scenario,
                remarks: "All steps passed"
            });
        } else {
            // For SKIPPED, DISABLED, etc.
            othersData.push({
                name: testCaseName,
                feature,
                scenario,
                result: rootResult,
                remarks: "Test case not executed or in other state"
            });
        }
    });

    return { successData, failureData, othersData };
}

module.exports = { readTestResultsFromFolder };
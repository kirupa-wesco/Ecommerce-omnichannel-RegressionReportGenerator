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
                    failureData.push({
                        name: testCaseName,
                        feature,
                        scenario,
                        step: child.description || "N/A",
                        reason: (child.exception && child.exception.message) || "No message",
                        remarks: "Check logs",
                        screenshot: child.screenshotPath || "" // Screenshot path add panniten
                    });
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
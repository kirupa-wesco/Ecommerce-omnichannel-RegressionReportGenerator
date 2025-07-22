class ReportGenerator {
    constructor() {
        this.ExcelJS = require('exceljs');
    }

    async generateSuccessReport(successData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Successful Test Cases');
        worksheet.columns = [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Scenario', key: 'scenario', width: 30 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Feature', key: 'feature', width: 30 },
            { header: 'Remarks', key: 'remarks', width: 30 },
            { header: 'Result', key: 'result', width: 10 }
        ];

        successData.forEach((testCase) => {
            let workflowName = '';
            let feature = testCase.feature;
            let scenario = testCase.scenario;
            if (testCase.feature && typeof testCase.feature === 'string') {
                const parts = testCase.feature.split(' - ');
                workflowName = parts.length > 1 ? parts[0] : '';
                feature = parts.length > 1 ? parts.slice(1).join(' - ') : testCase.feature;
            }
            if (testCase.scenario && typeof testCase.scenario === 'string') {
                let scenarioStr = testCase.scenario;
                // Remove workflow name if present before '--' or ' -- '
                const scenarioParts = scenarioStr.split(' -- ');
                scenario = scenarioParts.length > 1 ? scenarioParts.slice(1).join(' -- ') : scenarioStr;
                // Remove string after ';' if present
                if (scenario.includes(';')) {
                    scenario = scenario.split(';')[0].trim();
                }
                // Replace '-' with space
                scenario = scenario.replace(/-/g, ' ');
            }
            worksheet.addRow({
                testCaseName: testCase.name,
                githubJobId: testCase.githubJobId || '',
                branch: testCase.branch || '',
                brand: testCase.brand || '',
                team: testCase.team || '',
                scenario,
                workflowName,
                feature,
                remarks: testCase.remarks,
                result: 'PASS'
            });
        });

        await workbook.xlsx.writeFile(outputPath);
        //console.log(`✅ Success report created at: ${outputPath}`);
    }

    async generateFailureReport(failureData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Failed Test Cases');

        worksheet.columns = [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Scenario', key: 'scenario', width: 30 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Feature', key: 'feature', width: 30 },
            { header: 'Remarks', key: 'remarks', width: 30 },
            { header: 'Result', key: 'result', width: 10 }
        ];

        failureData.forEach((testCase) => {
            let workflowName = '';
            let feature = testCase.feature;
            let scenario = testCase.scenario;
            if (testCase.feature && typeof testCase.feature === 'string') {
                const parts = testCase.feature.split(' - ');
                workflowName = parts.length > 1 ? parts[0] : '';
                feature = parts.length > 1 ? parts.slice(1).join(' - ') : testCase.feature;
            }
            if (testCase.scenario && typeof testCase.scenario === 'string') {
                let scenarioStr = testCase.scenario;
                // Remove workflow name if present before '--' or ' -- '
                const scenarioParts = scenarioStr.split(' -- ');
                scenario = scenarioParts.length > 1 ? scenarioParts.slice(1).join(' -- ') : scenarioStr;
                // Remove string after ';' if present
                if (scenario.includes(';')) {
                    scenario = scenario.split(';')[0].trim();
                }
                // Replace '-' with space
                scenario = scenario.replace(/-/g, ' ');
            }
            worksheet.addRow({
                testCaseName: testCase.name,
                githubJobId: testCase.githubJobId || '',
                branch: testCase.branch || '',
                brand: testCase.brand || '',
                team: testCase.team || '',
                workflowName,
                scenario,
                feature,
                step: testCase.step,
                failedReason: testCase.reason,
                remarks: testCase.remarks
            });
        });

        await workbook.xlsx.writeFile(outputPath);
        //console.log(`❌ Failure report created at: ${outputPath}`);
    }
}

module.exports = ReportGenerator;
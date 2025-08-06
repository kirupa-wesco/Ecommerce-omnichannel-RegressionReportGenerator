class ReportGenerator {
    constructor() {
        this.ExcelJS = require('exceljs');
    }

    // Helper to format feature/scenario
    _formatString(str, type = 'feature') {
        if (!str || typeof str !== 'string') return str;
        let result = str;
        if (type === 'feature') {
            const parts = str.split(' - ');
            result = parts.length > 1 ? parts.slice(1).join(' - ') : str;
        } else if (type === 'scenario') {
            let scenarioStr = str;
            const scenarioParts = scenarioStr.split(' -- ');
            result = scenarioParts.length > 1 ? scenarioParts.slice(1).join(' -- ') : scenarioStr;
            if (result.includes(';')) result = result.split(';')[0].trim();
            result = result.replace(/-/g, ' ');
        }
        return result;
    }

    // Generic row adder
    _addRows(worksheet, data, columns, rowMapper) {
        worksheet.columns = columns;
        data.forEach(testCase => {
            worksheet.addRow(rowMapper(testCase, this._formatString.bind(this)));
        });
    }

    // Column definitions
    get successColumns() {
        return [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Environment', key: 'environment', width: 20 },
            { header: 'Feature', key: 'scenario', width: 30 },
            { header: 'Scenario', key: 'feature', width: 30 },
            { header: 'Result', key: 'result', width: 10 },
            { header: 'Remarks', key: 'remarks', width: 30 }
        ];
    }

    get failureColumns() {
        return [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Environment', key: 'environment', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Feature', key: 'scenario', width: 30 },
            { header: 'Scenario', key: 'feature', width: 30 },
            { header: 'Step', key: 'step', width: 30 },
            { header: 'Result', key: 'result', width: 10 },
            { header: 'Failure category', key: 'testFailureClassname', width: 30 },
            { header: 'Failure Message', key: 'testFailureMessage', width: 50 },
            { header: 'Failure Summary', key: 'testFailureSummary', width: 50 },
            { header: 'Remarks', key: 'remarks', width: 30 }
        ];
    }

    get othersColumns() {
        return [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Environment', key: 'environment', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Feature', key: 'scenario', width: 30 },
            { header: 'Scenario', key: 'feature', width: 30 },
            { header: 'Result', key: 'result', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 30 }
        ];
    }

    async generateSuccessReport(successData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Successful Test Cases');
        this._addRows(
            worksheet,
            successData,
            this.successColumns,
            (testCase, format) => ({
                testCaseName: testCase.name,
                githubJobId: testCase.githubJobId || '',
                branch: testCase.branch || '',
                brand: testCase.brand || '',
                team: testCase.team || '',
                workflowName: testCase.workflowName || '',
                environment: testCase.env || '',
                feature: format(testCase.feature, 'feature'),
                scenario: format(testCase.scenario, 'scenario'),
                result: 'PASS',
                remarks: testCase.remarks
            })
        );
        await workbook.xlsx.writeFile(outputPath);
    }

    async generateFailureReport(failureData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Failed Test Cases');
        this._addRows(
            worksheet,
            failureData,
            this.failureColumns,
            (testCase, format) => ({
                testCaseName: testCase.name,
                githubJobId: testCase.githubJobId || '',
                branch: testCase.branch || '',
                brand: testCase.brand || '',
                environment: testCase.env || '',
                team: testCase.team || '',
                workflowName: testCase.workflowName || '',
                feature: format(testCase.feature, 'feature'),
                scenario: format(testCase.scenario, 'scenario'),
                step: testCase.step,
                result: testCase.result || 'FAIL',
                testFailureClassname: testCase.testFailureClassname || '',
                testFailureMessage: testCase.testFailureMessage || '',
                testFailureSummary: testCase.testFailureSummary || '',
                remarks: testCase.remarks,
            })
        );
        await workbook.xlsx.writeFile(outputPath);
    }

    async generateOthersReport(othersData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Other Test Cases');
        this._addRows(
            worksheet,
            othersData,
            this.othersColumns,
            (testCase, format) => ({
                testCaseName: testCase.name,
                githubJobId: testCase.githubJobId || '',
                branch: testCase.branch || '',
                brand: testCase.brand || '',
                environment: testCase.env || '',
                team: testCase.team || '',
                workflowName: testCase.workflowName || '',
                feature: format(testCase.feature, 'feature'),
                scenario: format(testCase.scenario, 'scenario'),
                result: testCase.result,
                remarks: testCase.remarks
            })
        );
        await workbook.xlsx.writeFile(outputPath);
    }



    async generateMasterReport(allData, outputPath) {
        const workbook = new this.ExcelJS.Workbook();

        // ===== Summary Sheet =====
        const summarySheet = workbook.addWorksheet('Summary');

        // Calculate counts and percentages
        let successCount = 0, failureCount = 0, othersCount = 0;
        let total = allData.length;
        allData.forEach(tc => {
            let resultValue = '';
            if (tc.result) {
                resultValue = tc.result.toUpperCase();
            } else if (
                (tc.testFailureClassname || tc.testFailureMessage || tc.testFailureSummary || tc.step)
                && (!tc.result || tc.result === '')
            ) {
                resultValue = 'FAILURE';
            } else {
                resultValue = 'SUCCESS';
            }

            if (resultValue === 'SUCCESS') successCount++;
            else if (resultValue === 'FAILURE') failureCount++;
            else othersCount++;

            tc._finalResult = resultValue; // Store for later use
        });

        // Heading row
        summarySheet.addRow(['Test Case Summary']);
        summarySheet.mergeCells('A1', 'C1');
        summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0070C0' }
        };

        // Table header
        summarySheet.addRow(['Type', 'Count', 'Percentage']);
        ['A2', 'B2', 'C2'].forEach(cell => {
            summarySheet.getCell(cell).font = { bold: true, color: { argb: 'FF000000' } };
            summarySheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
            summarySheet.getCell(cell).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };
            summarySheet.getCell(cell).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Success row
        const successRow = summarySheet.addRow([
            'Success',
            successCount,
            `${((successCount/total)*100).toFixed(2)}%`
        ]);
        successRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF92D050' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Failure row
        const failureRow = summarySheet.addRow([
            'Failure',
            failureCount,
            `${((failureCount/total)*100).toFixed(2)}%`
        ]);
        failureRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' } };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Others row
        const othersRow = summarySheet.addRow([
            'Others',
            othersCount,
            `${((othersCount/total)*100).toFixed(2)}%`
        ]);
        othersRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Total row
        const totalRow = summarySheet.addRow([
            'Total',
            total,
            '100.00%'
        ]);
        totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFB4C6E7' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Set column widths
        summarySheet.getColumn(1).width = 15;
        summarySheet.getColumn(2).width = 10;
        summarySheet.getColumn(3).width = 12;

        // ===== All Test Cases Sheet =====
        const worksheet = workbook.addWorksheet('All Test Cases');
        const columns = [
            { header: 'Test Case Name', key: 'testCaseName', width: 30 },
            { header: 'GitHub Job ID', key: 'githubJobId', width: 20 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Workflow Name', key: 'workflowName', width: 30 },
            { header: 'Environment', key: 'environment', width: 20 },
            { header: 'Feature', key: 'feature', width: 30 },
            { header: 'Scenario', key: 'scenario', width: 30 },
            { header: 'Step', key: 'step', width: 30 },
            { header: 'Result', key: 'result', width: 15 },
            { header: 'Failure category', key: 'testFailureClassname', width: 30 },
            { header: 'Failure Message', key: 'testFailureMessage', width: 50 },
            { header: 'Failure Summary', key: 'testFailureSummary', width: 50 },
            { header: 'Remarks', key: 'remarks', width: 30 }
        ];
        worksheet.columns = columns;

        allData.forEach(tc => {
            worksheet.addRow({
                testCaseName: tc.name,
                githubJobId: tc.githubJobId || '',
                branch: tc.branch || '',
                brand: tc.brand || '',
                team: tc.team || '',
                workflowName: tc.workflowName || '',
                environment: tc.env || '',
                feature: tc.feature || '',
                scenario: tc.scenario || '',
                step: tc.step || '',
                result: tc._finalResult,
                testFailureClassname: tc.testFailureClassname || '',
                testFailureMessage: tc.testFailureMessage || '',
                testFailureSummary: tc.testFailureSummary || '',
                remarks: tc.remarks || ''
            });
        });

        await workbook.xlsx.writeFile(outputPath);
    }





}

module.exports = ReportGenerator;
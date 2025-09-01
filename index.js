const path = require('path');
const fs = require('fs');
const { readTestResultsFromFolder } = require('./src/utils/jsonReader');
const ReportGenerator = require('./src/reportgenerator/reportGenerator');

function parseFolderMeta(folderName) {
    // Remove timestamp at the start
    const nameWithoutTimestamp = folderName.replace(/^\d{14}-/, '');
    const parts = nameWithoutTimestamp.split('-');
    // Always take from the right
    const env = parts.pop() || '';
    const workflowName = parts.pop() || '';
    const team = parts.pop() || '';
    const brand = parts.pop() || '';
    const branch = parts.pop() || '';
    const githubJobId = parts.pop() || '';
    const repoName = parts.join('-');
    return {
        repoName,
        githubJobId,
        branch,
        brand: brand.trim(),
        team: team.trim(),
        workflowName: workflowName.trim(),
        env: env.trim()
    };
}

(async () => {
    const artifactsDir = path.join(__dirname, 'Artifacts');
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
    const reportsBaseDir = path.join(__dirname, 'Reports');
    const successReportsDir = path.join(reportsBaseDir, 'Success');
    const failureReportsDir = path.join(reportsBaseDir, 'Failures');
    const othersReportsDir = path.join(reportsBaseDir, 'Others');

    // Create all report folders once at the top
    [successReportsDir, failureReportsDir, othersReportsDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const generator = new ReportGenerator();

    // Get all subfolders in Artifacts
    const subfolders = fs.readdirSync(artifactsDir).filter(f =>
        fs.statSync(path.join(artifactsDir, f)).isDirectory()
    );

    let allFailureData = [];
    let allSuccessData = [];
    let allOthersData = [];

    for (const folder of subfolders) {
        const inputDir = path.join(artifactsDir, folder);
        const successReport = path.join(successReportsDir, `SuccessTestCases_${folder}.xlsx`);
        const failureReport = path.join(failureReportsDir, `FailedTestCases_${folder}.xlsx`);
        const othersReport = path.join(othersReportsDir, `OtherTestCases_${folder}.xlsx`);

        // Read test results from the folder
        const { successData, failureData, othersData } = readTestResultsFromFolder(inputDir);

        // Attach meta info to each test case
        const meta = parseFolderMeta(folder);
        const successDataWithMeta = successData.map(tc => ({ ...tc, ...meta }));
        const failureDataWithMeta = failureData.map(tc => ({ ...tc, ...meta }));
        const othersDataWithMeta = othersData.map(tc => ({ ...tc, ...meta }));

        // Collect all for consolidation
        allSuccessData = allSuccessData.concat(successDataWithMeta);
        allFailureData = allFailureData.concat(failureDataWithMeta);
        allOthersData = allOthersData.concat(othersDataWithMeta);

        // Generate individual reports
        await generator.generateSuccessReport(successDataWithMeta, successReport);
        await generator.generateFailureReport(failureDataWithMeta, failureReport);
        await generator.generateOthersReport(othersDataWithMeta, othersReport);

        // Uncomment if you want per-folder logs
        // console.log(`✅ Success report created at: ${successReport}`);
        // console.log(`❌ Failure report created at: ${failureReport}`);
        // console.log(`🟡 Others report created at: ${othersReport}`);
    }
    const consolidatedSuccessReport = path.join(successReportsDir, `AllSuccessTestCases.xlsx`);
    const consolidatedFailureReport = path.join(failureReportsDir, `AllFailedTestCases.xlsx`);
    const consolidatedOthersReport = path.join(othersReportsDir, `AllOtherTestCases.xlsx`);

    // Generate all three consolidated reports in parallel
    await Promise.all([
        generator.generateSuccessReport(allSuccessData, consolidatedSuccessReport),
        generator.generateFailureReport(allFailureData, consolidatedFailureReport),
        generator.generateOthersReport(allOthersData, consolidatedOthersReport)
    ]);

    console.log(`✅ Consolidated success report created at: ${consolidatedSuccessReport}`);
    console.log(`❌ Consolidated failure report created at: ${consolidatedFailureReport}`);
    console.log(`🟡 Consolidated others report created at: ${consolidatedOthersReport}`);

    // Now generate master report after all three are done
    const masterReportPath = path.join(reportsBaseDir, 'AllTestCases_Master.xlsx');
    const allTestCases = allSuccessData.concat(allFailureData, allOthersData);
    await generator.generateMasterReport(allTestCases, masterReportPath);
    console.log(`💯 Master consolidated report created at: ${masterReportPath}`);
})();

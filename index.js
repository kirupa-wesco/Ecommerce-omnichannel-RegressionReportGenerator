const path = require('path');
const fs = require('fs');
const { readTestResultsFromFolder } = require('./src/utils/jsonReader');
const ReportGenerator = require('./src/reportgenerator/reportGenerator');

function parseFolderMeta(folderName) {
    // Example: ecommerce-omnichannel-fta-125-DevRegression-EECOL-GreyMatter-ApprovalRules
    const parts = folderName.split('-');
    const ftaIndex = parts.findIndex(p => p.toLowerCase() === 'fta');
    if (ftaIndex === -1 || parts.length < ftaIndex + 5) {
        return { githubJobId: '', branch: '', brand: '', team: '' };
    }
    return {
        githubJobId: parts[ftaIndex + 1] || '',
        branch: parts[ftaIndex + 2] || '',
        brand: parts[ftaIndex + 3] || '',
        team: parts[ftaIndex + 4] || ''
    };
}

(async () => {
    const artifactsDir = path.join(__dirname, 'Artifacts');
    const generator = new ReportGenerator();

    // Get all subfolders in Artifacts
    const subfolders = fs.readdirSync(artifactsDir).filter(f =>
        fs.statSync(path.join(artifactsDir, f)).isDirectory()
    );

    let allFailureData = [];
    let allSuccessData = [];

    for (const folder of subfolders) {
        const inputDir = path.join(artifactsDir, folder);
        const successReport = path.join(__dirname, 'Reports','Success', `SuccessTestCases_${folder}.xlsx`);
        const failureReport = path.join(__dirname, 'Reports', 'Failures', `FailedTestCases_${folder}.xlsx`);

        const { successData, failureData } = readTestResultsFromFolder(inputDir);

        // Attach meta info to each test case
        const meta = parseFolderMeta(folder);
        const successDataWithMeta = successData.map(tc => ({ ...tc, ...meta }));
        const failureDataWithMeta = failureData.map(tc => ({ ...tc, ...meta }));

        await generator.generateSuccessReport(successDataWithMeta, successReport);
        await generator.generateFailureReport(failureDataWithMeta, failureReport);

        // Collect all for consolidation
        allSuccessData = allSuccessData.concat(successDataWithMeta);
        allFailureData = allFailureData.concat(failureDataWithMeta);

        // console.log(`✅ Success report created at: ${successReport}`);
        // console.log(`❌ Failure report created at: ${failureReport}`);
    }

    // After looping all folders, generate one consolidated success and failure report
    const successReportsDir = path.join(__dirname, 'Reports', 'Success');
    if (!fs.existsSync(successReportsDir)) fs.mkdirSync(successReportsDir, { recursive: true });
    const consolidatedSuccessReport = path.join(successReportsDir, `AllSuccessTestCases.xlsx`);
    await generator.generateSuccessReport(allSuccessData, consolidatedSuccessReport);
    console.log(`✅ Consolidated success report created at: ${consolidatedSuccessReport}`);

    const failureReportsDir = path.join(__dirname, 'Reports', 'Failures');
    if (!fs.existsSync(failureReportsDir)) fs.mkdirSync(failureReportsDir, { recursive: true });
    const consolidatedFailureReport = path.join(failureReportsDir, `AllFailedTestCases.xlsx`);
    await generator.generateFailureReport(allFailureData, consolidatedFailureReport);
    console.log(`❌ Consolidated failure report created at: ${consolidatedFailureReport}`);

})();
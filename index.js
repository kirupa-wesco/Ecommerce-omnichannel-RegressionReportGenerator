const path = require('path');
const fs = require('fs');
const { readTestResultsFromFolder } = require('./src/utils/jsonReader');
const ReportGenerator = require('./src/reportgenerator/reportGenerator');
const unzipper = require('unzipper'); // npm install unzipper
const os = require('os');

function parseFolderMeta(folderName) {
    // Example folder name: "ECommerce-omnichannel-fta-githubJobId-branch-env-brand-team-workflowName"
    const parts = folderName.split('-');
    const ftaIndex = parts.findIndex(p => p.toLowerCase() === 'fta');
    if (ftaIndex === -1 || parts.length < ftaIndex + 5) {
        return { githubJobId: '', branch: '', env: '', brand: '', team: '', workflowName: '' };
    }
    return {
        githubJobId: parts[ftaIndex + 1] || '',
        branch: parts[ftaIndex + 2] || '',
        env: parts[ftaIndex + 3] || '',
        brand: parts[ftaIndex + 4] || '',
        team: parts[ftaIndex + 5] || '',
        workflowName: parts[ftaIndex + 6] || ''
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

    // Get all entries (folders + zip files) in Artifacts
    const artifactEntries = fs.readdirSync(artifactsDir);

    let allFailureData = [];
    let allSuccessData = [];
    let allOthersData = [];

    for (const entry of artifactEntries) {
        const entryPath = path.join(artifactsDir, entry);
        let inputDir = entryPath;
        let isTemp = false;
        let folderName = entry;

        if (fs.statSync(entryPath).isFile() && entry.endsWith('.zip')) {
            // If zip file, extract to temp dir
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-'));
            await fs.createReadStream(entryPath)
                .pipe(unzipper.Extract({ path: tempDir }))
                .promise();
            inputDir = tempDir;
            isTemp = true;
            folderName = entry.replace(/\.zip$/i, '');
        } else if (!fs.statSync(entryPath).isDirectory()) {
            continue; // Skip non-folder, non-zip
        }

        const successReport = path.join(successReportsDir, `SuccessTestCases_${folderName}.xlsx`);
        const failureReport = path.join(failureReportsDir, `FailedTestCases_${folderName}.xlsx`);
        const othersReport = path.join(othersReportsDir, `OtherTestCases_${folderName}.xlsx`);

        // Read test results from the folder
        const { successData, failureData, othersData } = readTestResultsFromFolder(inputDir);

        // Attach meta info to each test case
        const meta = parseFolderMeta(folderName);
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

        // Clean up temp dir if used
        if (isTemp) {
            fs.rmSync(inputDir, { recursive: true, force: true });
        }
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
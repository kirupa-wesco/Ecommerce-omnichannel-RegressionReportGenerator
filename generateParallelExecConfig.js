const fs = require('fs');
const path = require('path');


const ARTIFACTS_DIR = path.join(__dirname, 'Artifacts');
const OUTPUT_FILE = path.join(__dirname, 'Parallel-exec-config.failures.json');
const BRANDS = ['ANIXTER', 'EECOL', 'XPRESSCONNECT', 'ACCUTECH'];

// Copy Parallel-exec-config.json from project root if not present
const PROJECT_CONFIG_PATH = path.join(__dirname, '..', 'Parallel-exec-config.json');
const LOCAL_CONFIG_PATH = path.join(__dirname, 'Parallel-exec-config.json');
if (fs.existsSync(PROJECT_CONFIG_PATH)) {
    fs.copyFileSync(PROJECT_CONFIG_PATH, LOCAL_CONFIG_PATH);
}

// Load the config for lookup
let parallelConfig = null;
if (fs.existsSync(LOCAL_CONFIG_PATH)) {
    parallelConfig = JSON.parse(fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8'));
}

function extractFieldsFromJson(json) {
    const tags = Array.isArray(json.tags) ? json.tags : [];
    const brandTag = tags.find(t => t.type === 'tag' && BRANDS.includes(t.name));
    const countryTag = tags.find(t => t.type === 'tag' && ['USA', 'CA', 'GB'].includes(t.name));
    const criticalTag = tags.find(t => t.type === 'tag' && t.name.endsWith('Critical'));
    let company = '';
    let user = '';
    if (json.dataTable && Array.isArray(json.dataTable.rows) && json.dataTable.rows.length > 0) {
        const values = json.dataTable.rows[0].values;
        company = values[3] || '';
        user = values[0] || '';
    }
    return {
        brand: brandTag ? brandTag.name : '',
        company,
        country: countryTag ? countryTag.name : '',
        user,
        tag: criticalTag ? criticalTag.name : ''
    };
}

function walkDirForJsons(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDirForJsons(dirPath, callback);
        } else if (f.endsWith('.json')) {
            callback(dirPath);
        }
    });
}


function findCompanyUser(brand, tag, country) {
    if (!parallelConfig || !parallelConfig.include[brand]) return {};
    return parallelConfig.include[brand].find(e => e.tag === tag && e.country === country) || {};
}

function main() {
    const result = { include: {} };
    BRANDS.forEach(b => result.include[b] = []);
    walkDirForJsons(ARTIFACTS_DIR, (jsonPath) => {
        try {
            const content = fs.readFileSync(jsonPath, 'utf-8');
            const json = JSON.parse(content);
            // Only include if result is FAILURE
            if (String(json.result).toUpperCase() === 'FAILURE') {
                const { brand, tag, country } = extractFieldsFromJson(json);
                if (brand && tag && country) {
                    // Lookup correct company/user from config
                    const match = findCompanyUser(brand, tag, country);
                    const company = match.company || '';
                    const user = match.user || '';
                    if (company && user) {
                        if (!result.include[brand].some(e =>
                            e.tag === tag && e.country === country && e.company === company && e.user === user
                        )) {
                            result.include[brand].push({ tag, country, company, user });
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore invalid JSONs
        }
    });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log('Generated:', OUTPUT_FILE);
}

main();
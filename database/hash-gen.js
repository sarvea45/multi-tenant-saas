const bcrypt = require('bcrypt');

async function generateHashes() {
    // 1. Super Admin Password
    const superAdminHash = await bcrypt.hash('Admin@123', 10);
    console.log('\n--- COPY THIS FOR SUPER ADMIN ---');
    console.log(superAdminHash);

    // 2. Tenant Admin Password
    const tenantAdminHash = await bcrypt.hash('Demo@123', 10);
    console.log('\n--- COPY THIS FOR TENANT ADMIN ---');
    console.log(tenantAdminHash);

    // 3. Regular User Password
    const userHash = await bcrypt.hash('User@123', 10);
    console.log('\n--- COPY THIS FOR REGULAR USER ---');
    console.log(userHash);
}

generateHashes();
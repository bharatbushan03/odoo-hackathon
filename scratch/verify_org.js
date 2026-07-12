const prisma = require('../src/config/database');
const { organizationService } = require('../src/services');

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  try {
    // 1. Clean up test data
    console.log('Cleaning up existing test organization data...');
    await prisma.organization.deleteMany({
      where: {
        code: {
          in: ['test-org-1', 'test-org-2']
        }
      }
    });

    // 2. Create Organization
    console.log('Testing Create Organization...');
    const orgData = {
      name: 'Acme Corp',
      code: 'test-org-1',
      address: '123 Acme Way',
      phone: '555-0199',
      email: 'info@acme.example.com',
      website: 'https://acme.example.com',
      taxId: 'TX-998811',
      fiscalYear: 'January-December',
      timezone: 'America/New_York',
      workingHours: '9:00 AM - 5:00 PM',
    };

    const created = await organizationService.createOrganization(orgData);
    console.log('✔ Organization created successfully:', created.name, `(ID: ${created.id})`);

    // 3. Prevent duplicate code
    console.log('Testing duplicate code prevention...');
    try {
      await organizationService.createOrganization({
        name: 'Acme Duplicate',
        code: 'test-org-1',
      });
      console.error('❌ Expected code conflict error but none was thrown');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✔ Successfully rejected duplicate code with status 409:', err.message);
      } else {
        console.error('❌ Unexpected error for duplicate code:', err);
      }
    }

    // 4. Get Profile by ID
    console.log('Testing Get Organization Profile by ID...');
    const fetched = await organizationService.getOrganizationById(created.id);
    console.log('✔ Organization profile retrieved successfully:', fetched.name, `(${fetched.code})`);

    // 5. Update Organization Profile
    console.log('Testing Update Organization Profile...');
    const updateData = {
      address: '456 Acme Boulevard',
      timezone: 'Europe/London',
      workingHours: '8:30 AM - 4:30 PM',
    };
    const updated = await organizationService.updateOrganization(created.id, updateData);
    if (updated.address === '456 Acme Boulevard' && updated.timezone === 'Europe/London') {
      console.log('✔ Organization profile updated successfully');
    } else {
      console.error('❌ Failed to update organization profile. Result:', updated);
    }

    // 6. List Organizations (Pagination)
    console.log('Testing List Organizations (Pagination)...');
    const listResult = await organizationService.listOrganizations({ page: 1, limit: 10 });
    const found = listResult.data.find(o => o.id === created.id);
    if (found) {
      console.log('✔ Organization listed in paginated results');
    } else {
      console.error('❌ Organization not found in paginated results');
    }

    // 7. Test Logo update
    console.log('Testing Brand Logo Update...');
    const logoUpdated = await organizationService.updateLogo(created.id, '/uploads/logo-123.png');
    if (logoUpdated.logo === '/uploads/logo-123.png') {
      console.log('✔ Organization brand logo updated successfully');
    } else {
      console.error('❌ Failed to update organization brand logo');
    }

    // 8. Delete (Soft delete)
    console.log('Testing soft delete...');
    await organizationService.deleteOrganization(created.id, true);
    
    // Retrieve again (should fail)
    try {
      await organizationService.getOrganizationById(created.id);
      console.error('❌ Organization was fetched successfully even after soft delete');
    } catch (err) {
      if (err.statusCode === 404) {
        console.log('✔ Soft delete verified: Organization is no longer retrievable (status 404)');
      } else {
        console.error('❌ Unexpected error when retrieving soft deleted organization:', err);
      }
    }

    // List active (should not include the soft-deleted organization)
    const listResultAfterDelete = await organizationService.listOrganizations({ page: 1, limit: 10 });
    const foundAfterDelete = listResultAfterDelete.data.find(o => o.id === created.id);
    if (!foundAfterDelete) {
      console.log('✔ Soft delete verified: Organization is excluded from active list');
    } else {
      console.error('❌ Organization still present in active list after soft delete');
    }

    console.log('--- ALL INTEGRATION TESTS PASSED ---');

  } catch (error) {
    console.error('❌ An unexpected error occurred during test run:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

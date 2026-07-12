const prisma = require('../src/config/database');
const { assignmentService, notificationService } = require('../src/services');

async function runTests() {
  console.log('--- STARTING ASSET ASSIGNMENT VERIFICATION TESTS ---');

  try {
    // 1. Clean up database
    console.log('Cleaning up existing test data...');
    await prisma.notification.deleteMany();
    await prisma.assetAssignment.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create test users (User A & User B)
    console.log('Creating test users...');
    const userA = await prisma.user.create({
      data: {
        employeeId: 'EMP-001',
        email: 'usera@example.com',
        password: 'passwordhashed',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'VIEWER',
      },
    });
    console.log(`Created User A: ${userA.firstName} ${userA.lastName} (${userA.id})`);

    const userB = await prisma.user.create({
      data: {
        employeeId: 'EMP-002',
        email: 'userb@example.com',
        password: 'passwordhashed',
        firstName: 'Bob',
        lastName: 'Jones',
        role: 'VIEWER',
      },
    });
    console.log(`Created User B: ${userB.firstName} ${userB.lastName} (${userB.id})`);

    // 3. Create test Asset
    console.log('Creating test asset...');
    // We need a createdBy user since Asset requires createdById
    const creatorUser = await prisma.user.create({
      data: {
        employeeId: 'EMP-000',
        email: 'admin@example.com',
        password: 'passwordhashed',
        firstName: 'System',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });

    const asset = await prisma.asset.create({
      data: {
        assetTag: 'AST-TEST-99',
        name: 'MacBook Pro 16',
        category: 'HARDWARE',
        status: 'AVAILABLE',
        createdById: creatorUser.id,
        updatedById: creatorUser.id,
      },
    });
    console.log(`Created Asset: ${asset.name} (${asset.id})`);

    // 4. Assign Asset to User A (Pending status)
    console.log('\nTesting Asset Assignment to User A...');
    const assignment1 = await assignmentService.assignAsset({
      assetId: asset.id,
      userId: userA.id,
      notes: 'Please return in original condition',
    });

    console.log('✔ Assignment created in state:', assignment1.acceptanceStatus);
    
    // Check asset status
    const assetAfterAssign = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('✔ Asset status updated to:', assetAfterAssign.status);
    if (assetAfterAssign.status !== 'ASSIGNED') {
      console.error('❌ Error: Asset status should be ASSIGNED');
    }

    // Check notifications for User A
    const notifsUserA = await notificationService.getNotifications({ userId: userA.id });
    console.log('✔ User A received notification:', notifsUserA.data[0].title, '-', notifsUserA.data[0].message);

    // 5. Test Double Assignment Prevention
    console.log('\nTesting Double Assignment Prevention...');
    try {
      await assignmentService.assignAsset({
        assetId: asset.id,
        userId: userB.id,
      });
      console.error('❌ Error: Allowed assigning already assigned asset!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log('✔ Double assignment successfully rejected with 409 conflict:', err.message);
      } else {
        console.error('❌ Unexpected error during double assignment test:', err);
      }
    }

    // 6. Accept Assignment by User A (Provide signature)
    console.log('\nTesting User A accepting assignment...');
    const accepted1 = await assignmentService.acceptAssignment(
      assignment1.id,
      userA.id,
      'Alice_Smith_Digital_Signature'
    );
    console.log('✔ Assignment accepted. New Status:', accepted1.acceptanceStatus);
    console.log('✔ Signature saved:', accepted1.signature);
    
    const assetAfterAccept = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('✔ Asset assignedToId updated to User A:', assetAfterAccept.assignedToId === userA.id ? 'YES' : 'NO');

    // 7. Transfer Asset from User A to User B
    console.log('\nTesting Transfer of Asset from User A to User B...');
    const transferAssignment = await assignmentService.transferAsset({
      assetId: asset.id,
      fromUserId: userA.id,
      toUserId: userB.id,
      notes: 'Transferring MacBook to Bob for project coding.',
    });

    console.log('✔ New transfer assignment created. New user:', transferAssignment.userId);
    console.log('✔ New assignment acceptanceStatus:', transferAssignment.acceptanceStatus);

    // Verify User A's assignment is closed
    const userAAssignmentClosed = await prisma.assetAssignment.findUnique({ where: { id: assignment1.id } });
    console.log('✔ User A assignment closed (returnedAt set):', userAAssignmentClosed.returnedAt !== null ? 'YES' : 'NO');
    console.log('✔ User A closed assignment notes contain transfer log:', userAAssignmentClosed.notes.includes('Transferred to Bob Jones'));

    // Verify Asset assignedToId is cleared until User B accepts
    const assetAfterTransfer = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('✔ Asset assignedToId cleared (null) during pending transfer:', assetAfterTransfer.assignedToId === null ? 'YES' : 'NO');

    // Check notifications for User B
    const notifsUserB = await notificationService.getNotifications({ userId: userB.id });
    console.log('✔ User B received pending transfer notification:', notifsUserB.data[0].title);

    // 8. User B Accepts Transfer
    console.log('\nTesting User B accepting transfer...');
    const acceptedTransfer = await assignmentService.acceptAssignment(
      transferAssignment.id,
      userB.id,
      'Bob_Jones_Digital_Signature'
    );
    console.log('✔ Transfer assignment accepted. New Status:', acceptedTransfer.acceptanceStatus);

    // Verify Asset assignedToId is now User B
    const assetAfterBobAccepts = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('✔ Asset assignedToId updated to User B:', assetAfterBobAccepts.assignedToId === userB.id ? 'YES' : 'NO');

    // 9. Return Asset by User B
    console.log('\nTesting Return of Asset by User B...');
    const returnedRecord = await assignmentService.returnAsset(transferAssignment.id, {
      notes: 'Returned with minor scratches on bottom, otherwise perfect.',
    });
    console.log('✔ Asset marked as returned. returnedAt set:', returnedRecord.returnedAt !== null ? 'YES' : 'NO');

    // Verify Asset status is back to AVAILABLE and assignedToId is cleared
    const assetAfterReturn = await prisma.asset.findUnique({ where: { id: asset.id } });
    console.log('✔ Asset status reset to:', assetAfterReturn.status);
    console.log('✔ Asset assignedToId is null:', assetAfterReturn.assignedToId === null ? 'YES' : 'NO');

    // 10. Check Assignment History
    console.log('\nTesting Retrieval of Assignment History...');
    const history = await assignmentService.getHistory({ assetId: asset.id });
    console.log('✔ Total history entries for asset:', history.meta.total);
    history.data.forEach((h, idx) => {
      console.log(`  [Entry ${idx + 1}] User: ${h.user.firstName} ${h.user.lastName} | Status: ${h.acceptanceStatus} | Returned: ${h.returnedAt ? 'YES' : 'NO'}`);
    });

    console.log('\n--- ALL ASSET ASSIGNMENT INTEGRATION TESTS PASSED ---');

  } catch (error) {
    console.error('❌ Error occurred during test execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

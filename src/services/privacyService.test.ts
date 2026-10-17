import { describe, it, expect } from 'vitest';
import { privacyService } from './privacyService';

describe('Privacy Service & GDPR Data Management', () => {
  const userId = 'user_demo_student_01';
  const email = 'student@college.edu';
  const displayName = 'Alex Rivera (CS 4th Yr)';

  it('exports user data archive with correct schema and metadata', async () => {
    const bundle = await privacyService.exportUserData(userId, email, displayName);

    expect(bundle.exportMetadata).toBeDefined();
    expect(bundle.exportMetadata.userId).toBe(userId);
    expect(bundle.exportMetadata.schemaVersion).toBe('notice_decoder_phase3_v1');
    expect(bundle.profile.email).toBe(email);
    expect(Array.isArray(bundle.timetableEntries)).toBe(true);
    expect(Array.isArray(bundle.personalNotices)).toBe(true);
    expect(Array.isArray(bundle.acknowledgementRecords)).toBe(true);
  });

  it('performs cascading account cleanup and reports retained academic audit records honestly', async () => {
    const result = await privacyService.purgeAccountData('user_purge_test', 'Purge User');

    expect(result.success).toBe(true);
    expect(result.retainedRecordsExplanation).toContain('academic compliance');
    expect(result.timestamp).toBeDefined();
  });
});

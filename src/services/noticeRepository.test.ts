import { describe, it, expect, beforeEach } from 'vitest';
import { noticeRepository } from './noticeRepository';
import { SAMPLE_NOTICES } from '../data/sampleNotices';

describe('Notice Repository Layer', () => {
  beforeEach(async () => {
    await noticeRepository.resetToSamples();
  });

  it('initializes and returns all sample notices', async () => {
    const list = await noticeRepository.getAll();
    expect(list.length).toBeGreaterThanOrEqual(SAMPLE_NOTICES.length);
  });

  it('retrieves notice by specific id', async () => {
    const notice = await noticeRepository.getById('sample_midterm_exam_2026');
    expect(notice).not.toBeNull();
    expect(notice?.noticeType).toBe('exam');
  });

  it('saves and updates notice record', async () => {
    const original = await noticeRepository.getById('sample_midterm_exam_2026');
    expect(original).not.toBeNull();

    if (original) {
      const updated = {
        ...original,
        noticeTitle: 'Modified Mid-Term Examination Schedule 2026',
        status: 'confirmed' as const,
      };

      await noticeRepository.save(updated);

      const fetched = await noticeRepository.getById('sample_midterm_exam_2026');
      expect(fetched?.noticeTitle).toBe('Modified Mid-Term Examination Schedule 2026');
      expect(fetched?.status).toBe('confirmed');
    }
  });

  it('deletes a notice record', async () => {
    const initialList = await noticeRepository.getAll();
    const targetId = initialList[0].id;

    const success = await noticeRepository.delete(targetId);
    expect(success).toBe(true);

    const check = await noticeRepository.getById(targetId);
    expect(check).toBeNull();
  });

  it('resets repository to sample notices', async () => {
    await noticeRepository.clearAll();
    const emptyList = await noticeRepository.getAll();
    expect(emptyList).toHaveLength(0);

    const restored = await noticeRepository.resetToSamples();
    expect(restored.length).toBeGreaterThanOrEqual(SAMPLE_NOTICES.length);
  });
});

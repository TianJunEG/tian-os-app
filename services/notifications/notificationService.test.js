import { afterEach, describe, expect, it, vi } from 'vitest';

const notificationCreate = vi.fn();

vi.mock('../../models/Notification.js', () => ({
  default: {
    create: (...args) => notificationCreate(...args),
  },
}));

const { notify } = await import('./notificationService.js');

describe('notificationService.notify', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates exactly one in-app notification with defaults', async () => {
    notificationCreate.mockResolvedValueOnce({ _id: 'n1' });

    const result = await notify({
      recipientUserId: 'parent_1',
      type: 'lesson_summary',
      title: 'New lesson update',
    });

    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'parent_1',
        type: 'lesson_summary',
        title: 'New lesson update',
        body: '',
        channels: ['in_app'],
      })
    );
    expect(result._id).toBe('n1');
  });

  it('passes through linkPath, source and channels', async () => {
    notificationCreate.mockResolvedValueOnce({ _id: 'n2' });

    await notify({
      recipientUserId: 'parent_1',
      type: 'recording_ready',
      title: 'Recording ready',
      linkPath: '/parent/recordings/rec_1',
      sourceType: 'LessonRecording',
      sourceId: 'rec_1',
      channels: ['in_app', 'whatsapp'],
    });

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        linkPath: '/parent/recordings/rec_1',
        sourceType: 'LessonRecording',
        sourceId: 'rec_1',
        channels: ['in_app', 'whatsapp'],
      })
    );
  });

  it('throws when required fields are missing and does not create', async () => {
    await expect(notify({ recipientUserId: 'parent_1', type: 'generic' })).rejects.toThrow();
    expect(notificationCreate).not.toHaveBeenCalled();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

const notificationCreate = vi.fn();
const userFindById = vi.fn();
const resolveEntitlements = vi.fn();
const sendWhatsApp = vi.fn();

vi.mock('../../models/Notification.js', () => ({
  default: { create: (...args) => notificationCreate(...args) },
}));
vi.mock('../../models/User.js', () => ({
  default: { findById: (...args) => userFindById(...args) },
}));
vi.mock('../billing/entitlements.js', () => ({
  resolveEntitlements: (...args) => resolveEntitlements(...args),
  PRODUCT_TIERS: { TRIAL: 'trial', PREMIUM_HOME: 'premium_home', SCHOOL: 'school' },
}));
vi.mock('./whatsappSender.js', () => ({
  sendWhatsApp: (...args) => sendWhatsApp(...args),
}));

const { notify } = await import('./notificationService.js');

describe('notificationService.notify', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('creates an in-app + email notification (no WhatsApp on trial tier)', async () => {
    resolveEntitlements.mockResolvedValueOnce({ tier: 'trial' });
    notificationCreate.mockResolvedValueOnce({ _id: 'n1' });

    await notify({ recipientUserId: 'parent_1', type: 'lesson_summary', title: 'New lesson update' });

    expect(notificationCreate).toHaveBeenCalledTimes(1);
    const arg = notificationCreate.mock.calls[0][0];
    expect(arg.channels).toEqual(expect.arrayContaining(['in_app', 'email']));
    expect(arg.channels).not.toContain('whatsapp');
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  it('pushes WhatsApp for a premium-home recipient with a phone', async () => {
    resolveEntitlements.mockResolvedValueOnce({ tier: 'premium_home' });
    userFindById.mockReturnValueOnce({ select: () => Promise.resolve({ phone: '+6591234567' }) });
    notificationCreate.mockResolvedValueOnce({ _id: 'n2' });

    await notify({ recipientUserId: 'parent_1', type: 'recording_ready', title: 'Recording ready', body: 'Replay it' });

    const arg = notificationCreate.mock.calls[0][0];
    expect(arg.channels).toContain('whatsapp');
    expect(sendWhatsApp).toHaveBeenCalledWith({ to: '+6591234567', title: 'Recording ready', body: 'Replay it' });
  });

  it('does not block when entitlement lookup throws', async () => {
    resolveEntitlements.mockRejectedValueOnce(new Error('billing down'));
    notificationCreate.mockResolvedValueOnce({ _id: 'n3' });

    const result = await notify({ recipientUserId: 'parent_1', type: 'generic', title: 'Hi' });

    expect(result._id).toBe('n3');
    const arg = notificationCreate.mock.calls[0][0];
    expect(arg.channels).toEqual(expect.arrayContaining(['in_app', 'email']));
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  it('throws when required fields are missing and does not create', async () => {
    await expect(notify({ recipientUserId: 'parent_1', type: 'generic' })).rejects.toThrow();
    expect(notificationCreate).not.toHaveBeenCalled();
  });
});

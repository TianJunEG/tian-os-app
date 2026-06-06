import { describe, expect, it } from 'vitest';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import PartnerMembership from '../models/PartnerMembership.js';
import PartnerStudent from '../models/PartnerStudent.js';

describe('Partner organisation models', () => {
  it('validates partner organisation type and status', () => {
    const partner = new PartnerOrganisation({
      name: 'North Star Student Care',
      type: 'student_care',
      status: 'pilot',
    });
    expect(partner.validateSync()).toBeUndefined();

    const invalid = new PartnerOrganisation({ name: 'Bad Partner', type: 'course_vendor' });
    expect(invalid.validateSync().errors.type).toBeTruthy();
  });

  it('validates staff membership roles', () => {
    const membership = new PartnerMembership({
      organisationId: '665000000000000000000001',
      userId: '665000000000000000000002',
      role: 'manager',
    });
    expect(membership.validateSync()).toBeUndefined();

    const invalid = new PartnerMembership({
      organisationId: '665000000000000000000001',
      userId: '665000000000000000000002',
      role: 'sales_rep',
    });
    expect(invalid.validateSync().errors.role).toBeTruthy();
  });

  it('validates partner student relationship types', () => {
    const link = new PartnerStudent({
      organisationId: '665000000000000000000001',
      studentId: '665000000000000000000003',
      relationshipType: 'pilot',
    });
    expect(link.validateSync()).toBeUndefined();

    const invalid = new PartnerStudent({
      organisationId: '665000000000000000000001',
      studentId: '665000000000000000000003',
      relationshipType: 'newsletter',
    });
    expect(invalid.validateSync().errors.relationshipType).toBeTruthy();
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDb, saveDb, type PortalDatabase } from '../server/data/store.ts';
import { websiteService } from '../server/modules/website/website.service.ts';
import { WEBSITE_STAFF_CATEGORIES } from '../server/modules/website/website.types.ts';
import {
  ROLE_TO_STAFF_PERMISSIONS,
  STAFF_PERMISSIONS,
} from '../server/modules/staff/staff.permissions.ts';
import { STAFF_ACCOUNTS } from '../src/config/staff-navigation.ts';
import WebsiteHeader from '../src/website/components/WebsiteHeader.tsx';
import WebsiteFooter from '../src/website/components/WebsiteFooter.tsx';

const TEST_ACTOR = {
  id: 'usr-admin-001',
  fullName: 'grace.nyambura',
  role: 'ADMIN' as const,
};

let dbSnapshot: PortalDatabase | null = null;

test.before(() => {
  dbSnapshot = structuredClone(getDb());
});

test.after(() => {
  if (dbSnapshot) {
    saveDb(dbSnapshot);
  }
});

test('Public staff directory returns only PUBLISHED & visible profiles and strips confidential HR fields', () => {
  const all = websiteService.listPublicStaff({ page: 1, pageSize: 50 });
  assert.ok(all.total >= 15, 'Should return seeded published staff');

  for (const item of all.items) {
    const raw = item as unknown as Record<string, unknown>;
    assert.equal('privatePhone' in raw, false);
    assert.equal('personalAddress' in raw, false);
    assert.equal('employmentContractType' in raw, false);
    assert.equal('salaryBandConfidential' in raw, false);
  }

  assert.equal(WEBSITE_STAFF_CATEGORIES.length, 15);
  assert.equal(websiteService.getPublicStaffBySlug('mr-kevin-rotich-draft'), null);
  assert.equal(websiteService.getPublicStaffBySlug('ms-brenda-atieno-ai'), null);

  const principal = websiteService.getPublicStaffBySlug('dr-bernard-k-maina');
  assert.ok(principal, 'Published Principal profile should resolve publicly');
  const principalRaw = principal as unknown as Record<string, unknown>;
  assert.equal('privatePhone' in principalRaw, false);
  assert.equal('salaryBandConfidential' in principalRaw, false);
});

test('Public departments endpoint exposes only PUBLISHED departments with HOD & programmes', () => {
  const depts = websiteService.listPublicDepartments({ page: 1, pageSize: 24 });
  assert.ok(depts.total >= 8, 'Should return 8 published departments');
  assert.equal(websiteService.getPublicDepartmentBySlug('health-records-digital-health'), null);

  const ict = websiteService.getPublicDepartmentBySlug('ict-computer-science');
  assert.ok(ict, 'Published ICT department should resolve publicly');
  assert.ok(ict.hod, 'ICT department should expose linked HOD');
  assert.ok(ict.programmes.length >= 2, 'ICT department should include accredited programmes');
  assert.ok(ict.staffMembers.length >= 2, 'ICT department should list assigned published staff');
});

test('CMS staff and department workflow transitions synchronize cleanly with public visibility', () => {
  const suffix = Date.now();
  const created = websiteService.createStaffProfile(TEST_ACTOR, {
    fullName: `=Test Lecturer ${suffix}`,
    officialTitle: 'Lecturer, Cloud Infrastructure',
    category: 'Lecturers and trainers',
    biography: 'Teaches cloud deployment and network operations.',
    publicEmail: `cloud.${suffix}@hitech.ac.ke`,
    showOnPublicWebsite: true,
  });

  assert.equal(created.status, 'DRAFT');
  assert.equal(websiteService.getPublicStaffBySlug(created.slug), null);

  const submitted = websiteService.transitionStaffStatus(TEST_ACTOR, created.id, 'SUBMIT');
  assert.equal(submitted.status, 'PENDING_APPROVAL');
  assert.equal(websiteService.getPublicStaffBySlug(created.slug), null);

  const approved = websiteService.transitionStaffStatus(TEST_ACTOR, created.id, 'APPROVE');
  assert.equal(approved.status, 'PUBLISHED');
  assert.ok(
    websiteService.getPublicStaffBySlug(created.slug),
    'Approved profile should be publicly visible'
  );

  // CSV export must neutralize spreadsheet formula injection
  const csv = websiteService.exportPublicDirectoryCsv(TEST_ACTOR);
  assert.ok(csv.includes(`"'=Test Lecturer ${suffix}"`));

  const archived = websiteService.transitionStaffStatus(TEST_ACTOR, created.id, 'ARCHIVE');
  assert.equal(archived.status, 'ARCHIVED');
  assert.equal(websiteService.getPublicStaffBySlug(created.slug), null);
});

test('Department HOD assignment enforces single HOD rule and supports multi-staff roster', () => {
  const suffix = Date.now();
  const dept = websiteService.createDepartment(TEST_ACTOR, {
    code: `TEST-${suffix}`,
    name: `School of Robotics ${suffix}`,
    shortDescription: 'Applied robotics and mechatronics training.',
    overview: 'Applied robotics and mechatronics training centre.',
    showOnPublicWebsite: true,
  });
  websiteService.transitionDepartmentStatus(TEST_ACTOR, dept.id, 'PUBLISH');
  assert.ok(websiteService.getPublicDepartmentBySlug(dept.slug));

  const publicStaff = websiteService.listPublicStaff({ page: 1, pageSize: 5 }).items;
  assert.ok(publicStaff.length >= 2);

  assert.throws(() => {
    websiteService.assignStaffToDepartment(TEST_ACTOR, dept.id, [
      { staffProfileId: publicStaff[0].id, isHod: true, roleInDepartment: 'HOD' },
      { staffProfileId: publicStaff[1].id, isHod: true, roleInDepartment: 'HOD 2' },
    ]);
  }, /only one Head of Department/i);

  const assigned = websiteService.assignStaffToDepartment(TEST_ACTOR, dept.id, [
    {
      staffProfileId: publicStaff[0].id,
      isHod: true,
      roleInDepartment: 'Head of Department',
      isPrimaryDepartment: true,
    },
    {
      staffProfileId: publicStaff[1].id,
      isHod: false,
      roleInDepartment: 'Visiting Trainer',
    },
  ]);

  assert.equal(assigned.department.hodStaffProfileId, publicStaff[0].id);
  const publicView = websiteService.getPublicDepartmentBySlug(dept.slug);
  assert.equal(publicView?.hod?.id, publicStaff[0].id);
  assert.equal(publicView?.staffMembers.length, 2);

  const dept2 = websiteService.createDepartment(TEST_ACTOR, {
    code: `TEST2-${suffix}`,
    name: `School of Marine ${suffix}`,
    shortDescription: 'Marine studies.',
    overview: 'Marine engineering studies.',
  });
  const approvedDept2 = websiteService.transitionDepartmentStatus(TEST_ACTOR, dept2.id, 'APPROVE');
  assert.equal(approvedDept2.status, 'PUBLISHED');
});

test('Role permissions and public header & footer navigation stay aligned and free of anti-patterns', () => {
  assert.ok(ROLE_TO_STAFF_PERMISSIONS.ADMIN.includes(STAFF_PERMISSIONS.WEBSITE_CONTENT_APPROVE));
  assert.ok(STAFF_ACCOUNTS.ADMIN.permissions.includes('website.content.approve'));
  assert.ok(STAFF_ACCOUNTS.COMMUNICATIONS_OFFICER.permissions.includes('website.staff.publish'));
  assert.equal(STAFF_ACCOUNTS.SECURITY_OFFICER.permissions.includes('website.content.view'), false);

  const headerHtml = renderToStaticMarkup(
    React.createElement(WebsiteHeader, {
      currentPage: 'departments',
      onNavigate: () => {},
      onOpenPortalModal: () => {},
      onSwitchToERP: () => {},
    })
  );

  for (const label of [
    'Home',
    'About Us',
    'Departments &amp; Staff',
    'Academic Departments',
    'Our Staff',
    'Academics',
    'Admissions',
    'Campus',
    'Student Life',
    'News &amp; Events',
    'Contact Us',
    'Apply Now',
  ]) {
    assert.ok(headerHtml.includes(label), `Header must include ${label}`);
  }
  assert.equal(headerHtml.includes('animate-pulse'), false);
  assert.equal(/\sstyle="/i.test(headerHtml), false);

  const footerHtml = renderToStaticMarkup(
    React.createElement(WebsiteFooter, {
      onNavigate: () => {},
      onOpenPortalModal: () => {},
      onSwitchToERP: () => {},
    })
  );

  for (const expected of [
    'Quick Links',
    'Our Services',
    'Contact Us',
    'Subscribe to Our Newsletter',
    'Student Portal Login',
    'TVETA',
    'KNEC',
    'CDACC / KASNEB',
  ]) {
    assert.ok(footerHtml.includes(expected), `Footer must include ${expected}`);
  }
  assert.equal(footerHtml.includes('ISO'), false, 'Footer must not display unverified ISO badge');
  assert.equal(footerHtml.includes('animate-pulse'), false);
  assert.equal(/\sstyle="/i.test(footerHtml), false);
});

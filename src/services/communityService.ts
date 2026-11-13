import {
  AlumniProfile,
  ClubMembership,
  CommunityEvent,
  ElectionBallot,
  ElectionCandidate,
  ElectionDispute,
  ElectionParticipation,
  ElectionVote,
  StudentClub,
  StudentElection,
  VolunteerProject,
} from '../types/community';

const STORAGE_KEY = 'hitech_elections_community_v1';

interface CommunityState {
  elections: StudentElection[];
  candidates: ElectionCandidate[];
  participations: ElectionParticipation[];
  ballots: ElectionBallot[];
  votes: ElectionVote[];
  disputes: ElectionDispute[];
  clubs: StudentClub[];
  memberships: ClubMembership[];
  events: CommunityEvent[];
  projects: VolunteerProject[];
  alumni: AlumniProfile[];
}

function randomBallotToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const INITIAL_STATE: CommunityState = {
  elections: [
    {
      id: 'elc-2026-src',
      title: 'HI-TECH Students Representative Council (SRC) General Election 2026',
      branch: 'Nairobi Main Campus',
      description: 'Annual secret-ballot student union leadership election across computing and business schools.',
      nominationStart: '2026-10-15',
      nominationEnd: '2026-10-25',
      votingStart: '2026-11-01',
      votingEnd: '2026-11-20',
      stage: 'VOTING_OPEN',
      eligibleVotersSnapshot: ['HCA/STU/2026/001', 'HCA/STU/2026/014', 'HCA/STU/2026/022', 'HCA/STU/2026/031'],
      positions: [
        { id: 'pos-pres', title: 'SRC President', seats: 1 },
        { id: 'pos-tech', title: 'Academic & Innovation Secretary', seats: 1 },
      ],
    },
  ],
  candidates: [
    {
      id: 'cand-1',
      electionId: 'elc-2026-src',
      positionId: 'pos-pres',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Faith Chebet Korir',
      manifesto: 'Expanded 24-hour weekend robotics & cybersecurity lab access plus transparent club grants.',
      status: 'APPROVED',
    },
    {
      id: 'cand-2',
      electionId: 'elc-2026-src',
      positionId: 'pos-pres',
      studentRegNo: 'HCA/STU/2026/022',
      studentName: 'Samuel Mwangi Njoroge',
      manifesto: 'Industry mentorship sprints, inter-campus hackathons, and streamlined welfare desks.',
      status: 'APPROVED',
    },
    {
      id: 'cand-3',
      electionId: 'elc-2026-src',
      positionId: 'pos-tech',
      studentRegNo: 'HCA/STU/2026/031',
      studentName: 'Mercy Wanjala',
      manifesto: 'Open GitHub campus workshops and peer CDACC practical clinics.',
      status: 'APPROVED',
    },
  ],
  participations: [
    { electionId: 'elc-2026-src', voterStudentRegNo: 'HCA/STU/2026/001', hasVoted: false },
    { electionId: 'elc-2026-src', voterStudentRegNo: 'HCA/STU/2026/014', hasVoted: true },
    { electionId: 'elc-2026-src', voterStudentRegNo: 'HCA/STU/2026/022', hasVoted: true },
    { electionId: 'elc-2026-src', voterStudentRegNo: 'HCA/STU/2026/031', hasVoted: false },
  ],
  ballots: [
    { ballotId: 'anon-9a8f102c3d4e', electionId: 'elc-2026-src' },
    { ballotId: 'anon-7b6e221a9f0c', electionId: 'elc-2026-src' },
  ],
  votes: [
    { id: 'v1', ballotId: 'anon-9a8f102c3d4e', electionId: 'elc-2026-src', positionId: 'pos-pres', candidateId: 'cand-1' },
    { id: 'v2', ballotId: 'anon-9a8f102c3d4e', electionId: 'elc-2026-src', positionId: 'pos-tech', candidateId: 'cand-3' },
    { id: 'v3', ballotId: 'anon-7b6e221a9f0c', electionId: 'elc-2026-src', positionId: 'pos-pres', candidateId: 'cand-2' },
    { id: 'v4', ballotId: 'anon-7b6e221a9f0c', electionId: 'elc-2026-src', positionId: 'pos-tech', candidateId: 'cand-3' },
  ],
  disputes: [],
  clubs: [
    {
      id: 'clb-ai',
      code: 'CLB-AI-NRB',
      name: 'HI-TECH AI, Robotics & Cloud Society',
      branch: 'Nairobi Main Campus',
      category: 'Technology & Research',
      description: 'Weekly Python, PyTorch, and Raspberry Pi hardware sprints.',
      active: true,
    },
    {
      id: 'clb-biz',
      code: 'CLB-ENACT-NRB',
      name: 'Entrepreneurs & KASNEB Finance Circle',
      branch: 'Nairobi Main Campus',
      category: 'Business & Leadership',
      description: 'Case competitions, SME financial modelling, and career clinics.',
      active: true,
    },
  ],
  memberships: [
    {
      id: 'mbr-1',
      clubId: 'clb-ai',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      status: 'APPROVED',
    },
  ],
  events: [
    {
      id: 'evt-hack',
      title: 'Annual East Africa TVET AI Hackathon',
      branch: 'Westlands Technology Park Campus',
      category: 'Innovation Challenge',
      location: 'Westlands AI Hub Auditorium',
      startDateTime: '2026-11-28 09:00 EAT',
      capacity: 40,
      status: 'PUBLISHED',
      registrations: [
        { studentRegNo: 'HCA/STU/2026/014', studentName: 'Faith Chebet Korir', status: 'REGISTERED' },
      ],
    },
  ],
  projects: [
    {
      id: 'prj-digital',
      title: 'County Primary Schools Digital Literacy Outreach',
      branch: 'Nairobi Main Campus',
      schedule: 'Saturdays 09:00–13:00 EAT',
      description: 'Trainers and DICT students teaching foundational computing and cyber safety.',
      status: 'OPEN',
      volunteers: [],
    },
  ],
  alumni: [
    {
      id: 'alm-1',
      studentRegNo: 'HCA/ALU/2024/089',
      fullName: 'Kevin Kiprop Tanui',
      graduationYear: 2024,
      programme: 'Diploma in ICT (DICT Level 6)',
      currentRole: 'Cloud Infrastructure Engineer',
      employer: 'Safaricom PLC',
      publicConsent: true,
      staffApproved: true,
    },
    {
      id: 'alm-2',
      studentRegNo: 'HCA/ALU/2025/041',
      fullName: 'Sharon Muthoni',
      graduationYear: 2025,
      programme: 'Diploma in Business Management',
      currentRole: 'Financial Operations Associate',
      employer: 'KCB Bank Group',
      publicConsent: false,
      staffApproved: true,
    },
  ],
};

function loadState(): CommunityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as CommunityState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: CommunityState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const communityService = {
  getState(): CommunityState {
    return loadState();
  },

  advanceElectionStage(electionId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const el = state.elections.find((e) => e.id === electionId);
    if (!el) return { ok: false, error: 'Election not found.' };

    if (el.stage === 'DRAFT') {
      el.stage = 'NOMINATIONS_OPEN';
    } else if (el.stage === 'NOMINATIONS_OPEN') {
      const pending = state.candidates.some(
        (c) => c.electionId === electionId && c.status === 'PENDING'
      );
      if (pending) {
        return {
          ok: false,
          error: 'Resolve all PENDING candidate nominations before closing nominations.',
        };
      }
      el.stage = 'NOMINATIONS_CLOSED';
    } else if (el.stage === 'NOMINATIONS_CLOSED') {
      el.stage = 'VOTING_OPEN';
    } else if (el.stage === 'VOTING_OPEN') {
      el.stage = 'VOTING_CLOSED';
    } else if (el.stage === 'VOTING_CLOSED') {
      el.stage = 'RESULTS_PUBLISHED';
    } else {
      return { ok: false, error: 'Results are already published.' };
    }

    saveState(state);
    return { ok: true };
  },

  submitNomination(input: {
    electionId: string;
    positionId: string;
    studentRegNo: string;
    studentName: string;
    manifesto: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const el = state.elections.find((e) => e.id === input.electionId);
    if (!el || el.stage !== 'NOMINATIONS_OPEN') {
      return { ok: false, error: 'Nominations are currently closed for this election.' };
    }
    if (
      state.candidates.some(
        (c) => c.electionId === input.electionId && c.studentRegNo === input.studentRegNo
      )
    ) {
      return { ok: false, error: 'Student already nominated in this election.' };
    }
    state.candidates.push({
      id: `cand-${Date.now()}`,
      electionId: input.electionId,
      positionId: input.positionId,
      studentRegNo: input.studentRegNo,
      studentName: input.studentName,
      manifesto: input.manifesto.trim(),
      status: 'PENDING',
    });
    saveState(state);
    return { ok: true };
  },

  reviewCandidate(candidateId: string, status: 'APPROVED' | 'REJECTED'): { ok: boolean } {
    const state = loadState();
    const cand = state.candidates.find((c) => c.id === candidateId);
    if (!cand) return { ok: false };
    cand.status = status;
    saveState(state);
    return { ok: true };
  },

  /** Secret Ballot Submission: Marks participation boolean with zero timestamp/ballot FK, writes anonymous ballot + votes */
  castSecretBallot(
    electionId: string,
    voterStudentRegNo: string,
    selections: Record<string, string>
  ): { ok: boolean; error?: string; anonymousReceiptHash?: string } {
    const state = loadState();
    const el = state.elections.find((e) => e.id === electionId);
    if (!el || el.stage !== 'VOTING_OPEN') {
      return { ok: false, error: 'Voting is not currently open.' };
    }
    const participation = state.participations.find(
      (p) => p.electionId === electionId && p.voterStudentRegNo === voterStudentRegNo
    );
    if (!participation) {
      return { ok: false, error: 'Student is not on the snapshotted voter roll.' };
    }
    if (participation.hasVoted) {
      return { ok: false, error: 'Duplicate vote rejected: Student has already cast a ballot.' };
    }

    // Validate all positions selected
    for (const pos of el.positions) {
      const candId = selections[pos.id];
      const valid = state.candidates.some(
        (c) =>
          c.id === candId &&
          c.electionId === electionId &&
          c.positionId === pos.id &&
          c.status === 'APPROVED'
      );
      if (!valid) {
        return { ok: false, error: `Select an approved candidate for ${pos.title}.` };
      }
    }

    // 1. Mark participation boolean ONLY (no ballotId, no timestamp)
    participation.hasVoted = true;

    // 2. Insert anonymous ballot with cryptographically random ID & zero voter reference
    const ballotId = `anon-${randomBallotToken()}`;
    state.ballots.push({ ballotId, electionId });

    // 3. Record anonymous vote selections linked solely to ballotId
    for (const pos of el.positions) {
      state.votes.push({
        id: `v-${Date.now()}-${pos.id}`,
        ballotId,
        electionId,
        positionId: pos.id,
        candidateId: selections[pos.id],
      });
    }

    saveState(state);
    return { ok: true, anonymousReceiptHash: ballotId };
  },

  submitDispute(electionId: string, studentRegNo: string, subject: string, details: string): { ok: boolean } {
    const state = loadState();
    state.disputes.unshift({
      id: `dsp-${Date.now()}`,
      electionId,
      submittedByRegNo: studentRegNo,
      subject: subject.trim(),
      details: details.trim(),
      status: 'OPEN',
    });
    saveState(state);
    return { ok: true };
  },

  resolveDispute(disputeId: string, resolutionNote: string): { ok: boolean } {
    const state = loadState();
    const dsp = state.disputes.find((d) => d.id === disputeId);
    if (!dsp) return { ok: false };
    dsp.status = 'RESOLVED';
    dsp.resolutionNote = resolutionNote.trim();
    saveState(state);
    return { ok: true };
  },

  requestClubJoin(clubId: string, studentRegNo: string, studentName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const club = state.clubs.find((c) => c.id === clubId);
    if (!club || !club.active) return { ok: false, error: 'Club is inactive.' };
    if (
      state.memberships.some((m) => m.clubId === clubId && m.studentRegNo === studentRegNo)
    ) {
      return { ok: false, error: 'Membership request or active membership already exists.' };
    }
    state.memberships.unshift({
      id: `mbr-${Date.now()}`,
      clubId,
      studentRegNo,
      studentName,
      status: 'PENDING',
    });
    saveState(state);
    return { ok: true };
  },

  reviewMembership(membershipId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED'): { ok: boolean } {
    const state = loadState();
    const m = state.memberships.find((x) => x.id === membershipId);
    if (!m) return { ok: false };
    m.status = status;
    saveState(state);
    return { ok: true };
  },

  registerForEvent(eventId: string, studentRegNo: string, studentName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const ev = state.events.find((e) => e.id === eventId);
    if (!ev || ev.status !== 'PUBLISHED') return { ok: false, error: 'Event is not open for registration.' };
    if (ev.registrations.some((r) => r.studentRegNo === studentRegNo)) {
      return { ok: false, error: 'Already registered for this event.' };
    }
    if (ev.registrations.length >= ev.capacity) {
      return { ok: false, error: 'Event capacity is full.' };
    }
    ev.registrations.push({ studentRegNo, studentName, status: 'REGISTERED' });
    saveState(state);
    return { ok: true };
  },

  volunteerForProject(projectId: string, studentRegNo: string, studentName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const prj = state.projects.find((p) => p.id === projectId);
    if (!prj || prj.status !== 'OPEN') return { ok: false, error: 'Project is not accepting volunteers.' };
    if (prj.volunteers.some((v) => v.studentRegNo === studentRegNo)) {
      return { ok: false, error: 'Already applied to volunteer.' };
    }
    prj.volunteers.push({ studentRegNo, studentName, status: 'APPLIED' });
    saveState(state);
    return { ok: true };
  },

  updateAlumniConsent(alumniId: string, publicConsent: boolean): { ok: boolean } {
    const state = loadState();
    const alm = state.alumni.find((a) => a.id === alumniId);
    if (!alm) return { ok: false };
    alm.publicConsent = publicConsent;
    saveState(state);
    return { ok: true };
  },
};

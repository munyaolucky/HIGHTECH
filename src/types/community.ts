/**
 * Student Elections (Secret Ballot), Clubs, Events, Volunteering & Alumni Types
 * Compliant with ELECTIONS-COMMUNITY.md
 */

export type CommunityOperatorRole = 'ELECTION_COMMUNITY_MANAGER' | 'STUDENT_VOTER' | 'ALUMNI_GRADUATE';

export type ElectionStage =
  | 'DRAFT'
  | 'NOMINATIONS_OPEN'
  | 'NOMINATIONS_CLOSED'
  | 'VOTING_OPEN'
  | 'VOTING_CLOSED'
  | 'RESULTS_PUBLISHED';

export interface ElectionPosition {
  id: string;
  title: string;
  seats: 1;
}

export interface ElectionCandidate {
  id: string;
  electionId: string;
  positionId: string;
  studentRegNo: string;
  studentName: string;
  manifesto: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/** Strict Secret-Ballot Participation Table: No ballot foreign key & NO timestamp */
export interface ElectionParticipation {
  electionId: string;
  voterStudentRegNo: string;
  hasVoted: boolean;
}

/** Anonymous Ballot Table: Cryptographically random ID, ZERO voter identity link */
export interface ElectionBallot {
  ballotId: string;
  electionId: string;
}

/** Anonymous Vote Rows: Linked ONLY to random ballotId, positionId, candidateId */
export interface ElectionVote {
  id: string;
  ballotId: string;
  electionId: string;
  positionId: string;
  candidateId: string;
}

export interface ElectionDispute {
  id: string;
  electionId: string;
  submittedByRegNo: string;
  subject: string;
  details: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string;
}

export interface StudentElection {
  id: string;
  title: string;
  branch: string;
  description: string;
  nominationStart: string;
  nominationEnd: string;
  votingStart: string;
  votingEnd: string;
  stage: ElectionStage;
  eligibleVotersSnapshot: string[];
  positions: ElectionPosition[];
}

export interface StudentClub {
  id: string;
  code: string;
  name: string;
  branch: string;
  category: string;
  description: string;
  active: boolean;
}

export interface ClubMembership {
  id: string;
  clubId: string;
  studentRegNo: string;
  studentName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export interface CommunityEvent {
  id: string;
  title: string;
  branch: string;
  category: string;
  location: string;
  startDateTime: string;
  capacity: number;
  status: 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
  registrations: { studentRegNo: string; studentName: string; status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW' }[];
}

export interface VolunteerProject {
  id: string;
  title: string;
  branch: string;
  schedule: string;
  description: string;
  status: 'OPEN' | 'ACTIVE' | 'COMPLETED';
  volunteers: { studentRegNo: string; studentName: string; status: 'APPLIED' | 'ACCEPTED' | 'COMPLETED' }[];
}

export interface AlumniProfile {
  id: string;
  studentRegNo: string;
  fullName: string;
  graduationYear: number;
  programme: string;
  currentRole: string;
  employer: string;
  publicConsent: boolean;
  staffApproved: boolean;
}

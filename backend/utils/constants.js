/**
 * Application-wide constants
 */

const ENTRY_STATUS = {
  RECEIVED: 'received',
  NOT_RECEIVED: 'not_received',
  UNMARKED: 'unmarked',
};

const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

module.exports = {
  ENTRY_STATUS,
  REQUEST_STATUS,
  ROLES,
  DAYS_OF_WEEK,
};

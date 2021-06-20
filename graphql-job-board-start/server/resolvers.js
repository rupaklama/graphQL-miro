// local database
const db = require('./db');

// The purpose of resolve is that it must return a data that represents a 'data/document'
// resolve func also works by returning a PROMISE - async request
// very important func which performs the 'Search & Get the Data' into our database
// parentValue - don't get used very often
// args - This is an Object which gets call whatever arguments are passed into the original query above

// this will contain Query Resolver
// This is to resolve all the 'type Query' in our Schema file
const Query = {
  // .list() method returns array of Job from our local database
  jobs: () => db.jobs.list(),
  // 'parentValue' as root here is the Parent Data table - 'Job' of this table
  // to get right job from the database
  job: (root, args) => db.jobs.get(args.id),

  // company query to return a specific company object
  company: (root, { id }) => db.companies.get(id),
};

// THIS IS TO REFLECT THE STRUCTURE OF OUR SCHEMA TYPES

// NOTE - whenever there's a Company Object where request is a 'job' field,
// this function will be invoked
// note - A 'jobs' field is inside of 'type Company' Schema
// our 'jobs' resolver-field should also be inside of Company object.
// We don't have the Company object in the Resolver yet, so we are adding one
const Company = {
  // 'parentValue' is the Parent Data table - 'Company' on this table
  // list() method returns an array
  jobs: company => db.jobs.list().filter(job => job.companyId === company.id),
};

// NOTE - whenever there's a Job Object where request is a 'company' field,
// this function will be invoked

// SINCE COMPANY FIELD IS INSIDE OF JOB TYPE - same thing as above
// The resolver must reflect Schema so we need to declare new resolver object
// for the Job type since it has a nested query filed(foreign key) to another object - company
const Job = {
  // 'parentValue' is the Parent Data table - 'Job' of this table
  // accessing companyId field in Job Schema
  // .get method - returning a Company whose 'id' is the SAME as the Company ID of this Job instance
  company: job => db.companies.get(job.companyId),
  // NOTE - job is the Parent Data table - 'Job' pass as arg with 'parentValue'
  // to access the field - 'companyId' which is pass down as props above
};

module.exports = { Query, Job, Company };

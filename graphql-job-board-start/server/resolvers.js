// local database
const db = require('./db');

// NOTE - The resolve function works also by returning a Promise - async fashion
// making request to outside server

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
// BY DEFINING NEW OBJECT TYPES

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

// we also need to match the mutation structure Schema also
// Mutation is a function that returns the value
const Mutation = {
  // root is the parent object - parentValue

  // NOTE - CHECK IF USER IS AUTHENTICATED BEFORE POSTING A JOB
  // WE DO THIS WITH THIRD PARAM PASSED TO RESOLVED FUNC - CONTEXT
  // With Context we can access things that are not part of GraphQL itself
  // but are provided by our Application.

  // createJob: (root, { companyId, title, description }, context) => {
  createJob: (root, { input }, context) => {
    // note - context can contain whatever we want &
    // it's up to us to put something into the context in first place
    // Note - We pass 'context' property into an instance of Apollo Server in server.js as initial setup
    console.log('context:', context);

    // this will skip rest of the code here
    // return null;

    // user not authenticated
    if (!context.user) {
      // NOTE - throwing an error will cause GraphQL server to return Error Response Object
      throw new Error('Unauthorized');
    }

    // using create method which takes an Object & returns 'String' that will be the ID of new object
    // const id = db.jobs.create({ companyId, title, description });
    const id = db.jobs.create({ ...input, companyId: context.user.companyId });
    // setting companyId field from context so that we can use it in JobForm component

    // now to return 'Job' object to display in the Client
    return db.jobs.get(id);
    // by doing this, we can query any Child Schema related to 'Job' object
    // with SINGLE QUERY instead of TWO - BEST PRACTICE FOR MUTATION
  },
};

// This will be pass down into Apollo server instance in server.js
module.exports = { Query, Job, Company, Mutation };

// Common logic to make GraphQL Requests over HTTP

import { getAccessToken, isLoggedIn } from './auth';

// apollo server
const endPointURL = 'http://localhost:9000/graphql';

// Generic Function - reusable func to make any query requests with
// take in query & optional graphQL query variables by setting it an empty object
async function graphqlRequest(query, variables = {}) {
  // request object
  const request = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // normal queries
      query: query,
      // query variable
      variables: variables,
    }),
  };

  // to persist auth user with token
  if (isLoggedIn()) {
    request.headers['authorization'] = 'Bearer ' + getAccessToken();
  }

  const response = await fetch(endPointURL, request);

  // to get the response body
  const responseBody = await response.json();

  // Basic Error Handling for development
  // to handle errors from GraphQL response object
  // note - this Error overlay is only visible when we run react app in development mode
  // In production, users won't see it
  if (responseBody.errors) {
    // .join to return a Single Message from errors array, separating with new line
    const message = responseBody.errors.map(err => err.message).join('\n');
    throw new Error(message);
  }

  // GraphQL 'query type' returns a 'data' in DATA PROPERTY
  // 'data' property of graphQL query consists response data
  return responseBody.data;
}

// Sending a GraphQL Request for Mutation is no different than sending queries like below
// Calling a Mutation from Client
export async function createJob(input) {
  const mutation = `
  mutation CreateJob($input: CreateJobInput){

    # GraphQL supports ALIAS to give a Custom Name
    # to the Resolve Object. 
    # Here, the Result of createJob is named as 'job'

      job: createJob(input: $input) {
        id
        title
        company {
          id
          name
        }
      }
    }
  `;

  const { job } = await graphqlRequest(mutation, { input });
  return job;
}

// to load single job
export async function loadJob(id) {
  const query = `
  # query name is required if we want to pass variables
  # we can also optional name - operational name
  # Naming the query can be useful for debugging

  query JobQuery($id: ID!) {
    job(id: $id) {
      id
      title
      company {
        id
        name
      }
      description
    }
  }`;

  const data = await graphqlRequest(query, { id });

  // 'data' property of graphQL query consists response data
  return data.job;
}

// to load jobs
export async function loadJobs() {
  const query = `
  {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
  `;

  const { jobs } = await graphqlRequest(query);

  // 'data' property of graphQL query consists response data
  return jobs;
}

export async function loadCompany(id) {
  const query = ` query CompanyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
      }
    }
  }`;

  const { company } = await graphqlRequest(query, { id });
  return company;
}

// // to load single job
// export async function loadJob(id) {
//   const response = await fetch(endPointURL, {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       query: `
//       # query name is required if we want to pass variables
//       # we can also optional name - operational name
//       # Naming the query can be useful for debugging

//       query JobQuery($id: ID!) {
//         job(id: $id) {
//           id
//           title
//           company {
//             id
//             name
//           }
//           description
//         }
//       }`,
//       // passing arg as a graphQL query <variable>q</variable>
//       variables: { id },
//     }),
//   });

//   // to get the response body
//   const responseBody = await response.json();
//   // 'data' property of graphQL query consists response data
//   return responseBody.data.job;
// }

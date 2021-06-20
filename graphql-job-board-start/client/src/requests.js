// Common logic to make GraphQL Requests over HTTP

// apollo server
const endPointURL = 'http://localhost:9000/graphql';

// Generic Function - reusable func to make any query requests with
// take in query & optional graphQL query variables by setting it an empty object
async function graphqlRequest(query, variables = {}) {
  const response = await fetch(endPointURL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // normal queries
      query: query,
      // query variable
      variables: variables,
    }),
  });

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

  // 'data' property of graphQL query consists response data
  return responseBody.data;
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

// NOTE - Using Apollo Client for 'caching' over GraphQL Requests over HTTP
// apollo-boost is a package that has all the dependencies we need on Client Side
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';

// With Apollo Client, we need to parse query using graphQL library
// note - gql is known as 'tag' function
import gql from 'graphql-tag';

// Common logic to make GraphQL Requests over HTTP
import { getAccessToken, isLoggedIn } from './auth';

// apollo server
const endPointURL = 'http://localhost:9000/graphql';

// to persist auth user with token
// ApolloLink instances take a function with two params
// operation - graphQL query or mutation to be executed
// forward - a Function that allow us to CHAIN MULTIPLE STEPS TOGETHER
const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
    // request.headers['authorization'] = 'Bearer ' + getAccessToken();
    // passing props object to be use in the request
    operation.setContext({
      // setting http headers
      // We are setting Request Header in operation context to use in http request
      headers: {
        authorization: 'Bearer ' + getAccessToken(),
      },
    });
  }

  // note - saying at the end, forward to the next step
  return forward(operation);
});

// apollo client instance
const client = new ApolloClient({
  // config setup

  // link - how to connect to server, using HttpLink
  // passing array which contains multiple ApolloLink instances
  link: ApolloLink.from([
    // authLink code will be executed first & then HttpLink to make request
    // By adding authLink before, we are preparing request before it gets sent
    authLink,
    new HttpLink({ uri: endPointURL }),
  ]),
  // NOTE - Sine we are using HttpLink to communicate with a Server,
  // we need to customize the behaviour of this link by using 'ApolloLink.from'

  // cache - one of the main feature of Apollo Client
  cache: new InMemoryCache(),
});

// Generic Function - reusable func to make any query requests with
// take in query & optional graphQL query variables by setting it an empty object
// async function graphqlRequest(query, variables = {}) {
//   // request object
//   const request = {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       // normal queries
//       query: query,
//       // query variable
//       variables: variables,
//     }),
//   };

//   // to persist auth user with token
//   if (isLoggedIn()) {
//     request.headers['authorization'] = 'Bearer ' + getAccessToken();
//   }

//   const response = await fetch(endPointURL, request);

//   // to get the response body
//   const responseBody = await response.json();

//   // Basic Error Handling for development
//   // to handle errors from GraphQL response object
//   // note - this Error overlay is only visible when we run react app in development mode
//   // In production, users won't see it
//   if (responseBody.errors) {
//     // .join to return a Single Message from errors array, separating with new line
//     const message = responseBody.errors.map(err => err.message).join('\n');
//     throw new Error(message);
//   }

//   // GraphQL 'query type' returns a 'data' in DATA PROPERTY
//   // 'data' property of graphQL query consists response data
//   return responseBody.data;
// }

// Sending a GraphQL Request for Mutation is no different than sending queries like below
// Calling a Mutation from Client
export async function createJob(input) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput) {
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

  // const { job } = await graphqlRequest(mutation, { input });

  // NOTE - Since it's a Mutation, we use 'mutate' method instead of a 'query'
  const { data } = await client.mutate({ mutation, variables: { input } });
  return data.job;
}

// to load single job
export async function loadJob(id) {
  const query = gql`
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
    }
  `;

  // const data = await graphqlRequest(query, { id });

  // note - here we also need to pass query variables
  // we can do it using another option - variables prop
  const { data } = await client.query({ query, variables: { id } });

  // 'data' property of graphQL query consists response data
  return data.job;
}

// to load jobs
export async function loadJobs() {
  const query = gql`
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

  // note - using instance of apollo client here now
  // .query() - to send a request or make a query
  // sending above graphQL query
  const {
    // nested destructuring
    data: { jobs },
  } = await client.query({ query });
  // NOTE - query method returns a PROMISE with props - data, errors, loading, networkStatus, stale
  // basically a graphQL  Response Object

  // const { jobs } = await graphqlRequest(query);

  // 'data' property of graphQL query consists response data
  return jobs;
}

export async function loadCompany(id) {
  const query = gql`
    query CompanyQuery($id: ID!) {
      company(id: $id) {
        id
        name
        description
        jobs {
          id
          title
        }
      }
    }
  `;

  // const { company } = await graphqlRequest(query, { id });
  const { data } = await client.query({ query, variables: { id } });
  return data.company;
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

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

// FRAGMENTS - To avoid duplicate code
const jobDetailFragment = gql`
  # on - in which query type to select fields from
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

// MOVING ALL THE QUERIES & MUTATIONS TO TOP LEVEL VARIABLES
const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    # GraphQL supports ALIAS to give a Custom Name
    # to the Resolve Object.
    # Here, the Result of createJob is named as 'job'

    job: createJob(input: $input) {
      # id
      # title
      # company {
      #   id
      #   name
      # }
      # description
      ...JobDetail
    }
  }
  # need to include fragment definition here
  # we can not use 'jobDetail' without defining it first
  # It's value will be pass on 'jobDetail'
  ${jobDetailFragment}
`;

const companyQuery = gql`
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

// to reuse this query to solve some caching issues
const jobQuery = gql`
  # query name is required if we want to pass variables
  # we can also optional name - operational name
  # Naming the query can be useful for debugging

  query JobQuery($id: ID!) {
    job(id: $id) {
      # id
      # title
      # company {
      #   id
      #   name
      # }
      # description
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobsQuery = gql`
  # declaring Operation Name - we see it on log messages
  # helpful when debugging
  query JobsQuery {
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

// Sending a GraphQL Request for Mutation is no different than sending queries like below
// Calling a Mutation from Client
export async function createJob(input) {
  // const { job } = await graphqlRequest(mutation, { input });

  // NOTE - Since it's a Mutation, we use 'mutate' method instead of a 'query'

  // To avoid making TWO requests to the Server every time we create a job
  // because when we sent a mutation we already get back the new job details in the RESPONSE
  // so NO NEED to make a separate query to get the same data again
  const { data } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    // update prop gives us full control over the cache
    // update is the function that will be called after the mutation has been executed
    // It receives TWO PARAMS
    // 'cache' - In documentation, sometimes they call it store or proxy, it
    // an Object that lets you manipulate what store in cache
    // 'mutationResult' - a response we get from the Server when we send this mutation
    update: (cache, { data }) => {
      // mutationResult is a data object in the response
      // console.log('mutation result:', mutationResult);
      // NOTE - We want to save Newly Created Job object into the Cache
      // So, apollo can find data in the cache & it does not need to make another request to the Server

      // NOTE - we can use 'cache' object to modify what store in cache
      // writeQuery() to save the result of query which takes some args
      // query - this is normally the regular query that generated the result

      // After executing the query, Apollo Client calls this writeQuery method
      // passing the query & data received as response. Here we are doing something special
      // we want to update the cache with data returned by mutation but we want that
      // data to be used whenever we make query to load the same data - job
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data: data,
      });
      // note - we also need to specify the variables associated with the query
      // we need to specify the 'id' of job to be cached,
      // when we load the job, we pass 'id' as a query variable so when writing to a cache
      // we need the SAME VARIABLE, data prop is what returned by mutation

      // note - the last argument is the 'data' prop
      // the value will be the value of the data parameter passed to this function

      // note - above we are Updating the Cache After a Mutation
    },
  });
  return data.job;
}

// to load single job
export async function loadJob(id) {
  // NOTE - USING THIS ABOVE
  // const query = gql`
  //   # query name is required if we want to pass variables
  //   # we can also optional name - operational name
  //   # Naming the query can be useful for debugging

  //   query JobQuery($id: ID!) {
  //     job(id: $id) {
  //       id
  //       title
  //       company {
  //         id
  //         name
  //       }
  //       description
  //     }
  //   }
  // `;

  // const data = await graphqlRequest(query, { id });

  // note - here we also need to pass query variables
  // we can do it using another option - variables prop
  const { data } = await client.query({ query: jobQuery, variables: { id } });

  // 'data' property of graphQL query consists response data
  return data.job;
}

// to load jobs
export async function loadJobs() {
  // note - using instance of apollo client here now
  // .query() - to send a request or make a query
  // sending above graphQL query
  const {
    // nested destructuring
    data: { jobs },
    // NOTE - BY DEFAULT, Apollo client applies Caching 'cache-first' which might causes unexpected results
    // To override, we can use 'fetchPolicy' prop with provided values that we can choose
    // 'no-cache' - no caching, data will be always fetch from the server
  } = await client.query({ query: jobsQuery, fetchPolicy: 'no-cache' });
  // NOTE - query method returns a PROMISE with props - data, errors, loading, networkStatus, stale
  // basically a graphQL  Response Object

  // const { jobs } = await graphqlRequest(query);

  // 'data' property of graphQL query consists response data
  return jobs;
}

export async function loadCompany(id) {
  // const { company } = await graphqlRequest(query, { id });
  const { data } = await client.query({ query: companyQuery, variables: { id } });
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

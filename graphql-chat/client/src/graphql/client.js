import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from 'apollo-boost';

// To support Websocket for Subscriptions on Client side
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

import { getAccessToken } from '../auth';

const httpUrl = 'http://localhost:9000/graphql';

// websocket protocol - ws
const wsUrl = 'ws://localhost:9000/graphql';

const httpLink = ApolloLink.from([
  new ApolloLink((operation, forward) => {
    const token = getAccessToken();
    if (token) {
      operation.setContext({ headers: { authorization: `Bearer ${token}` } });
    }
    return forward(operation);
  }),
  new HttpLink({ uri: httpUrl }),
]);

// Websocket instance
const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
    // by default, 'lazy' is false which means Apollo Client will start a
    // Websocket connection as soon as application is loaded but if new user
    // opens our application first thing they will see is a Login Page.
    // We don't use graphQL subscription there so we don't need websocket at that point.
    // With 'lazy' true it will only make Websocket Connection when Needed that
    // is the first time we request a graphQL subscription
    lazy: true,
    // if websocket connection fails, re-connect again
    reconnect: true,

    // passing extra value to the Server
    // payload object in request header for user authentication
    // NOTE - need to call 'getAccessToken' when connection starts, not when app starts loading
    // function to use latest/updated values in the server
    connectionParams: () => ({
      accessToken: getAccessToken(),
    }),
  },
});

// NOTE- this is a code to check if 'operation' is Subscription
// takes graphQL operation as param
function isSubscription(operation) {
  // we need to tell if this 'operation' is subscription or not,
  // we do this with 'getMainDefinition'
  const definition = getMainDefinition(operation.query);
  // we return true if
  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
}

// configuring apollo client to use 'wsLink'
const client = new ApolloClient({
  cache: new InMemoryCache(),
  // split func to use both http & websocket
  // we need http for queries & websocket for subscriptions

  // note - split func works as a IF statement
  // The args is saying if it is a subscription, we want to use the wsLink
  // otherwise we want to use httpLink
  link: split(isSubscription, wsLink, httpLink),
  defaultOptions: { query: { fetchPolicy: 'no-cache' } },
});

export default client;

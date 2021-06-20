// Defining a GraphQL Schema that describes what our API can do

// we can pass Schema below with a func - gql
// It is to write GraphQL queries
const { ApolloServer, gql } = require('apollo-server');

// using GraphQL Schema definition language
// We start defining a type Query like defining a Class in javaScript
// expect we write 'type' instead of a 'class'.
// We have ONE field here with data type 'String'
const typeDefs = gql`
  type Query {
    greeting: String
  }
`;

// The purpose of resolve is that it must return a data that represents a 'data/document'
// resolve func also works by returning a PROMISE - async request
// very important func which performs the 'Search & Get the Data' into our database
// parentValue - don't get used very often
// args - This is an Object which gets call whatever arguments are passed into the original query above
const resolvers = {
  // note - when we make above query, will get this data asynchronously
  Query: {
    greeting: () => 'Hello GraphQL world!',
  },
};
// note - resolve func also works by returning a PROMISE - async request

// creating GraphQL Server
const server = new ApolloServer({ typeDefs, resolvers });
server.listen({ port: 5000 }).then(serverInfo => console.log(`Server running at ${serverInfo.url}`));

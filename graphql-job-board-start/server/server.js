// loading schema.graphql file with built in Node JS API (fs - file system)
const fs = require('fs');

// to integrate GraphQL with the Express Backend
const { ApolloServer, gql } = require('apollo-server-express');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const port = 9000;
const jwtSecret = Buffer.from('Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZt', 'base64');

const app = express();

app.use(
  cors(),
  bodyParser.json(),
  expressJwt({
    secret: jwtSecret,
    credentialsRequired: false,
  })
);

// type definitions
// instead of calling gql with template literal, we can call it as a regular func
// & then use fs.readFileSync() to read our graphQL Schema file
// encoding - to make sure it reads a file as a String, not as a binary file
const typeDefs = gql(fs.readFileSync('./schema.graphql', { encoding: 'utf8' }));
// readFileSync will return the content of our Schema file &
// then parse by gql function & assigned to the typeDefs variable

// resolver object
const resolvers = require('./resolvers');

// NOTE - Basic setup for using Apollo Server with Express
// Apollo server instance with our type definitions & resolver objects
const apolloServer = new ApolloServer({ typeDefs, resolvers });
// applyMiddleware func - to connect Apollo server into our existing existing Express app
// passing instance of express app from above &
// optionally we can also set a path that is where we want to expose graphQL endpoint on our server
apolloServer.applyMiddleware({ app, path: '/graphql' });

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.list().find(user => user.email === email);
  if (!(user && user.password === password)) {
    res.sendStatus(401);
    return;
  }
  const token = jwt.sign({ sub: user.id }, jwtSecret);
  res.send({ token });
});

app.listen(port, () => console.info(`Server started on port ${port}`));

// PubSub Class stands for Publish & Subscribe
const { PubSub } = require('graphql-subscriptions');

const db = require('./db');

// EVENT TYPES
const MESSAGE_ADDED = 'MESSAGE_ADDED';

// PubSub instance
const pubSub = new PubSub();

function requireAuth(userId) {
  if (!userId) {
    throw new Error('Unauthorized');
  }
}

const Query = {
  messages: (_root, _args, { userId }) => {
    requireAuth(userId);
    return db.messages.list();
  },
};

// we will never receive any messages data unless we published(created) it first
// we can do the Publishing here.
// In addition to saving data in the db, we should notify any Clients that have
// Subscribed (made query) to receive Messaged added/Created Events
const Mutation = {
  addMessage: (_root, { input }, { userId }) => {
    requireAuth(userId);
    const messageId = db.messages.create({ from: userId, text: input.text });

    // first extract the message returned by the db
    const message = db.messages.get(messageId);

    // now we also want to call - pubSub.publish() with Event Type
    // we pass an Object that will be the Value send to th Client as second arg
    // messageAdded - this needs to match the Subscription in schema.graphql &
    // the value will be the data from the db
    pubSub.publish(MESSAGE_ADDED, { messageAdded: message });

    return message;
  },
};

// Subscription Type
const Subscription = {
  // this property will be a Object that provides a 'subscribe' method
  messageAdded: {
    // this method will return a pubSub asyncIterator & we need to pass an arg with
    // string that identifies the Event Type.
    // Here's we are returning 'iterator' - object that generates multiple values
    subscribe: (_root, _args, { userId }) => {
      // { userId } is context object
      // passing arg for auth
      // to auth user id with
      requireAuth(userId);
      return pubSub.asyncIterator(MESSAGE_ADDED);
    },
    // note - When Client subscribes the MESSAGE_ADDED Event,
    // we use the PubSub Instance to return asyncIterator which will
    // take care of NOTIFYING all the Subscribers on every time we publish a new message with 'addMessage' mutation
  },
  // NOTE - this is quite different than Query Resolver that's because
  // with 'subscriptions' the Client doesn't receive a Single Value like Query
  // subscriptions - receives multiple values over time
};

module.exports = { Query, Mutation, Subscription };

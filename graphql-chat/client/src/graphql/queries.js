import gql from 'graphql-tag';
import client from './client';

const messagesQuery = gql`
  query MessagesQuery {
    messages {
      id
      from
      text
    }
  }
`;

const addMessageMutation = gql`
  mutation AddMessageMutation($input: MessageInput!) {
    message: addMessage(input: $input) {
      id
      from
      text
    }
  }
`;

// subscription
const messageAddedSubscription = gql`
  subscription {
    messageAdded {
      id
      from
      text
    }
  }
`;

// function that uses Subscription
export function onMessageAdded(handleMessage) {
  // here we want to use the apollo client to subscribe
  const observable = client.subscribe({ query: messageAddedSubscription });
  return observable.subscribe(({ data }) => handleMessage(data.messageAdded));
}

export async function addMessage(text) {
  const { data } = await client.mutate({
    mutation: addMessageMutation,
    variables: { input: { text } },
  });
  return data.message;
}

export async function getMessages() {
  const { data } = await client.query({ query: messagesQuery });
  return data.messages;
}

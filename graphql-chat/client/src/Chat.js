import React from 'react';

// hooks to make queries
import { useQuery, useMutation, useSubscription } from '@apollo/react-hooks';

// import queries
import { messagesQuery, addMessageMutation, messageAddedSubscription } from './graphql/queries';

import MessageInput from './MessageInput';
import MessageList from './MessageList';

const Chat = ({ user }) => {
  // const [messages, setMessages] = useState([]);
  // Local State Management with Apollo Client Cache

  // useQuery returns 'result' object
  // NOTE - we can pass second arg to useQuery(messagesQuery, {fetchPolicy}) with some Options object
  // We can pass Query Variables, fetchPolicy as second args
  const { data, loading, error } = useQuery(messagesQuery);

  // similar approach what we did we useSubscription hook below
  // onCompleted option where we pass our own function that receives a data
  // useQuery(messagesQuery, {
  //   // data returned by query
  //   onCompleted: data => setMessages(data.messages),
  // });

  // Note - useSubscription hook automatically takes care of 'unsubscribing' automatically
  // no need of componentWillUnmount or any clean up method
  // Gets Result Object
  // const { data } = useSubscription(messageAddedSubscription);
  // note - instead of return object we can pass some Options
  useSubscription(messageAddedSubscription, {
    // this will be a func that takes 'result' object - {client: ApolloClient, subscriptionData: {…}}
    onSubscriptionData: ({ client, subscriptionData }) => {
      // when we receive a new message from the subscription, we want to add it in our list
      // setMessages([...messages, result.subscriptionData.data.messageAdded]);

      // NOTE - Local State Management with Apollo Client Cache - GLOBAL STORE
      // apollo client instance
      // we can use client to write data directly to the cache
      client.writeData({
        // need to pass object with data property

        // note - IT'S IMPORTANT THAT WHEN WE WRITE DATA DIRECTLY INTO APOLLO CACHE
        // WE MAKE SURE THAT DATA HAS THE SAME STRUCTURE AS IN THE QUERY WE USE TO GET THAT DATA
        // this is what we get in RESULT OBJECT
        // export const messagesQuery = gql`
        //   query MessagesQuery {
        //   messages { THIS PROPERTY IN RESULT OBJECT
        //     id
        //     from
        //     text
        //     }
        //   }
        // `;

        data: {
          // similar way like setMessages() on useState
          // we are replacing entire 'messages' array in cache with a new array that
          // contains new additional message
          messages: [...messages, subscriptionData.data.messageAdded],
        },

        // NOTE - the beauty of this approach is that we could UPDATE the DATA in ONE COMPONENT
        // & use it in another Component or even in multiple components, good way to share data across components
        // Cached Data will prevent component re-rendering issues
      });
    },
  });

  // NOTE - this hook returns an Array where first element is Function that will execute the mutation
  // First Element in an array is similar to calling 'client.mutate()' directly on Apollo Client
  // note - Calling useMutation does not perform Mutation right away, it simply returns
  // a function that triggers the mutation later
  // note - we can name the First Element Variable whatever we like
  const [addMessage] = useMutation(addMessageMutation);
  // const [addMessage, {loading, error}] = useMutation(addMessageMutation);
  // note - Second Element 'result' is also a Resolved Object - data,
  // calling after 'addMessage' mutate function

  // displaying an array with single element
  // showing only the last message received from the server
  const messages = data ? data.messages : [];

  const handleSend = async text => {
    // using 'addMessage' function here to mutate
    // 'addMessage' is a mutate function return by useMutation hook
    // accepts an Object where we can pass Options including query variables

    // const { data } = await addMessage({ variables: { input: { text } } });
    // note - mutate function returns Promise
    // console.log('mutation:', data);

    // here we just needed to send data to the server, not needed to access Resolved Object
    await addMessage({ variables: { input: { text } } });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <div>
      <section className='section'>
        <div className='container'>
          <h1 className='title'>Chatting as {user}</h1>
          <MessageList user={user} messages={messages} />
          <MessageInput onSend={handleSend} />
        </div>
      </section>
    </div>
  );
};

export default Chat;

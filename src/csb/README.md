# Client Server Broker

A socket application protocol, with or without broker work fine. Request \<--\> response workflow, like HTTP.

## Client packet structure

The broker to client is transparent, it does not need to care about it is connecting to a server directly or a broker.

    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
    |              kind             |      result code              |                             message id                        |
    |                                                           action id                                                           |
    |                                                            payload                                                            |

### Client message kinds

- ClientRequest: client send message to server
- ServerResponse: server response to client request
- ServerRequest: server send message to client
- ClientResponse: client response to server request

## Result code

This field should be `0x00` if the message kind is not Response, else, it's same to http status code, but the value
should between `0` and `0xFF`, so, we need to assign different value to it.

- OK: server response successfully
- NotFoundTarget: could not found target server/client
- NotFoundAction: no handler to handle the action
- WriteError: socket write error
- Timeout: the server/client does not response in time
- UserDefinedValue: the other error codes, the codes between `0x00` and `0x7F` is reserved by internal use.

## Server packet structure

A server will work in different mode between with broker and without broker, and the packet structure is different.

**If without broker, the packet structure is absolutely same to client packet structure.**

If with broker, the packet need to distinguish target client, so the packet need to contains more fields. And with
more message kinds.

    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
    |                                                           client id                                                           |
    |              kind             |      result code              |                             message id                        |
    |                                                           action id                                                           |
    |                                                            payload                                                            |

### Server extra message kinds with broker

- ClientConnected: broker notify server that the client connected
- ClientClosed: broker notify server that the client closed
- CloseClient: server request broker to close client

## Workflow without broker

    1. start a server
    2. client connect to server
    3. client send message to server
    3.1 server response to client
    4. server send message to client
    4.1 client response to server
    5. client close
    6. server close

## Workflow with broker

    1. start a broker
    2. start a server
    3. client connect to broker
    3.1 broker notify server client connected
    4. client send message to broker
    4.1 broker transmit message to server
    4.2 server response
    4.3 broker transmit response to client
    5. server send message to broker
    5.1 broker transmit message to client
    5.2 client response
    5.3 broker transmit response to server
    6. client close
    6.1 broker notify server client close
    7. server close
    7.1 broker close all client assign to the server
    8. broker close
    
## TODO

- Currently this protocol works over `WebSocket`, so we ignored the payload length field and the ping/pong message kind. And we need to let this protocol support work over TCP directly.

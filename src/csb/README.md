# Client Server Broker

A socket application protocol, with or without broker work fine. Request \<--\> response workflow, like HTTP.

## Common Message Structure

In general, the message struct as follow,  contains 8 bytes header and optional payload

    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
    |      kind     |    encoding   |      result code              |                             message id                        |
    |                                                           action id                                                           |
    |                                                            payload                                                            |

### Message Kind

The first field of the message header is the message kind.

The length is `4 bit`, value from `0x0` to `0xF`

In general, there are four message kinds could be transmitted in socket as follow.

- Request: this is a request message
- Response: this is a response message

### Payload Encodings

The second field of message header is the payload encoding.

The length is `4 bit`, value from `0x0` to `0xF`

The encodings we supported as follow:

- Binary
- String
- Json
- UrlEncoded
- Base64

### Result code

The third field of message header is result code, just like `http status code`.

The length is `8 bit`, value from `0x00` to `0xFF`

The field should be `0x00` if the message kind is not `Response`.

The means of the value between `0x01` and `0xC8` could be user defined, and the value of `0x00` and the
values between `0xC9` and `0xFF` is reserved for common result means.

Currently the defined reserved result as follow:

```typescript

export enum ReservedResults {
  Ok              = 0x00, // OK
  NotFound        = 0xC9, // no action to handle this request
  Timeout         = 0xCA, // action handle timeout
  EncodingError   = 0xCB, // could not parse payload according encoding
  BadRequest      = 0xCC, // payload is incorrect
  Unauthorized    = 0xCD, // need to login
  Forbidden       = 0xCE, // forbid to access this action
  TooManyRequests = 0xCF, // too many request
  InternalError   = 0xD0, // action throws error
  PayloadTooLarge = 0xD1, // payload too large
}

```

### Message id

The 4th field of the message header is the message id, this response should return this field and
the sender should use this to filter response messages.

The length is `16 bit`, value from `0x0000` to `0xFFFF`

### Action id

The 5th field of the message header is the target action id, this is same to pathname in http protocol,
but it is a integer rather than string.

The length is `32 bit`, value from `0x00000000` to `0xFFFFFFFF`

### Payload

The payload could be any value and size. The client/server should decode the payload according to `encoding` field.


## Message structure with broker

For client, the broker should be transparent, so the message structure is absolutely same to common message.

For server, we need to distinguish target client, so the packet need to prepend more fields. And the server need
to request broker control client connections and the broker need to notify the client connections, so need to
add more message kinds.

### Extra message kinds

- Connected: broker notify server that the client connected
- Closed: broker notify server that the client closed
- Close: server request broker to close client

### Wrapped message structure

We just need add a client id header to the packet as follow:

    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
    |                                                           client id                                                           |
    |      kind     |    encoding   |      result code              |                             message id                        |
    |                                                           action id                                                           |
    |                                                            payload                                                            |

## Workflow without broker

    1. start a server
    2. client connect to server
    3. client send message to server
    3.1 server response to client
    4. server send message to client
    4.1 client response to server
    5. client close
    6. server close client
    7. server close

## Workflow with broker

    1. start a broker
    2. server connect to broker
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
    7. server request close client
    7.1 broker close client
    8. server close
    8.1 broker close all client assign to the server
    9. broker close

## TODO

- [ ] Currently this protocol works over `WebSocket`, so we ignored the payload length field and the ping/pong message kind. And we need to let this protocol support work over TCP directly.
- [ ] Socket pool between broker and server.
- [ ] Ping control.
- [x] Parse payload.
- [x] More strict message interface.
- [ ] Demo.
- [ ] More useful document.
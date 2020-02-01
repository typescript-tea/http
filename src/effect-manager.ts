import { EffectManager, Dispatch, Cmd, ActionMapper } from "@typescript-tea/core";
import { exhaustiveCheck } from "ts-exhaustive-check";
import { Result, Err, Ok, mapError } from "./result";

// -- REQUESTS

/**
 * Create a `GET` request.
 *     import Http
 *     type Msg
 *       = GotText (Result Http.Error String)
 *     getPublicOpinion : Cmd Msg
 *     getPublicOpinion =
 *       Http.get
 *         { url = "https://elm-lang.org/assets/public-opinion.txt"
 *         , expect = Http.expectString GotText
 *         }
 * You can use functions like [`expectString`](#expectString) and
 * [`expectJson`](#expectJson) to interpret the response in different ways. In
 * this example, we are expecting the response body to be a `String` containing
 * the full text of _Public Opinion_ by Walter Lippmann.
 * **Note:** Use [`elm/url`](/packages/elm/url/latest) to build reliable URLs.
 */
export function get<A>(url: string, expect: Expect<A>): Cmd<A> {
  return request("GET", [], url, emptyBody(), expect, undefined, undefined);
}

/**
 * Create a `POST` request. So imagine we want to send a POST request for
 * some JSON data. It might look like this:
 *     import Http
 *     import Json.Decode exposing (list, string)
 *     type Msg
 *       = GotBooks (Result Http.Error (List String))
 *     postBooks : Cmd Msg
 *     postBooks =
 *       Http.post
 *         { url = "https://example.com/books"
 *         , body = Http.emptyBody
 *         , expect = Http.expectJson GotBooks (list string)
 *         }
 * Notice that we are using [`expectJson`](#expectJson) to interpret the response
 * as JSON. You can learn more about how JSON decoders work [here][] in the guide.
 * We did not put anything in the body of our request, but you can use functions
 * like [`stringBody`](#stringBody) and [`jsonBody`](#jsonBody) if you need to
 * send information to the server.
 * [here]: https://guide.elm-lang.org/interop/json.html
 *
 */
export function post<A>(url: string, body: Body, expect: Expect<A>): Cmd<A> {
  return request("POST", [], url, body, expect, undefined, undefined);
}

/**
 * Create a custom request. For example, a PUT for files might look like this:
 *   import File
 *   import Http
 *   type Msg = Uploaded (Result Http.Error ())
 *   upload : File.File -> Cmd Msg
 *   upload file =
 *     Http.request
 *       { method = "PUT"
 *       , headers = []
 *       , url = "https://example.com/publish"
 *       , body = Http.fileBody file
 *       , expect = Http.expectWhatever Uploaded
 *       , timeout = Nothing
 *       , tracker = Nothing
 *       }
 * It lets you set custom `headers` as needed. The `timeout` is the number of
 * milliseconds you are willing to wait before giving up. The `tracker` lets you
 * [`cancel`](#cancel) and [`track`](#track) requests.
 */
export function request<A>(
  method: string,
  headers: ReadonlyArray<Header>,
  url: string,
  body: Body,
  expect: Expect<A>,
  timeout: number | undefined,
  tracker: string | undefined
): Cmd<A> {
  const r: Request<A> = {
    home,
    type: "Request",
    method,
    headers,
    url,
    body,
    expect,
    timeout,
    tracker,
    allowCookiesFromOtherDomains: false,
  };
  return r;
}

// -- HEADERS

/**
 * An HTTP header for configuring requests. See a bunch of common headers
 * [here](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields).
 */
export type Header = readonly [string, string];

/**
 * Create a `Header`.
 *   header "If-Modified-Since" "Sat 29 Oct 1994 19:43:31 GMT"
 *   header "Max-Forwards" "10"
 *   header "X-Requested-With" "XMLHttpRequest"
 */
export function header(name: string, value: string): Header {
  return [name, value];
}

// -- BODY

/**
 * Represents the body of a `Request`.
 */
export type Body = readonly [string, unknown] | undefined;

/**
 * Create an empty body for your `Request`. This is useful for GET requests
 * and POST requests where you are not sending any data.
 */
export function emptyBody(): Body {
  return undefined;
}

/**
 * Put some JSON value in the body of your `Request`. This will automatically
 * add the `Content-Type: application/json` header.
 */
export function jsonBody(value: {} | ReadonlyArray<unknown> | number | string | boolean): Body {
  return ["application/json", value];
}

/**
 * Put some string in the body of your `Request`. Defining `jsonBody` looks
 * like this:
 *     import Json.Encode as Encode
 *     jsonBody : Encode.Value -> Body
 *     jsonBody value =
 *       stringBody "application/json" (Encode.encode 0 value)
 * The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
 * of the body. Some servers are strict about this!
 */
export function stringBody(mimeType: string, theString: string): Body {
  return [mimeType, theString];
}

/**
 * Put some `Bytes` in the body of your `Request`. This allows you to use
 * [`elm/bytes`](/packages/elm/bytes/latest) to have full control over the binary
 * representation of the data you are sending. For example, you could create an
 * `archive.zip` file and send it along like this:
 *     import Bytes exposing (Bytes)
 *     zipBody : Bytes -> Body
 *     zipBody bytes =
 *       bytesBody "application/zip" bytes
 * The first argument is a [MIME type](https://en.wikipedia.org/wiki/Media_type)
 * of the body. In other scenarios you may want to use MIME types like `image/png`
 * or `image/jpeg` instead.
 * **Note:** Use [`track`](#track) to track upload progress.
 */
export function bytesBody(mimeType: string, bytes: Uint8Array): Body {
  return [mimeType, bytes];
}

/**
 * Use a file as the body of your `Request`. When someone uploads an image
 * into the browser with [`elm/file`](/packages/elm/file/latest) you can forward
 * it to a server.
 * This will automatically set the `Content-Type` to the MIME type of the file.
 * **Note:** Use [`track`](#track) to track upload progress.
 */
export function fileBody(f: File): Body {
  return ["", f];
}

// -- EXPECT

/**
 * Logic for interpreting a response body.
 */

export type Expect<A> = {
  readonly type: "Expect";
  readonly $: 0;
  readonly __type: XMLHttpRequestResponseType;
  readonly __toBody: (a: unknown) => unknown;
  readonly __toValue: (a: Response<unknown>) => A;
};

function mapExpect<A1, A2>(func: ActionMapper<A1, A2>, expect: Expect<A1>): Expect<A2> {
  return {
    ...expect,
    __toValue: function(x) {
      return func(expect.__toValue(x));
    },
  };
}

/**
 * Expect the response body to be a `String`. Like when getting the full text
 * of a book:
 *     import Http
 *     type Msg
 *       = GotText (Result Http.Error String)
 *     getPublicOpinion : Cmd Msg
 *     getPublicOpinion =
 *       Http.get
 *         { url = "https://elm-lang.org/assets/public-opinion.txt"
 *         , expect = Http.expectString GotText
 *         }
 * The response body is always some sequence of bytes, but in this case, we
 * expect it to be UTF-8 encoded text that can be turned into a `String`.
 */
export function expectString<A>(toMsg: (r: Result<Error, string>) => A): Expect<A> {
  return expectStringResponse(toMsg, resolve(Ok));
}

/*

{-| Expect the response body to be JSON. Like if you want to get a random cat
GIF you might say:
    import Http
    import Json.Decode exposing (Decoder, field, string)
    type Msg
      = GotGif (Result Http.Error String)
    getRandomCatGif : Cmd Msg
    getRandomCatGif =
      Http.get
        { url = "https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cat"
        , expect = Http.expectJson GotGif gifDecoder
        }
    gifDecoder : Decoder String
    gifDecoder =
      field "data" (field "image_url" string)
The official guide goes through this particular example [here][]. That page
also introduces [`elm/json`][json] to help you get started turning JSON into
Elm values in other situations.
[here]: https://guide.elm-lang.org/interop/json.html
[json]: /packages/elm/json/latest/
If the JSON decoder fails, you get a `BadBody` error that tries to explain
what went wrong.
-}
expectJson : (Result Error a -> msg) -> Decode.Decoder a -> Expect msg
expectJson toMsg decoder =
  expectStringResponse toMsg <| resolve <|
    \string ->
      Result.mapError Decode.errorToString (Decode.decodeString decoder string)


{-| Expect the response body to be binary data. For example, maybe you are
talking to an endpoint that gives back ProtoBuf data:
    import Bytes.Decode as Bytes
    import Http
    type Msg
      = GotData (Result Http.Error Data)
    getData : Cmd Msg
    getData =
      Http.get
        { url = "/data"
        , expect = Http.expectBytes GotData dataDecoder
        }
    -- dataDecoder : Bytes.Decoder Data
You would use [`elm/bytes`](/packages/elm/bytes/latest/) to decode the binary
data according to a proto definition file like `example.proto`.
If the decoder fails, you get a `BadBody` error that just indicates that
_something_ went wrong. It probably makes sense to debug by peeking at the
bytes you are getting in the browser developer tools or something.
-}
expectBytes : (Result Error a -> msg) -> Bytes.Decoder a -> Expect msg
expectBytes toMsg decoder =
  expectBytesResponse toMsg <| resolve <|
    \bytes ->
      Result.fromMaybe "unexpected bytes" (Bytes.decode decoder bytes)
*/

/**
 * Expect the response body to be whatever. It does not matter. Ignore it!
 * For example, you might want this when uploading files:
 *     import Http
 *     type Msg
 *       = Uploaded (Result Http.Error ())
 *     upload : File -> Cmd Msg
 *     upload file =
 *       Http.post
 *         { url = "/upload"
 *         , body = Http.fileBody file
 *         , expect = Http.expectWhatever Uploaded
 *         }
 * The server may be giving back a response body, but we do not care about it.
 */
export function expectWhatever<A>(toMsg: (r: Result<Error, readonly []>) => A): Expect<A> {
  return expectBytesResponse(
    toMsg,
    resolve(() => Ok<[]>([]))
  );
}

function resolve<a, body>(toResult: (b: body) => Result<string, a>) {
  return (response: Response<body>) => {
    switch (response.type) {
      case "BadUrl_":
        return Err({ type: "BadUrl", url: response.url });
      case "Timeout_":
        return Err({ type: "Timeout" });
      case "NetworkError_":
        return Err({ type: "NetworkError" });
      case "BadStatus_":
        return Err({
          type: "BadStatus",
          statusCode: response.metadata.statusCode,
        });
      case "GoodStatus_":
        return mapError(
          () => ({
            type: "BadBody",
            body: (response.body as unknown) as string,
          }),
          toResult(response.body)
        );
      default:
        return exhaustiveCheck(response, true);
    }
  };
}

/**
 * {-| A `Request` can fail in a couple ways:
 * - `BadUrl` means you did not provide a valid URL.
 * - `Timeout` means it took too long to get a response.
 * - `NetworkError` means the user turned off their wifi, went in a cave, etc.
 * - `BadStatus` means you got a response back, but the status code indicates failure.
 * - `BadBody` means you got a response back with a nice status code, but the body
 * of the response was something unexpected. The `String` in this case is a
 * debugging message that explains what went wrong with your JSON decoder or
 * whatever.
 * **Note:** You can use [`expectStringResponse`](#expectStringResponse) and
 * [`expectBytesResponse`](#expectBytesResponse) to get more flexibility on this.
 */
export type Error =
  | { readonly type: "BadUrl"; readonly url: string }
  | { readonly type: "Timeout" }
  | { readonly type: "NetworkError" }
  | { readonly type: "BadStatus"; readonly statusCode: number }
  | { readonly type: "BadBody"; readonly body: string };

// -- ELABORATE EXPECTATIONS

/**
 * Expect a [`Response`](#Response) with a `String` body. So you could define
 * your own [`expectJson`](#expectJson) like this:
 *     import Http
 *     import Json.Decode as D
 *     expectJson : (Result Http.Error a -> msg) -> D.Decoder a -> Expect msg
 *     expectJson toMsg decoder =
 *       expectStringResponse toMsg <|
 *         \response ->
 *           case response of
 *             Http.BadUrl_ url ->
 *               Err (Http.BadUrl url)
 *             Http.Timeout_ ->
 *               Err Http.Timeout
 *             Http.NetworkError_ ->
 *               Err Http.NetworkError
 *             Http.BadStatus_ metadata body ->
 *               Err (Http.BadStatus metadata.statusCode)
 *             Http.GoodStatus_ metadata body ->
 *               case D.decodeString decoder body of
 *                 Ok value ->
 *                   Ok value
 *                 Err err ->
 *                   BadBody (D.errorToString err)
 * This function is great for fancier error handling and getting response headers.
 * For example, maybe when your sever gives a 404 status code (not found) it also
 * provides a helpful JSON message in the response body. This function lets you
 * add logic to the `BadStatus_` branch so you can parse that JSON and give users
 * a more helpful message! Or make your own custom error type for your particular
 * application!
 */
export function expectStringResponse<A, x, a>(
  toMsg: (r: Result<x, a>) => A,
  toResult: (r: Response<string>) => Result<x, a>
): Expect<A> {
  return {
    type: "Expect",
    $: 0,
    __type: "",
    __toBody: (a: string) => a,
    __toValue: (a: Response<string>) => toMsg(toResult(a)),
  };
}

type Bytes = ArrayBuffer;

/**
 * Expect a [`Response`](#Response) with a `Bytes` body.
 * It works just like [`expectStringResponse`](#expectStringResponse), giving you
 * more access to headers and more leeway in defining your own errors.
 */
export function expectBytesResponse<A, x, a>(
  toMsg: (r: Result<x, a>) => A,
  toResult: (r: Response<Bytes>) => Result<x, a>
): Expect<A> {
  return {
    type: "Expect",
    $: 0,
    __type: "arraybuffer",
    __toBody: (arrayBuffer: unknown) => new DataView(arrayBuffer as ArrayBuffer),
    __toValue: (a: Response<Bytes>) => toMsg(toResult(a)),
  };
}

/**
 * A `Response` can come back a couple different ways:
 * - `BadUrl_` means you did not provide a valid URL.
 * - `Timeout_` means it took too long to get a response.
 * - `NetworkError_` means the user turned off their wifi, went in a cave, etc.
 * - `BadResponse_` means you got a response back, but the status code indicates failure.
 * - `GoodResponse_` means you got a response back with a nice status code!
 * The type of the `body` depends on whether you use
 * [`expectStringResponse`](#expectStringResponse)
 * or [`expectBytesResponse`](#expectBytesResponse).
 */
type Response<body> =
  | { readonly type: "BadUrl_"; readonly url: string }
  | { readonly type: "Timeout_" }
  | { readonly type: "NetworkError_" }
  | {
      readonly type: "BadStatus_";
      readonly metadata: Metadata;
      readonly body: body;
    }
  | {
      readonly type: "GoodStatus_";
      readonly metadata: Metadata;
      readonly body: body;
    };

/**
 * Extra information about the response:
 * - `url` of the server that actually responded (so you can detect redirects)
 * - `statusCode` like `200` or `404`
 * - `statusText` describing what the `statusCode` means a little
 * - `headers` like `Content-Length` and `Expires`
 * **Note:** It is possible for a response to have the same header multiple times.
 * In that case, all the values end up in a single entry in the `headers`
 * dictionary. The values are separated by commas, following the rules outlined
 * [here](https://stackoverflow.com/questions/4371328/are-duplicate-http-response-headers-acceptable).
 */
type Metadata = {
  readonly url: string;
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: { readonly [key: string]: string };
};

// -- CANCEL

/**
 * Try to cancel an ongoing request based on a `tracker`.
 */
export function cancel<A>(tracker: string): Cmd<A> {
  return { home, type: "Cancel", tracker } as Cancel;
}

// -- PROGRESS

/**
 * Track the progress of a request. Create a [`request`](#request) where
 * `tracker = Just "form.pdf"` and you can track it with a subscription like
 * `track "form.pdf" GotProgress`.
 */
export function track<A>(tracker: string, toMsg: (p: Progress) => A): MySub<A> {
  //  subscription (MySub tracker toMsg)
  return { type: "MySub", tracker, toMsg };
}

/**
 * There are two phases to HTTP requests. First you **send** a bunch of data,
 * then you **receive** a bunch of data. For example, say you use `fileBody` to
 * upload a file of 262144 bytes. From there, progress will go like this:
 * ```
 * Sending   { sent =      0, size = 262144 }  -- 0.0
 * Sending   { sent =  65536, size = 262144 }  -- 0.25
 * Sending   { sent = 131072, size = 262144 }  -- 0.5
 * Sending   { sent = 196608, size = 262144 }  -- 0.75
 * Sending   { sent = 262144, size = 262144 }  -- 1.0
 * Receiving { received =  0, size = Just 16 } -- 0.0
 * Receiving { received = 16, size = Just 16 } -- 1.0
 * ```
 * With file uploads, the **send** phase is expensive. That is what we saw in our
 * example. But with file downloads, the **receive** phase is expensive.
 * Use [`fractionSent`](#fractionSent) and [`fractionReceived`](#fractionReceived)
 * to turn this progress information into specific fractions!
 * **Note:** The `size` of the response is based on the [`Content-Length`][cl]
 * header, and in rare and annoying cases, a server may not include that header.
 * That is why the `size` is a `Maybe Int` in `Receiving`.
 * [cl]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
 */
type Progress =
  | { readonly type: "Sending"; readonly sent: number; readonly size: number }
  | {
      readonly type: "Receiving";
      readonly received: number;
      readonly size: number | undefined;
    };

/**
 * Turn `Sending` progress into a useful fraction.
 *     fractionSent { sent =   0, size = 1024 } == 0.0
 *     fractionSent { sent = 256, size = 1024 } == 0.25
 *     fractionSent { sent = 512, size = 1024 } == 0.5
 *     -- fractionSent { sent = 0, size = 0 } == 1.0
 * The result is always between `0.0` and `1.0`, ensuring that any progress bar
 * animations never go out of bounds.
 * And notice that `size` can be zero. That means you are sending a request with
 * an empty body. Very common! When `size` is zero, the result is always `1.0`.
 * **Note:** If you create your own function to compute this fraction, watch out
 * for divide-by-zero errors!
 */
export function fractionSent(sent: number, size: number): number {
  return size === 0 ? 1 : clamp(0, 1, sent / size);
}
function clamp(min: number, max: number, value: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Turn `Receiving` progress into a useful fraction for progress bars.
 *     fractionReceived { received =   0, size = Just 1024 } == 0.0
 *     fractionReceived { received = 256, size = Just 1024 } == 0.25
 *     fractionReceived { received = 512, size = Just 1024 } == 0.5
 *     -- fractionReceived { received =   0, size = Nothing } == 0.0
 *     -- fractionReceived { received = 256, size = Nothing } == 0.0
 *     -- fractionReceived { received = 512, size = Nothing } == 0.0
 * The `size` here is based on the [`Content-Length`][cl] header which may be
 * missing in some cases. A server may be misconfigured or it may be streaming
 * data and not actually know the final size. Whatever the case, this function
 * will always give `0.0` when the final size is unknown.
 * Furthermore, the `Content-Length` header may be incorrect! The implementation
 * clamps the fraction between `0.0` and `1.0`, so you will just get `1.0` if
 * you ever receive more bytes than promised.
 * **Note:** If you are streaming something, you can write a custom version of
 * this function that just tracks bytes received. Maybe you show that 22kb or 83kb
 * have been downloaded, without a specific fraction. If you do this, be wary of
 * divide-by-zero errors because `size` can always be zero!
 * [cl]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
 */
export function fractionReceived(received: number, size: number | undefined): number {
  return size === undefined ? 0 : size === 0 ? 1 : clamp(0, 1, received / size);
}

// -- COMMANDS and SUBSCRIPTIONS

export type MyCmd<A> = Cancel | Request<A>;
export type Cancel = {
  readonly home: typeof home;
  readonly type: "Cancel";
  readonly tracker: string;
};
export type Request<A> = {
  readonly home: typeof home;
  readonly type: "Request";
  readonly method: string;
  readonly headers: ReadonlyArray<Header>;
  readonly url: string;
  readonly body: Body;
  readonly expect: Expect<A>;
  readonly timeout: number | undefined;
  readonly tracker: string | undefined;
  readonly allowCookiesFromOtherDomains: boolean;
};

export function mapCmd<A1, A2>(func: ActionMapper<A1, A2>, cmd: MyCmd<A1>): MyCmd<A2> {
  switch (cmd.type) {
    case "Cancel":
      return cmd;
    case "Request":
      return {
        ...cmd,
        expect: mapExpect(func, cmd.expect),
      };
    default:
      return exhaustiveCheck(cmd, true);
  }
}

export type MySub<A> = {
  readonly type: "MySub";
  readonly tracker: string;
  readonly toMsg: (p: Progress) => A;
};

export function mapSub<A1, A2>(func: ActionMapper<A1, A2>, sub: MySub<A1>): MySub<A2> {
  return { ...sub, toMsg: (p: Progress) => func(sub.toMsg(p)) };
}

// -- EFFECT MANAGER

const home = "http";

type State<A> = {
  readonly reqs: Reqs;
  readonly subs: ReadonlyArray<MySub<A>>;
};
type Reqs = { readonly [key: string]: () => void };

const init = <A>(): State<A> => ({ reqs: {}, subs: [] });

export const createEffectManager = <AppAction>(): EffectManager<
  AppAction,
  SelfAction,
  State<AppAction>,
  typeof home
> => ({
  home,
  mapCmd: (_, c) => c,
  mapSub: (_, s) => s,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEffects: onEffects as any,
  onSelfAction,
});

// -- APP MESSAGES

function onEffects<AppAction>(
  dispatchApp: Dispatch<AppAction>,
  dispatchSelf: Dispatch<SelfAction>,
  cmds: ReadonlyArray<MyCmd<AppAction>>,
  subs: ReadonlyArray<MySub<AppAction>>,
  state: State<AppAction>
): State<AppAction> {
  const reqs = updateReqs(dispatchApp, dispatchSelf, cmds, state.reqs);
  return { reqs, subs };
}

function updateReqs<A>(
  dispatchApp: Dispatch<A>,
  dispatchSelf: Dispatch<SelfAction>,
  cmds: ReadonlyArray<MyCmd<A>>,
  reqs: Reqs
): Reqs {
  if (cmds.length === 0) {
    return reqs;
  }

  const mutableReqs: { [key: string]: () => void } = { ...reqs };
  for (const cmd of cmds) {
    switch (cmd.type) {
      case "Cancel": {
        const req = mutableReqs[cmd.tracker];
        if (req !== undefined) {
          const abort = mutableReqs[cmd.tracker];
          abort();
          delete mutableReqs[cmd.tracker];
        }
        break;
      }

      case "Request": {
        // Process.spawn (Elm.Kernel.Http.toTask router (Platform.sendToApp router) req)
        //   |> Task.andThen (\pid ->
        //         case req.tracker of
        //           Nothing ->
        //             updateReqs router otherCmds reqs

        //           Just tracker ->
        //             updateReqs router otherCmds (Dict.insert tracker pid reqs)
        //     )
        const abort = toTask(dispatchApp, dispatchSelf, cmd);
        if (cmd.tracker !== undefined && abort !== undefined) {
          mutableReqs[cmd.tracker] = abort;
        }
        break;
      }

      default:
        exhaustiveCheck(cmd);
    }
  }
  return mutableReqs;
}

/*

updateReqs router cmds reqs =
  case cmds of
    [] ->
      Task.succeed reqs

    cmd :: otherCmds ->
      case cmd of
        Cancel tracker ->
          case Dict.get tracker reqs of
            Nothing ->
              updateReqs router otherCmds reqs

            Just pid ->
              Process.kill pid
                |> Task.andThen (\_ -> updateReqs router otherCmds (Dict.remove tracker reqs))

        Request req ->
          Process.spawn (Elm.Kernel.Http.toTask router (Platform.sendToApp router) req)
            |> Task.andThen (\pid ->
                  case req.tracker of
                    Nothing ->
                      updateReqs router otherCmds reqs

                    Just tracker ->
                      updateReqs router otherCmds (Dict.insert tracker pid reqs)
              )




*/

// -- SELF MESSAGES

type SelfAction = { readonly type: "Progress"; readonly tracker: string; readonly progress: Progress };

function onSelfAction<AppAction>(
  _dispatchApp: Dispatch<AppAction>,
  _dispatchSelf: Dispatch<SelfAction>,
  _action: SelfAction,
  state: State<AppAction> = init()
): State<AppAction> {
  // Task.sequence (List.filterMap (maybeSend router tracker progress) state.subs)
  //   |> Task.andThen (\_ -> Task.succeed state)
  return state;
}

/*

maybeSend : MyRouter msg -> String -> Progress -> MySub msg -> Maybe (Task x ())
maybeSend router desiredTracker progress (MySub actualTracker toMsg) =
  if desiredTracker == actualTracker then
    Just (Platform.sendToApp router (toMsg progress))
  else
    Nothing

*/

// -- SEND REQUEST

// eslint-disable-next-line functional/prefer-readonly-type
type XMLHttpRequestEx = XMLHttpRequest & { __isAborted: boolean };

function toTask<A>(
  dispatchApp: Dispatch<A>,
  dispatchSelf: Dispatch<SelfAction>,
  request: Request<A>
): (() => void) | undefined {
  function done(response: Response<unknown>): void {
    const value = request.expect.__toValue(response);
    dispatchApp(value);
  }

  const xhr = new XMLHttpRequest() as XMLHttpRequestEx;
  xhr.addEventListener("error", () => done({ type: "NetworkError_" }));
  xhr.addEventListener("timeout", () => done({ type: "Timeout_" }));
  xhr.addEventListener("load", () => done(_Http_toResponse(request.expect.__toBody, xhr)));
  // eslint-disable-next-line no-unused-expressions
  request.tracker && _Http_track(dispatchSelf, xhr, request.tracker);

  try {
    xhr.open(request.method, request.url, true);
  } catch (e) {
    done({ type: "BadUrl_", url: request.url });
    return undefined;
  }

  configureRequest(xhr, request);

  // eslint-disable-next-line no-unused-expressions
  request.body && request.body[0] && xhr.setRequestHeader("Content-Type", request.body[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xhr.send(request.body && (request.body[1] as any));

  return () => {
    xhr.__isAborted = true;
    xhr.abort();
  };
}

// -- CONFIGURE

function configureRequest(xhr: XMLHttpRequest, request: Request<unknown>): void {
  for (const header of request.headers) {
    xhr.setRequestHeader(header[0], header[1]);
  }
  xhr.timeout = request.timeout || 0;
  xhr.responseType = request.expect.__type;
  xhr.withCredentials = request.allowCookiesFromOtherDomains;
}

// -- RESPONSES

function _Http_toResponse(toBody: (a: unknown) => unknown, xhr: XMLHttpRequest): Response<unknown> {
  const metadata = _Http_toMetadata(xhr);
  const body = toBody(xhr.response);
  return xhr.status >= 200 && xhr.status < 300
    ? { type: "GoodStatus_", metadata, body }
    : { type: "BadStatus_", metadata, body };
}

// -- METADATA

function _Http_toMetadata(xhr: XMLHttpRequest): Metadata {
  return {
    url: xhr.responseURL,
    statusCode: xhr.status,
    statusText: xhr.statusText,
    headers: _Http_parseHeaders(xhr.getAllResponseHeaders()),
  };
}

// -- HEADERS

function _Http_parseHeaders(rawHeaders: string): { readonly [key: string]: string } {
  if (!rawHeaders) {
    return {};
  }

  const headers: { [key: string]: string } = {};
  const headerPairs = rawHeaders.split("\r\n");
  for (let i = headerPairs.length; i--; ) {
    const headerPair = headerPairs[i];
    const index = headerPair.indexOf(": ");
    if (index > 0) {
      const key = headerPair.substring(0, index);
      const value = headerPair.substring(index + 2);
      const oldValue = headers[key];
      headers[key] = oldValue !== undefined ? value + ", " + oldValue : value;
    }
  }
  return headers;
}

// -- BODY and PARTS

// const _Http_emptyBody = { $: 0 };
// const _Http_pair = F2(function(a, b) {
//   return { $: 0, a: a, b: b };
// });

// function _Http_toFormData(parts) {
//   for (
//     var formData = new FormData();
//     parts.b;
//     parts = parts.b // WHILE_CONS
//   ) {
//     var part = parts.a;
//     formData.append(part.a, part.b);
//   }
//   return formData;
// }

// var _Http_bytesToBlob = F2(function(mime, bytes) {
//   return new Blob([bytes], { type: mime });
// });

// -- PROGRESS

function _Http_track(dispatchSelf: Dispatch<SelfAction>, xhr: XMLHttpRequestEx, tracker: string): void {
  // TODO check out lengthComputable on loadstart event

  xhr.upload.addEventListener("progress", (event) => {
    if (xhr.__isAborted) {
      return;
    }
    dispatchSelf({ type: "Progress", tracker, progress: { type: "Sending", sent: event.loaded, size: event.total } });
  });
  xhr.addEventListener("progress", (event) => {
    if (xhr.__isAborted) {
      return;
    }
    dispatchSelf({
      type: "Progress",
      tracker,
      progress: {
        type: "Receiving",
        received: event.loaded,
        size: event.lengthComputable ? event.total : undefined,
      },
    });
  });
}

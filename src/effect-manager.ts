import { EffectManager, Dispatch, LeafEffect, Cmd } from "@typescript-tea/core";
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
export function get<A>(url: string): Cmd<A> {
  return request(
    "GET",
    [],
    url,
    emptyBody(),
    // expect: r.expect,
    undefined,
    undefined
  );
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
export function post<A>(
  url: string,
  body: Body
  // , expect : Expect msg
): Cmd<A> {
  return request("POST", [], url, body, /*expect,*/ undefined, undefined);
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
  // , expect : Expect msg
  //   onResponse: (result: Result<string, Error>) => A,
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
    // expect = r.expect,
    timeout,
    tracker,
    allowCookiesFromOtherDomains: false
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
export function jsonBody(
  value: {} | ReadonlyArray<unknown> | number | string | boolean
): Body {
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
  readonly __type: string;
  readonly __toBody: (a: unknown) => unknown;
  readonly __toValue: (a: Response<unknown>) => A;
};

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
export function expectString<A>(
  toMsg: (r: Result<Error, string>) => A
): Expect<A> {
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
export function expectWhatever<A>(
  toMsg: (r: Result<Error, readonly []>) => A
): Expect<A> {
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
          statusCode: response.metadata.statusCode
        });
      case "GoodStatus_":
        return mapError(
          () => ({
            type: "BadBody",
            body: (response.body as unknown) as string
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
  // expectStringResponse toMsg toResult =
  //   Elm.Kernel.Http.expect "" identity (toResult >> toMsg)
  return {
    type: "Expect",
    $: 0,
    __type: "",
    __toBody: (a: string) => a,
    __toValue: (a: Response<string>) => toMsg(toResult(a))
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
    __toBody: (arrayBuffer: unknown) =>
      new DataView(arrayBuffer as ArrayBuffer),
    __toValue: (a: Response<Bytes>) => toMsg(toResult(a))
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
      readonly meta: Metadata;
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
  readonly headers: ReadonlyMap<string, string>;
};

// -- COMMANDS and SUBSCRIPTIONS

export type MyCmd<A> = Cancel | Request<A>;
export type Cancel = {
  readonly home: typeof home;
  readonly type: "Cancel";
  readonly tracker: string;
};
export type Request<_A> = {
  readonly home: typeof home;
  readonly type: "Request";
  readonly method: string;
  readonly headers: ReadonlyArray<Header>;
  readonly url: string;
  readonly body: Body;
  // , expect : Expect msg
  readonly timeout: number | undefined;
  readonly tracker: string | undefined;
  readonly allowCookiesFromOtherDomains: boolean;
};

// function mapCmd() {}

// function mapSub() {}

// -- EFFECT MANAGER

const home = "http";

type State = {};

const init = (): State => ({});

type SelfAction = { readonly type: "Action1" } | { readonly type: "Action2" };

export const createEffectManager = <AppAction>(): EffectManager<
  AppAction,
  SelfAction,
  State,
  typeof home
> => ({
  home,
  mapCmd: (_, c) => c,
  mapSub: (_, s) => s,
  onEffects,
  onSelfAction
});

// -- APP MESSAGES

function onEffects<AppAction>(
  _dispatchApp: Dispatch<AppAction>,
  _dispatchSelf: Dispatch<SelfAction>,
  _cmds: ReadonlyArray<LeafEffect<AppAction>>,
  _subs: ReadonlyArray<LeafEffect<AppAction>>,
  state: State
): State {
  return state;
}

// -- SELF MESSAGES

function onSelfAction<AppAction>(
  _dispatchApp: Dispatch<AppAction>,
  _dispatchSelf: Dispatch<SelfAction>,
  _action: SelfAction,
  state: State = init()
): State {
  return state;
}

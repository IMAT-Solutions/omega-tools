# Omega API Docs

**Inline documentation for Omega based REST APIs.**

Omega provides a tool to generate HTML based documentation from information the developers provide in one or more comment sections of the API JavaScript source files. This information describes the various endpoints, their parameters and examples

All of these comment sections are wrapped like this:

```
/**
 *
 */
```

Inside these comments you place the information that defines the API. This information is a group of one ore more document tags. These tags define the API name, url, description, parameters, and other details about the API.

Here is an example of a full set of information defining one endpoint:

```
/**
 * @api {get} /api/account/prefs Get a set of preference values
 * @apiGroup Account Preferences
 * @apiDescription This is the description of how this API code will work.
 *
 * This is a multiline comment.
 * @apiParam (query) {string} ids Comma separated list of preference ids to get.
 * If `ids` is not provided then you will receive a `400 Bad Request` response.
 * @apiRequestValue <200> (query) ids hideSideBar,expertMode,theme,coolStuff
 * @apiRequestExample <200> Get Preferences
 * @apiResponseExample <200> Preference Object
 * {
 *   "hideSideBar": true,
 *   "expertMode": false,
 *   "theme": "dark",
 *   "coolStuff": {
 *     "one": 1,
 *     "two": "two",
 *     "three": "3"
 *   }
 * }
 *
 * @apiRequestExample <400> Bad Request
 * @apiResponseExample <400> Bad Request
 * {
 *   error: true,
 *   title: "Bad Request",
 *   status: 400,
 *   message: "You must supply a list of ids",
 *   url: "/api/account/prefs"
 * }
 */

```

## Getting Started

To be able to generate documentation from your API file you need to include a set of comments that contain a set of tags that define your API and information about it.

To use the Omega tool you need to install the `Omega` repo. You can do this globally:

```bask
npm install -g git+https://github.com/IMAT-Solutions/omega-tools.git
```

Or you can install `Omega` in your project:

```
npm install --save-dev git+https://github.com/IMAT-Solutions/omega-tools.git
```

### How to Run:

Running Omega Docs will parse through the files in a set of folders to generate a single `.json` file that contains all of the information needed to render the documentation.

If you have installed `Omega` globally then run:

```bash
omega docs
```

If `Omega` is installed only in your project then run:

```bash
npx omega docs
```

#### Command Line Parameters

`omega docs` can have one or two command line parameters. The first is the source folder and the second is the destination folder. These default to `./src/api` and `./dist/api`, which are the default folders for all Omega applications.

The command:

```bash
npm omega docs mysrc mydst
```

would read the source files from the folder `./mysrc` and its children and would place the output file `apidocs.json` into the folder `./mydst`.

### View the documentation

Once the document file `apidocs.json` has been generated you can view the documents by going to the page `/api` in the Omega app. If your Omega app is running on for 4000 then you can access the documentation by going to `http:/localhost:4000/api`

> By default the documentation page is enabled in all Omega apps. But this can be turned off by setting `"apidocs": false` in the file `app.config.json`

## Minimal Document comments

To make your comments useful they need at least 3 tags: `@api`, `@apiGroup` and `@apiDescription`.

```js
/**
 * @api {get} /api/items Get a list of items 
 * @apiGroup Stranger Things
 * @apiDescription Get a list of items.
 */
```

### Document tags

The document tags are grouped into general tags, parameters, examples and definitions.

#### General tags

##### @api

`@api` is the main tag to define the URL and title of the endpoint.

```
@api {method} url title
```

| Name                                                        | Description                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| {method}<span style="color:#0C0;font-weight:bold;">*</span> | Any HTTP method from this list: `get`, `put`, `post`, `delete`,  or `patch`. |
| url<span style="color:#0C0;font-weight:bold;">*</span>      | The URL path of the API endpoint.                            |
| title<span style="color:#0C0;font-weight:bold;">*</span>    | A brief title or description of this endpoint .              |

Examples:

```
@api {get} /api/account/prefs Get preference values
```

This tag indicates that there is an API located at the URL `/api/account/prefs` and that you access it using the `GET` HTTP method. The brief description of this API is `Get preference values`.

>  The `title` is the rest of the line after the URL, including all spaces.

---

##### @apiGroup

```
@apiGroup groupName
```

| Name                                                         | Description                                         |
| ------------------------------------------------------------ | --------------------------------------------------- |
| groupName<span style="color:#0C0;font-weight:bold;">*</span> | The name of the group this API endpoint belongs to. |

Examples:

```
@apiGroup Account Preferences
```

This tag indicates that the API belongs in the `Account Preferences` group. All other APIs that define the same group name will be represented together in the documentation.

> The `groupName` is the rest of the line after `@apiGroup`

---

##### @apiDescription

```
@apiDescription description
```

| Name                                                         | Description                                               |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| description<span style="color:#0C0;font-weight:bold;">*</span> | A multi lined description that supports minimal Markdown. |

Examples:

```
@apiDescription Provide a way to `get`, `set` and `delete` user preferences.
```

This tag provides a multi-lined description of this API. You can use based Markup in the description.

> The `description` is the rest of the line after `@apiDescription`

---

##### @apiStability

```
@apiStability apiState
```

| Name                                                         | Description                                               |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| apiState<span style="color:#0C0;font-weight:bold;">*</span> | Current state of the api. States: `dev`, `beta`, `prod`, `deprecated` |

Examples:

```
@apiStability dev
```

This tag indicates that the endpoint is currently in development and therefore probably subject to change and some bugginess.

> The `state` is the rest of the line after `@apiStability`

---

#### Parameters

There are five types of parameters using in an API endpoint. These include values embedded in the API URL `path`, `query` parameters, `header`s, `cookie`s and values passed in the `body` of a `PUT` or `POST`.

```
@apiParam [(paramType)] [{fieldType[=allowedValues]}] fieldName[=defaultValue] [description]
```

Describe a parameter passed to your API-Method.

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| (paramType)                                                  | The parameter type. This must be one of these values: `header`, `cookie`, `path`, `query` or `body`.<br />The default parameter type is `body`. |
| {fieldType}                                                  | The field type, ex: `{boolean}`, `{string}`, `{number}`, `{object}`, `{string, string[]}` <br />The default field type is `string`. |
| =allowedValues                                               | A list of allowed values for this field.<br />`{string="dog","cat"}` indicates that this field can only have the values of `"dog"` or `"cat"`. |
| fieldName<span style="color:#0C0;font-weight:bold;">*</span> | The name of the field. A field name with brackets, `[fieldName]` indicates that user developer can optionally supply a value for this field. |
| =defaultValue                                                | The default value for the field. `[admin=false]` would indicate that `admin` is optional and, if not provided, it will have the value of `false`. |
| description                                                  | The description of the field                                 |

Examples:

```
@apiParam (query) ids A comma separated list of preference ids you want to read.
@apiParam (path) {string} id User id.
@apiParam (header) [authuser] The user name. _Must be used with `authtoken`_
@apiParam (header) [authtoken] The **Secure token**. _Must be used wth `authuser`_
@apiParam (cookie) [auth_tkt] The session cookie.
_Use this instead of `authuser` and `authtoken`_
```

### Example tags

There are a set of tags that allow the developer to provide both request and response example. These tags are normally grouped by a response code. You would create a example response for a `200` status code and an example request that would cause the `200` status code response. 

#### Request example tags

##### @apiRequestValue

`@apiRequestValue` allows the developer to provide a value to be included in the matching request example. You can indicate the type of this value as `header`, `cookie`, `path`, `query` or `body`. Each value must also provide a `groupingId`, `name` and `value` .

```
@apiRequestValue <groupingId> [(paramType)] name value
```

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| &lt;groupingId&gt;<span style="color:#0C0;font-weight:bold;">*</span> | An id to group this request value with a specific request example. Normally this would be an HTTP response code like `200` or `404`. If you have several examples that will return an response code of `200` then you can add a dash and a letter (`-A`) after the response code. |
| (paramType)                                                  | The parameter type. This must be one of these values: `header`, `cookie`, `path`, `query` or `body`.<br />The default parameter type is `body`. |
| name<span style="color:#0C0;font-weight:bold;">*</span>      | Name of the parameter being defined                          |
| value<span style="color:#0C0;font-weight:bold;">*</span>     | Value of the parameter being defined                         |

Examples:

````
@apiRequestValue <201> (path) id food
@apiRequestValue <201> (header) Accept application/json
@apiRequestValue <403> (cookie) auth_tkt invalid value
````

##### @apiRequestExample

`@apiRequestExample`  allows the developer to create an example of an API request that is tied to `@apiRequestValue` and `@apiResponseExample` tags. For `GET` and `DELETE` operations you will only need to provide the `@apiRequestExample` line without any `value`. `PUT`, `POST` and `PATCH` should all have a `value` added just below the `@apiRequestExample` line.

```
@apiRequestExample <groupId> title
[requestBody]
```

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| &lt;groupdId&gt;<span style="color:#0C0;font-weight:bold;">*</span> | An id to group this request example with specific request values and a response example. Normally this would be an HTTP response code like `200` or `404`. If you have several examples that will return an response code of `200` then you can add a dash and a letter (`-A`) after the response code. |
| title<span style="color:#0C0;font-weight:bold;">*</span>     | The title for the request example output block.              |
| requestBody<span style="color:#0C0;font-weight:bold;">*</span> | The request body used for this example.                      |

Example:

```
@api {get} /api/blocks/:id Get a block
@apiRequestValue <200> (path) id 99
@apiRequestExample <200> Get Preferences
```

Example:

```
@api {put} /api/something/:id Save Something
@apiRequestValue <200> (path) id 20
@apiRequestExample <200> Save Something
{
  "key": "value
}
```

#### Response example tags

##### @apiResponseValue

`@apiResponseValue` allows the developer to provide a value to be included in the matching response example. You can indicate the type of this value as `header`, or `cookie`. Each value must also provide a ` groupingId`, `name` and `value` . The value for the response `body` should be defined as part of the `@apiResponseExample` tag.

```
@apiResponseValue <groupingId> (paramType) name value
```

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| &lt;groupingId&gt;<span style="color:#0C0;font-weight:bold;">*</span> | An id to group this request value with a specific request. Normally this would be an HTTP response code like `200` or `404`. If you have several examples that will return an response code of `200` then you can add a dash and a letter (`-A`) after the response code. |
| (paramType)<span style="color:#0C0;font-weight:bold;">*</span> | The parameter type. This must be one of these values: `header` or `cookie`. |
| name<span style="color:#0C0;font-weight:bold;">*</span>      | Name of the parameter being defined                          |
| value<span style="color:#0C0;font-weight:bold;">*</span>     | Value of the parameter being defined                         |

Examples:

```
@apiResponseValue <201> (header) Location /api/account/prefs/food
@apiResponseValue <200> (cookie) auth_tkt "valid sesson cookie"
```

##### @apiResponseExample

The `@apiResponseExample` tag allows the developer to create a title and a response `body` that are associated with the set of `@apiResponseValue` tag that use the same `groupId`.

```
@apiResponseExample <groupdId> [(contentType)] title
[responseBody]
```

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| <groupingId><span style="color:#0C0;font-weight:bold;">*</span> | An id to group this request value with a specific request. Normally this would be an HTTP response code like `200` or `404`. If you have several examples that will return an response code of `200` then you can add a dash and a letter (`-A`) after the response code. |
| (contentType)                                                | The value from the `Content-Type` header.<br />The default value is `application/json` |
| title<span style="color:#0C0;font-weight:bold;">*</span>     | The title of this example.                                   |
| responseBody                                                 | The body of the response, if there is any. _Will normally be a JSON object._ |

Example

```
@apiResponseExample <200> Preference Object
{
  "hideSideBar": true,
  "expertMode": false,
  "theme": "dark",
  "coolStuff": {
    "one": 1,
    "two": "two",
    "three": "3"
  }
}
```

### Definition tags

If you want to provide additional information about a group of APIs you can add new comment block that starts with `@apiDefineGroup` instead of `@api`.

##### @apiDefineGroup

```
@apiDefineGroup (groupName) url
[description]
[@apiParamTags]
```

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| (groupName)<span style="color:#0C0;font-weight:bold;">*</span> | The name of the group for which you are adding details.      |
| url<span style="color:#0C0;font-weight:bold;">*</span>       | The root url that shows in the docs with the `groupName`     |
| description                                                  | A description of this group of endpoints.                    |
| @apiParamTags                                                | Any `@apiParam` tags that are global for this group of endpoints. |

Example:

```
@apiDefineGroup (User) /api/user
A set of endpoints that allows access to the user object, the ability to log in and out, and the ability to change the user profile values and user preferences
@apiParam (cookie) auth_tkt "a valid sessionId"
```

## History

| Date       | Author       | Description                                                  |
| ---------- | ------------ | ------------------------------------------------------------ |
| 2019-03-29 | Mike Collins | Cleanup and minor improvements.                              |
| 2019-03-19 | Mike Collins | Finished initial release.<br />Added `@apiDefineGroup`, `@apiRequestValue`, `@apiRequestExample`, `@apiResponseValue` and `@apiResponseExample` |
| 2019-03-15 | Mike Collins | Initial documentation                                        |


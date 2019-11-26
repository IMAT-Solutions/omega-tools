# Write an API

Here are some general rules that need to be followed when writing an API in an Omega based app.

## `./src` folder vs `./dist folder`

In an Omega app you work in the `./src` folder and the build system copies and compiles everything needed to run into the `./dist` folder.

> Often, in this documentation, I will refer to the `./dist` folder. Just remember that you do not edit the files in the `./dist` folder. They are auto-generated and will be replaced the next time you build.

## The API generator

The easiest way to create a new API file is to use the Omega API generator CLI tool.

The command:

```bash
npx omega api "things/(thingid)/explode"
```

Will generate the file `explode.js` in the `./src/api/things/(thingid)` folder. By default this command will create `doGet`, `doPost`, `doPut` and `doDelete` methods. If you would like `doPatch` included in the generated file, append `--patch` to the `omega api` command.

Read ??? for details.

## The DOC comment blocks

All API files must have their DOC comment blocks.

Anyone doing a code review of an API file needs to validate the documentation too.

To convert the DOC comment blocks into the docs you can run the command:

```bash
npm omega docs
```

from the project folder. Then you should be able to view the documentation by going to

```http
https://localhost/api
```

Read [Omega API Docs.md](Omega API Docs.md) for details.

## How `require` works in an API file

For most commonJS files the `require` function loads files relative to the current file path. But with API files this would have lead to paths like this:

```js
const thing = require('../../../../../../../../../lib/thing')
```

To avoid that all API files use the `<project>/dist/lib` folder as the base for `require`. This means that no matter where your API file is located you simply need to do this:

```js
const thing = require('./thing')
```

to load the file `<project>/dist/lib/thing.js`

## The `/lib/model` folder for database code

If your app is going to access a database then you need to place the code that does the actual database functionality into the `./dist/lib/model` folder. You should place your library file into a sub folder that allows for grouping of similar types of functionality.

The folder `./dist/lib/model/account` should hold all of the code that access the database for any `account` type of functionality.

## Built-In Functions, Objects and Classes

The API system provides several helper functions, classes and objects that can be used in an API file without the need to use `require()`. These functions include:

- **Functions:** `require`, `isTrue`, `isFalse`, `mergeData`, `mergePatch`, and `throw404`
- **Objects:** `apimodule`, `__dirname` and `__filename`
- **Classes:** `HttpError` and `HttpResponse`

Read ??? for details.

## `req` parameters and methods

The `req` object has a few things available on it that each API might need. Below is a list of some of the most common things you may need in your API. Feel free to dig into the [Express `Request` object](https://devdocs.io/express-request/) for more information.

| name          | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `req.cookies` | The set of cookies passing into this request.                |
| `req.db`      | a set of database objects. As of 2019-04-05 there is only one object available: `req.db.mysql`<br />See the file `omegalib\lib\dbFactory\Mysql.js` |
| `req.headers` | The set of HTTP headers passed into this request.            |
| `req.params`  | The set of params that exist in the path part of the URL. These should be converted into the various ID values, but you can still access them through `req.params`. |
| `req.query`   | The list of query parameters from the URL. `req.query.testing` is the value for the query parameter `?testing=something` |
| `req.rest`    | A simplified object for making API calls to other servers that includes logging and time tracking. |
| `req.user`    | The user object of the currently logged in user.<br />`req.user.loggedIn` - `true` if the user is logged in.<br />`req.user.inGroup('group')` - `true` if the user is in the requested group.<<br />`req.user.inRole('role')` - `true` if the user is in the requested role.<br />`req.user.username` - The username of the logged in user<br />`req.user.provider` - The provider of the logged in user<br />`req.user.dbid` - the mysql database id from the `users` table<br />`req.user.name` - Display name of the logged in user |

## Session Cookie from Python

Currently the Python middleware code can cause a new session cookie to be set any time the current one expires. So, for now, every time you call down into a Python Middleware Endpoint you need to see if it returns a new session cookie, by checking to see if there is a response header `Set-Cookie`. If there is then you need to pass this along in the response to the browser.

## Common library functions

When common library functions are written they should be defined below.

| Function | File | Description | Author(s) |
| -------- | ---- | ----------- | --------- |
|          |      |             |           |

>  If we find that a common library function needs to be made available to all APIs then we will migrate it into the **Build-In functions** group.

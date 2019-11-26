# Omega Tools

The Omega tools repo is a set of tools used in the development of an Omega based app.

## Install Omega Tools

To use Omega tools you first must install them as a dev-dependency in your project:

```bash
npm install --save-dev git+https://github.com/IMAT-Solutions/omega-tools.git
```

Once there you can run omega from the command line:

```bash
npx omega api "user/(uid)/preferences"
```

Or you can add an omega command into your `package.json` file:

```json
  "scripts": {
    "build": "omega build",
    "clean": "omega rm dist coverage .nyc_output",
    "validate-api": "omega validate \"src/api/**/!(*.mocha).js\"",
    "watch": "omega watch"
  }
```

> Remember that `npx` is only needed for running Omega from the command-line and not in the `package.json` file.

## Omega tools commands

There are several commands that Omega tools can perform. The `imat-ui` project uses all of these commands. The available commands are:

### <a name="omegaapi">`omega api`</a>

Generate the shell of an API file.

```bash
npx omega api "<api-file-path>"
```

`<api-file-path>` is the name of the API file to generate relative to the API folder.

> You must put double quotes (`"`) around the path.

By default this command will create `doGet`, `doPost`, `doPut` and `doDelete` methods. If you would like `doPatch` included in the generated file, append `--patch` to the omega api command.

#### Examples

```bash
npx omega api "users"
```

Creates a file named `./src/api/users.js`. The functions in this file will be accessed by the URL `/api/users`.

---

```bash
npx omega api "users/(uid)/preferences"
```

Creates a file named `./src/api/users/(uid)/preferences.js`. The functions in this file will be accessed by the URL `/api/users/:uid/preferences`.

The `api` command creates a JavaScript file that includes the following functions:

`doGet`, `doPost`, `doPut`, `doDelete` and `doPatch`. These functions are then exported through a special object called `apimodule.exports`. This is similar to the commonJS `module.exports` but is designed to remind the developer that this file is not to be loaded using `require`. It is only to be loaded by the Omega API system.

>  The function `doGet` processes the method `GET`, `doPost` processes the method `POST`, etc. The function `doPatch` processes the method `PATCH` and utilizes the common routine function `mergePatch`.

Each function is passed in an object that contains the `req` property as well as any IDs that are defined in the directory structure. `doPut` and `doPost` also include the `data` property. The API file `preferences.js` that is located at `./src/api/user/(uid)/preferences.js` will always be passed in a value for `uid`.

The functions `doGet` and `doDelete` in the file `./src/api/user/(uid)/preferences.js` will receive an object like this: `{req: req, uid: req.params.uid}`. The function `doPost`, `doPut` and `doPatch` will receive an object like this: `{req: req, uid: req.params.uid, data: req.body}`.

The functions `doGet` and `doDelete` in the file `./src/api/user/(uid)/preferences/(prefid).js` will receive an object like this: `{req: req, uid: req.params.uid, prefid: req.params.prefid}`. The function `doPost`, `doPut` and `doPatch` will receive an object like this: `{req: req, uid: req.paramaters.uid, prefid: req.params.prefid, data: req.body}`.

The values for `data` will be passed in as a JavaScript object whether it was sent using URL Encoding or JSON encoding.

All values for IDs are passed as strings. If you need to convert the ID value to a number then you must either call `parseInt(id, 10)` or `Number(id)`

#### Return values for API functions

Each API function, `doGet`, `doPut`, etc. can return nothing, a `Promise` or any other kind of data. These functions can also call the function `throw404()` or throw an instance of `HttpError`.

- If the API function returns nothing then the API system will generate a response with the status code of `204` (No content) and no body.
- If the API function returns an instance of `HttpResponse`, then the API system passes the `HttpResponse.headers` as part of the response. If `HttpResponse.status` is set then that value is used for the response status, otherwise `204` is used if `HttpResponse.data` is empty or `200` if there is any value in `HttpResponse.data`.
- If the API function returns a `Promise` then the API system will wait until the `Promise` is resolved or rejected. If the `Promise` is resolved then it acts just like the paragraph above.
- If the API function returns any other data besides and `HTTPReponse`, or if the API function `Promise` resolves with any other data, then the API system will respond with a status code of `200` and the data returned as the body of the response.
- If the API function calls `throw404` then the API system returns a `404` response with the header `'X-No-Entity'` set to the provided path.
- If the API function throws an `HttpError` or the API function `Promise` rejects with an `HttpError` then the response with use the provided status, title, headers and data used when calling `new HttpError(<status>, <options>)`

#### Functions available to an API function

All API files are loaded through the API system.  The API system provides several helper functions, classes and objects that can be used in an API file without the need to use `require()`. These functions include:

* **Functions:** `require`, `isTrue`, `isFalse` and `throw404`
* **Objects:** `apimodule`, `__dirname` and `__filename`
* **Classes:** `HttpError` and `HttpResponse`

##### Function `require`

Your API file will need to include other code. The version of `require` used in the API files always originates in the `lib` folder instead of in the folder that contains the API file. This is a simplification to allow an API file be able to access the same `lib` files using the exact same path no matter where the API file is located.

`const fs = require('fs');` will load the node `fs` object.

`const minmatch = require('minmatch');` will load the dependency `minmatch` defined in the `package.json` file.

`const myLib = require('./mylib');` will load the file `/<project folder>/dist/lib/mylib.js`

##### Function `isTrue`

The function `isTrue` takes a string, normally from a query parameter and returns `true` if that string is either `'1'`, `'t'`, `'true'` or `true`. The check is case independent. All other values will return `false`.

**Example:**

```
function getList({req}) {
  if (isTrue(req.query.explode)) {
    // explode something.
  }
}
```

##### Function `isFalse`

The function `isFalse` takes a string, normally from a query parameter and returns `true` if that string is either `'0'`, `'f'`, `'false'` or `false`. The check is case independent. All other values will return `false`.

##### Function `mergePatch`

The function `mergePatch` will get an object from the server, merge it with the provided patch data and replace the server object with the new one.

##### Function `throw404`

If your API function needs to indicate that a resource is not available you must call `throw404(<path>, <message>)`. The `<path>` should be the URL path of the resource the calling application attempted to access.

**Example:** (File: `./src/api/users/(uid).js`)

```js
function doGet({uid, req}) { // eslint-disable-line no-unused-vars
  if (isValidId(uid)) {
    // Do something
    return value;
  }

  throw404(`/api/users/${uid}`, `${uid} was not found.`);
}
```

##### Object `apimodule`

Regular CommonJS files export their functions and objects on the `module` object. But, since and API file can only be loaded by the Omega API system, you export your API object on and `apimodule` object.

**Example:**

```js
apimodule.export = {doGet, doPut};
```

##### String `__dirname`

`__dirname` is the full path of the folder that holds the current API file.

##### String `__filename`

`__filename` is the full path to the current API file.

##### Class `HttpError`

If your API needs to respond with and HTTP error (Status code over 399) then it is best to throw a new [`HttpError`](../omega/docs/lib/HttpError.md) object.

##### Class `HttpResponse`

If your API needs to respond a successful response but needs to include headers or a different status code then `200` 0r `204`, then you need to respond with an instance of [`HttpResponse()`](../omega/docs/lib/HttpResponse.md).

### `omega build`

Build the app based on the `./build.config.json` file.

```bash
npx omega build [<build-args>] [<build-config-file>]
```

where `<build-args>` can be:

| build argument     | Description                               |
| ------------------ | ----------------------------------------- |
| `--noconcat`       | Do not run the concat step of the build   |
| `--verbose`        | Display more detailed output              |
| `--del <filename>` | Delete file `<filename>` before copy step |


Example `./build.config.json` file:

```json
{
  "filestocopy": {
    "node_modules/angular!(-mocks)/ang*!(-mocks).js": "dist/static/js/:1",
    "node_modules/jquery/dist/jquery*.js": "dist/static/js/jquery",
    "src/ui/!(imat)/**/*": "dist/static/ui/:2"
  },
  "filestoignore": [
    "**/test/**",
    "**/+(*fixture|*test|*karma|*spec).js"
  ],
  "filestoremove": [],
  "minify": {
    "js": [
      "dist/static/js/**/!(*.min).js"
    ]
  },
  "lesstocss": {
    "src/ui/imat/_shared/styles/styles.less": "dist/static/css/imat.css"
  },
  "concat": {
    "apps": {
      "imat": "imat",
      "login": "login"
    },
    "dstPath": "dist/static/js",
    "srcFiles": [
      "src/ui/{paths}/**/*.module.js",
      "src/ui/{paths}/**/modules/**/*.js",
      "src/ui/{paths}/**/*.dir.js",
      "src/ui/{paths}/**/*.js",
      "!**/*.{spec,test,karma,mocha}.js"
    ],
    "srcPath": "src"
  }
}
```

##### `filestocopy`

This is a list of files to copy if the source file is newer then the destination file.

**Examples:**

```
"filestocopy": {
  "node_modules/jquery/dist/jquery*.js": "dist/static/js/jquery"
}
```

The above example will copy all `jquery*.js` files from `node_modules/jquery.dist` into the folder `dist/static/js/jquery`

```js
"filestocopy": {
  "node_modules/codemirror/addon/+(dialog|search)/*.css": "dist/static/css/:1"
}
```

The above example will copy all `*.css` files from:
`node_modules/codemirror/addon/dialog` to `dist/static/css/codemirror/addon/dialog`
and from:
`node_modules/codemirror/addon/search` to `dist/static/css/codemirror/addon/search`

The `:1` indicates that the path is replicated starting at the first path past `node_modules`. If `:0` had been used then the one destination path would have been `dist/static/css/node_modules/codemirror/addon/dialog` and `:2` would have given the destination path of `dist/static/css/addon/dialog`.

A source file that starts with `"node_modules/"` will first check the local `node_modules` folder. If the file is not found there then we use `require.resolve` to find out where the file is. This only works on source filenames that do not have anything globby in its path. `"node_modules/dogs/dogs.js"` will work but `"node_modules/dogs/*.js"` will not.

##### `filestoignore`

`filestoignore` is an array of files that should not be copied even if they were found.

##### `filestoremove`

Sometimes you just can't create a good globby path and some files are copied that should not have been. `filestoremove` is an array of filenames that should be removed after all of the files are copied.

##### `minify`

`minify` currently only supports the ability to minify `.js` files. `minify.js` is an array of globby filenames to  minify.

> The minification process happens after all files are copied. So all our source code is minified and any third party code that was not already minified will also be minified.

##### `lesstocss`

`lesstocss` is an object where the key is the top-most `.less` file and the value is the destination `.css` file.

> After the first time the build tool creates a temporary `.json` file that includes a list of all `.less` files that are `imported` into the top-most file. This list is used to see if ANY of the `.less` files are changed to rebuild the appropriate `.css` file.

##### `concat`

This is a special operation for the imat-ui repo. We currently have a list of `.js` files that are concatenated together to create a single `.js` file.

> **_If you need support with this section, please talk to Mike. As he explains it, please transcribe that description here._**

### `omega docs`

Generate the file `apidocs.json` which contains all of the API information taken from the comment blocks in each of the API files.

```bash
npx omega docs [src-path [dst-path]]
```

`src-path`(optional) is the source path of the API files used to generate the API documentation. **If `src-path` is not provided then it will default to using `./src/api`.**

`dst-path`(optional) is the destination path of where to save the file `apidocs.json` which is used to render the API documentation. **If `dst-path` is not provided then it will default to using `./dist/api`.**

> You can not specify `dst-path` without also specifying `src-path`.

The file `apidocs.json` contains information from all API files found in the `src-path` and all children folders. This produces a single set of documentation for all APIs in an Omega application.

> More information about how to use the API DOCs can be found in the file [Omega API Docs.md](Omega API Docs.md).

### `omega rm`

a blobby version of `rm -rf <folder> [<folder2> ... <folderx>]`

```bash
npx omega rm <folder> [<folder> ... <folder>]
```

where `<folder>` is one or more globby folder names that are to be removed.

### `omega validate`

> Currently (2.1.0) not functioning.

Validate the API files in your API folder.

```bash
npx omega validate [<validate-files>]
```

where `<validate-files>` is a globby list of filenames to validate.

> (The default is "**./src/api/\*\*/!(\*.mocha).js**")

### `omega watch`

Watch the file system for changes. Run build as needed. Restart node as needed.

```bash
npx omega watch [<watch-config-file>]
```

where `<watch-config-file>` is the path to the config file to use for watch.

>  (The default value is "**./watch.config.json**")

> Most of the time developers should be able to run the command `npm run watch` which will, in turn, run `omega watch`

## Updated History:

| Date | Author | Ver | Description |
| --- | --- | --- | --- |
| 2019-06-17 | Jeremy Workman | 2.1.11 | * Update Omega version check to only include major and minor versions. |
| 2019-06-12 | Jeremy Workman | 2.1.10 | * Validate src/api folder before doc build. |
| 2019-06-10 | Jeremy Workman | 2.1.9 | * Run build docs on on omega build and watch. |
| 2019-06-10 | Jeremy Workman | 2.1.8 | * Utilize mergePatch in generated doPatch funcion. |
| 2019-06-05 | Mike Collins | 2.1.7 | * Added doPatch to generator. |
| 2019-05-30 | Jeremy Workman | 2.1.6 | * Added check for if @imat folder exists in node modules. |
| 2019-05-30 | Jeremy Workman | 2.1.5 | * Added Omega module version check on build. |
| 2019-05-29 | Jeremy Workman | 2.1.4 | * Added access to package.json version number on module |
| 2019-05-13 | Mike Collins | 2.1.2 | * Added keyboard functionality to watch to toggle between debug mode and non-debug mode (`'d'`), clear screen (`'c'`),  and restart (`'r'`) |
| 2019-05-03 | Mike Collins | 2.1.1 | * Added ability to better find node_module files specified in the `filestocopy` section of `build.config.json`. |
| 2019-04-30 | Mike Collins | 2.1.0 | * Changed API generation tool to conform to new interface<br/>* Updated dependencies<br/>* Updated Docs |
| 2019-04-24 | Mike Collins | 2.0.7 | * Changed sort order of the various endpoints.<br/>* Added more tests.<br/>* Updated version of `micromatch`. |
| 2019-04-19 | Mike Collins | 2.0.6 | * Updated versions of repos<br/>* Added docs on how to write API files. |
| 2019-03-29 | Mike Collins | 2.0.5 | * Updated the `Omega API Docs.md` file.<br/>* Improved the output of the AOI docs HTML page.<br/>* Create the folder for `apidocs.json` if it is not there.<br/>* Now only parse `.js` and `.api` files for the API docs.<br/>* Added comments in some files to help clarify what the code is doing.<br />* Updated this file `README.md`. |
| 2019-03-27 | Mike Collins | 2.0.4 | * Fixed watch to correctly delete folders or files that are removed from the `src` folder<br />* Fixed the less compilation code to create a dependencies json file to save off the list of dependencies for each root level `.less` file. This improves the building of CSS files from any `.less` file change.<br />* Added some `debug` output<br />* Fixed the display of the number of `.less` files compiled.<br />* Added some comments to help clarify what the code does.<br />* Removed unwanted `console.log` calls. |
| 2019-03-26 | Mike Collins | 2.0.3 | * Adding DOCS tool<br />* Updated .eslintrc.json to match our standard<br />* Removed un-needed `console.log` statements<br />* Added code to generate the DOC JSON file<br />* Adding tests to get back up to over 50%<br />* Correctly sorting params and endpoints in docs<br />* Added permissions in docs<br />* Trimming descriptions in docs<br />* Updated versions of acorn, eslint and mocha<br />* Further updates will be in `@imat/omega` project. |
| 2019-02-21 | Mike Collins | 2.0.2 | * Updated eslint to include `eslint-plugin-omega`<br/>* Added API comment to Omega cli<br/>* Updated to latest versions of `mocha` and `node-watch`<br/>* Created most of this README file. |

"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("src/middleware",{

/***/ "(middleware)/./src/middleware.ts":
/*!***************************!*\
  !*** ./src/middleware.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/esm/api/server.js\");\n\nasync function middleware(request) {\n    const { pathname } = request.nextUrl;\n    // Direct access: redirect legacy login pages and separate panels straight to the unified admin dashboard\n    if (pathname === \"/login\" || pathname.startsWith(\"/platform\") || pathname.startsWith(\"/portal\")) {\n        const homeUrl = new URL(\"/\", request.url);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(homeUrl);\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n}\nconst config = {\n    matcher: [\n        /*\n     * Match all request paths except for:\n     * - _next/static, _next/image (static assets)\n     * - files with an extension (images, icons, etc.)\n     */ \"/((?!_next/static|_next/image|.*\\\\..*).*)\"\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vc3JjL21pZGRsZXdhcmUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXdEO0FBRWpELGVBQWVDLFdBQVdDLE9BQW9CO0lBQ25ELE1BQU0sRUFBRUMsUUFBUSxFQUFFLEdBQUdELFFBQVFFLE9BQU87SUFFcEMseUdBQXlHO0lBQ3pHLElBQ0VELGFBQWEsWUFDYkEsU0FBU0UsVUFBVSxDQUFDLGdCQUNwQkYsU0FBU0UsVUFBVSxDQUFDLFlBQ3BCO1FBQ0EsTUFBTUMsVUFBVSxJQUFJQyxJQUFJLEtBQUtMLFFBQVFNLEdBQUc7UUFDeEMsT0FBT1IscURBQVlBLENBQUNTLFFBQVEsQ0FBQ0g7SUFDL0I7SUFFQSxPQUFPTixxREFBWUEsQ0FBQ1UsSUFBSTtBQUMxQjtBQUVPLE1BQU1DLFNBQVM7SUFDcEJDLFNBQVM7UUFDUDs7OztLQUlDLEdBQ0Q7S0FDRDtBQUNILEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vc3JjL21pZGRsZXdhcmUudHM/ZDE5OSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlkZGxld2FyZShyZXF1ZXN0OiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCB7IHBhdGhuYW1lIH0gPSByZXF1ZXN0Lm5leHRVcmw7XG5cbiAgLy8gRGlyZWN0IGFjY2VzczogcmVkaXJlY3QgbGVnYWN5IGxvZ2luIHBhZ2VzIGFuZCBzZXBhcmF0ZSBwYW5lbHMgc3RyYWlnaHQgdG8gdGhlIHVuaWZpZWQgYWRtaW4gZGFzaGJvYXJkXG4gIGlmIChcbiAgICBwYXRobmFtZSA9PT0gJy9sb2dpbicgfHxcbiAgICBwYXRobmFtZS5zdGFydHNXaXRoKCcvcGxhdGZvcm0nKSB8fFxuICAgIHBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9wb3J0YWwnKVxuICApIHtcbiAgICBjb25zdCBob21lVXJsID0gbmV3IFVSTCgnLycsIHJlcXVlc3QudXJsKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KGhvbWVVcmwpO1xuICB9XG5cbiAgcmV0dXJuIE5leHRSZXNwb25zZS5uZXh0KCk7XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIG1hdGNoZXI6IFtcbiAgICAvKlxuICAgICAqIE1hdGNoIGFsbCByZXF1ZXN0IHBhdGhzIGV4Y2VwdCBmb3I6XG4gICAgICogLSBfbmV4dC9zdGF0aWMsIF9uZXh0L2ltYWdlIChzdGF0aWMgYXNzZXRzKVxuICAgICAqIC0gZmlsZXMgd2l0aCBhbiBleHRlbnNpb24gKGltYWdlcywgaWNvbnMsIGV0Yy4pXG4gICAgICovXG4gICAgJy8oKD8hX25leHQvc3RhdGljfF9uZXh0L2ltYWdlfC4qXFxcXC4uKikuKiknLFxuICBdLFxufTtcblxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsIm1pZGRsZXdhcmUiLCJyZXF1ZXN0IiwicGF0aG5hbWUiLCJuZXh0VXJsIiwic3RhcnRzV2l0aCIsImhvbWVVcmwiLCJVUkwiLCJ1cmwiLCJyZWRpcmVjdCIsIm5leHQiLCJjb25maWciLCJtYXRjaGVyIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./src/middleware.ts\n");

/***/ })

});
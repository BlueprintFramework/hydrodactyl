"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HCaptchaProvider = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = _interopRequireWildcard(require("react"));
var _index = _interopRequireDefault(require("../index"));
var _Context = require("./Context");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var HCaptchaProvider = exports.HCaptchaProvider = function HCaptchaProvider(_ref) {
  var _ref$sitekey = _ref.sitekey,
    sitekey = _ref$sitekey === void 0 ? null : _ref$sitekey,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? "normal" : _ref$size,
    _ref$theme = _ref.theme,
    theme = _ref$theme === void 0 ? "light" : _ref$theme,
    _ref$rqdata = _ref.rqdata,
    rqdata = _ref$rqdata === void 0 ? null : _ref$rqdata,
    _ref$languageOverride = _ref.languageOverride,
    languageOverride = _ref$languageOverride === void 0 ? null : _ref$languageOverride,
    onVerify = _ref.onVerify,
    onError = _ref.onError,
    children = _ref.children;
  var hcaptchaRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2["default"])(_useState, 2),
    ready = _useState2[0],
    setReady = _useState2[1];
  var _useState3 = (0, _react.useState)(null),
    _useState4 = (0, _slicedToArray2["default"])(_useState3, 2),
    token = _useState4[0],
    setToken = _useState4[1];
  var _useState5 = (0, _react.useState)(null),
    _useState6 = (0, _slicedToArray2["default"])(_useState5, 2),
    error = _useState6[0],
    setError = _useState6[1];
  var handleReady = function handleReady() {
    setReady(true);
  };
  var handleError = function handleError(error) {
    setError(error);
    onError && onError(error);
  };
  var handleExpire = function handleExpire() {
    setToken(null);
  };
  var handleVerify = function handleVerify(token) {
    setToken(token);
    onVerify && onVerify(token);
  };
  var executeInstance = /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
      var config,
        _yield$hcaptchaRef$cu,
        response,
        _args = arguments;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            config = _args.length > 0 && _args[0] !== undefined ? _args[0] : {};
            _context.prev = 1;
            if (ready) {
              _context.next = 4;
              break;
            }
            throw new Error("hCaptcha not ready");
          case 4:
            if (token) {
              resetInstance();
            }
            _context.next = 7;
            return hcaptchaRef.current.execute(_objectSpread({
              async: true
            }, config.rqdata ? {
              rqdata: config.rqdata
            } : {}));
          case 7:
            _yield$hcaptchaRef$cu = _context.sent;
            response = _yield$hcaptchaRef$cu.response;
            setToken(response);
            return _context.abrupt("return", response);
          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](1);
            setError(_context.t0);
            onError && onError(_context.t0);
          case 17:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[1, 13]]);
    }));
    return function executeInstance() {
      return _ref2.apply(this, arguments);
    };
  }();
  var resetInstance = function resetInstance() {
    var _hcaptchaRef$current;
    hcaptchaRef === null || hcaptchaRef === void 0 || (_hcaptchaRef$current = hcaptchaRef.current) === null || _hcaptchaRef$current === void 0 || _hcaptchaRef$current.resetCaptcha();
  };
  (0, _react.useEffect)(function () {
    if (rqdata) {
      var _hcaptchaRef$current2;
      hcaptchaRef === null || hcaptchaRef === void 0 || (_hcaptchaRef$current2 = hcaptchaRef.current) === null || _hcaptchaRef$current2 === void 0 || _hcaptchaRef$current2.setData(rqdata);
    }
  }, [rqdata]);
  return /*#__PURE__*/_react["default"].createElement(_Context.HCaptchaContext.Provider, {
    value: {
      sitekey: sitekey,
      error: error,
      token: token,
      ready: ready,
      executeInstance: executeInstance,
      resetInstance: resetInstance
    }
  }, children, /*#__PURE__*/_react["default"].createElement(_index["default"], {
    sitekey: sitekey,
    size: size,
    theme: theme,
    languageOverride: languageOverride,
    onReady: handleReady,
    onVerify: handleVerify,
    onExpire: handleExpire,
    onError: handleError,
    ref: hcaptchaRef
  }));
};
import _extends from "@babel/runtime/helpers/extends";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import React, { useEffect, useRef, useState } from "react";
import HCaptcha from "../index";
import { HCaptchaContext } from "./Context";
export var HCaptchaProvider = function HCaptchaProvider(_ref) {
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
  var hcaptchaRef = useRef(null);
  var _useState = useState(false),
    ready = _useState[0],
    setReady = _useState[1];
  var _useState2 = useState(null),
    token = _useState2[0],
    setToken = _useState2[1];
  var _useState3 = useState(null),
    error = _useState3[0],
    setError = _useState3[1];
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
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(config) {
      var _yield$hcaptchaRef$cu, response;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (config === void 0) {
              config = {};
            }
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
            return hcaptchaRef.current.execute(_extends({
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
    return function executeInstance(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var resetInstance = function resetInstance() {
    var _hcaptchaRef$current;
    hcaptchaRef == null || (_hcaptchaRef$current = hcaptchaRef.current) == null || _hcaptchaRef$current.resetCaptcha();
  };
  useEffect(function () {
    if (rqdata) {
      var _hcaptchaRef$current2;
      hcaptchaRef == null || (_hcaptchaRef$current2 = hcaptchaRef.current) == null || _hcaptchaRef$current2.setData(rqdata);
    }
  }, [rqdata]);
  return /*#__PURE__*/React.createElement(HCaptchaContext.Provider, {
    value: {
      sitekey: sitekey,
      error: error,
      token: token,
      ready: ready,
      executeInstance: executeInstance,
      resetInstance: resetInstance
    }
  }, children, /*#__PURE__*/React.createElement(HCaptcha, {
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
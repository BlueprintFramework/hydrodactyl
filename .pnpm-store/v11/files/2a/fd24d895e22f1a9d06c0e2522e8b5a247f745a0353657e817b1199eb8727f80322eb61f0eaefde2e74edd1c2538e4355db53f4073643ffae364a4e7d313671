import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import * as React from 'react';
import { hCaptchaLoader } from '@hcaptcha/loader';
import { getFrame, getMountElement } from './utils.js';
var HCaptcha = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(HCaptcha, _React$Component);
  function HCaptcha(props) {
    var _this;
    _this = _React$Component.call(this, props) || this;

    /**
     * Internal reference to track hCaptcha API
     *
     * Required as window is relative to initialization in application
     * not where the script and iFrames have been loaded.
     */
    _this._hcaptcha = undefined;

    // API Methods
    _this.renderCaptcha = _this.renderCaptcha.bind(_assertThisInitialized(_this));
    _this.resetCaptcha = _this.resetCaptcha.bind(_assertThisInitialized(_this));
    _this.removeCaptcha = _this.removeCaptcha.bind(_assertThisInitialized(_this));
    _this.isReady = _this.isReady.bind(_assertThisInitialized(_this));
    _this._onReady = null;

    // Event Handlers
    _this.loadCaptcha = _this.loadCaptcha.bind(_assertThisInitialized(_this));
    _this.handleOnLoad = _this.handleOnLoad.bind(_assertThisInitialized(_this));
    _this.handleSubmit = _this.handleSubmit.bind(_assertThisInitialized(_this));
    _this.handleExpire = _this.handleExpire.bind(_assertThisInitialized(_this));
    _this.handleError = _this.handleError.bind(_assertThisInitialized(_this));
    _this.handleOpen = _this.handleOpen.bind(_assertThisInitialized(_this));
    _this.handleClose = _this.handleClose.bind(_assertThisInitialized(_this));
    _this.handleChallengeExpired = _this.handleChallengeExpired.bind(_assertThisInitialized(_this));
    _this.ref = /*#__PURE__*/React.createRef();
    _this.apiScriptRequested = false;
    _this.sentryHub = null;
    _this.captchaId = '';

    /**
     * Tracks the currently pending async execute() promise.
     * Stores { resolve, reject } so we can cancel on unmount/errors/etc.
     */
    _this._pendingExecute = null;
    _this.state = {
      isApiReady: false,
      isRemoved: false,
      elementId: props.id
    };
    return _this;
  }
  var _proto = HCaptcha.prototype;
  _proto.componentDidMount = function componentDidMount() {
    var _this2 = this;
    // Once captcha is mounted intialize hCaptcha - hCaptcha
    var element = getMountElement(this.props.scriptLocation);
    var frame = getFrame(element);
    this._hcaptcha = frame.window.hcaptcha || undefined;
    var isApiReady = typeof this._hcaptcha !== 'undefined';

    /*
     * Check if hCaptcha has already been loaded,
     * If Yes, render the captcha
     * If No, create script tag and wait to render the captcha
     */
    if (isApiReady) {
      this.setState({
        isApiReady: true
      }, function () {
        _this2.renderCaptcha();
      });
      return;
    }
    this.loadCaptcha();
  };
  _proto.componentWillUnmount = function componentWillUnmount() {
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    this._cancelPendingExecute('react-component-unmounted');
    if (!this.isReady()) {
      return;
    }

    // Reset any stored variables / timers when unmounting
    hcaptcha.reset(captchaId);
    hcaptcha.remove(captchaId);
  };
  _proto.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
    // Prevent component re-rendering when these internal state variables are updated
    if (this.state.isApiReady !== nextState.isApiReady || this.state.isRemoved !== nextState.isRemoved) {
      return false;
    }
    return true;
  };
  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var _this3 = this;
    // Prop Keys that could change
    var keys = ['sitekey', 'size', 'theme', 'tabindex', 'languageOverride', 'endpoint'];
    // See if any props changed during component update
    var match = keys.every(function (key) {
      return prevProps[key] === _this3.props[key];
    });

    // If they have changed, remove current captcha and render a new one
    if (!match) {
      this.removeCaptcha(function () {
        _this3.renderCaptcha();
      });
    }
  };
  _proto.loadCaptcha = function loadCaptcha() {
    if (this.apiScriptRequested) {
      return;
    }
    var _this$props = this.props,
      apihost = _this$props.apihost,
      assethost = _this$props.assethost,
      endpoint = _this$props.endpoint,
      host = _this$props.host,
      imghost = _this$props.imghost,
      hl = _this$props.languageOverride,
      reCaptchaCompat = _this$props.reCaptchaCompat,
      reportapi = _this$props.reportapi,
      sentry = _this$props.sentry,
      custom = _this$props.custom,
      loadAsync = _this$props.loadAsync,
      scriptLocation = _this$props.scriptLocation,
      scriptSource = _this$props.scriptSource,
      secureApi = _this$props.secureApi,
      _this$props$cleanup = _this$props.cleanup,
      cleanup = _this$props$cleanup === void 0 ? true : _this$props$cleanup,
      userJourneys = _this$props.userJourneys;
    var mountParams = {
      render: 'explicit',
      apihost: apihost,
      assethost: assethost,
      endpoint: endpoint,
      hl: hl,
      host: host,
      imghost: imghost,
      recaptchacompat: reCaptchaCompat === false ? 'off' : null,
      reportapi: reportapi,
      sentry: sentry,
      custom: custom,
      loadAsync: loadAsync,
      scriptLocation: scriptLocation,
      scriptSource: scriptSource,
      secureApi: secureApi,
      cleanup: cleanup,
      uj: userJourneys !== undefined ? userJourneys : false
    };
    hCaptchaLoader(mountParams).then(this.handleOnLoad, this.handleError)["catch"](this.handleError);
    this.apiScriptRequested = true;
  };
  _proto.renderCaptcha = function renderCaptcha(onRender) {
    var _this4 = this;
    var onReady = this.props.onReady;
    var isApiReady = this.state.isApiReady;
    var captchaId = this.captchaId;

    // Prevent calling hCaptcha render on two conditions:
    // • API is not ready
    // • Component has already been mounted
    if (!isApiReady || captchaId) return;
    var renderParams = Object.assign({
      "open-callback": this.handleOpen,
      "close-callback": this.handleClose,
      "error-callback": this.handleError,
      "chalexpired-callback": this.handleChallengeExpired,
      "expired-callback": this.handleExpire,
      "callback": this.handleSubmit
    }, this.props, {
      hl: this.props.hl || this.props.languageOverride,
      languageOverride: undefined
    });
    var hcaptcha = this._hcaptcha;
    //Render hCaptcha widget and provide necessary callbacks - hCaptcha
    var id = hcaptcha.render(this.ref.current, renderParams);
    this.captchaId = id;
    this.setState({
      isRemoved: false
    }, function () {
      onRender && onRender();
      onReady && onReady();
      _this4._onReady && _this4._onReady(id);
    });
  };
  _proto.resetCaptcha = function resetCaptcha() {
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    if (!this.isReady()) {
      return;
    }

    // Reset captcha state, removes stored token and unticks checkbox
    hcaptcha.reset(captchaId);
    this._cancelPendingExecute('hcaptcha-reset');
  };
  _proto.removeCaptcha = function removeCaptcha(callback) {
    var _this5 = this;
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    this._cancelPendingExecute('hcaptcha-removed');
    if (!this.isReady()) {
      return;
    }
    this.setState({
      isRemoved: true
    }, function () {
      _this5.captchaId = '';
      hcaptcha.remove(captchaId);
      callback && callback();
    });
  };
  _proto.handleOnLoad = function handleOnLoad() {
    var _this6 = this;
    this.setState({
      isApiReady: true
    }, function () {
      var element = getMountElement(_this6.props.scriptLocation);
      var frame = getFrame(element);
      _this6._hcaptcha = frame.window.hcaptcha;

      // render captcha and wait for captcha id
      _this6.renderCaptcha(function () {
        // trigger onLoad if it exists

        var onLoad = _this6.props.onLoad;
        if (onLoad) onLoad();
      });
    });
  };
  _proto.handleSubmit = function handleSubmit(event) {
    var onVerify = this.props.onVerify;
    var isRemoved = this.state.isRemoved;
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    if (typeof hcaptcha === 'undefined' || isRemoved) return;
    var token = hcaptcha.getResponse(captchaId); //Get response token from hCaptcha widget
    var ekey = hcaptcha.getRespKey(captchaId); //Get current challenge session id from hCaptcha widget
    if (onVerify) onVerify(token, ekey); //Dispatch event to verify user response
  };
  _proto.handleExpire = function handleExpire() {
    var onExpire = this.props.onExpire;
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    if (!this.isReady()) {
      return;
    }
    hcaptcha.reset(captchaId); // If hCaptcha runs into error, reset captcha - hCaptcha

    if (onExpire) onExpire();
  };
  _proto.handleError = function handleError(event) {
    var onError = this.props.onError;
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    if (this.isReady()) {
      // If hCaptcha runs into error, reset captcha - hCaptcha
      hcaptcha.reset(captchaId);
    }
    if (onError) onError(event);
  };
  _proto.isReady = function isReady() {
    var _this$state = this.state,
      isApiReady = _this$state.isApiReady,
      isRemoved = _this$state.isRemoved;
    return isApiReady && !isRemoved;
  }

  /**
   * Cancel any pending async execute() promise
   * Called when the component unmounts, errors occur, resets, etc.
   */;
  _proto._cancelPendingExecute = function _cancelPendingExecute(reason) {
    if (!this._pendingExecute) {
      return;
    }
    var pending = this._pendingExecute;
    this._pendingExecute = null;
    var error = new Error(reason);
    pending.reject(error);
  };
  _proto.handleOpen = function handleOpen() {
    if (!this.isReady() || !this.props.onOpen) {
      return;
    }
    this.props.onOpen();
  };
  _proto.handleClose = function handleClose() {
    if (!this.isReady() || !this.props.onClose) {
      return;
    }
    this.props.onClose();
  };
  _proto.handleChallengeExpired = function handleChallengeExpired() {
    if (!this.isReady() || !this.props.onChalExpired) {
      return;
    }
    this.props.onChalExpired();
  };
  _proto.execute = function execute(opts) {
    var _this7 = this;
    if (opts === void 0) {
      opts = null;
    }
    opts = typeof opts === 'object' ? opts : null;
    try {
      var hcaptcha = this._hcaptcha;
      var captchaId = this.captchaId;

      // Is an async execute and there's already 1 pending, cancel the old one.
      if (opts && opts.async && this._pendingExecute) {
        this._cancelPendingExecute('hcaptcha-execute-replaced');
      }
      if (!this.isReady()) {
        if (opts && opts.async) {
          return new Promise(function (resolve, reject) {
            _this7._pendingExecute = {
              resolve: resolve,
              reject: reject
            };
            _this7._onReady = function (id) {
              if (!_this7._pendingExecute) {
                return;
              }
              try {
                var _result = hcaptcha.execute(id, opts);
                if (_result && typeof _result.then === 'function') {
                  _result.then(function (val) {
                    _this7._pendingExecute = null;
                    resolve(val);
                  })["catch"](function (err) {
                    _this7._pendingExecute = null;
                    reject(err);
                  });
                } else {
                  _this7._pendingExecute = null;
                  reject(new Error('hcaptcha-execute-no-promise'));
                }
              } catch (e) {
                _this7._pendingExecute = null;
                reject(e);
              }
            };
          });
        } else {
          // Non-async: don't return a promise.
          this._onReady = function (id) {
            hcaptcha.execute(id, opts);
          };
          return null;
        }
      }

      // hCaptcha is ready, execute directly.
      var result = hcaptcha.execute(captchaId, opts);

      // If it's async execute, track it.
      if (opts && opts.async && result && typeof result.then === 'function') {
        return new Promise(function (resolve, reject) {
          _this7._pendingExecute = {
            resolve: resolve,
            reject: reject
          };
          result.then(function (val) {
            _this7._pendingExecute = null;
            resolve(val);
          })["catch"](function (err) {
            _this7._pendingExecute = null;
            reject(err);
          });
        });
      }
      return result;
    } catch (error) {
      if (opts && opts.async) {
        return Promise.reject(error);
      }
      return null;
    }
  };
  _proto.close = function close() {
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    this._cancelPendingExecute('hcaptcha-closed');
    if (!this.isReady()) {
      return;
    }
    return hcaptcha.close(captchaId);
  };
  _proto.setData = function setData(data) {
    var hcaptcha = this._hcaptcha;
    var captchaId = this.captchaId;
    if (!this.isReady()) {
      return;
    }
    if (data && typeof data !== "object") {
      data = null;
    }
    hcaptcha.setData(captchaId, data);
  };
  _proto.getResponse = function getResponse() {
    var hcaptcha = this._hcaptcha;
    return hcaptcha.getResponse(this.captchaId);
  };
  _proto.getRespKey = function getRespKey() {
    var hcaptcha = this._hcaptcha;
    return hcaptcha.getRespKey(this.captchaId);
  };
  _proto.render = function render() {
    var elementId = this.state.elementId;
    return /*#__PURE__*/React.createElement("div", {
      ref: this.ref,
      id: elementId
    });
  };
  return HCaptcha;
}(React.Component);
export default HCaptcha;
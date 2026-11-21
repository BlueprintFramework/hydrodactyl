"use strict";
"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Root: () => Switch,
  Switch: () => Switch,
  SwitchThumb: () => SwitchThumb,
  Thumb: () => SwitchThumb,
  createSwitchScope: () => createSwitchScope,
  unstable_BubbleInput: () => SwitchBubbleInput,
  unstable_Provider: () => SwitchProvider,
  unstable_SwitchBubbleInput: () => SwitchBubbleInput,
  unstable_SwitchProvider: () => SwitchProvider,
  unstable_SwitchTrigger: () => SwitchTrigger,
  unstable_Trigger: () => SwitchTrigger
});
module.exports = __toCommonJS(index_exports);

// src/switch.tsx
var React = __toESM(require("react"));
var import_primitive = require("@radix-ui/primitive");
var import_react_compose_refs = require("@radix-ui/react-compose-refs");
var import_react_context = require("@radix-ui/react-context");
var import_react_use_controllable_state = require("@radix-ui/react-use-controllable-state");
var import_react_use_previous = require("@radix-ui/react-use-previous");
var import_react_use_size = require("@radix-ui/react-use-size");
var import_react_primitive = require("@radix-ui/react-primitive");
var import_jsx_runtime = require("react/jsx-runtime");
var SWITCH_NAME = "Switch";
var [createSwitchContext, createSwitchScope] = (0, import_react_context.createContextScope)(SWITCH_NAME);
var [SwitchProviderImpl, useSwitchContext] = createSwitchContext(SWITCH_NAME);
function SwitchProvider(props) {
  const {
    __scopeSwitch,
    checked: checkedProp,
    children,
    defaultChecked,
    disabled,
    form,
    name,
    onCheckedChange,
    required,
    value = "on",
    // @ts-expect-error
    internal_do_not_use_render
  } = props;
  const [checked, setChecked] = (0, import_react_use_controllable_state.useControllableState)({
    prop: checkedProp,
    defaultProp: defaultChecked ?? false,
    onChange: onCheckedChange,
    caller: SWITCH_NAME
  });
  const [control, setControl] = React.useState(null);
  const [bubbleInput, setBubbleInput] = React.useState(null);
  const hasConsumerStoppedPropagationRef = React.useRef(false);
  const isFormControl = control ? !!form || !!control.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    true
  );
  const context = {
    checked,
    setChecked,
    disabled,
    control,
    setControl,
    name,
    form,
    value,
    hasConsumerStoppedPropagationRef,
    required,
    defaultChecked,
    isFormControl,
    bubbleInput,
    setBubbleInput
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchProviderImpl, { scope: __scopeSwitch, ...context, children: isFunction(internal_do_not_use_render) ? internal_do_not_use_render(context) : children });
}
var TRIGGER_NAME = "SwitchTrigger";
var SwitchTrigger = React.forwardRef(
  ({ __scopeSwitch, onClick, ...switchProps }, forwardedRef) => {
    const {
      value,
      disabled,
      checked,
      required,
      setControl,
      setChecked,
      hasConsumerStoppedPropagationRef,
      isFormControl,
      bubbleInput
    } = useSwitchContext(TRIGGER_NAME, __scopeSwitch);
    const composedRefs = (0, import_react_compose_refs.useComposedRefs)(forwardedRef, setControl);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_primitive.Primitive.button,
      {
        type: "button",
        role: "switch",
        "aria-checked": checked,
        "aria-required": required,
        "data-state": getState(checked),
        "data-disabled": disabled ? "" : void 0,
        disabled,
        value,
        ...switchProps,
        ref: composedRefs,
        onClick: (0, import_primitive.composeEventHandlers)(onClick, (event) => {
          setChecked((prevChecked) => !prevChecked);
          if (bubbleInput && isFormControl) {
            hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
            if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
          }
        })
      }
    );
  }
);
SwitchTrigger.displayName = TRIGGER_NAME;
var Switch = React.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSwitch,
      name,
      checked,
      defaultChecked,
      required,
      disabled,
      value,
      onCheckedChange,
      form,
      ...switchProps
    } = props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchProvider,
      {
        __scopeSwitch,
        checked,
        defaultChecked,
        disabled,
        required,
        onCheckedChange,
        name,
        form,
        value,
        internal_do_not_use_render: ({ isFormControl }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            SwitchTrigger,
            {
              ...switchProps,
              ref: forwardedRef,
              __scopeSwitch
            }
          ),
          isFormControl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            SwitchBubbleInput,
            {
              __scopeSwitch
            }
          )
        ] })
      }
    );
  }
);
Switch.displayName = SWITCH_NAME;
var THUMB_NAME = "SwitchThumb";
var SwitchThumb = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSwitch, ...thumbProps } = props;
    const context = useSwitchContext(THUMB_NAME, __scopeSwitch);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_primitive.Primitive.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...thumbProps,
        ref: forwardedRef
      }
    );
  }
);
SwitchThumb.displayName = THUMB_NAME;
var BUBBLE_INPUT_NAME = "SwitchBubbleInput";
var SwitchBubbleInput = React.forwardRef(
  ({ __scopeSwitch, ...props }, forwardedRef) => {
    const {
      control,
      hasConsumerStoppedPropagationRef,
      checked,
      defaultChecked,
      required,
      disabled,
      name,
      value,
      form,
      bubbleInput,
      setBubbleInput
    } = useSwitchContext(BUBBLE_INPUT_NAME, __scopeSwitch);
    const composedRefs = (0, import_react_compose_refs.useComposedRefs)(forwardedRef, setBubbleInput);
    const prevChecked = (0, import_react_use_previous.usePrevious)(checked);
    const controlSize = (0, import_react_use_size.useSize)(control);
    React.useEffect(() => {
      const input = bubbleInput;
      if (!input) return;
      const inputProto = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        "checked"
      );
      const setChecked = descriptor.set;
      const bubbles = !hasConsumerStoppedPropagationRef.current;
      if (prevChecked !== checked && setChecked) {
        const event = new Event("click", { bubbles });
        setChecked.call(input, checked);
        input.dispatchEvent(event);
      }
    }, [bubbleInput, prevChecked, checked, hasConsumerStoppedPropagationRef]);
    const defaultCheckedRef = React.useRef(checked);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_react_primitive.Primitive.input,
      {
        type: "checkbox",
        "aria-hidden": true,
        defaultChecked: defaultChecked ?? defaultCheckedRef.current,
        required,
        disabled,
        name,
        value,
        form,
        ...props,
        tabIndex: -1,
        ref: composedRefs,
        style: {
          ...props.style,
          ...controlSize,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: "translateX(-100%)"
        }
      }
    );
  }
);
SwitchBubbleInput.displayName = BUBBLE_INPUT_NAME;
function isFunction(value) {
  return typeof value === "function";
}
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
//# sourceMappingURL=index.js.map

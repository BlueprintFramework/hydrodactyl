var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $h2mV5$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTypeSelect", function () { return $a6299e8d95fc8908$export$e32c88dfddc6e1d8; });
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

/**
 * Controls how long to wait before clearing the typeahead buffer.
 */ const $a6299e8d95fc8908$var$TYPEAHEAD_DEBOUNCE_WAIT_MS = 1000; // 1 second
function $a6299e8d95fc8908$export$e32c88dfddc6e1d8(options) {
    let { keyboardDelegate: keyboardDelegate, selectionManager: selectionManager, onTypeSelect: onTypeSelect } = options;
    let state = (0, $h2mV5$react.useRef)({
        search: '',
        timeout: undefined
    });
    let onKeyDownCapture = (e)=>{
        // if we're in the middle of a search, then a spacebar should be treated as a search and we should not propagate the event
        // since we handle this one in a capture phase, we should ignore it in the bubble phase
        if (state.current.search.length > 0 && e.key === ' ') {
            e.preventDefault();
            if (!('continuePropagation' in e) || 'continuePropagation' in e && !e.isPropagationStopped()) e.stopPropagation();
            state.current.search += ' ';
            if (keyboardDelegate.getKeyForSearch != null) {
                // Use the delegate to find a key to focus.
                // Prioritize items after the currently focused item, falling back to searching the whole list.
                let key = keyboardDelegate.getKeyForSearch(state.current.search, selectionManager.focusedKey);
                // If no key found, search from the top.
                if (key == null) key = keyboardDelegate.getKeyForSearch(state.current.search);
                if (key != null) {
                    selectionManager.setFocusedKey(key);
                    if (onTypeSelect) onTypeSelect(key);
                }
            }
            clearTimeout(state.current.timeout);
            state.current.timeout = setTimeout(()=>{
                state.current.search = '';
            }, $a6299e8d95fc8908$var$TYPEAHEAD_DEBOUNCE_WAIT_MS);
        }
    };
    let onKeyDown = (e)=>{
        let character = $a6299e8d95fc8908$var$getStringForKey(e.key);
        if (!character || e.ctrlKey || e.metaKey || e.altKey || !(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) || state.current.search.length === 0 && character === ' ') return;
        state.current.search += character;
        if (keyboardDelegate.getKeyForSearch != null) {
            // Use the delegate to find a key to focus.
            // Prioritize items after the currently focused item, falling back to searching the whole list.
            let key = keyboardDelegate.getKeyForSearch(state.current.search, selectionManager.focusedKey);
            if (key == null) key = keyboardDelegate.getKeyForSearch(state.current.search);
            if (key != null) {
                selectionManager.setFocusedKey(key);
                if (onTypeSelect) onTypeSelect(key);
                e.preventDefault();
                if (!('continuePropagation' in e)) e.stopPropagation();
            } else {
                // if still nothing then the type to select is done and everything is reset
                state.current.search = '';
                clearTimeout(state.current.timeout);
                state.current.timeout = undefined;
                return;
            }
        }
        clearTimeout(state.current.timeout);
        state.current.timeout = setTimeout(()=>{
            state.current.search = '';
        }, $a6299e8d95fc8908$var$TYPEAHEAD_DEBOUNCE_WAIT_MS);
    };
    (0, $h2mV5$react.useEffect)(()=>{
        let timeout = state.current.timeout;
        return ()=>{
            clearTimeout(timeout);
        };
    }, [
        state
    ]);
    return {
        typeSelectProps: {
            // Using a capturing listener to catch the keydown event before
            // other hooks in order to handle the Spacebar event.
            onKeyDownCapture: keyboardDelegate.getKeyForSearch ? onKeyDownCapture : undefined,
            onKeyDown: keyboardDelegate.getKeyForSearch ? onKeyDown : undefined
        }
    };
}
function $a6299e8d95fc8908$var$getStringForKey(key) {
    // If the key is of length 1, it is an ASCII value.
    // Otherwise, if there are no ASCII characters in the key name,
    // it is a Unicode character.
    // See https://www.w3.org/TR/uievents-key/
    if (key.length === 1 || !/^[A-Z]/i.test(key)) return key;
    return '';
}


//# sourceMappingURL=useTypeSelect.cjs.map

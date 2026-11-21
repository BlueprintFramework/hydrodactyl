Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/getAttributes.ts
/**
* Copyright IBM Corp. 2018, 2026
*
* This source code is licensed under the Apache-2.0 license found in the
* LICENSE file in the root directory of this source tree.
*/
const defaultAttributes = {
	focusable: "false",
	preserveAspectRatio: "xMidYMid meet"
};
/**
* Get supplementary HTML attributes for a given <svg> element based on existing
* attributes.
*/
function getAttributes({ width, height, viewBox = `0 0 ${width} ${height}`, ...attributes } = {}) {
	const { tabindex, ...rest } = attributes;
	const iconAttributes = {
		...defaultAttributes,
		...rest,
		width,
		height,
		viewBox
	};
	if (iconAttributes["aria-label"] || iconAttributes["aria-labelledby"]) {
		iconAttributes.role = "img";
		if (tabindex !== void 0 && tabindex !== null) {
			iconAttributes.focusable = "true";
			iconAttributes.tabindex = tabindex;
		}
	} else iconAttributes["aria-hidden"] = true;
	return iconAttributes;
}
//#endregion
//#region src/toString.ts
/**
* Copyright IBM Corp. 2018, 2024
*
* This source code is licensed under the Apache-2.0 license found in the
* LICENSE file in the root directory of this source tree.
*/
/**
* Convert an icon descriptor to a String
*/
function toString(descriptor) {
	const { elem = "svg", attrs = {}, content = [] } = descriptor;
	const children = content.map(toString).join("");
	if (elem !== "svg") return `<${elem} ${formatAttributes(attrs)}>${children}</${elem}>`;
	return `<${elem} ${formatAttributes(getAttributes(attrs))}>${children}</${elem}>`;
}
function formatAttributes(attrs) {
	return Object.keys(attrs).reduce((acc, key, index) => {
		const attribute = `${key}="${attrs[key]}"`;
		if (index === 0) return attribute;
		return acc + " " + attribute;
	}, "");
}
//#endregion
//#region src/toSVG.ts
/**
* Copyright IBM Corp. 2018, 2024
*
* This source code is licensed under the Apache-2.0 license found in the
* LICENSE file in the root directory of this source tree.
*/
/**
* Convert an icon descriptor to a DOM node.
*/
function toSVG(descriptor) {
	const { elem = "svg", attrs = {}, content = [] } = descriptor;
	const node = document.createElementNS("http://www.w3.org/2000/svg", elem);
	const attributes = elem !== "svg" ? attrs : getAttributes(attrs);
	Object.keys(attributes).forEach((key) => {
		node.setAttribute(key, attrs[key]);
	});
	for (let i = 0; i < content.length; i++) node.appendChild(toSVG(content[i]));
	return node;
}
//#endregion
//#region src/index.ts
/**
* Copyright IBM Corp. 2018, 2023
*
* This source code is licensed under the Apache-2.0 license found in the
* LICENSE file in the root directory of this source tree.
*/
//#endregion
exports.defaultAttributes = defaultAttributes;
exports.formatAttributes = formatAttributes;
exports.getAttributes = getAttributes;
exports.toSVG = toSVG;
exports.toString = toString;

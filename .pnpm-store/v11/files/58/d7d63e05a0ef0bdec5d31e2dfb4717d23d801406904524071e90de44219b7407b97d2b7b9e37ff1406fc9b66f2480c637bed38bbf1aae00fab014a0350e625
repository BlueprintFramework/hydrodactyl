'use client';
'use strict';

const h = (type, props = {}, ...children) => {
  if (props === null)
    props = {};
  props.children = children;
  return {
    type,
    props
  };
};

exports.createElement = h;
exports.h = h;
exports.jsx = h;
exports.jsxs = h;

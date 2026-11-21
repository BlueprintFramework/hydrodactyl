#!/usr/bin/env node
/*
 * Copyright IBM Corp. 2023, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
var d=function(t,r,i,e){function a(o){return o instanceof i?o:new i(function(c){c(o)})}return new(i||(i=Promise))(function(o,c){function f(n){try{s(e.next(n))}catch(p){c(p)}}function l(n){try{s(e.throw(n))}catch(p){c(p)}}function s(n){n.done?o(n.value):a(n.value).then(f,l)}s((e=e.apply(t,r||[])).next())})},u;const v=16,h=parseInt((u=process.versions.node.split(".")[0])!==null&&u!==void 0?u:"0");h<16&&(console.log("Telemetry collection not supported in this environment. Skipping"),process.exit(0));function _(){return d(this,void 0,void 0,function*(){const{notify:t}=yield import("./notify.js");t();const{spawnBackgroundProcess:r}=yield import("./spawn-background-process.js");r()})}_().catch(t=>{console.error(t)});

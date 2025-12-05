'use strict';
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.PluginEvent = void 0;
/**
 * Plugin registry event types
 */
var PluginEvent;
(function (PluginEvent) {
  PluginEvent['REGISTERED'] = 'plugin:registered';
  PluginEvent['UNREGISTERED'] = 'plugin:unregistered';
  PluginEvent['ENABLED'] = 'plugin:enabled';
  PluginEvent['DISABLED'] = 'plugin:disabled';
  PluginEvent['ERROR'] = 'plugin:error';
})(PluginEvent || (exports.PluginEvent = PluginEvent = {}));

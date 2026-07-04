#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
void (0, core_1.run)()
    .then(() => (0, core_1.flush)())
    .catch(core_1.Errors.handle);

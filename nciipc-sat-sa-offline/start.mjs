#!/usr/bin/env node
console.log("Starting SAT-SA Air-Gapped Supervisor Analytics Engine...");
console.log("Initializing local SQLite store...");
process.env.PORT = 8080;
process.env.HOST = "0.0.0.0";
process.env.NODE_ENV = "production";
import("./.vercel/output/functions/__server.func/index.mjs");
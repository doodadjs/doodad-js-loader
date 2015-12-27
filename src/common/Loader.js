//! REPLACE_BY("// Copyright 2015 Claude Petit, licensed under Apache License version 2.0\n")
// dOOdad - Class library for Javascript (BETA) with some extras (ALPHA)
// File: Loader.js - Optional Loader
// Project home: https://sourceforge.net/projects/doodad-js/
// Trunk: svn checkout svn://svn.code.sf.net/p/doodad-js/code/trunk doodad-js-code
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2015 Claude Petit
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//		http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.
//! END_REPLACE()

(function() {
	var global = this;

	// Node.js
	var exports;
	if (global.process) {
		exports = module.exports = {};
	} else {
		exports = global;
	};

	global.DD_MODULES = (global.DD_MODULES || {});
	global.DD_MODULES['Doodad.Loader'] = {
		type: null,
		version: '0a',
		namespaces: null,
		dependencies: ['Doodad.Namespaces'],
		proto: null,
		
		create: function create(root, /*optional*/_options) {
			"use strict";

			//===================================
			// Get namespaces
			//===================================
			var doodad = root.Doodad,
				loader = doodad.Loader,
				types = doodad.Types,
				tools = doodad.Tools,
				namespaces = doodad.Namespaces;
					
			//===================================
			// Loader options
			//===================================
			loader.options = {
				// Settings
				settings: {
					defaultAsync: true,
				},
			};
			
			types.depthExtend(1, loader.options, _options);
			
			//===================================
			// Internals
			//===================================
			// <FUTURE> Thread context
			var __Internal__ = {
				remaining: 0,		// <FUTURE> global for every thread
				lastEx: null,		// <FUTURE> global for every thread
				evalCache: null,	// <FUTURE> global for every thread
			};

			//===================================
			// Events
			//===================================
			
			tools.onloading = null;
			tools.onwaiting = null;
			tools.onsuccess = null;
			tools.onerror = null;
			
			
			//===================================
			// Utilities
			//===================================
			
			loader.initScripts = function initScripts(before, scripts) {
				var ok = false,
					removed,
					script, dependencies, dependency, dependencyBefore, dependencyScripts, conditions, initializers, exprs, expr, val, result, 
					beforeScript, beforeDependencies, beforeDependency, beforeConditions, beforeExprs, beforeExprsLen,
					thisObj,
					len = scripts.length,
					j,
					k;
				
				do {
					removed = false;
					
					__Internal__.evalCache = {};

					while (len) {
						script = (scripts[0] || {});
						dependencies = (script.dependencies || []);
						
						j = 0;
						nextDependency: while (j < dependencies.length) {
							dependency = (dependencies[j] || {});
							
							dependencyBefore = !!dependency.before;
							if (dependencyBefore !== before) {
								j++;
								continue nextDependency;
							};
							
							conditions = (dependency.conditions || {});
							dependencyScripts = (dependency.scripts || []);
							initializers = (dependency.initializers || []);
							
							// Evaluate "exclude" conditions...
							exprs = conditions.exclude || [];  // "or" conditions
							result = false;
							k = 0;
							while (k < exprs.length) {
								val = false;
								try {
									expr = exprs[k];
									if (types.isObject(expr)) {
										thisObj = expr.thisObj;
										if (types.isString(thisObj)) {
											thisObj = tools.safeEvalCached(__Internal__.evalCache, thisObj, {root: root}, null, true);
										};
										val = expr._function;
										if (types.isString(val)) {
											val = tools.safeEvalCached(__Internal__.evalCache, val, {root: root}, null, true);
										};
										if (types.isFunction(val)) {
											val = val.call(thisObj, root);
										};
									} else {
										if (types.isString(expr)) {
											val = tools.safeEvalCached(__Internal__.evalCache, expr, {root: root}, null, true);
										};
										if (types.isFunction(val)) {
											val = val.call(undefined, root);
										};
									};
								} catch(ex) {
									if (ex instanceof types.ScriptAbortedError) {
										throw ex;
									};
									__Internal__.lastEx = ex;
								};
								if (val) {
									exprs.length = 0;
									result = true;
								} else {
									k++;
								};
							};

							exprs = conditions.include || []; // "and" conditions
							if (result) {
								// When "exclude" returns "true", ignore this dependency.
								exprs.length = 0;
								dependencyScripts.length = 0;
								initializers.length = 0;
							} else {
								// When "exclude" returns "false", evaluate "include" condition...
								result = true;
								k = 0;
								nextExpr: while (k < exprs.length) {
									expr = exprs[k];
									
									if (!before) {
										nextBeforeScript: for (var l = 1; l < len; l++) {
											beforeScript = scripts[l] || {};
											beforeDependencies = beforeScript.dependencies || [];
											for (var m = 0; m < beforeDependencies.length; m++) {
												beforeDependency = beforeDependencies[m] || {};
												if (beforeDependency.before) {
													beforeConditions = beforeDependency.conditions || {};
													beforeExprs = beforeConditions.include || [];
													beforeExprsLen = beforeExprs.length;
													for (var n = 0; n < beforeExprsLen; n++) {
														if (beforeExprs[n] === expr) {
															result = false;
															break nextBeforeScript;
														};
													};
												};
											};
										};
									};

									if (result) {
										val = false;
										try {
											if (types.isObject(expr)) {
												thisObj = expr.thisObj;
												if (types.isString(thisObj)) {
													thisObj = tools.safeEvalCached(__Internal__.evalCache, thisObj, {root: root}, null, true, false);
												};
												val = expr._function;
												if (types.isString(val)) {
													val = tools.safeEvalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
												};
												if (types.isFunction(val)) {
													val = val.call(thisObj, root);
												};
											} else {
												if (types.isString(expr)) {
													val = tools.safeEvalCached(__Internal__.evalCache, expr, {root: root}, null, true, false);
												};
												if (types.isFunction(val)) {
													val = val.call(undefined, root);
												};
											};
										} catch(ex) {
											if (ex instanceof types.ScriptAbortedError) {
												throw ex;
											};
											__Internal__.lastEx = ex;
										};
										if (!val) {
											result = false;
										};
									};
									
									if (result) {
										exprs.splice(k, 1);
									} else {
										break nextExpr;
									};
								};
							};
							
							// If there are remaining "include" conditions, stop to proceed this dependency
							if (exprs.length) {
								break nextDependency;
							};
							
							if ((dependencyScripts.deletedItems || 0) >= dependencyScripts.length) {
								// All scripts have been deleted
								dependencyScripts.length = 0;
							};
							
							if (!dependencyScripts.length) {
								// When every "include" conditions are "true", and every scripts are loaded, execute initializers...
								while (initializers.length) {
									expr = initializers[0];
									try {
										if (types.isObject(expr)) {
											thisObj = expr.thisObj;
											if (types.isString(thisObj)) {
												thisObj = tools.safeEvalCached(__Internal__.evalCache, thisObj, {root: root}, null, true, false);
											};
											val = expr._function;
											if (types.isString(val)) {
												val = tools.safeEvalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
											};
											if (types.isFunction(val)) {
												val = val.call(thisObj, root);
											};
										} else {
											if (types.isString(expr)) {
												val = tools.safeEvalCached(__Internal__.evalCache, expr, {root: root}, null, true, false);
											};
											if (types.isFunction(val)) {
												val = val.call(undefined, root);
											};
										};
									} catch(ex) {
										if (ex instanceof types.ScriptAbortedError) {
											throw ex;
										};
										if (root.DD_ASSERT) {
											throw ex;
										};
										__Internal__.lastEx = ex;
										break;
									};
									initializers.splice(0, 1);
								};
							};
							
							if (!dependencyScripts.length && !initializers.length) {
								dependencies.splice(j, 1);
							} else {
								j++;
							};
						};

						scripts.splice(0, 1);

						if (dependencies.length) {
							// Missing dependencies, move last
							scripts.push(script);
						} else {
							// When every dependencies are meet, remove entry...
							ok = true;
							removed = true;
						};

						len--;
					};
				} while (removed);

				return ok;
			};
			
			loader.loadMissings = function loadMissings(before, scripts, reload, async) {
				var ok = false,
					loading,
					script, dependencies, dependency, conditions, dependencyBefore, exprs, dependencyScripts, dependencyScript, initializers, scriptType,
					i = 0,
					j,
					k,
					scriptLoaders = [];
					
				function makeHandler(scripts, dependencies, dependencyScripts, initializers, k) {
					return function loadScriptHandler(ev) {
						try {
							if (ev.detail && ev.detail.finalize) {
								ev.detail.finalize();
							};
							if (!this.failed || dependencyScripts[k].optional) {
								delete dependencyScripts[k];
								dependencyScripts.deletedItems++;
							};
						} catch(ex) {
							if (ex instanceof types.ScriptAbortedError) {
								throw ex;
							};
							if (root.DD_ASSERT) {
								debugger;
							};
							throw ex;
						} finally {
							__Internal__.remaining--;
							if (__Internal__.remaining === 0) {
								loader.loadScripts(scripts, reload, async);
							};
						};
					};
				};
				
				nextScript: for (i = 0; i < scripts.length; i++) {
					script = (scripts[i] || {});
					dependencies = (script.dependencies || []);
					
					j = 0;
					nextDependency: for (j = 0; j < dependencies.length; j++) {
						dependency = (dependencies[j] || {});
						conditions = (dependency.conditions || {});

						dependencyBefore = !!conditions.before;
						if (dependencyBefore !== before) {
							j++;
							continue nextDependency;
						};

						exprs = (conditions.include || []);
						dependencyScripts = (dependency.scripts || []);
						initializers = (dependency.initializers || []);

						if (!types.hasKey(dependencyScripts, 'deletedItems')) {
							dependencyScripts.deletedItems = 0;
						};

						// If ready to load scripts...
						if (!exprs.length) {
							// Load scripts
							var dependencyScriptsLen = dependencyScripts.length;
							nextDependencyScript: for (k = 0; k < dependencyScriptsLen; k++) {
								if (k in dependencyScripts) {
									dependencyScript = dependencyScripts[k];
									scriptType = (dependencyScript.fileType || 'js');
									
									var url = dependencyScript.baseUrl;
									if (types.isFunction(url)) {
										try {
											url = (url(root) || '');
											dependencyScript.baseUrl = url;
										} catch(o) {
											if (o instanceof types.ScriptAbortedError) {
												throw ex;
											};
											__Internal__.lastEx = o;
											url = null;
										};
									};
									var file = dependencyScript.fileName;
									if (types.isFunction(file)) {
										try {
											file = (file(root) || '');
											dependencyScript.fileName = file;
										} catch(o) {
											if (o instanceof types.ScriptAbortedError) {
												throw ex;
											};
											__Internal__.lastEx = o;
											file = null;
										};
									};
									if (url && file) {
										if (types.isString(url)) {
											url = tools.Url.parse(url);
										};

										if (root.DD_ASSERT) {
											root.DD_ASSERT && root.DD_ASSERT(types._instanceof(url, [tools.Url, tools.Path]), "Invalid url.");
											root.DD_ASSERT && root.DD_ASSERT(types.isString(file), "Invalid file.");
										};
										
										file = tools.Url.parse(file, {
											protocol: 'file',
											isRelative: true, // allow relative
										});

										url = url.combine(file);

										var scriptLoader = null;
										if (scriptType === 'js') {
											scriptLoader = tools.getJsScriptFileLoader(/*url*/url, /*async*/async, /*timeout*/dependencyScript.timeout, /*reload*/reload);
										} else if (scriptType === 'css') {
											if (tools.getCssScriptFileLoader) {
												async = false;
												scriptLoader = tools.getCssScriptFileLoader(/*url*/url, /*async*/async, /*media*/dependencyScript.media, /*timeout*/dependencyScript.timeout, /*reload*/reload);
											} else {
												// Not supported
												ok = dependencyScript.optional;
												if (ok) {
													delete dependencyScripts[k];
													dependencyScripts.deletedItems++;
													dependencyScriptsLen--;
													continue nextDependencyScript;
												};
											};
										};

										if (scriptLoader) {
											if (scriptLoader.launched) {
												// Script has already been asked
												if (scriptLoader.ready) {
													if (!scriptLoader.failed || dependencyScript.optional) {
														// Script is already loaded
														delete dependencyScripts[k];
														dependencyScripts.deletedItems++;
														ok = true;
														dependencyScriptsLen--;
														continue nextDependencyScript;
													};
												};
											} else if (!scriptLoader.__attached) {
												// Load new script
												__Internal__.remaining++;
												var handler = makeHandler(scripts, dependencies, dependencyScripts, initializers, k);
												scriptLoader.addEventListener('load', handler);
												scriptLoader.addEventListener('error', handler);
												scriptLoaders.push(scriptLoader);
												scriptLoader.__attached = true;
												ok = true;
											};
										};
									};
								};
							};
						};
					};
				};
				
				// Start loaders
				var scriptLoadersLen = scriptLoaders.length;
				for (var i = 0; i < scriptLoadersLen; i++) {
					scriptLoaders[i].start();
				};

				if (!scripts.length) {
					ok = true;
				};
				
				return ok;
			};

			loader.dumpFailed = function dumpFailed(scripts) {
				var scriptsLen = scripts.length,
					script,
					optionalDependencies,
					i;
				for (i = 0; i < scriptsLen; i++) {
					script = scripts[i] || {};
					optionalDependencies = tools.filter((script.dependencies || []), function(dependency) {
						return dependency.optional;
					});
					if (!optionalDependencies.length) {
						tools.log(tools.LogLevels.Error, script.description);
					};
				};
			};
			
			loader.areOptional = function areOptional(scripts) {
				return !tools.some(scripts, function(script) {
					return tools.some((script.dependencies || []), function(dependency) {
						return !dependency.optional;
					});
				});
			};
			
			loader.loadScripts = function loadScripts(/*optional*/scripts, /*optional*/reload, /*optional*/async) {
				var done = true;
				try {
					if (types.isNothing(global.DD_SCRIPTS)) {
						global.DD_SCRIPTS = [];
					};
					root.DD_ASSERT && root.DD_ASSERT(types.isArray(global.DD_SCRIPTS), 'Invalid scripts array.');
					if (types.isNothing(scripts)) {
						scripts = global.DD_SCRIPTS;
					} else {
						root.DD_ASSERT && root.DD_ASSERT(types.isArray(scripts), 'Invalid scripts array.');
						if (scripts !== global.DD_SCRIPTS) {
							types.prepend(scripts, global.DD_SCRIPTS);
							global.DD_SCRIPTS.length = 0;
						};
					};
					reload = !!reload;
					if (types.isNothing(async)) {
						async = !!loader.options.settings.defaultAsync;
					} else {
						async = !!async;
					};

					__Internal__.remaining = 0;
					__Internal__.lastEx = null;
					__Internal__.evalCache = {};
					
					done = namespaces.loadNamespaces(!!scripts.length);

					if (scripts.length) {
						loader.dispatchEvent(new types.CustomEvent('loading'));
						
						while (scripts.length) {
							var ok = loader.initScripts(true, scripts);
							ok = loader.initScripts(false, scripts) || ok;
							
							if (!ok) {
								ok = loader.loadMissings(true, scripts, reload, async);
								ok = loader.loadMissings(false, scripts, reload, async) || ok;
								
								if (ok) {
									loader.dispatchEvent(new types.CustomEvent('waiting'));
									
								} else {
									ok = loader.areOptional(scripts);
									
									if (!ok) {
										done = false;
										tools.log(tools.LogLevels.Error, "The following scripts failed to load or to initialize :");
										loader.dumpFailed(scripts);
										if (root.DD_ASSERT) {
											debugger;
										};
									};
									
									scripts.length = 0;
								};
								
								break;
							};
						};
					};
					
					return done;
					
				} catch(ex) {
					if (ex instanceof types.ScriptAbortedError) {
						throw ex;
					};
					if (root.DD_ASSERT) {
						throw ex;
					};
					__Internal__.lastEx = ex;
					tools.log(tools.LogLevels.Error, "Loader failed :");
					tools.log(tools.LogLevels.Error, ex);
					if (ex.stack) {
						tools.log(tools.LogLevels.Error, ex.stack);
					};
					
				} finally {
					if (__Internal__.lastEx && root.DD_ASSERT) {
						throw __Internal__.lastEx;
					};
					if (done) {
						loader.dispatchEvent(new types.CustomEvent('success'));
					} else {
						loader.dispatchEvent(new types.CustomEvent('error'));
					};
				};
			};

			//===================================
			// Init
			//===================================
			//return function init(/*optional*/options) {
			//};
		},
	};

	var __prevOnLoad__ = exports.onload;
	exports.onload = function onload(ev) {
		if (__prevOnLoad__) {
			__prevOnLoad__.call(this, ev);
		};
		
		var root = global.createRoot(global.DD_MODULES),
			doodad = root.Doodad,
			namespaces = doodad.Namespaces;

		namespaces.loadNamespaces(true);
		doodad.Loader.loadScripts();
	};
})();

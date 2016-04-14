//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// dOOdad - Object-oriented programming framework
// File: Loader.js - Optional Loader
// Project home: https://sourceforge.net/projects/doodad-js/
// Trunk: svn checkout svn://svn.code.sf.net/p/doodad-js/code/trunk doodad-js-code
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2016 Claude Petit
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

	var exports = {};
	
	//! BEGIN_REMOVE()
	if ((typeof process === 'object') && (typeof module === 'object')) {
	//! END_REMOVE()
		//! IF_DEF("serverSide")
			module.exports = exports;
		//! END_IF()
	//! BEGIN_REMOVE()
	};
	//! END_REMOVE()
	
	exports.add = function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Doodad.Loader'] = {
			version: /*! REPLACE_BY(TO_SOURCE(VERSION(MANIFEST("name")))) */ null /*! END_REPLACE() */,
			
			proto: function(root) {
				var types = root.Doodad.Types;
				return {
					setOptions: types.SUPER(function setOptions(/*paramarray*/) {
						options = this._super.apply(this, arguments);
						options.defaultAsync = types.toBoolean(types.get(options, 'defaultAsync'));
						return options;
					}),
				};
			},
			
			create: function create(root, /*optional*/_options) {
				"use strict";

				//===================================
				// Get namespaces
				//===================================
				var doodad = root.Doodad,
					loader = doodad.Loader,
					types = doodad.Types,
					tools = doodad.Tools,
					files = tools.Files,
					safeEval = tools.SafeEval,
					namespaces = doodad.Namespaces;
						
				//===================================
				// Internals
				//===================================
				// <FUTURE> Thread context
				var __Internal__ = {
					lastEx: null,		// <FUTURE> global for every thread
					evalCache: null,	// <FUTURE> global for every thread
					oldSetOptions: null,
				};

				//===================================
				// Loader options
				//===================================
				loader.setOptions({
					// Settings
					defaultAsync: true,
				}, _options);
				
				
				//===================================
				// Events
				//===================================
				
				loader.onloading = null;
				loader.onwaiting = null;
				loader.onsuccess = null;
				loader.onerror = null;
				
				
				//===================================
				// Utilities
				//===================================
				
				__Internal__.initScripts = function initScripts(before, scripts) {
					var Promise = types.getPromise();
					
					function doExcludes(exclude) {
						if (!exclude.length) {
							return Promise.resolve(true);
						};
						
						var expr = exclude[0],
							val = false;
						
						if (expr) {
							try {
								if (types.isObject(expr)) {
									var thisObj = expr.thisObj;
									if (types.isString(thisObj)) {
										thisObj = safeEval.evalCached(__Internal__.evalCache, thisObj, {root: root}, null, true);
									};
									val = expr._function;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true);
									};
									if (types.isFunction(val)) {
										val = val.call(thisObj, root);
									};
								} else {
									val = expr;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true);
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
						};
						
						if (!types.isPromise(val)) {
							val = Promise.resolve(val);
						};
						
						return val.then(function(result) {
							if (result) {
								return false;
							} else {
								exclude.shift();
								return doExcludes(exclude);
							};
						});
					};

					function doIncludes(include) {
						if (!include.length) {
							return Promise.resolve(true);
						};
						
						var expr = include[0];
						
						var val = false;
							
						if (expr) {
							if (!before) {
								for (var i = 1; i < scripts.length; i++) {
									if (i in scripts) {
										var beforeScript = scripts[i] || {};
										var beforeDependencies = beforeScript.dependencies || [];
										for (var j = 0; j < beforeDependencies.length; j++) {
											if (j in beforeDependencies) {
												var beforeDependency = beforeDependencies[j] || {};
												if (beforeDependency.before) {
													var beforeConditions = beforeDependency.conditions || {};
													var beforeExprs = beforeConditions.include || [];
													for (var k = 0; k < beforeExprs.length; k++) {
														if (k in beforeExprs) {
															if (beforeExprs[k] === expr) {
																return Promise.resolve(false);
															};
														};
													};
												};
											};
										};
									};
								};
							};

							try {
								if (types.isObject(expr)) {
									thisObj = expr.thisObj;
									if (types.isString(thisObj)) {
										thisObj = safeEval.evalCached(__Internal__.evalCache, thisObj, {root: root}, null, true, false);
									};
									val = expr._function;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
									};
									if (types.isFunction(val)) {
										val = val.call(thisObj, root);
									};
								} else {
									val = expr;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
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
							
						} else {
							val = true;
						};
						
						if (!types.isPromise(val)) {
							val = Promise.resolve(val);
						};
						
						return val.then(function(result) {
							if (result) {
								include.shift();
								return doIncludes(include);
							} else {
								return false;
							};
						});
					};
					
					function doInitializers(initializers) {
						if (!initializers.length) {
							return Promise.resolve(true);
						};
						
						var expr = initializers.shift(),
							val;
							
						if (expr) {
							try {
								if (types.isObject(expr)) {
									var thisObj = expr.thisObj;
									if (types.isString(thisObj)) {
										thisObj = safeEval.evalCached(__Internal__.evalCache, thisObj, {root: root}, null, true, false);
									};
									val = expr._function;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
									};
									if (types.isFunction(val)) {
										val = val.call(thisObj, root);
									};
								} else {
									val = expr;
									if (types.isString(val)) {
										val = safeEval.evalCached(__Internal__.evalCache, val, {root: root}, null, true, false);
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
								return Promise.resolve(false);
							};
						};
						
						if (types.isPromise(val)) {
							return val
								.then(function() {
									return doInitializers(initializers);
								});
						} else {
							return doInitializers(initializers);
						};
					};
					
					function loopDependencies(dependencies, index) {
						if (index >= dependencies.length) {
							return Promise.resolve(false);
						};
						
						var dependency = (dependencies[index] || {});
						
						var dependencyBefore = !!dependency.before;
						if (dependencyBefore !== before) {
							// Skip
							return loopDependencies(dependencies, ++index);
						};
						
						var conditions = (dependency.conditions || {});
						
						return doExcludes(conditions.exclude || [])
							.then(function(ok) {
								if (ok) {
									return doIncludes(conditions.include || []);
								} else {
									return false;
								};
							})
							.then(function(ok) {
								if (ok) {
									var dependencyScripts = (dependency.scripts || []);
									if (dependencyScripts.length) {
										return false;
									} else {
										return doInitializers(dependency.initializers || []);
									};
								} else {
									return false;
								};
							})
							.then(function(ok) {
								if (ok) {
									dependencies.splice(index, 1);
									index = 0;
								} else {
									index++;
								};
								return loopDependencies(dependencies, index);
							});
					};
					
					var removed = false,
						last = null;
					
					function loopScripts() {
						if (!scripts.length) {
							return Promise.resolve(true);
						};
						
						if (scripts[0] === last) {
							return Promise.resolve(false);
						};
						
						var script = (scripts.shift() || {}),
							dependencies = (script.dependencies || []);
							
						return loopDependencies(dependencies, 0)
							.nodeify(function(err, ok) {
								if (err || dependencies.length) {
									// Move last
									scripts.push(script);
									if (!last) {
										last = script;
									};
								} else {
									__Internal__.evalCache = {};
									removed = true;
								};
								if (err) {
									throw err;
								};
								return loopScripts();
							});
					};

					return loopScripts()
						.then(function(ok) {
							return ok || removed;
						});
				};
				
				__Internal__.loadMissings = function loadMissings(before, scripts, reload, async) {
					var Promise = types.getPromise();

					var promises = [];
						
					for (var i = 0; i < scripts.length; i++) {
						if (i in scripts) {
							var script = (scripts[i] || {}),
								dependencies = (script.dependencies || []);
							
							for (var j = 0; j < dependencies.length; j++) {
								if (j in dependencies) {
									var dependency = (dependencies[j] || {}),
										conditions = (dependency.conditions || {});

									var dependencyBefore = !!conditions.before;
									if (dependencyBefore !== before) {
										continue;
									};

									var exprs = (conditions.include || []),
										dependencyScripts = (dependency.scripts || []);

									// If ready to load scripts...
									if (!exprs.length) {
										// Load scripts
										var dependencyScript;
										while (dependencyScript = dependencyScripts.shift()) {
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
											if (!types.isPromise(url)) {
												url = Promise.resolve(url);
											};
											var promise = (function(promise, dependencyScript) {
												return promise.then(function(url) {
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
															var tmp = files.Url.parse(url);
															if (!tmp.protocol) {
																tmp = files.Path.parse(url);
															};
															url = tmp;
														};

														if (root.DD_ASSERT) {
															root.DD_ASSERT && root.DD_ASSERT(types._instanceof(url, [files.Url, files.Path]), "Invalid url.");
															root.DD_ASSERT && root.DD_ASSERT(types.isString(file), "Invalid file.");
														};
														
														file = files.Path.parse(file, {
															isRelative: true, // force relative
															dirChar: ['/', '\\'],
														});

														url = url.set({file: null}).combine(file);

														var scriptLoader = null;
														var scriptType = (dependencyScript.fileType || 'js');
														if (scriptType === 'js') {
															scriptLoader = tools.getJsScriptFileLoader(/*url*/url, /*async*/async, /*timeout*/dependencyScript.timeout, /*reload*/reload);
														} else if (scriptType === 'css') {
															if (tools.getCssScriptFileLoader) {
																async = false;
																scriptLoader = tools.getCssScriptFileLoader(/*url*/url, /*async*/async, /*media*/dependencyScript.media, /*timeout*/dependencyScript.timeout, /*reload*/reload);
															} else {
																// Skip
																return true;
															};
														};

														if (scriptLoader) {
															if (scriptLoader.launched) {
																return true; // already loaded
															} else {
																// Load new script
																return new Promise(function(resolve, reject) {
																		scriptLoader.addEventListener('load', resolve);
																		scriptLoader.addEventListener('error', reject);
																		scriptLoader.start();
																	})
																	.then(function(ev) {
																		if (ev.detail && ev.detail.finalize) {
																			ev.detail.finalize();
																		};
																		return true;
																	})
																	['catch'](function(ev) {
																		throw new types.Error("Unable to load file '~0~'.", [url.toString()]);
																	});
															};
														};
													};
													
													return false;
												});
											})(url, dependencyScript);
											
											promises.push(promise);
										};
									};
								};
							};
						};
					};
					return Promise.all(promises)
						.then(function(results) {
							var loaded = tools.some(results, function(result) {
								return result;
							});
							return loaded;
						});
				};

				__Internal__.dumpFailed = function dumpFailed(scripts) {
					for (var i = 0; i < scripts.length; i++) {
						if (i in scripts) {
							var script = scripts[i] || {};
							var optionalDependencies = tools.filter((script.dependencies || []), function(dependency) {
								return dependency.optional;
							});
							if (!optionalDependencies.length) {
								tools.log(tools.LogLevels.Error, script.description);
							};
						};
					};
				};
				
				__Internal__.areOptional = function areOptional(scripts) {
					return !tools.some(scripts, function(script) {
						return tools.some((script.dependencies || []), function(dependency) {
							return !dependency.optional;
						});
					});
				};
				
				loader.loadScripts = function loadScripts(scripts, /*optional*/reload, /*optional*/async) {
					var Promise = types.getPromise();

					root.DD_ASSERT && root.DD_ASSERT(types.isArray(scripts), 'Invalid scripts array.');
					
					reload = !!reload;
					
					if (types.isNothing(async)) {
						async = !!loader.getOptions().defaultAsync;
					} else {
						async = !!async;
					};

					__Internal__.lastEx = null;
					__Internal__.evalCache = {};

					function loopScripts() {
						if (!scripts.length) {
							return namespaces.load(global.DD_MODULES, null, null, false);
						};
						
						return namespaces.load(global.DD_MODULES, null, null, true)
							.then(function(done) {
								return __Internal__.initScripts(true, scripts)
							})
							.then(function(ok1) {
								return __Internal__.initScripts(false, scripts)
									.then(function(ok2) {
										return ok1 || ok2;
									});
							})
							.then(function(ok) {
								if (ok) {
									return loopScripts();
								};

								loader.dispatchEvent(new types.CustomEvent('waiting'));
								
								return __Internal__.loadMissings(true, scripts, reload, async)
									.then(function(loaded1) {
										return __Internal__.loadMissings(false, scripts, reload, async)
											.then(function(loaded2) {
												if (loaded1 || loaded2) {
													return loopScripts();
												} else {
													return true;
												};
											});
									});
							})
							.nodeify(function(err, result) {
								if (err) {
									__Internal__.lastEx = err;
								};
								
								var ok = __Internal__.areOptional(scripts);
								if (!ok) {
									tools.log(tools.LogLevels.Error, "The following scripts failed to load or to initialize :");
									__Internal__.dumpFailed(scripts);
									
									if (root.DD_ASSERT) {
										debugger;
									};
									
									if (__Internal__.lastEx) {
										throw __Internal__.lastEx;
									};
								};
								
								scripts.length = 0;

								return false;
							});
					};
					
					loader.dispatchEvent(new types.CustomEvent('loading'));

					return loopScripts()
						.then(function(done) {
							if (done) {
								loader.dispatchEvent(new types.CustomEvent('success'));
							} else {
								loader.dispatchEvent(new types.CustomEvent('error'));
							};
										
							if (__Internal__.lastEx) {
								throw __Internal__.lastEx;
							};
										
							return done;
						});
				};

				//===================================
				// Init
				//===================================
				//return function init(/*optional*/options) {
				//};
			},
		};

		return DD_MODULES;
	};

	//! BEGIN_REMOVE()
	if ((typeof process !== 'object') || (typeof module !== 'object')) {
	//! END_REMOVE()
		//! IF_UNDEF("serverSide")
			// <PRB> export/import are not yet supported in browsers
			global.DD_MODULES = exports.add(global.DD_MODULES);
		//! END_IF()
	//! BEGIN_REMOVE()
	};
	//! END_REMOVE()
}).call(
	//! BEGIN_REMOVE()
	(typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : this)
	//! END_REMOVE()
	//! IF_DEF("serverSide")
	//! 	INJECT("global")
	//! ELSE()
	//! 	INJECT("window")
	//! END_IF()
);
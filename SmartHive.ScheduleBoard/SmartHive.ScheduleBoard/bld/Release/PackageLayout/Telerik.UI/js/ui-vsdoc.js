/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
; (function (global, $, undefined) {
	"use strict";
	//CHECK IF NAMESPACE EXISTS 
	if (typeof (Telerik) != "undefined" && typeof (Telerik.Utilities) != "undefined") throw new Error("Telerik scripts already loaded! Check for duplicate script tags.");
	var win = WinJS,
        define = win.Class.define,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        resources = win.Resources,
		STRING = "string",
		NUMBER = "number",
		BOOLEAN = "boolean",
		ARRAY = "array",
		OBJECT = "object",
		FUNCTION = "function",
		REGEXP = "regexp",
		NULL = null,
		NOOP = function () { },
		DOT = ".",
		extend = $.extend,
		getProto = Object.getPrototypeOf,
		keys = Object.keys,
		prop = Object.defineProperty,
		unsafe = MSApp.execUnsafeLocalFunction,
			telerik = namespace("Telerik", {
				Error: derive(Error, function (name, message) {
					/// <summary>
					/// Represents a Telerik-specific error with a name and message
					/// </summary>
	})
			}),
			localization = namespace("Telerik.Localization", {
				cultures: {
					"en-US": {
					}
				},
				_strings: {
					elementIsInvalid: "Invalid argument: the control expects a valid DOM element as the first argument.",
					pageContainerIsInvalid: "Invalid page container.",
					pageableControlIsInvalid: "Invalid argument: the function expects a valid constructor function as the first argument.",
					pageProviderIsInvalid: "Invalid argument: the function expects a valid constructor deriving from Telerik.UI.Pagination.PageProvider as the second argument.",
					endCalendarIsNotFound: "The specified end calendar was not found after 1 second since the start calendar was initialized."
				},
				_getStringFromResourceSubtree: function (subtree, key) {
					var mainResourceMap = Windows.ApplicationModel.Resources.Core.ResourceManager.current.mainResourceMap,
						resourceMap,
						resCandidate,
						valueAsString;
					try {
						resourceMap = mainResourceMap.getSubtree(subtree);
					}
					catch (e) { }
					if (resourceMap) {
						resCandidate = resourceMap.getValue(key);
					}
					if (resCandidate) {
						return { value: resCandidate.valueAsString };
					}
					return { empty: true };
				},
				_getString: function (key) {
					// Firstly check if the national getString finds something...
					var resource = resources.getString(key);
					if (resource.empty) {
						var keys = key.split("/"),
							strings = this["_" + keys[0]];
						// Secondly check if there is a subtree for the control loaded in the resources...
						resource = this._getStringFromResourceSubtree(keys[0], keys[1]);
						if (resource.empty) {
							if (!strings) {
								return undefined;
							}
							// Thirdly, if there's a built-in string for the requested resource, return it...
							resource = strings[keys[1]];
						}
						else {
							resource = resource.value;
						}
					}
					else {
						resource = resource.value;
					}
					return resource;
				}
			}),
			util = namespace("Telerik.Utilities", {
				getPropertyValue: function (obj, property) {
					/// <summary>
					/// Retrieves a property value from an object. Supports retrieving sub-properties.
					/// </summary>
					/// <param name="obj" type="Object">The object whose property to retrieve.</param>
					/// <param name="property" type="String">The name of the property to retrieve.</param>
					/// <returns type="Object">The property value</returns>
					property = property.replace(/\[('|\")?/g, ".").replace(/('|\")?\]/g, "");
					if (property.indexOf(DOT) > 0) {
						var props = property.split(DOT),
							sub = obj;
						while (props.length > 1) {
							var prop = props.shift();
							if (typeof sub[prop] !== OBJECT) {
								return undefined
							}
							sub = sub[prop];
						}
						return sub[props.shift()];
					}
					return obj[property];
				},
				setPropertyValue: function (obj, property, value) {
					/// <summary>
					/// Sets the specified value to a property. Supports setting sub-property values.
					/// </summary>
					/// <param name="obj" type="Object">The object whose property will be set.</param>
					/// <param name="property" type="String">The name of the property to set.</param>
					/// <param name="value" type="Object">The value to set.</param>
					property = property.replace(/\[('|\")?/g, ".").replace(/('|\")?\]/g, "");
					if (property.indexOf(DOT) > 0) {
						var props = property.split(DOT),
							sub = obj;
						while (props.length > 1) {
							var prop = props.shift();
							if (typeof sub[prop] !== OBJECT) {
								if (props.length && props[0] === +props[0] + "") { //next property is an array index
									props[0] = +props[0];
									sub[prop] = [];
								}
								else {
									sub[prop] = {};
								}
							}
							sub = sub[prop];
						}
						sub[props.shift()] = value;
					}
					else {
						obj[property] = value;
					}
				},
				getType: function (value) {
					/// <summary>
					/// Returns the type of the specified value as a string.
					/// </summary>
					/// <param name="value">The value whose type to retreive</param>
					/// <returns type="String">The type name string</returns>
					return Object.prototype.toString.call(value).split(" ")[1].split("]")[0].toLowerCase();
				},
				setPrivate: function (obj, property, value, writable) {
					/// <summary>
					/// Creates or assignes a private property (enumerable=false) to an object)
					/// </summary>
					/// <param name="obj" type="Object">The object that will receive the property.</param>
					/// <param name="property" type="String">The name of the property.</param>
					/// <param name="value" type="Object">The value of the property.</param>
					/// <param name="writable" type="Boolean" optional="true">Optional. Indicates whether the property should be writable. Default is read-only.</param>
					/// <returns type="Object">The value, which was set</returns>
					var desc = Object.getOwnPropertyDescriptor(obj, property);
					if (desc) {
						obj[property] = value;
					}
					else {
						prop(obj, property, {
							value: value,
							writable: !!writable
						});
					}
					return value;
				},
				merge: function (to, from) {
					/// <summary>
					/// Recursively merges properties from a source object to a target object.
					/// </summary>
					/// <param name="to" type="Object">The target object that will receive the properties of the source.</param>
					/// <param name="from" type="Object">The source object that will have its properties recursively copied.</param>
					var target = arguments[0] || {},
						types = [OBJECT, ARRAY],
						getType = this.getType;
					//support arbitrary number of arguments to merge
					for (var i = 1, len = arguments.length; i < len; i++) {
						var source = arguments[i];
						if (types.indexOf(getType(source)) < 0) {
							continue;
						}
						for (var key in source) {
							var sourceValue = source[key],
								targetValue = target[key],
								sourceType = getType(sourceValue),
								targetType = getType(targetValue);
							//break never-ending loop
							if (sourceValue === targetValue) {
								continue;
							}
							//recursively merge properties of inner objects
							if (types.indexOf(sourceType) >= 0) {
								var newObj = sourceType === OBJECT ? {} : [];
								if (targetType !== sourceType) {
									targetValue = target[key] = newObj;
								}
								this.merge(targetValue, sourceValue);
							}
								//if value is non-null copy directly to target
							else if (sourceValue !== undefined) {
								target[key] = sourceValue;
							}
						}
					}
					return target;
				},
				clone: function (toClone, excludes, constructors, replacer) {
					/// <summary>
					/// Returns a clone of the specified object. Performs a deep clone with the ability
					/// to copy instances of objects directly and to exclude properties from cloning. An optional
					/// replacer function can be provided that will be called with each key and value pair recursively. If
					/// the function returns a non-undefined value, the value will be copied instead of the original value.
					/// </summary>
					/// <param name="toClone" type="Object">The object to clone.</param>
					/// <param name="excludes" type="Array" elementType="String" optional="true">Optional. An array of properties (can be nested) to ignore when cloning.</param>
					/// <param name="constructors" type="Array" elementType="Function" optional="true">Optional. An array of constructor functions whose instances to copy directly without cloning.</param>					
					/// <param name="replacer" type="Function" optional="true">A function that will be called with each key and value pair.</param>
					var that = this,
						ex = excludes || [],
						cons = constructors || [],
						clone = that.getType(toClone) === ARRAY ? [] : {};
					if (!toClone || typeof toClone !== OBJECT) {
						//do not clone if argument is not an object
						return toClone;
					}
					if (cons.indexOf(Date) < 0) {
						//instances of Date should be copied directly and not recursed
						cons.push(Date);
					}
					(function iterator(clone, toClone, cons, ex) {
						for (var key in toClone) {
							if (ex.indexOf(key) > -1) {
								continue;
							}
							var value = toClone[key],
								replaced = false;
							//call the replacer function if it's defined
							if (replacer) {
								var replacedValue = replacer(key, value, toClone);
								replaced = value !== replacedValue;
								value = replacedValue;
							}
							//recurse only if the replacer function returned a different value
							if (value && typeof value === OBJECT && !replaced) {
								var copy = false;
								//copy object directly if it's an instance of one of the specified constructors
								for (var i = 0, len = cons.length; i < len; i++) {
									if (value instanceof cons[i]) {
										copy = true;
										break;
									}
								}
								//filter all compound excluded keys and reduce the array to a set of keys 
								//that apply to the inner call to iterator() that follows (e.g. ["key.subkey"] -> ["subkey"])
								var subex = ex.reduce(function (arr, exkey) {
									var parts = exkey.split(".");
									if (parts.indexOf(key) > -1) {
										var subkey = parts.slice(1).join(".");
										if (subkey) {
											arr.push(subkey);
										}
									}
									return arr;
								}, []);
								value = copy ? value : iterator(that.getType(value) === ARRAY ? [] : {}, value, cons, subex);
							}
							//copy the value ony if it's defined
							if (value !== undefined) {
								clone[key] = value;
							}
						}
						return clone;
					})(clone, toClone, cons, ex);
					return clone;
				},
				htmlToString: function (nodes) {
					/// <summary>
					/// Convert the specified HTML element or list of HTML elements to string.
					/// </summary>
					/// <param name="nodes">An HTML element or a list of HTML elements.</param>
					return $("<div></div>").append(nodes).html();
				},
				getTemplate: function (templateObject, asString) {
					/// <summary>
					/// Converts one of the supported template types to a common executable template function. The result function accepts
					/// a data object passed to the template and returns the rendered HTML content.
					/// </summary>
					/// <param name="templateObject" type="Object">
					/// WinJS.Binding.Template instance, HTML element hosting a WinJS.Binding.Template, 
					/// a function, or a string defining a template.
					/// </param>				
					/// <param name="asString" type="Boolean" optional="true">
					/// Optional. If set to true, the returned template function returns the resulting HTML as a string. By default, the 
					/// type of the resulting HTML depends on the original template object passed to this function.
					/// </param>
					/// <returns type="Function"></returns>
					var templateFunc,
						toStr = function (content) {
							var result = content;
							//convert content to string, if required
							if (asString && typeof content !== STRING) {
								try {
									result = Telerik.Utilities.htmlToString($(content));
								}
								catch (e) {
									result = document.createTextNode(content).textContent;
								}
							}
							return result;
						};
					if (templateObject === NULL) {
						return NULL;
					}
					if (!templateObject) {
						return undefined;
					}
					//templateObject is a plain function that accepts data and returns HTML (string or DOM)
					if (typeof templateObject === FUNCTION) {
						templateFunc = function (data) {
							return toStr(templateObject(data));
						};
					}
						//templateObject is a string - treat as kendo template string
					else if (typeof templateObject === STRING) {
						templateFunc = function (data) {
							return toStr(templateFunc._kendoTemplate(data));
						}
						//compile the kendo template for reuse
						templateFunc._kendoTemplate = kendo.template(templateObject);
					}
						//templateObject is an instance of WinJS.Binding.Template, or a host element
					else {
						var template = templateObject.getAttribute && templateObject.winControl ? templateObject.winControl : templateObject;
						if (template instanceof WinJS.Binding.Template) {
							templateFunc = function (data) {
								//WARNING: The binding architecture in WinJS doesn't like kendo's observable objects.
								//If the data is not JSON-ized, the render() method below never completes.
								data = (data instanceof kendo.data.ObservableObject || (typeof data.bind === "function" && typeof data.unbind === "function" && typeof data.toJSON === "function")) ? data.toJSON() : data;
								var host = document.createElement(template.element.tagName),
									result = [];
								template.render(data, host).then(function (element) {
									var child = element.firstElementChild;
									while (child) {
										result.push(child);
										child = child.nextElementSibling;
									}
								});
								return toStr(result);
							}
						}
					}
					if (templateFunc) {
						//save original template object for internal access
						templateFunc._originalTemplate = templateObject;
					}
					return templateFunc || undefined;
				},
				/// <summary>
				/// Converts array like object to array.
				/// </summary>
				/// <param name="obj" type="Object">Object to convert in array</param>
				/// <returns type="Array"></returns>
				makeArray: function (obj) {
					return obj != null ?
						(util.getType(obj) === "array" ? obj : [obj]) :
						[];
				},
				intersection: function (left, right) {
					/// <summary>
					/// Returns the intersection of two arrays or array-like objects that have zero-indexed numeric fields and a length field. 
					/// </summary>
					/// <param name="left" type="Array"></param>
					/// <param name="right" type="Array"></param>
					/// <returns type="Array"></returns>
					var ret = [];
					for (var i = 0, len = left.length; i < len; i++) {
						var val = left[i];
						if (ret.indexOf(val) < 0 && right.indexOf(val) > -1) {
							ret.push(val);
						}
					}
					return ret;
				},
				//common validator functions
				_validators: {
					unifiedTemplate: function (value) {
						//if value can be converted to a unified template function, accept it
						return util.getTemplate(value, true) !== undefined ? value : undefined;
					},
					stringOrUnifiedTemplate: function (value) {
						//if value is a string, accept it, otherwise try to convert to a unified template function
						return typeof value === "string" ? value : util.getTemplate(value, true);
					},
					notPrevious: function (value, prev) {
						if (value !== prev) {
							return value;
						}
					},
					floatValue: function (value, prev) {
						value = parseFloat(value);
						if (!isNaN(value) && util._validators.notPrevious(value, prev) !== undefined) {
							return value;
						}
					}
				},
				toString: function(object, format, culture) {
					/// <summary>
					/// Returns a string representation of the current object taking into account the given format and culture.
					/// </summary>
					/// <param name="object" type="Object"></param>
					/// <param name="format" type="String"></param>
					/// <param name="culture" type="String"></param>
					/// <returns type="String">String representation of the formatted value.</returns>
					// To support composite formatting: {0:c}
					format = kendo._extractFormat(format);
					if (culture) {
						Telerik.Culture._checkCulture(culture);
					}
					return kendo.toString(object, format, culture);
				},
				format: function() {
					/// <summary>
					/// Replaces each format item in a specified string with the text equivalent of a corresponding object's value.
					/// Example: Telerik.Utilities.format("{0:c} - {1:c}", 12, 24) //$12.00 - $24.00
					/// </summary>
					/// <returns type="String">The formatted string.</returns>
					return kendo.format.apply(this, arguments);
				},
				/// <summary>
				/// Color objects can be used to manipulate colors. 
				/// You cannot instantiate a Color object directly, instead you should use one of the methods of Telerik.Utilities.color object.
				/// </summary>
				color: {
					fromRGB: function (r, g, b, a) {
						/// <summary>
						/// Color representation as RGB (where the values are float numbers between 0 and 1)
						/// Telerik.Utilities.color.fromRGB(1, 0, 0, 1);
						/// </summary>
						/// <returns type="Object">Color object.</returns>
						return kendo.Color.fromRGB(r, g, b, a);
					},
					fromBytes: function (r, g, b, a) {
						/// <summary>
						/// Color representation as Bytes (where values are integers between 0 and 255)
						/// Telerik.Utilities.color.fromBytes(0, 0, 255, 1);
						/// </summary>
						/// <returns type="Object">Color object.</returns>
						return kendo.Color.fromBytes(r, g, b, a);
					},
					fromHSV: function (h, s, v, a) {
						/// <summary>
						/// Color representation as HSV
						/// </summary>
						/// <returns type="Object">Color object.</returns>
						return kendo.Color.fromHSV(h, s, v, a);
					},
					parseColor: function (string, noError) {
						/// <summary>
						/// Parse a color string to a Color object. If the input is not valid throws an Error, unless the noerror argument is given.
						/// </summary>
						/// <returns type="Object">Color object.</returns>
						return kendo.parseColor(string, noError);
					}
				},
				// Build localization object for controls that use messages object.
				_buildLocalizationObject: function(map, path) {
					var obj = {},
						inner = {};
					Object.defineProperties(obj, Object.keys(map).reduce(function (descriptor, prop) {
						var value = map[prop];
						if (typeof value === "object") {
							inner[prop] = value;
						}
						else {
							/// <field type="String">
							/// The localized string.
							/// </field>
							descriptor[prop] = {
								get: function () {
									var modified = this["_" + prop];
									return modified !== undefined ? modified : Telerik.Localization._getString(path + "/" + value);
								},
								set: function (value) {
									priv(this, "_" + prop, value, true);
								},
								configurable: false,
								enumerable: true
							};
						}
						return descriptor;
					}, {}));
					Object.keys(inner).forEach(function (innerProp) {
						obj[innerProp] = util._buildLocalizationObject(inner[innerProp], path);
					});
					return obj;
				},
				_pointerEvent: function (type) {
					return "onpointerdown" in document ?
						("pointer" + type) :
						("MSPointer" + type.charAt(0).toUpperCase() + type.substr(1));
				}
			}),
			priv = util.setPrivate,
			ui = namespace("Telerik.UI", {
				setOptions: function (control, options) {
					var keys, key, value, ch1, ch2, i, len;
					if (util.getType(options) === OBJECT) {
						keys = Object.keys(options);
						for (i = 0, len = keys.length; i < len; i++) {
							key = keys[i];
							value = options[key];
							//do not set private fields
							if (key.charAt(0) !== "_") {
								if (key.length > 2) {
									ch1 = key[0];
									ch2 = key[1];
									if ((ch1 === 'o' || ch1 === 'O') && (ch2 === 'n' || ch2 === 'N')) {
										if (typeof value === FUNCTION && typeof control.addEventListener === FUNCTION) {
											control.addEventListener(key.substr(2), value);
											continue;
										}
									}
								}
								control[key] = value;
							}
						}
					}
				}
			}),
			common = namespace("Telerik.UI.Common", {
				EventBase: define(function (type, target, extended) {
					/// <summary>
					/// Represents an event object for an event thrown by a control.
					/// </summary>
					/// <param name="type" type="String">The type (name) of the event.</param>
					/// <param name="target" type="Object">The event target object.</param>
					/// <param name="extended" type="Object">An object specifying additional details for this event.</param>
}, {
					target: NULL,
					timeStamp: NULL,
					type: NULL,
					bubbles: { value: false, writable: false },
					cancelable: { value: false, writable: false },
					trusted: { value: false, writable: false },
					eventPhase: { value: 0, writable: false },
					currentTarget: {get:function(){}},
					defaultPrevented: {get:function(){}},
					isDefaultPrevented: function () {
},
					preventDefault: function () {
},
					stopImmediatePropagation: function () {
},
					stopPropagation: function () {
}
				}),
				eventMixin: {
					addEventListener: function (type, listener, useCapture) {
						/// <summary>
						/// Adds an event listener that will be called when the specified event is raised.
						/// </summary>
						/// <param name="type" type="string">The type (name) of the event.</param>
						/// <param name="listener" type="function">The listener to invoke when the event gets raised.</param>
						/// <param name="useCapture" type="boolean">If true, initiates capture, otherwise false.</param>
						var that = this,
							events = that._events ? that._events : priv(that, "_events", {}),
							listeners = (events[type] = events[type] || []);
						for (var i = 0, len = listeners.length; i < len; i++) {
							var item = listeners[i];
							if (item.capture === !!useCapture && item.handler === listener) {
								return;
							}
						}
						listeners.push({ capture: !!useCapture, handler: listener });
					},
					removeEventListener: function (type, listener, useCapture) {
						/// <summary>
						/// Removes an event listener for the specified event.
						/// </summary>
						/// <param name="type" type="string">The type (name) of the event.</param>
						/// <param name="listener" type="function">The listener to remove.</param>
						/// <param name="useCapture" type="boolean">Specifies a capturing listener.</param>
						var that = this,
							events = that._events ? that._events : priv(that, "_events", {}),
							listeners = events[type];
						if (listeners) {
							for (var i = 0, len = listeners.length; i < len; i++) {
								var item = listeners[i];
								if (item.handler === listener && item.capture === !!useCapture) {
									listeners.splice(i, 1);
									if (!listeners.length) {
										delete events[type];
									}
									break;
								}
							}
						}
					},
					dispatchEvent: function (type, details) {
						/// <summary>
						/// Raises an event of the specified type and with the specified additional properties.
						/// </summary>
						/// <param name="type" type="string">The type (name) of the event.</param>
						/// <param name="details" type="object">The event details object.</param>
						var that = this,
							events = that._events ? that._events : priv(that, "_events", {}),
							listeners = events[type];
						if (listeners) {
							var listenersCopy = listeners.slice(0, listeners.length),
								evt = new common.EventBase(type, that, details);
							for (var i = 0, len = listenersCopy.length; i < len && !evt._stopImmediatePropagationCalled; i++) {
								listenersCopy[i].handler(evt);
							}
							return evt.defaultPrevented;
						}
						return false;
					},
					_disposeEvents: function () {
						var that = this,
							events = that._events || {};
						for (var evt in events) {
							delete events[evt];
						}
					}
				}
			});
	var GC_DISPOSE_WINDOW = 2000; // ms to wait before running the "garbage collector".
	var gcActiveControls = []; // array containing all active Telerik controls
	var gcTimeout = null;
	function gcRun() {
		gcTimeout = null;
		gcActiveControls = gcActiveControls.filter(function filter_activeControls(control) {
			if (control._gcCheck()) {
				//dispose orphaned control
				if (typeof (control._destroy) === "function") control._destroy();
				return false;
			}
			return true;
		});
	}
	function gcNotify(control) {
		gcActiveControls.push(control);
		if (gcTimeout != null) clearTimeout(gcTimeout);
		gcTimeout = setTimeout(gcRun, GC_DISPOSE_WINDOW);
	}
	/// <summary>
	/// Defines an object that can be disposed. For internal use only!
	/// </summary>
	var _Disposable = define(function Disposable_constructor(element, options) {
		/// <summary>
		/// Internal use only.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
},
	{
		});
	
	/// <summary>
	/// Serves as a base class for all Telerik.UI controls.
	/// </summary>
	/// <excludetoc />
	var Control = derive(_Disposable, function (element, options) {
		/// <summary>
		/// Internal use only.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="HTMLElement" domElement="true" hidden="true">
		/// Gets the DOM element that hosts this control.
		/// </field>
		element: NULL,
		/// <field type="Boolean" readonly="true" hidden="true">
		/// Indicates whether the control is initialized.
		/// </field>
		initialized: {get:function(){}},
		});
	mix(Control, common.eventMixin);
	function isControlConfigurationType(func) {
		var proto = func.prototype;
		while (proto) {
			if (proto === _ControlConfiguration.prototype) {
				return true;
			}
			proto = getProto(proto);
		}
		return false;
	}
	//check if the specified object is an instance of WinJS.Binding.List or a
	//WinJS.Binding.List.dataSource instance and retrieve the list object
	function getBindingList(dataSource) {
		if (dataSource instanceof WinJS.Binding.List) {
			return dataSource;
		}
		else if (dataSource && typeof dataSource.createListBinding === FUNCTION && dataSource.list instanceof win.Binding.List) {
			return dataSource.list;
		}
		return undefined;
	}
	function replaceOptions(key, value) {
		if (util.getType(value) === OBJECT) {
			var bList = getBindingList(value);
			if (bList) {
				return bList;
			}
			if (value instanceof _ControlConfiguration) {
				return value._toOption();
			}
			//convert options received from data-win-options attributes
			//into plain objects that can recognize configuration type definitions
			//like { prop: { type:Telerik.UI._ControlConfiguration } }
			if (value && typeof value.type === FUNCTION && isControlConfigurationType(value.type)) {
				var config = new value.type();
				delete value.type;
				config._modified = value;
				return config._toOption();
			}
		}
		return value;
	}
	//gathers all properties of type object from all prototypes in the prototype chain
	function mergeAcrossPrototypes(obj, property) {
		var value = obj[property];
		if (typeof value === OBJECT) {
			var proto = obj.constructor.prototype;
			while (proto) {
				var protoValue = proto[property];
				if (protoValue !== value && typeof protoValue === OBJECT && keys(protoValue).length) {
					value = extend(true, {}, protoValue, value);
				}
				proto = getProto(proto);
			}
		}
		return value;
	}
	function mapDataSourceEvents(wrapper, dataSourceOptions) {
		var map = Telerik.Data.DataSource.prototype._eventsMap;
		keys(map).forEach(function (eventName) {
			var shortEventName = eventName.substr(2),
				handler = dataSourceOptions[eventName];
			if (typeof handler === FUNCTION) {
				//register an event handler to the kendo.data.DataSource
				dataSourceOptions[map[eventName]] = function mappingHandler(e) {
					//register and dispatch the event through the DataSource component
					var kendoDS = e.sender,
						justCreated = !(wrapper._dataSource instanceof Telerik.Data.DataSource),
						dataSource = wrapper.dataSource;
					if (!dataSource) {
						var dsType = (wrapper instanceof Telerik.UI.RadScheduler) ? Telerik.Data.SchedulerDataSource : Telerik.Data.DataSource;
						dataSource = new dsType(kendoDS);
						priv(wrapper, "_dataSource", dataSource, true);
					}
					//register the original handler if it is not already registered for this event
					dataSource.addEventListener(shortEventName, handler);
					//remove this mapping handler from the kendo data source
					kendoDS.unbind(map[eventName], mappingHandler);
					//if the DataSource instance is just created, dispatch the event explicitly,
					//as the dataSource won't dispatch this event after this point
					if (justCreated) {
						var dispatchArgs = Array.apply(NULL, arguments);
						dispatchArgs.unshift(shortEventName);
						dataSource.dispatchEvent.apply(dataSource, dispatchArgs);
					}
				}
				//delete original field (eg."ondatabinding"), as now we have "dataBinding" in its place going to the widget
				delete dataSourceOptions[eventName];
			}
		});
	}
	/// <excludetoc />
	var WidgetWrapper = derive(Control, function (element, options) {
		/// <summary>
		/// Serves as a base class for all widget wrapper controls.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
	});
	///<excludetoc />
	var _ControlConfiguration = define(function (owner, parentMapping, defaults, onchange) {
		/// <summary>
		/// For internal usage only.
		/// </summary>
}, {
		}, {
		createGetter: function (key, defaultValue) {
			return function () {
				var that = this;
				if (!that._initialized) {
					return defaultValue;
				}
				var owner = that instanceof WidgetWrapper ? that : that._owner,
					widget = owner && owner._widget ? owner._widget : NULL,
					value = that._modified[key],
					def = that._defaults[key] !== undefined ? that._defaults[key] : defaultValue,
					mappedKey = (that._optionsMap || {})[key] || key;
				if (value !== undefined) {
					return value;
				}
				if (typeof def === FUNCTION) {
					def = def.call(that, key);
				}
				if (!widget) {
					if (that._seriesOption) {
						//value = that._seriesOption[key];
						value = util.getPropertyValue(that._seriesOption, mappedKey);
						if (value !== undefined) {
							return value;
						}
					}
					value = def;
				}
				else {
					var mapping = typeof that._parentMapping === FUNCTION ? that._parentMapping() : that._parentMapping,
				        mapped = mapping ? mapping + "." + mappedKey : mappedKey;
					value = util.getPropertyValue(widget.options, mapped);
					if (value === undefined) {
						value = def;
					}
				}
				if (value === defaultValue && util.getType(value) === ARRAY) {
					value = that._modified[key] = Array.apply(NULL, value);
				}
				return value;
			}
		},
		createSetter: function (key) {
			return function (value) {
				var that = this,
					oldValue = that[key],
					value = _ControlConfiguration.validate(that._validators || {}, key, value, oldValue);
				//quit if validation fails or value is default
				if (value === undefined || value === oldValue) {
					return;
				}
				that._modified[key] = value;
				if (that._onchange) {
					that._onchange({
						key: key,
						value: value,
						oldValue: oldValue
					});
				}
			}
		},
		defineProperty: function (key, defaultValue) {
			return {
				get: _ControlConfiguration.createGetter(key, defaultValue),
				set: _ControlConfiguration.createSetter(key),
				enumerable: true,
				configurable: false
			}
		},
		convert: function (value, type) {
			var currentType = util.getType(value);
			if (currentType !== type) {
				if (type === STRING) {
					value = value + "";
				}
				else if (type === NUMBER) {
					value = parseFloat(value);
					if (isNaN(value)) {
						return; //invalid value
					}
				}
				else if (type === BOOLEAN) {
					value = !!value;
				}
				else {
					//all other type mismatches are invalid
					return;
				}
			}
			return value;
		},
		validate: function (validators, key, value, oldValue) {
			var that = this,
				type = util.getType(value),
				defaultType = util.getType(oldValue),
				validator = util.getPropertyValue(validators, key),
				isTypeValidator = validator && validator.hasOwnProperty("type"),
				validatorType = util.getType(validator);
			if (type !== defaultType && !isTypeValidator && validatorType !== FUNCTION) {
				//try to convert between types to get value in required type.
				//DO NOT convert if there is a type validator for this property,
				//or if the validator is a custom function. In this case,
				//we will validate the type further down.
				value = that.convert(value, defaultType);
			}
			if (value === undefined) {
				return;
			}
			//validate converted value, if a validator is registered for this property
			if (validator) {
				if (isTypeValidator) {
					var allowedTypes = util.getType(validator.type) === ARRAY ? validator.type : [validator.type],
						typeValid = false;
					for (var i = 0, len = allowedTypes.length; i < len; i++) {
						var allowedType = allowedTypes[i],
					        noconvert = allowedType.substr(allowedType.length - 10) === ":noconvert",
					        allowedType = noconvert ? allowedType.substr(0, allowedType.length - 10) : allowedType;
						if (type === allowedType) {
							typeValid = true;
							break;
						}
						if (!noconvert) {
							var converted = that.convert(value, allowedType);
							if (converted !== undefined) {
								typeValid = true;
								value = converted;
								break;
							}
						}
					}
					if (!typeValid) {
						return; //value type not among accepted types
					}
				}
				else if (validatorType === ARRAY && validator.indexOf(value) < 0) {
					return; //value not in the set of valid values
				}
				else if (validatorType === FUNCTION) {
					return validator(value); //validate through a custom function
				}
				else if (validatorType === REGEXP) {
					if (!validator.test(value)) {
						return; //value does not match regular expression
					}
				}
				else if (validator.hasOwnProperty("min") || validator.hasOwnProperty("max")) {
					if (validator.min && value < validator.min) {
						return; //min defined and value is less than min
					}
					if (validator.max && value > validator.max) {
						return; //max defined and value is greater than max
					}
				}
			}
			return value;
		},
		getMapping: function (config, key) {
			var mapping;
			if (config._optionsMap) {
				mapping = config._optionsMap[key];
				if (mapping) {
					return mapping;
				}
			}
			mapping = config._parentMapping;
			if (mapping) {
				if (typeof mapping === FUNCTION) {
					return function () {
						return mapping() + "." + key;
					}
				}
				return mapping + "." + key;
			}
			return key;
		}
	});
	///<excludetoc />
	var _Configuration = define(function (options) {
		/// <summary>
		/// For internal usage only.
		/// </summary>
}, null, {
		createGetter: function (key, defaultValue) {
			/// <excludetoc />
			/// <summary>
			/// For internal usage only. Do not use in client code.
			/// </summary>
},
		createSetter: function (key, onvalidate, onchange) {
			/// <excludetoc />
			/// <summary>
			/// For internal usage only. Do not use in client code.
			/// </summary>
},
		defineProperty: function (key, defaultValue, onvalidate, onchange) {
			/// <excludetoc />
			/// <summary>
			/// For internal usage only. Do not use in client code.
			/// </summary>
},
		defineConfigurationProperty: function (key, oncreate, onchange) {
			/// <excludetoc />
			/// <summary>
			/// For internal usage only. Do not use in client code.
			/// </summary>
}
	});
	namespace("Telerik.UI", {
		Control: Control,
		WidgetWrapper: WidgetWrapper,
		_ControlConfiguration: _ControlConfiguration,
		_Configuration: _Configuration,
		_Disposable: _Disposable,
		progress: function (element, show, modal) {
			/// <summary>
			/// Toggles a progress indicator over the specified element.
			/// </summary>
			/// <param name="element" type="HTMLElement">The target HTML element.</param>
			/// <param name="show" type="Boolean">Specifies whether to show or hide the progress indicator.</param>
			/// <param name="modal" type="Boolean" optional="true">Optional. Specifies whether to show a modal mask over the target element that prevents interaction.</param>
			$(element).each(function () {
				var elem = $(this),
					modal = modal || elem.hasClass("k-grid-content") || elem.hasClass("k-chart"),
					dataKey = "t-progress-id",
					data = elem.data(dataKey) || {},
					progress = $("#" + data.id);
				if (show) {
					if (!progress.length) {
						data.id = kendo.guid();
						data.position = elem[0].style.position;
						progress = $("<div class='t-progress'><div class='t-mask' /><progress /></div>").attr("id", data.id);
						elem.data(dataKey, data);
					}
					progress[modal ? "addClass" : "removeClass"]("t-modal");
					if (data.position !== "relative" && data.position !== "absolute") {
						elem.css("position", "relative");
					}
					elem.append(progress);
				}
				else {
					progress.remove();
					elem.css("position", data.position);
				}
			});
		}
	});
	//use our own progress UI
	kendo.ui.progress = Telerik.UI.progress;
	var defineProperty = _ControlConfiguration.defineProperty;
	namespace("Telerik.UI.Common", {
		_runGC: gcRun,
		_BorderConfiguration: derive(_ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of a border.
			/// </summary>
}, {
			/// <field type="String">Gets or sets the color of the border/line.</field>
			color: defineProperty("color", "black"),
			/// <field type="String" defaultValue="solid">
			/// Gets or sets the dash type of the border/line. Accepted valies are:
			/// "solid", "dot", "dash", "longDash", "dashDot", "longDashDot", "longDashDotDot"
			/// </field>
			/// <options>
			/// <option value="solid">solid</option>
			/// <option value="dot">dot</option>
			/// <option value="dash">dash</option>
			/// <option value="longDash">longDash</option>
			/// <option value="dashDot">dashDot</option>
			/// <option value="longDashDot">longDashDot</option>
			/// <option value="longDashDotDot">longDashDotDot</option>
			/// </options>
			dashType: defineProperty("dashType", "solid"),
			/// <field type="Number">Gets or sets the width of the border/line in pixels.</field>
			width: defineProperty("width", 0)
		}),
		_BoxConfiguration: derive(_ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of a bounding box such as padding or margin.
			/// </summary>
}, {
			/// <field type="Number">Gets or sets the left value.</field>
			left: defineProperty("left", 0),
			/// <field type="Number">Gets or sets the right value.</field>
			right: defineProperty("right", 0),
			/// <field type="Number">Gets or sets the top value.</field>
			top: defineProperty("top", 0),
			/// <field type="Number">Gets or sets the bottom value.</field>
			bottom: defineProperty("bottom", 0)
		})
	});
	//kendo overrides
	var oldRenderSVG = kendo.dataviz.renderSVG;
	kendo.dataviz.renderSVG = function (container, svg) {
		unsafe(function () {
			oldRenderSVG(container, svg);
		});
	};
	//kendo.support.scrollbar = function () {
	//	//same as kendo.support.scrollbar() but with added style -ms-overflow-style:scrollbar;
	//	var div = document.createElement("div"), result;
	//	div.style.cssText = "-ms-overflow-style:scrollbar;overflow:scroll;overflow-x:hidden;zoom:1;clear:both";
	//	div.innerHTML = "&nbsp;";
	//	document.body.appendChild(div);
	//	result = div.offsetWidth - div.scrollWidth;
	//	document.body.removeChild(div);
	//	return result;
	//};
	if (Windows && Windows.Devices && Windows.Devices.Input && Windows.Devices.Input.TouchCapabilities) {
		//var tc = new Windows.Devices.Input.TouchCapabilities();
		//kendo.support.kineticScrollNeeded = !!tc.touchPresent;
		//Kendo kinetic scroll is pretty broken
		kendo.support.kineticScrollNeeded = false;
	}
	//jQuery animation extends
	extend($.easing, {
		easeInOutSine: function (unused, time, start, end, duration) {
			return -end / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
		}
	});
	//ensure any open popups close when the app navigates away from the current page
	var originalOpen = kendo.ui.Popup.prototype.open;
	kendo.ui.Popup.prototype.open = function () {
		var that = this,
			anchor = $(that.options.anchor),
			root = document.documentElement;
		if (anchor.length) {
			WinJS.Navigation.addEventListener("navigated", that._navHandler = function (e) {
				setImmediate(function () {
					if (anchor[0] && !anchor[0].offsetWidth) {
						that.close();
					}
				});
			});
		}
		originalOpen.apply(that, arguments);
	}
	var removeHideCallbackFactory = function (method) {
		return function () {
			var that = this;
			if (that._navHandler) {
				WinJS.Navigation.removeEventListener("navigated", that._navHandler);
				delete that._navHandler;
			}
			method.apply(that, arguments);
		}
	}
	var originalDestroy = kendo.ui.Popup.prototype.destroy;
	kendo.ui.Popup.prototype.destroy = removeHideCallbackFactory(originalDestroy);
	var originalClose = kendo.ui.Popup.prototype.close;
	kendo.ui.Popup.prototype.close = removeHideCallbackFactory(originalClose);
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-1.8.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
        namespace = win.Namespace.define,
		globalization = Windows.Globalization,
		calendarIdentifier = globalization.CalendarIdentifiers.gregorian,
		NUMBER = "number",
		twenty = "24HourClock",
		twelve = "12HourClock";
	namespace("Telerik.Culture", {
		_current: "en-US",
		setCurrent: function (culture, twentyFourHour) {
			/// <summary>
			/// Set global current culture.
			/// </summary>
			/// <param name="culture" type="String">BCP-47 language tag with language and region. For example: en-US, fr-FR, ar-KW</param>
			/// <param name="twentyFourHour" type="Boolean" optional="true">Optional. Indicates whether the clock is 24 hour format. Default value is set according to the culture.</param>
			var that = this;
			if (culture) {
				that._current = culture;
			}
			that.getCultureInfo(culture, twentyFourHour);
			kendo.culture(culture);
		},
		getCurrent: function () {
			/// <summary>
			/// Get the current culture.
			/// </summary>
			return this._current;
		},
		getCultureInfo: function (culture, twentyFourHour) {
			/// <summary>
			/// Create culture object (if it doesn't already exists).
			/// </summary>
			/// <param name="culture" type="String">BCP-47 language tag with language and region. For example: en-US, fr-FR, ar-KW</param>
			/// <param name="twentyFourHour" type="Boolean" optional="true">Optional. Indicates whether the clock is 24 hour format. Default is 12 hour format.</param>
			/// <returns type="Object">Culture object</returns>
			var cultures = kendo.cultures;
			if (twentyFourHour === undefined) {
				twentyFourHour = clockFormat(twentyFourHour, culture);
			}
			if (cultures[culture] && cultures[culture].twentyFourHour === twentyFourHour) {
				return cultures[culture];
			}
			var kendoCulture = buildKendoCulture(culture, twentyFourHour);
			cultures[culture] = kendoCulture;
			return cultures[culture];
		},
		setCultureInfo: function (culture, object) {
			/// <summary>
			/// Set culture object.
			/// </summary>
			/// <param name="culture" type="String">BCP-47 language tag with language and region. For example: en-US, fr-FR, ar-KW</param>
			/// <param name="object" type="Object">Culture object to set</param>
			object = object || {};
			kendo.cultures[culture] = object;
		},
		/// <excludetoc />
		_checkCulture: function (culture) {
			if (!kendo.cultures[culture]) {
				this.getCultureInfo(culture);
			}
		}
	});
	function getRegion(culture) {
		var parts, len;
		parts = culture.split("-");
		len = parts.length;
		return len > 3 ? parts[3] : parts[len-1];
	}
	function returnPeriod(hour, culture) {
		var formatter = new globalization.DateTimeFormatting.DateTimeFormatter( "{period.abbreviated}",  [culture], getRegion(culture), calendarIdentifier, globalization.ClockIdentifiers["twelveHour"] ),
			period = formatter.format( new Date(2003, 1, 2, hour) );
		return period;
	}
	function clockFormat(twentyFourHour, culture) {
		var period = returnPeriod(1, culture);
		if (period.length > 0) {
			twentyFourHour = false;
		} else {
			twentyFourHour = true;
		}
		return twentyFourHour;
	}
	function buildKendoCulture(culture, twentyFourHour) {
		var region = getRegion(culture),
			numberFormatting = globalization.NumberFormatting,
			// Number formatters
			decimalFormatter = new numberFormatting.DecimalFormatter( [culture], region ),
			percentFormatter = new numberFormatting.PercentFormatter( [culture], region ),
			currencyFormatter = new numberFormatting.CurrencyFormatter( currency(culture), [culture], region ),
			// Clock identifiers
			clockToIdentifier = twentyFourHour ? "twentyFourHour" : "twelveHour",
			clockIdentifier = globalization.ClockIdentifiers[clockToIdentifier],
			defaultNumberFraction = decimalFormatter.fractionDigits,
			defaultPercentFraction = percentFormatter.fractionDigits,
			defaultCurrencyFraction = currencyFormatter.fractionDigits,
			kendoCulture = {},
			symbols = {p: "", c: ""},
			group, separator, dateMap, timeMap, mapKendoPatterns;
		dateMap = {
			// Date patterns
			"{day.integer(2)}": "dd",
			"{day.integer}": "d",
			"{dayofweek.abbreviated(2)}/{dayofweek.abbreviated}/{dayofweek.solo.abbreviated(2)}/{dayofweek.solo.abbreviated}": "ddd",
			"{dayofweek.full}/{dayofweek.solo.full}": "dddd",
			"{month.integer(2)}": "MM",
			"{month.integer}": "M",
			"{month.abbreviated(2)}/{month.abbreviated}/{month.solo.abbreviated(2)}/{month.solo.abbreviated}": "MMM",
			"{month.full}/{month.solo.full}": "MMMM",
			"{year.abbreviated(2)}/{year.abbreviated}": "yy",
			"{year.full}": "yyyy"
		}
		timeMap = {
			// Time patterns
			"{hour.integer(2)}": "hh",
			"{hour.integer}": "h",
			"{minute.integer(2)}": "mm",
			"{minute.integer}": "m",
			"{second.integer(2)}": "ss",
			"{second.integer}": "s",
			"{period.abbreviated}": "tt"
		}
		mapKendoPatterns = {
			// short date pattern
			d: { date: "shortdate" },
			// long date pattern
			D: { date: "longdate" },
			// Full date/time pattern
			F: {
				date: "longdate",
				time: "longtime"
			},
			// General date/time pattern (short time)
			g: {
				date: "day month.numeric year.full",
				time: "hour minute"
			},
			// General date/time pattern (long time)
			G: {
				date: "day month.numeric year.full",
				time: "hour minute second"
			},
			// Month/day pattern
			m: { date: "day month.full" },
			// Month/day pattern
			M: { date: "day month.full" },
			// coordinated universal time
			s: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
			// short time pattern
			t: { time: "shorttime" },
			// long time pattern
			T: { time: "longtime" },
			// Universal sortable date/time pattern
			u: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
			// Year/month pattern
			y: { date: "month.full year.full" },
			// Year/month pattern
			Y: { date: "month.full year.full" }
		}
		function formatNumber(num, fraction) {
			decimalFormatter.fractionDigits = typeof fraction === NUMBER ? fraction : defaultNumberFraction;
			return decimalFormatter.format(num);
		}
		function separator(formatter, number) {
			var num, sep;
			formatter.fractionDigits = 1;
			num = formatter.format(1.1);
			sep = num.indexOf(",") > -1 ? "," : ".";
			return sep;
		}
		function groupSeparator(formatter, symbol) {
			var num;
			formatter.isGrouped = true;
			formatter.fractionDigits = 0;
			num = formatter.format(1234567);
			if (symbol) {
				num = num.replace(symbol, "").replace(" ", "");
			}
			group = num.charAt(num.length - 4);
			return group;
		}
		function groupSize(formatter, symbol) {
			var num, parts;
			formatter.isGrouped = true;
			formatter.fractionDigits = 0;
			num = formatter.format(1234567);
			if (symbol) {
				num = num.replace(symbol, "").replace(" ", "");
			}
			parts = num.split(group);
			return parts.length === 2 ? [3,0] : ( parts[1].length === 2 ? [3,2] : [3] );
		}
		function numberPattern() {
			var decimal = formatNumber(2, 0),
				leftParenthesis = "",
				rightParenthesis = "",
				nSymbol = "-",
				dashPosition, num, numPosition, space, RTL;
			num = formatNumber(-2);
			numPosition = num.indexOf(decimal);
			dashPosition = num.indexOf("-");
			RTL = dashPosition > numPosition;
			if (!RTL) {
				if (num.indexOf("(") > -1) {
					leftParenthesis = "(";
					rightParenthesis = ")";
					nSymbol = "";
				}
			}
			space = num.indexOf(" ") > -1 ? " " : "";
			if (RTL) {
				return [leftParenthesis + "n" + space + nSymbol + rightParenthesis];
			} else {
				return [leftParenthesis + nSymbol + space + "n" + rightParenthesis];
			}
		}
		function percentPattern() {
			var num;
			num = percentFormatter.format(2);
			return num.charAt(0) === symbols.p ? ["-%n","%n"] : (num.indexOf(" ") > -1 ? ["-n %","n %"] : ["-n%","n%"]);
		}
		function currency(culture) {
			var geographicRegion = new globalization.GeographicRegion( getRegion(culture).toUpperCase() ),
				topCurrencyInUse = geographicRegion.currenciesInUse[0];
			return topCurrencyInUse;
		}
		function currencyPattern() {
			var decimal = formatNumber(2, 0),
				leftParenthesis = "",
				rightParenthesis = "",
				nSymbol = "-",
				num, numPosition, space, nSpace, symbolPosition, dashPosition, RTL;
			num = currencyFormatter.format(-2);
			numPosition = num.indexOf(decimal);
			symbolPosition = num.indexOf(symbols.c);
			dashPosition = num.indexOf("-");
			nSpace = num.indexOf(" ") > -1 ? " " : "";
			RTL = dashPosition > numPosition;
			if (!RTL) {
				if (num.indexOf("(") > -1) {
					leftParenthesis = "(";
					rightParenthesis = ")";
					nSymbol = "";
				}
			}
			num = currencyFormatter.format(2);
			space = num.indexOf(" ") > -1 ? " " : "";
			if (RTL) {
				if (numPosition < symbolPosition) {
					return dashPosition > symbolPosition ? 
						["n" + nSpace + "$" + nSymbol, "n" + space + "$"] : 
						["n" + nSymbol + nSpace + "$", "n" + space + "$"];
				} else {
					return ["$" + nSpace + "n" + nSymbol, "$" + space + "n"];
				}
			} else {
				if (symbolPosition < numPosition) {
					return dashPosition > symbolPosition ? 
						[leftParenthesis + "$" + nSpace + nSymbol + "n" + rightParenthesis, "$" + space + "n"] : 
						[leftParenthesis + nSymbol + "$" + nSpace + "n" + rightParenthesis, "$" + space + "n"];
				} else {
					return [leftParenthesis + nSymbol + "n" + nSpace + "$" + rightParenthesis, "n" + space + "$"];
				}
			}
		}
		function parseSymbol(formatter, number, symbol) {
			var num = formatNumber(number, 0);
			formatter.fractionDigits = 0;
			symbols[symbol] = formatter.format(2).replace(num, "").replace(" ", "");
			return symbols[symbol];
		}
		function replacePatterns () {
			for (var key in mapKendoPatterns) {
				var formatter, 
					pattern,
					matches,
					separators = [],
					newPattern = "",
					date = mapKendoPatterns[key].date,
					time = mapKendoPatterns[key].time;
				if (date) {
					formatter = new globalization.DateTimeFormatting.DateTimeFormatter( date,  [culture], region, calendarIdentifier, clockIdentifier );
					pattern = formatter.patterns[0];
					matches = pattern.match(/(?=\})[^{]+(?=\{)/g);
					matches.forEach(function (item) {
						if (separators.indexOf(item) === -1) {
							var sub = item.substring(1),
								reg = new RegExp(sub, "g");
							separators.push(item);
							pattern = pattern.replace(reg, "'" + sub + "'");
						}
					});
					for (var item in dateMap) {
						var items = item.split("/");
						for (var i=0; i < items.length; i++) {
							pattern = pattern.replace(items[i], dateMap[item]);
						}
					}
					// fix for hidden symbol that comes from the formatter's patterns array => microsoft's bug
					var re = new RegExp(pattern[0], "g");
					pattern = pattern.replace(re, "");
					newPattern += pattern;
				}
				if (time) {
					formatter = new globalization.DateTimeFormatting.DateTimeFormatter( time,  [culture], region, calendarIdentifier, clockIdentifier );
					pattern = formatter.patterns[0];
					if (date) {
						newPattern += " ";
					}
					if (twentyFourHour) {
						timeMap["{hour.integer(2)}"] = "HH";
						timeMap["{hour.integer}"] = "H";
					}
					for (var item in timeMap) {
						pattern = pattern.replace(item, timeMap[item]);
					}
					// fix for hidden symbol that comes from the formatter's patterns array => microsoft's bug
					var re = new RegExp(pattern[0], "g");
					pattern = pattern.replace(re, "");
					newPattern += pattern;
				}
				if (!date && !time) {
					newPattern = mapKendoPatterns[key];
				}
				mapKendoPatterns[key] = newPattern;
			}
			return mapKendoPatterns;
		}
		function parsePeriod (hour) {
			var period = returnPeriod(hour, culture);
			return period.length > 1 ? [period, period.toLowerCase(), period] : 
									   hour == 1 ? ["AM"] : ["PM"];
		}
		function parseDateSeparator (dateOrtime) {
			var formatter = new globalization.DateTimeFormatting.DateTimeFormatter( dateOrtime,  [culture], region, calendarIdentifier, clockIdentifier ),
				sep = formatter.patterns[0].replace("{period.abbreviated}", "").match(/\}(.*?)\{/)[1];
			return sep || ".";
		}
		function formatMonths() {
			var months = {
					// Array
					// full month names
					names: [],
					// Array
					// abbreviated month names
					namesAbbr: []
				},
				formatterNames = globalization.DateTimeFormatting.DateTimeFormatter( "{month.full}",  [culture], region, calendarIdentifier, clockIdentifier ),
				formatterAbbr = globalization.DateTimeFormatting.DateTimeFormatter( "{month.abbreviated}",  [culture], region, calendarIdentifier, clockIdentifier ),
				names = months.names,
				namesAbbr = months.namesAbbr;
			for (var i=0; i<12; i++) {
				names.push( formatterNames.format( new Date(2000, i, 1)) );
				namesAbbr.push( formatterAbbr.format( new Date(2000, i, 1)) );
			}
			return months;
		}
		function formatDays() {
			var days = {
					// Array
					// full day names
					names: [],
					// Array
					// abbreviated day names
					namesAbbr: [],
					// Array
					// shortest day names
					namesShort: []
				},
				formatterNames = globalization.DateTimeFormatting.DateTimeFormatter( "{dayofweek.full}",  [culture], region, calendarIdentifier, clockIdentifier ),
				formatterAbbr = globalization.DateTimeFormatting.DateTimeFormatter( "{dayofweek.abbreviated}",  [culture], region, calendarIdentifier, clockIdentifier ),
				formatterShort = globalization.DateTimeFormatting.DateTimeFormatter( "{dayofweek.abbreviated(1)}",  [culture], region, calendarIdentifier, clockIdentifier ),
				names = days.names,
				namesAbbr = days.namesAbbr,
				namesShort = days.namesShort;
			// kendo have sunday for first element
			names.push( formatterNames.format( new Date(2000, 1, 6)) );
			namesAbbr.push( formatterAbbr.format( new Date(2000, 1, 6)) );
			namesShort.push( formatterShort.format( new Date(2000, 1, 6)) );
			for (var i=0; i<6; i++) {
				names.push( formatterNames.format( new Date(2000, 1, i)) );
				namesAbbr.push( formatterAbbr.format( new Date(2000, 1, i)) );
				namesShort.push( formatterShort.format( new Date(2000, 1, i)) );
			}
			return days;
		}
		function firstDayOfWeek (region) {
			var firstDay = Windows.System.UserProfile.GlobalizationPreferences.weekStartsOn,
				locations = [];
			locations[0] = ["AG","AR","AS","AU","BR","BS","BT","BW","BY","BZ","CA","CN","CO","DM","DO","ET","GT","GU","HK","HN","ID","IE","IL","IN","JM","JP","KE","KH","KR","LA","MH","MM","MO","MT","MX","MZ","NI","NP","NZ","PA","PE","PH","PK","PR","PY","SG","SV","TH","TN","TT","TW","UM","US","VE","VI","WS","ZA","ZW"];
			locations[1] = ["AD","AI","AL","AM","AN","AT","AX","AZ","BA","BE","BG","BM","BN","CH","CL","CM","CR","CY","CZ","DE","DK","EC","EE","ES","FI","FJ","FO","FR","GB","GE","GF","GP","GR","HR","HU","IS","IT","KG","KZ","LB","LI","LK","LT","LU","LV","MC","MD","ME","MK","MN","MQ","MY","NL","NO","PL","PT","RE","RO","RS","RU","SE","SI","SK","SM","TJ","TM","TR","UA","UY","UZ","VA","VN"];
			locations[5] = ["BD","MV"];
			locations[6] = ["AE","AF","BH","DJ","DZ","EG","IQ","IR","JO","KW","LY","MA","OM","QA","SA","SD","SY","YE"];
			for (var i=0; i<7; i++) {
				if (locations[i]) {
					if (locations[i].indexOf(region) > -1) {
						firstDay = i;
						break;
					}
				}
			}
			return firstDay;
		}
		kendoCulture = {
			// String
			// BCP-47 language tag <language code>-<region code>
			name: culture,
			// "numberFormat" defines general number formatting rules
			numberFormat: {
				// Array
				// numberFormat has only negative pattern unlike the percent and currency
				// negative pattern: one of (n)|-n|- n|n-|n -
				pattern: numberPattern(),
				// Number
				// number of decimal places
				decimals: defaultNumberFraction,
				// String
				// string that separates the number groups (1,000,000)
				",": groupSeparator(decimalFormatter),
				// String
				// string that separates a number from the fractional point
				".": separator(decimalFormatter, 1.1),
				// Array
				// the length of each number group
				groupSize: groupSize(decimalFormatter),
				// formatting rules for percent number
				percent: {
					// Number
					// number of decimal places
					decimals: defaultPercentFraction,
					// String
					// percent symbol
					symbol: parseSymbol(percentFormatter, 200, "p"),
					// Array
					// [negative pattern, positive pattern]
					// negativePattern: one of -n %|-n%|-%n|%-n|%n-|n-%|n%-|-% n|n %-|% n-|% -n|n- %
					// positivePattern: one of n %|n%|%n|% n
					pattern: percentPattern(),
					// String
					// string that separates the number groups (1,000,000 %)
					",": groupSeparator(percentFormatter, symbols.p),
					// String
					// string that separates a number from the fractional point
					".": separator(percentFormatter, 0.1),
					// Array
					// the length of each number group
					groupSize: groupSize(percentFormatter, symbols.p)
				},
				// formatting rules for currency
				currency: {
					// Number
					// number of decimal places
					decimals: defaultCurrencyFraction,
					// String
					// currency symbol
					symbol: parseSymbol(currencyFormatter, 2, "c"),
					// String
					// string that separates the number groups (1,000,000 $)
					",": groupSeparator(currencyFormatter, symbols.c),
					// String
					// string that separates a number from the fractional point
					".": separator(currencyFormatter, 1.1),
					// Array
					// the length of each number group
					groupSize: groupSize(currencyFormatter, symbols.c),
					// Array
					// [negative pattern, positive pattern]
					// negativePattern: one of "($n)|-$n|$-n|$n-|(n$)|-n$|n-$|n$-|-n $|-$ n|n $-|$ n-|$ -n|n- $|($ n)|(n $)"
					// positivePattern: one of "$n|n$|$ n|n $"
					pattern: currencyPattern()
				}
			},
			// "calendars" defines general date and time formatting rules
			calendars: {
				standard: {
					// The different name formats of the days of the week.
					days: formatDays(),
					// The different name formats of the months of the year.
					months: formatMonths(),
					// Array
					// AM designator
					// [standard,lowercase,uppercase]
					AM: parsePeriod(1),
					// Array
					// PM designator
					// [standard,lowercase,uppercase]
					PM: parsePeriod(12),
					// set of predefined date and time patterns used by the culture.
					patterns: replacePatterns(),
					// String
					// date delimiter
					"/": parseDateSeparator("shortdate"),
					// String
					// time delimiter
					":": parseDateSeparator("shorttime"),
					// Number
					// the first day of the week (0 = Sunday, 1 = Monday, etc)
					firstDay: firstDayOfWeek(region),
					// Number
					// the last year of a 100-year range that can be represented by a 2-digit year
					twoDigitYearMax: 2029
				}
			},
			// boolean
			// 24-hour format
			twentyFourHour: twentyFourHour
		}
		return kendoCulture;
	}
	// clear all kendo cultures and set our own default culture
	kendo.cultures = {};
	Telerik.Culture.setCurrent("en-US");
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		define = win.Class.define,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		utilities = win.Utilities,
		telerik = Telerik,
		ui = telerik.UI,
		util = telerik.Utilities,
		common = ui.Common,
		nsName = "Telerik.Data",
		keys = Object.keys,
		ObservableObject = kendo.data.ObservableObject,
		ObservableArray = kendo.data.ObservableArray,
		OBJECT = "object",
		NUMBER = "number",
		ARRAY = "array",
		FUNCTION = "function",
		NULL = null,
		CHANGE = "change",
		ERROR = "error";
	var ObservableArrayProxy = derive(ObservableArray, function (list) {
		/// <summary>
		/// Represents a proxy to a WinJS.Binding.List
		/// </summary>
		/// <param name="list" type="WinJS.Binding.List">The WinJS.Binding.List to watch.</param>
}, null, {
		observe: function (obj) {
			/// <summary>
			/// Get a corresponding kendo.data.ObservableObject instance if the provided obj parameter is a WinJS observable object.
			/// Otherwise return the original passed value.
			/// </summary>
			/// <param name="obj" type="Object">The WinJS observable to watch.</param>
},
		getWinJSObservable: function (obj) {
			/// <summary>
			/// Get the WinJS observable object for this object.
			/// </summary>
			/// <param name="obj" type="Object">The object that is or has a WinJS observable behind.</param>
},
		bind: function (kendo, winjs) {
			/// <summary>
			/// Bind the kendo and WinJS observables together
			/// </summary>
			/// <param name="kendo" type="kendo.data.ObservableObject">The kendo observable</param>
			/// <param name="winjs" type="Object">The WinJS observable</param>
},
		unbind: function (winjs) {
			/// <summary>
			/// Unbind the provided WinJS observable from its connected kendo ObservableObject
			/// </summary>
			/// <param name="winjs" type="Object">The WinJS observable</param>
}
	});
	function defineProperty(name, defaultValue, getterMapping, mergeState) {
		return {
			get: function () {
				var ds = this._ds,
					key = getterMapping || name,
					value;
				//try calling ds.value() function
				if (typeof (ds[name]) === FUNCTION) {
					value = ds[name]();
				}
				//try getting ds.options.value or ds.value property
				if (value === undefined) {
					value = util.getPropertyValue(ds, key);
				}
				//default value
				if (value === undefined) {
					value = defaultValue;
				}
				return value;
			},
			set: function (value) {
				var that = this,
					key = getterMapping || name,
					oldValue = that[name],
					value = ui._ControlConfiguration.validate(that._validators || {}, name, value, oldValue);
				if (value !== undefined) {
					util.setPropertyValue(that._ds, key, value);
					if (mergeState) {
						var newOption = {};
						newOption[name] = value;
						that._ds._mergeState($.extend({}, {
							page: that._ds.page(),
							pageSize: that._ds.pageSize(),
							sort: that._ds.sort(),
							filter: that._ds.filter(),
							group: that._ds.group(),
							aggregate: that._ds.aggregate()
						}, newOption));
					}
					that._change(name, value, oldValue);
				}
			},
			enumerable: true
		};
	}
	function normalizeOptions(opts) {
		var options = opts || {},
			dsType = (options && options._dsType) || kendo.data.DataSource,
			kendoDS = NULL;
			if (options instanceof dsType) {
			kendoDS = options;
			options = {};
		}
		else if (options instanceof win.Binding.List) {
			options = { data: new ObservableArrayProxy(options) };
		}
		else if (options.data instanceof win.Binding.List) {
			options.data = new ObservableArrayProxy(options.data);
		}
		else if (util.getType(options) === ARRAY) {
			options = { data: options };
		}
		return {
			options: options,
			kendoDS: kendoDS
		};
	}
	var DataSource = define(function (options) {
		/// <summary>
		/// Initializes a new instance of the Telerik.Data.DataSource component.
		/// </summary>
		/// <param name="options" type="Object" optional="true">The configuration options for this DataSource component.</param>
		/// <event name="change">Fires when the underlying data is changed.</event>
		/// <event name="error" type="Telerik.Data.DataSource.ErrorEventArgs">
		/// Fires when an error occurs during data retrieval.
		/// <param name="errorThrown" type="Object">An object containing information about the thrown error. 
		/// It includes: description, message, number and stack properties.</param>
		/// <param name="status" type="String">A string describing the type of the error.</param>
		/// <param name="xhr" type="Object">The xhr object of the request.</param>
		/// </event>
		/// <event name="requeststart">Fires before a data request is made.</event>
		/// <event name="requestend" type="Telerik.Data.DataSource.RequestEndEventArgs">
		/// Fires when a request ends.
		/// <param name="requestType" type="String">The type of the request-"create", "read", "update" or "destroy".</param>
		/// <param name="response" type="Object">The raw remote service response.</param>
		/// </event>
		/// <event name="sync">Fires after changes are synced.</event>
}, {
		/// <field type="Array">
		/// Gets or sets the underlying raw data array.
		/// </field>
		data: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets the object that describes the raw data format. Once configured through
		/// the constructor options, the schema is read-only.
		/// </field>
		schema: {get:function(){}},
		/// <field type="Object">
		/// Gets or sets the object that describes how data is loaded from a remote endpoint.
		/// Once configured through the constructor options, the transport is read-only.
		/// </field>
		transport: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the name of a transport with preconfigured settings. Currently only "odata" is supported.
		/// Once configured through the constructor options, the transport type is read-only.
		/// </field>
		/// <options>
		/// <option value=""></option>
		/// <option value="odata">odata</option>
		/// </options>
		type: {get:function(){}},
		/// <field type="Number" integer="true" mayBeNull="true">
		/// Gets or sets the page index. Default value is null.
		/// </field>
		page: defineProperty("page", NULL, "options.page", true),
		/// <field type="Number" integer="true" mayBeNull="true">
		/// Gets or sets the number of items a page of data contains. Default value is null, indicating no paging is used.
		/// </field>
		pageSize: defineProperty("pageSize", NULL, "options.pageSize", true),
		/// <field type="Object">
		/// Gets or sets the filter descriptors. Accepts an object or an array of objects for multiple filter descriptors.
		/// </field>
		filter: defineProperty("filter", NULL, "options.filter", true),
		/// <field type="Object">
		/// Gets or sets the group descriptors. Accepts an object or an array of objects for multiple group descriptors.
		/// </field>
		group: defineProperty("group", NULL, "options.group", true),
		/// <field type="Object">
		/// Gets or sets the sort descriptors. Accepts an object or an array of objects for multiple sort descriptors.
		/// </field>
		sort: defineProperty("sort", NULL, "options.sort", true),
		/// <field type="Object">
		/// Gets or sets the aggregate descriptors. Accepts an object or an array of objects for multiple aggregate descriptors.
		/// </field>
		aggregate: defineProperty("aggregate", NULL, "options.aggregate", true),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether aggregates should be calculated on the server when a remote endpoint is used.
		/// </field>
		serverAggregates: defineProperty("serverAggregates", false, "options.serverAggregates"),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether filtering should be applied on the server when a remote endpoint is used.
		/// </field>
		serverFiltering: defineProperty("serverFiltering", false, "options.serverFiltering"),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether grouping should be applied on the server when a remote endpoint is used.
		/// </field>
		serverGrouping: defineProperty("serverGrouping", false, "options.serverGrouping"),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether paging should be applied on the server when a remote endpoint is used.
		/// </field>
		serverPaging: defineProperty("serverPaging", false, "options.serverPaging"),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether sorting should be applied on the server when a remote endpoint is used.
		/// </field>
		serverSorting: defineProperty("serverSorting", false, "options.serverSorting"),
		/// <field type="Boolean">
		/// Enables or disables the automatic invocation of the sync method after each change made to the data.
		/// </field>
		autoSync: defineProperty("autoSync", false, "options.autoSync"),
		/// <field type="Boolean" defaultValue="false">
		/// Enables or disables batch mode.
		/// </field>
		batch: defineProperty("batch", false, "options.batch"),
		/// <field type="Number" integer="true">
		/// Retrieves the number of available pages.
		/// </field>
		totalPages: {get:function(){}},
		/// <field type="Number" integer="true">
		/// Retrieves the total number of data records.
		/// </field>
		total: {get:function(){}},
		/// <field type="Object" readonly="true" hidden="true">
		/// Retrieves the result of aggregation.
		/// </field>
		aggregates: {get:function(){}},
		/// <field type="Array" readonly="true" hidden="true">
		/// Gets a view of the data with operations such as sorting, paging, filtering and grouping applied. To ensure data is
		/// available, this property should be used from within the change event of the data source, or from a success callback
		/// of the promise returned by a data-processing method such as fetch or read.
		/// </field>
		view: {get:function(){}},
		at: function (index) {
			/// <summary>
			/// Returns the data record at the specified index.
			/// </summary>
			/// <param name="index" type="Number" integer="true">The index of the data record to retrieve.</param>
			/// <returns type="Object"></returns>
},
		indexOf: function (model) {
			/// <summary>
			/// Retrieve the index of a specified observable object from the underlying data.
			/// </summary>
			/// <param name="model" type="Object">The observable object whose index to retreive.</param>
},
		fetch: function () {
			/// <summary>
			/// Fetches data using the current filter/sort/group/paging information. If data is not available or remote operations 
			/// are enabled, data is requested through the transport, otherwise operations are executed over the available data.
			/// </summary>
			/// <returns type="WinJS.Promise"></returns>
},
		read: function () {
			/// <summary>
			/// Read the data into the DataSource using the transport read definition.
			/// </summary>
			/// <returns type="WinJS.Promise"></returns>
},
		query: function (options) {
			/// <summary>
			/// Executes a query over the data. Available operations are paging, sorting, filtering, grouping. 
			/// If data is not available or remote operations are enabled, data is requested through the transport. 
			/// Otherwise operations are executed over the available data.
			/// </summary>
			/// <param name="options" type="Object">Configuration options for this query. Contains page, sort, filter, group and aggregate descriptors.</param>
			/// <returns type="WinJS.Promise"></returns>
},
		add: function (model) {
			/// <summary>
			/// Adds a new data item to the DataSource
			/// </summary>
			/// <param name="model" type="Object">The new data item to add.</param>
},
		insert: function (index, model) {
			/// <summary>
			/// Inserts a new item into the DataSource at the specified index.
			/// </summary>
			/// <param name="index" type="Number">The zero-based index of the position to insert.</param>
			/// <param name="model" type="Object">The Javascript object to insert.</param>
},
		remove: function (model) {
			/// <summary>
			/// Remove the specified item from the DataSource
			/// </summary>
			/// <param name="model" type="Object">The item to remove.</param>
			/// <returns type="Object">The removed item.</returns>
},
		hasChanges: function () {
			/// <summary>
			/// Gets or sets a boolean value indicating whether data in the DataSource have changed.
			/// </summary>
},
		cancelChanges: function (model) {
			/// <summary>
			/// Cancels any changes made to the data since the last sync.
			/// </summary>
			/// <param name="model" type="Object" optional="true">Optional. The data item to cancel any changes for.</param>
},
		//HACK: this function cannot be named simply 'get', because this will not allow adding a DataSource to a WinJS namespace (treats it as a getter)
		getById: function (id) {
			/// <summary>
			/// Retrieves a model by a given ID.
			/// </summary>
			/// <param name="id" type="Object">The ID of the model to retrieve. The ID of a model is defined through the schema.model.id option.</param>
			/// <returns type="Object"></returns>
},
		getByUid: function (uid) {
			/// <summary>
			/// Retrieves a model by a its uid field.
			/// </summary>
			/// <param name="uid" type="String">The uid of the item to retrieve.</param>
			/// <returns type="Object"></returns>
},
		sync: function () {
			/// <summary>
			/// Synchronizes changes through the transport. Any pending CRUD operations will be sent to the server. If the 
			/// DataSource is in batch mode, only one call will be made for each type of operation (Create, Update, Destroy).
			/// Otherwise, the DataSource will send one request per item change and change type.
			/// </summary>
},
		clone: function () {
			/// <summary>
			/// Clones this Telerik.Data.DataSource instance along with options and data.
			/// </summary>
			/// <returns type="Telerik.Data.DataSource"></returns>
}
	});
	mix(DataSource, common.eventMixin, utilities.createEventProperties("change", "error", "requeststart", "requestend", "sync"));
	/* Override dispatchEvent to customize event arguments */
	DataSource.prototype.dispatchEvent = function (type, details) {
		/// <summary>
		/// Raises an event of the specified type and with the specified additional properties.
		/// </summary>
		/// <param name="type" type="string">The type (name) of the event.</param>
		/// <param name="details" type="object">The event details object.</param>
		if (type === "requestend") {
			//set the request type to another property, as the evt.type property is used for specifying the event type
			details.requestType = details.type;
		}
		common.eventMixin.dispatchEvent.call(this, type, details);
	}
	namespace(nsName, {
		DataSource: DataSource
	});
	//Transport for Telerik.DataStorage integration
	/// <excludetoc />
	var dataStorageTransport = define(function (options) {
		/// <excludetoc />
		/// <summary>
		/// For internal use only. Creates a new instance of the Telerik.DataStorage transport for the DataSource component.
		/// </summary>
}, {
		read: function (options) {
},
		destroy: function (options) {
},
		create: function (options) {
},
		update: function (options) {
}
	}),
			/// <excludetoc />
			dataStorageReader = kendo.data.DataReader.extend({}),
			/// <excludetoc />
			dataStorageSchema = {
				type: "dataStorage",
				data: function (data) {
					return data;
				},
				total: function (data) {
					return data.length;
				}
			};
	kendo.data.transports.dataStorage = dataStorageTransport;
	kendo.data.schemas.dataStorage = dataStorageSchema;
	kendo.data.readers.dataStorage = dataStorageReader;
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		DataSource = Telerik.Data.DataSource,
		priv = util.setPrivate,
		BOOLEAN = "boolean",
		RADIX = 10,
		CONTAINERCSSCLASS = "t-list",
		INTERACTIVECSSCLASS = "win-interactive";
	/// <summary>
	/// Serves as a base class for the AutoComplete, DropDownList and ComboBox controls. For internal use only.
	/// </summary>
	/// <event name="change">Fires when the value of the control changes.</event>
	/// <event name="open">Fires when the drop-down list is shown.</event>
	/// <event name="close">Fires when the drop-down list is closed.</event>
	/// <event name="select">Fires when an item is selected from the drop-down list.</event>
	/// <event name="databinding">Fires when the control is about to databind.</event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <excludetoc />
	var ListBase = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// Serves as a base class for the AutoComplete, DropDownList and ComboBox controls. For internal use only.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		//Override this method when the control needs to set additional
		//options after the widget has been initialized. Call this
		//method in derived classes after ensuring widget is initialized.
		/// <field type="String">
		/// Gets or sets the value of the control.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets the animation options to be used for opening/closing the popup.
		/// </field>
		animation: {get:function(){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether to bind the widget to the dataSource on initialization.
		/// </field>
		autoBind: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.Data.DataSource">
		/// Gets or sets the data source of the control.
		/// </field>
		dataSource: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the field of the data item that provides the text content of the list items.
		/// </field>
		dataTextField: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the field of the data item that provides the value content of the list items.
		/// </field>
		dataValueField: {get:function(){}, set:function(value){}},
		/// <field type="Number">
		/// Gets or sets the delay in ms after which the control will start filtering the dataSource.
		/// </field>
		delay: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the enabled state of the control.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="Number"  defaultValue="200">
		/// Gets or sets the height of the drop-down list in pixels.
		/// </field>
		height: {get:function(){}, set:function(value){}},
	    /// <field type="String">
	    /// Specifies a static HTML content, which will be rendered as a header of the popup element.
	    /// </field>
		headerTemplate: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the template to be used for rendering the items in the list.
		/// </field>
		template: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether the search should be case sensitive.
		/// </field>
		ignoreCase: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" hidden="true">
		/// Gets a value indicating whether the list container is currently open.
		/// </field>
		isOpen: {get:function(){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether the control is read-only.
		/// </field>
		readonly: {get:function(){}, set:function(value){}},
		/// <field type="Object" hidden="true">
		/// Gets the jQuery-wrapped list of items in the control.
		/// </field>
		list: {get:function(){}},
		dataItem: function (index) {
			/// <summary>
			/// Returns the raw data record at the specified index or the selected index.
			/// </summary>
			/// <param name="index" type="Number" integer="true" optional="true">Optional. The zero-based index of the data record to retrieve.</param>
},
		refresh: function () {
			/// <summary>
			/// Re-renders the items in the drop-down list.
			/// </summary>
},
		search: function (word) {
			/// <summary>
			/// Filters the data using the provided parameter and rebinds drop-down list.
			/// </summary>
			/// <param name="word" type="String">The value to search for.</param>
},
		select: function (li) {
			/// <summary>
			/// Selects drop-down list item and sets the text of the combobox control.
			/// </summary>
			/// <param name="li" type="HTMLElement" domElement="true">The list item element to select.</param>
},
		close: function () {
			/// <summary>
			/// Closes the drop-down list.
			/// </summary>
},
		focus: function () {
			/// <summary>
			/// Gives focus to the input element of the control.
			/// </summary>
}
		});
	mix(ListBase, win.Utilities.createEventProperties("open", "close", "select", "change", "databinding", "databound"));
	/// <summary>
	/// Serves as a base class for the DropDownList and ComboBox controls. Implements cascade support. For internal use only.
	/// </summary>	
	/// <excludetoc />
	var CascadingListBase = derive(ListBase, function (element, options) {
}, {
		/// <field type="String">
		/// Gets the ID of the parent ComboBox control that will filter the values of this ComboBox. This property is read-only.
		/// </field>
		cascadeFrom: {get:function(){}, set:function(value){}},
	    /// <field type="String">
	    /// Defines the field to be used to filter the data source.
	    /// </field>
		cascadeFromField: {get:function(){}, set:function(value){}},
	});
	mix(CascadingListBase, win.Utilities.createEventProperties("cascade"));
	namespace("Telerik.UI", {
		ListBase: ListBase,
		CascadingListBase: CascadingListBase
	});
	// Modify _cascade method to implement cascading functionality for RadDropDownList and RadComboBox
	var originalCascade = kendo.ui.Select.prototype._cascade;
	kendo.ui.Select.prototype._cascade = function () {
		var that = this,
			cascade = that.options.cascadeFrom,
			parentElement,
			wrapper,
			widgetId;
		if (cascade) {
			parentElement = $("#" + cascade);
			if (parentElement[0]) {
				wrapper = parentElement[0].winControl;
				if (wrapper && wrapper._widget) {
					widgetId = wrapper._widget.element.attr("id");
					if (!widgetId) {
						widgetId = kendo.guid();
						wrapper._widget.element.attr("id", widgetId);						
					}
					//use a temporary ID for the cascadeFrom functionality, so that the original _cascade method can find the widget
					that.options.cascadeFrom = widgetId;
				}
			}
		}
		originalCascade.apply(that, arguments);
		//restore the original cascadeFrom value;
		that.options.cascadeFrom = cascade;
	}
	//modify the busy indicator logic
	kendo.ui.Select.prototype._showBusy = function () {
		var that = this;
		that._request = true;
		if (that._busy) {
			return;
		}
		that._busy = setTimeout(function () {
			that._focused.attr("aria-busy", true);
			Telerik.UI.progress(that.element.parents(".t-list"), true);
		}, 100);
	}
	kendo.ui.Select.prototype._hideBusy = function () {
		var that = this;
		clearTimeout(that._busy);
		Telerik.UI.progress(that.element.parents(".t-list"), false);
		that._focused.attr("aria-busy", false);
		that._busy = null;
	}
	kendo.ui.AutoComplete.prototype._showBusy = kendo.ui.Select.prototype._showBusy;
	kendo.ui.AutoComplete.prototype._hideBusy = kendo.ui.Select.prototype._hideBusy;
	kendo.ui.MultiSelect.prototype._showBusy = kendo.ui.Select.prototype._showBusy;
	kendo.ui.MultiSelect.prototype._hideBusy = kendo.ui.Select.prototype._hideBusy;
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		utilities = win.Utilities,
		telerik = Telerik,
		ui = telerik.UI,
		cul = telerik.Culture,
		nsName = "Telerik.UI.Chart",
		ns = namespace(nsName),
		common = ui.Common,
		util = telerik.Utilities,
		DataSource = Telerik.Data.DataSource,
		OBJECT = "object",
		ARRAY = "array",
		FUNCTION = "function",
		NULL = null,
		config = ui._ControlConfiguration,
		defineProperty = config.defineProperty,
		getMapping = config.getMapping,
		priv = util.setPrivate;
	/// <summary>
	/// A charting control that can visualize different chart types.
	/// </summary>
	/// <icon src="chart_html_12.png" width="12" height="12" />
	/// <icon src="chart_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadChart"></div>]]></htmlSnippet>
	/// <event name="axislabelclick" argsType="Telerik.UI.Chart.AxisLabelClickEventArgs">
	/// Fires when an axis label is clicked.
	/// <param name="axis" type="Telerik.UI.Chart.Axis">The axis that the clicked label belongs to.</param>
	/// <param name="dataItem" type="Object">The original data item used to generate the label. Applicable only for data bound category axis.</param>
	/// <param name="element" type="Object">The jQuery element representing the label.</param>
	/// <param name="index" type="Number">The label sequential index or category index.</param>
	/// <param name="text" type="String">The label text.</param>
	/// <param name="value" type="Object">The label value or category name.</param>
	/// </event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <event name="dragstart" argsType="Telerik.UI.Chart.DragStartEventArgs">
	/// Fires when the user has used the mouse or a swipe gesture to drag the chart.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the drag action.</param>
	/// </event>
	/// <event name="drag" argsType="Telerik.UI.Chart.DragEventArgs">
	/// Fires as long as the user is dragging the chart using the mouse or swipe gestures.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the drag action.</param>
	/// </event>
	/// <event name="dragend" argsType="Telerik.UI.Chart.DragEndEventArgs">
	/// Fires when the user stops dragging the chart.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the drag end action.</param>
	/// </event>
	/// <event name="legenditemclick" argsType="Telerik.UI.Chart.LegendItemClickEventArgs">
	/// Fires when a series in the chart legend is clicked.
	/// <param name="series" type="Telerik.UI.Chart.Series">The chart series object represented by the legend item.</param>
	/// <param name="seriesIndex" type="Number">The index of the chart series.</param>
	/// <param name="text" type="String">The legend item text.</param>
	/// </event>
	/// <event name="legenditemhover" argsType="Telerik.UI.Chart.LegendItemHoverEventArgs">
	/// Fires when a series in the chart legend is hovered.
	/// <param name="series" type="Telerik.UI.Chart.Series">The chart series object represented by the legend item.</param>
	/// <param name="seriesIndex" type="Number">The index of the chart series.</param>
	/// <param name="text" type="String">The legend item text.</param>
	///</event>
	/// <event name="plotareaclick" argsType="Telerik.UI.Chart.PlotAreaClickEventArgs">
	/// Fires when the plot area is clicked.
	/// <param name="category" type="Object">The data point category. Available only for categorical charts (bar, line, area and similar).</param>
	/// <param name="element" type="Object">The jQuery element representing the plot area.</param>
	/// <param name="value" type="Object">The data point value. Available only for categorical charts (bar, line, area and similar).</param>
	/// <param name="x" type="Object">The X axis value or array of values for XY-charts.</param>
	/// <param name="y" type="Object">The Y axis value or array of values for multi-axis charts.</param>
	/// </event>
	/// <event name="seriesclick" argsType="Telerik.UI.Chart.SeriesClickEventArgs">
	/// Fires when any of the chart series is clicked.
	/// <param name="category" type="Object">The clicked data point category.</param>
	/// <param name="dataItem" type="Object">The original data item (when binding to dataSource).</param>
	/// <param name="element" type="Object">The jQuery element representing the data point.</param>
	/// <param name="series" type="Telerik.UI.Chart.Series">The clicked series instance.</param>
	/// <param name="value" type="Object"> The clicked data point value.</param>
	/// </event>
	/// <event name="serieshover" argsType="Telerik.UI.Chart.SeriesHoverEventArgs">
	/// Fires when any of the chart series is hovered.
	/// <param name="category" type="Object">The clicked data point category.</param>
	/// <param name="dataItem" type="Object">The original data item (when binding to dataSource).</param>
	/// <param name="element" type="Object">The jQuery element representing the data point.</param>
	/// <param name="series" type="Telerik.UI.Chart.Series">The hovered series instance.</param>
	/// <param name="value" type="Object"> The clicked data point value.</param>
	///</event>
	/// <event name="zoomstart" argsType="Telerik.UI.Chart.ZoomStartEventArgs">
	/// Fires when the user has used the mousewheel to zoom the chart.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the zoom action.</param>
	/// </event>
	/// <event name="zoom" argsType="Telerik.UI.Chart.ZoomEventArgs">
	/// Fires as long as the user is zooming the chart using the mousewheel.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="delta" type="Number">A number that indicates the zoom amount and direction. A negative value indicates "zoom in" and a positive-"zoom out".</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the zoom action.</param>
	/// </event>
	/// <event name="zoomend" argsType="Telerik.UI.Chart.ZoomEndEventArgs">
	/// Fires when the user stops zooming the chart.
	/// <param name="axisRanges" type="Object">A hastable containing the initial range (min and max values) of named axes. The axis name is used as a key.</param>
	/// <param name="originalEvent" type="Object">The original user event that triggered the zoom end action.</param>
	/// </event>
	/// <event name="selectstart" argsType="Telerik.UI.Chart.SelectStartEventArgs">
	/// Fires when the user starts modifying the axis selection.
	/// <param name="from" type="Object">The lower boundary of the selected range.</param>
	/// <param name="to" type="Object">The upper boundary of the selected range. The last selected category is at index [to - 1] unless the axis is justified. In this case it is at index [to].</param>
	/// </event>
	/// <event name="select" argsType="Telerik.UI.Chart.SelectEventArgs">
	/// Fires when the user modifies the selection.
	/// <param name="from" type="Object">The lower boundary of the selected range.</param>
	/// <param name="to" type="Object">The upper boundary of the selected range. The last selected category is at index [to - 1] unless the axis is justified. In this case it is at index [to].</param>
	/// </event>
	/// <event name="selectend" argsType="Telerik.UI.Chart.SelectEndEventArgs">
	/// Fires when the user completes modifying the selection.
	/// <param name="from" type="Object">The lower boundary of the selected range.</param>
	/// <param name="to" type="Object">The upper boundary of the selected range. The last selected category is at index [to - 1] unless the axis is justified. In this case it is at index [to].</param>
	/// </event>
	/// <part name="chart" class="k-chart">The RadChart widget.</part>
	/// <part name="tooltip" class="k-tooltip">The tooltip of the chart.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadChart = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// Creates a new RadChart control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.Data.DataSource">
		/// Gets or sets the data source object for this control.
		/// </field>
		dataSource: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Indicates whether the chart will call read on the DataSource initially.
		/// </field>
		autoBind: defineProperty("autoBind", true),
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables transitions. True by default.
		/// </field>
		transitions: defineProperty("transitions", true),
		/// <field type="String" defaultValue="dark">
		/// Gets or sets the visual theme of the chart.
		/// </field>
		theme: defineProperty("theme", "dark"),
		/// <field type="Array" elementType="String">
		/// Gets or sets the color collection that will be used for styling the chart series.
		/// Array elements must be valid CSS color definitions.
		/// </field>
		seriesColors: defineProperty("seriesColors", []),
		/// <field type="String" defaultValue="none">
		/// Gets or sets the background of the chart area.
		/// </field>
		background: defineProperty("background", "none"),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the background opacity of the chart area.
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the chart area.
		/// </field>
		border: {get:function(){}},
		/// <field type="Number" defaultValue="600">
		/// Gets or sets the width of the chart area in pixels.
		/// </field>
		width: defineProperty("width", 600),
		/// <field type="Number" defaultValue="400">
		/// Gets or sets the height of the chart area in pixels.
		/// </field>
		height: defineProperty("height", 400),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the chart area.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Telerik.UI.Chart._TitleConfiguration">
		/// Gets the title settings of the chart.
		/// </field>
		title: {get:function(){}},
		/// <field type="Telerik.UI.Chart._LegendConfiguration">
		/// Gets the legend settings of the chart.
		/// </field>
		legend: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Chart.Pane">
		/// The chart panes configuration.
		/// Panes are used to split the chart in two or more parts. The panes are ordered from top to bottom.
		/// Each axis can be associated with a pane by setting its pane option to the name of the desired pane. Axis that don't have specified pane are placed in the top (default) pane.
		/// Series are moved to the desired pane by associating them with an axis.
		/// </field>
		panes: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Chart._TooltipConfiguration">
		/// Gets the tooltip settings of the chart.
		/// </field>
		tooltip: {get:function(){}},
		/// <field type="Telerik.UI.Chart._PlotAreaConfiguration">
		/// Gets the plot are settings.
		/// </field>
		plotArea: {get:function(){}},
		/// <field type="Telerik.UI.Chart.Axis">
		/// Gets the default settings that apply to all axes.
		/// </field>
		axisDefaults: {get:function(){}},
		/// <field type="Telerik.UI.Chart.Axis">
		/// Gets the value axis settings.
		/// </field>
		valueAxis: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Chart.Axis">
		/// Gets the array of all value axis defined for the chart.
		/// </field>
		valueAxes: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Chart.CategoryAxis">
		/// Gets the category axis settings.
		/// </field>
		categoryAxis: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Chart.CategoryAxis">
		/// Gets the array of all category axes defined for the chart.
		/// </field>
		categoryAxes: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Chart.Axis">
		/// Gets the X axis settings when a scatter chart type is used.
		/// </field>
		xAxis: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Chart.Axis">
		/// Gets the array of all X axis defined for the chart.
		/// </field>
		xAxes: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Chart.Axis">
		/// Gets the Y axis settings when a scatter chart type is used.
		/// </field>
		yAxis: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Chart.Axis">
		/// Gets the array of all Y axis defined for the chart.
		/// </field>
		yAxes: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Chart.Series">
		/// Gets the default settings common to all series.
		/// </field>
		seriesDefaults: {get:function(){}, set:function(value){}},
		/// <field type="Array">
		/// Gets or sets the data series in the chart.
		/// </field>
		series: {get:function(){}, set:function(value){}},
		/// <field type="String" readonly="true" hidden="true">
		/// Gets the SVG representation of the current chart.
		/// </field>
		svg: {get:function(){}},
		refresh: function () {
			/// <summary>
			/// Reloads the data and repaints the chart.
			/// </summary>
},
		redraw: function () {
			/// <summary>
			/// Repaints the chart.
			/// </summary>
}
	});
	namespace("Telerik.UI", {
		RadChart: RadChart
	});
	mix(RadChart, utilities.createEventProperties("axislabelclick", "databound", "dragstart", "drag", "dragend", "legenditemclick", "legenditemhover", "plotareaclick", "seriesclick", "serieshover", "zoomstart", "zoom", "zoomend", "selectstart", "select", "selectend"));
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Chart",
		common = Telerik.UI.Common,
		util = Telerik.Utilities,
		cul = Telerik.Culture,
		NULL = null,
		SANS12 = "12px Arial,Helvetica,sans-serif",
		config = Telerik.UI._ControlConfiguration,
		defineProperty = config.defineProperty,
		getMapping = config.getMapping,
		priv = util.setPrivate;
	var _TitleConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart title.
		/// </summary>
}, {
		/// <field type="String" defaultValue="center">
		/// Gets or sets the chart title alignment. Accepted values are: "left", "center", "right". Default is "center"
		/// </field>
		/// <options>
		/// <option value="left">left</option>
		/// <option value="center">center</option>
		/// <option value="right">right</option>
		/// </options>
		align: defineProperty("align", "center"),
		/// <field type="String">
		/// Gets or sets the background color of the chart title.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the chart title.
		/// </field>
		border: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the text color of the chart title.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="String">
		/// Gets or sets the title font.
		/// </field>
		font: defineProperty("font", SANS12),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the chart title.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the padding settings of the chart title.
		/// </field>
		padding: {get:function(){}},
		/// <field type="String" defaultValue="top">
		/// Gets or sets the vertical position of the chart title. Accepted values are: "top" and "bottom". Default is "top".
		/// </field>
		/// <options>
		/// <option value="top">top</option>
		/// <option value="bottom">bottom</option>
		/// </options>
		position: defineProperty("position", "top"),
		/// <field type="String">
		/// Gets or sets the title text.
		/// </field>
		text: defineProperty("text", ""),
		/// <field type="Boolean">
		/// Gets or sets the title visibility. Default is false.
		/// </field>
		visible: defineProperty("visible", false)
	});
	var _LegendLabelConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart legend labels.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the text color of the label. Any valid CSS color value is accepted.
		/// </field>
		color: defineProperty("color", "black"),
		/// <field type="String">
		/// Gets or sets the label font style.
		/// </field>
		font: defineProperty("font", SANS12),
		/// <field type="String">
	    /// Gets or sets the label template. Inside the template, the following variables can be used:
	    /// category - the category name. (only for area, bar, column, bubble, donut, funnel, line and pie series);
	    /// text - the text the legend item;
	    /// series - the data series;
		/// value - the point value. (only for donut and pie charts);
	    /// percentage - the point value represented as a percentage value. (only for donut, funnel and pie charts);
		/// dataItem - the original data item used to construct the point. (only for donut and pie charts)
		/// </field>
		template: defineProperty("template", ""),
	});
	//TODO: add additional options (font, template) when they are supported by kendo
	var _LegendInactiveItemsColorConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart legend color for labels and markers.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the legend item color. Any valid CSS color value is accepted.
		/// </field>
		color: defineProperty("color", NULL)
	});
	var _LegendInactiveItemsConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart inactive legend items.
		/// </summary>
}, {
		/// <field type="Telerik.UI.Chart._LegendInactiveItemsColorConfiguration">
		/// Gets the label settings of the chart inactive legend items.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Telerik.UI.Chart._LegendInactiveItemsColorConfiguration">
		/// Gets the marker settings of the chart inactive legend items.
		/// </field>
		markers: {get:function(){}}
	});
	var _LegendConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart legend.
		/// </summary>
}, {
		/// <field type="String" defaultValue="white">
		/// Gets or sets the background color of chart legend. Any valid CSS value is accepted.
		/// </field>
		background: defineProperty("background", "white"),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the chart legend.
		/// </field>
		border: {get:function(){}},
		/// <field type="Telerik.UI.Chart._LegendInactiveItemsConfiguration">
		/// Gets the settings of the inactive legend items.
		/// </field>
		inactiveItems: {get:function(){}},
		/// <field type="Telerik.UI.Chart._LegendLabelConfiguration">
		/// Gets the label settings of the chart legend.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the chart legend.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the padding settings of the chart legend.
		/// </field>
		padding: {get:function(){}},
		/// <field type="Number" defaultValue="0">
		/// Gets or sets the X offset of the legend from its positions.
		/// </field>
		offsetX: defineProperty("offsetX", 0),
		/// <field type="Number" defaultValue="0">
		/// Gets or sets the Y offset of the legend from its positions.
		/// </field>
		offsetY: defineProperty("offsetY", 0),
		/// <field type="String" defaultValue="right">
		/// Gets or sets the position of the chart legend. Accepted values are:
		/// "top", "bottom", "left", "right", "custom". When a value of "custom"
		/// is used, the legend is positioned using its offsetX and offsetY
		/// properties. Default value is "right".
		/// </field>
		/// <options>
		/// <option value="top">top</option>
		/// <option value="bottom">bottom</option>
		/// <option value="left">left</option>
		/// <option value="right">right</option>
		/// <option value="custom">custom</option>
		/// </options>
		position: defineProperty("position", "right"),
		/// <field type="Boolean" defautlValue="true">
		/// Gets or sets the legend visibility. Default is true.
		/// </field>
		visible: defineProperty("visible", true)
	});
	var _TooltipConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart tooltip.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the tooltip. The default value is
		/// determined from the series color.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the tooltip border settings.
		/// </field>
		border: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the text color of the tooltip. The default value is
		/// determined from the series label color.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="String">
		/// Gets or sets the tooltip font.
		/// </field>
		font: defineProperty("font", SANS12),
		/// <field type="String">
		/// Gets or sets the tooltip format. Format variables depend on the series type: 
		/// Area, bar, column, funnel, line and pie 0 - value; 
		/// Bubble, scatter and scatterLine 0 - x value, 1 - y value; 
		/// Candlestick and OHLC 0 - open value, 1 - high value, 2 - low value, 3 - close value, 4 - category name; 
		/// For Example: "{0:C}--{1:C}" to show a tooltip on candlestick series for open and high values.
		/// </field>
		format: defineProperty("format", ""),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the padding settings of the tooltip.
		/// </field>
		padding: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the template that is used to render the tooltip. Available
		/// template variables are value, category, series and dataItem.
		/// </field>
		template: defineProperty("template", ""),
		/// <field type="Boolean">
		/// Gets or sets the tooltip visibility. Default is false.
		/// </field>
		visible: defineProperty("visible", false),
		/// <field type="Boolean">
		/// A value indicating if the tooltip should be shared. Default is false.
		/// </field>
		shared: defineProperty("shared", false),
		/// <field type="String">
		/// The shared tooltip template.
		/// Template variables: points - the category points, category - the category name
		/// </field>
		sharedTemplate: defineProperty("sharedTemplate", ""),
	});
	var _PlotAreaConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart plot area.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the plot area.
		/// </field>
		background: defineProperty("background", "white"),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the plot area opacity.
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the plot area.
		/// </field>
		border: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the plot area.
		/// </field>
		margin: {get:function(){}}
	});
	var _LabelConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart labels.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the labels. Any valid CSS color is accepted.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the labels.
		/// </field>
		border: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the text color of the labels. Any valid CSS color is accepted.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="String">
		/// Gets or sets the culture of the labels.
		/// </field>
		culture: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the font style of the labels.
		/// </field>
		font: defineProperty("font", ""),
		/// <field type="String">
		/// Gets or sets the format of the labels.
		/// </field>
		format: defineProperty("format", ""),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the labels.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the padding settings of the labels.
		/// </field>
		padding: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the label template. Inside the template, the 'value' variable exposes the label value.
		/// </field>
		template: defineProperty("template", ""),
		/// <field type="Boolean">
		/// Gets or sets the visibility of the labels.
		/// </field>
		visible: defineProperty("visible", false),
		/// <field type="String">
		/// Gets or sets the position of the labels.
		/// </field>
		/// <options>
		/// <option value="above">above</option>
		/// <option value="below">below</option>
		/// <option value="center">center</option>
		/// <option value="left">left</option>
		/// <option value="right">right</option>
		/// <option value="insideEnd">insideEnd</option>
		/// <option value="outsideEnd">outsideEnd</option>
		/// <option value="insideBase">insideBase</option>
		/// </options>
		position: defineProperty("position", "above")
	});
	var _AxisCrossHairConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis crosshair.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the id of the crosshair. If not set, it will be autogenerated.
		/// </field>
		id: defineProperty("id", ""),
		/// <field type="String" defaultValue="#000">
		/// Gets or sets the color of the crosshair. Any valid CSS color is accepted.
		/// </field>
		color: defineProperty("color", "#000"),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the width of the crosshair in pixels.
		/// </field>
		width: defineProperty("width", 1),
		/// <field type="Number" defaultValue="-11">
		/// Gets or sets the zIndex of the crosshair.
		/// </field>
		zIndex: defineProperty("zIndex", -1),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the crosshair opacity.
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="String">
		/// Gets or sets the dash type of the crosshair.
		/// </field>
		/// <options>
		/// <option value="solid">solid</option>
		/// <option value="dot">dot</option>
		/// <option value="dash">dash</option>
		/// <option value="longDash">longDash</option>
		/// <option value="dashDot">dashDot</option>
		/// <option value="longDashDot">longDashDot</option>
		/// <option value="longDashDotDot">longDashDotDot</option>
		/// </options>
		dashType: defineProperty("dashType", "solid"),
		/// <field type="Telerik.UI.Chart._CrossHairTooltipConfiguration">
		/// Retrieves the tooltip settings for this crosshair.
		/// </field>
		tooltip: {get:function(){}},
		/// <field type="Boolean">
		/// Gets or sets the visibility of the crosshair.
		/// </field>
		visible: defineProperty("visible", false),
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var _CrossHairTooltipConfiguration = derive(_TooltipConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a crosshair tooltip.
		/// </summary>
}, {
		/// <field type="Number" defaultValue="10">
		/// Gets or sets the padding of the tooltip.
		/// </field>
		padding: defineProperty("padding", 10),
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var _AxisTitleConfiguration = derive(_TitleConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis title.
		/// </summary>
}, {
		/// <field type="Number">
		/// Gets or sets the rotation angle of the axis title.
		/// </field>
		rotation: defineProperty("rotation", 0)
	});
	var _AxisLabelDateFormatConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the date label format on a chart axis.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the format for displaying hour values in the axis labels. Default value is "HH:mm".
		/// </field>
		hours: defineProperty("hours", "HH:mm"),
		/// <field type="String">
		/// Gets or sets the format for displaying day values in the axis labels. Default value is "M/d".
		/// </field>
		days: defineProperty("days", "M/d"),
		/// <field type="String">
		/// Gets or sets the format for displaying month values in the axis labels. Default value is "MMM 'yy".
		/// </field>
		months: defineProperty("months", "MMM 'yy"),
		/// <field type="String">
		/// Gets or sets the format for displaying year values in the axis labels. Default value is "yyyy".
		/// </field>
		years: defineProperty("years", "yyyy"),
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var _AxisLabelConfiguration = derive(_LabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart axis labels.
		/// </summary>
}, {
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether the labels and ticks are mirrored. Mirrored labels
		/// usually rendered on the left side will be rendered on the right.
		/// </field>
		mirror: defineProperty("mirror", false),
		/// <field type="Number">
		/// Gets or sets the rotation angle of the labels.
		/// </field>
		rotation: defineProperty("rotation", 0),
		/// <field type="Number">
		/// Gets or sets the number of labels from the beginning of the axis to skip rendering.
		/// </field>
		skip: defineProperty("skip", 0),
		/// <field type="Number">
		/// Gets or sets the label rendering step. Every n-th label is rendered, where n is the step value.
		/// </field>
		step: defineProperty("step", 1),
		/// <field type="Telerik.UI.Chart._AxisLabelDateFormatConfiguration">
		/// Gets the date formatting settings for the axis labels when the axis values are of Date type.
		/// </field>
		dateFormats: {get:function(){}}
	});
	var _AxisLineConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis line.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the color of the axis line. Any valid CSS color is accepted.
		/// </field>
		color: defineProperty("color", "black"),
		/// <field type="Boolean">
		/// Gets or sets the visibility of the axis line.
		/// </field>
		visible: defineProperty("visible", true),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the width of the axis line in pixels.
		/// </field>
		width: defineProperty("width", 1),
		/// <field type="String">
		/// Gets or sets the dash type of the line.
		/// </field>
		/// <options>
		/// <option value="solid">solid</option>
		/// <option value="dot">dot</option>
		/// <option value="dash">dash</option>
		/// <option value="longDash">longDash</option>
		/// <option value="dashDot">dashDot</option>
		/// <option value="longDashDot">longDashDot</option>
		/// <option value="longDashDotDot">longDashDotDot</option>
		/// </options>
		dashType: defineProperty("dashType", "solid"),
		/// <field type="String">
		/// Gets or sets the type of the grid lines for radar charts. This property has a meaning only when working with radar series.
		/// Defaults to 'line' for 'radarLine' and 'radarArea' series and 'arc' for 'radarColumn' series.
		/// </field>
		/// <options>
		/// <option value="line">line</option>
		/// <option value="arc">arc</option>		
		/// </options>
		type: defineProperty("type", "line")
	});
	var _AxisTickConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis tick.
		/// </summary>
}, {
		/// <field type="Number">
		/// Gets or sets the width of the axis tick lines in pixels.
		/// </field>
		size: defineProperty("size", 0),
		/// <field type="Boolean">
		/// Gets or sets the visibility of the axis tick lines.
		/// </field>
		visible: defineProperty("visible", false)
	});
	var _ChartNoteLabelConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis note label.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the chart note icon label.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings for the chart note icon label.
		/// </field>
		border: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the color of the chart note icon label.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="String">
		/// Gets or sets the font style of the chart note icon label.
		/// </field>
		font: defineProperty("font", SANS12),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of the note icon label.
		/// </field>
		visible: defineProperty("visible", true),
		/// <field type="Number" defaultValue="3">
		/// Gets or sets the label padding.
		/// </field>
		padding: defineProperty("padding", 3),
		/// <field type="Number">
		/// Gets or sets the rotation angle of the note icon label.
		/// </field>
		rotation: defineProperty("rotation", 0),
		/// <field type="String" defaultValue="{0}">
		/// Gets or sets the format of the note icon label. Contains one placeholder ("{0}") which represents the category value.
		/// </field>
		format: defineProperty("format", "{0}"),
		/// <field type="String" defaultValue="inside">
		/// Defines the position of the label. Accepted values are: "outside" - labels are positioned outside,
		/// "inside" - labels are positioned inside. Default value is "inside".
		/// </field>
		/// <options>
		/// <option value="inside">inside</option>
		/// <option value="outside">outside</option>
		/// </options>
		position: defineProperty("position", "inside"),
		/// <field type="String">
		/// Gets or sets the label template. Inside the template, the 'value' variable exposes the label value.
		/// </field>
		template: defineProperty("template", "")
	});
	var _ChartNoteIconConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart axis note icon.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the chart note icon.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings for the chart note icon.
		/// </field>
		border: {get:function(){}},
		/// <field type="Number" defaultValue="7">
		/// Gets or sets the size of the note icon.
		/// </field>
		size: defineProperty("size", 7),
		/// <field type="String" defaultValue="circle">
		/// Gets or sets the shape type of the note icon. Accepted values are: "circle", "square" and "triangle". Default is "circle".
		/// </field>
		/// <options>
		/// <option value="circle">circle</option>
		/// <option value="square">square</option>
		/// <option value="triangle">triangle</option>
		/// </options>
		type: defineProperty("type", "circle"),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of the note icon.
		/// </field>
		visible: defineProperty("visible", true)
	});
	var _ChartNoteLineConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart note line.
		/// </summary>
}, {
		/// <field type="Number" defaultValue="4">
		/// Gets or sets the width of the notes line.
		/// </field>
		width: defineProperty("width", 4),
		/// <field type="String">
		/// Gets or sets the color of the notes line.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="Number">
		/// Gets or sets the length of the notes line.
		/// </field>
		length: defineProperty("length", NULL)
	});
	var _SeriesNoteConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart axis notes.
		/// </summary>
}, {
		/// <field type="String" defaultValue="top">
		/// Gets or sets the position of the chart notes. Accepted values are:
		/// "top", "bottom", "left", "right". Default value is "top".
		/// </field>
		/// <options>
		/// <option value="top">top</option>
		/// <option value="bottom">bottom</option>
		/// <option value="left">left</option>
		/// <option value="right">right</option>
		/// </options>
		position: defineProperty("position", "top"),
		/// <field type="Telerik.UI.Chart._ChartNoteIconConfiguration">
		/// Gets the note icon settings.
		/// </field>
		icon: {get:function(){}},
		/// <field type="Telerik.UI.Chart._ChartNoteLineConfiguration">
		/// Gets the note line settings.
		/// </field>
		line: {get:function(){}},
		/// <field type="Telerik.UI.Chart._ChartNoteLabelConfiguration">
		/// Gets the label settings for the chart note.
		/// </field>
		label: {get:function(){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of this note.
		/// </field>
		visible: defineProperty("visible", true)
	});
	var _AxisNoteConfiguration = derive(_SeriesNoteConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis note.
		/// </summary>
}, {
		/// <field type="Array">
		/// Gets the axis note data.
		/// </field>
		data: defineProperty("data", []),
	});
	var Axis = derive(config, function () {
		/// <summary>
		/// Represents an axis on a chart.
		/// </summary>
}, {
		/// <field type="Number">
		/// Gets or sets the value at which this axis crosses the perpendicular axis.
		/// </field>
		axisCrossingValue: defineProperty("axisCrossingValue", 0),
		/// <field type="String">
		/// Gets or sets the color to all apply to all axis elements. Individual color settings
		/// for line and labels take priority. Any valid CSS color is accepted.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="Telerik.UI.Chart._AxisCrossHairConfiguration">
		/// Gets the axis crosshair settings.
		/// </field>
		crosshair: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisLabelConfiguration">
		/// Gets the axis label settings.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisLineConfiguration">
		/// Gets the axis line settings.
		/// </field>
		line: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisLineConfiguration">
		/// Gets the major grid line settings.
		/// </field>
		majorGridLines: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisLineConfiguration">
		/// Gets the minor grid line settings.
		/// </field>
		minorGridLines: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisTickConfiguration">
		/// Gets the major tick settings
		/// </field>
		majorTicks: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisTickConfiguration">
		/// Gets the minor tick settings
		/// </field>
		minorTicks: {get:function(){}},
		/// <field type="Number">
		/// Gets or sets the minimum value of the axis. This property is often used in combination
		/// with the max property to adjust the size of the chart relative to the charting area.
		/// </field>
		min: defineProperty("min", 0),
		/// <field type="Number">
		/// Gets or sets the maximum value of the axis. This property is often used in combination
		/// with the min property to adjust the size of the chart relative to the charting area.
		/// </field>
		max: defineProperty("max", 1),
		/// <field type="Number">
		/// Gets or sets the interval between major divisions. For example, on a column chart, this property
		/// determines the step size whole going up the vertical axis. You can additionally have minor steps
		/// and ticks in between the major ones by adjusting the minorUnit and minorTick.size properties.
		/// </field>
		majorUnit: defineProperty("majorUnit", 0),
		/// <field type="Number">
		/// Gets or sets the interval between minor divisions. For more information, refer to the
		/// majorUnit property description.
		/// </field>
		minorUnit: defineProperty("minorUnit", 0),
		/// <field type="String">
		/// Gets or sets the unique axis name.
		/// </field>
		name: defineProperty("name", ""),
		/// <field type="Boolean">
		/// Prevents the automatic axis range from snapping to 0.
		/// </field>
		narrowRange: defineProperty("narrowRange", false),
		/// <field type="String">
		/// The name of the pane that the axis should be rendered in. The axis will be rendered in the first (default) pane if not set.
		/// </field>
		pane: defineProperty("pane", ""),
		/// <field type="Array" elementType="{ from:0, to: 100, color: 'navy', opacity: 1 }">
		/// Gets or sets the plot bands of the axis. Elements of this array must be
		/// objects of the form { from:0, to: 100, color: 'navy' }
		/// </field>
		plotBands: defineProperty("plotBands", []),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether the axis direction is reversed.
		/// </field>
		reverse: defineProperty("reverse", false),
		/// <field type="Telerik.UI.Chart._AxisTitleConfiguration">
		/// Retrieves the chart axis title settings.
		/// </field>
		title: {get:function(){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of this axis.
		/// </field>
		visible: defineProperty("visible", true),
		/// <field type="String">
		/// Gets or sets the base time interval for the axis when axis values are of Date type. Accepted values are
		/// "seconds", "minutes", "hours", "days", "weeks", "months" and "years". The default value is determined automatically from the
		/// minimum difference between subsequent categories.
		/// </field>
		/// <options>
		/// <option value="seconds">seconds</option>
		/// <option value="minutes">minutes</option>
		/// <option value="hours">hours</option>
		/// <option value="days">days</option>
		/// <option value="weeks">weeks</option>
		/// <option value="months">months</option>
		/// <option value="years">years</option>
		/// </options>
		baseUnit: defineProperty("baseUnit", NULL),
		/// <field type="Telerik.UI.Chart._AxisNoteConfiguration">
		/// Retrieves the chart axis notes settings.
		/// </field>
		notes: {get:function(){}}
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var CategoryAxis = derive(Axis, function () {
		/// <summary>
		/// Represents a chart category axis.
		/// </summary>
}, {
		/// <field type="Array">
		/// Gets or sets the array of category names that will be used to label the categories in the chart.
		/// </field>
		categories: defineProperty("categories", []),
		/// <field type="String">
		/// Gets or sets the field from the objects in the categories array that will be used to retrieve
		/// the category name. Use this property when the categories array contains objects instead
		/// of primitive types.
		/// </field>
		field: defineProperty("field", ""),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether the categories and series are positioned on major ticks. This removes
	    /// the empty space before and after the series. Default is true. This option is ignored for bar, column, "boxPlot", ohlc or candlestick series.
		/// </field>
		justified: defineProperty("justified", true),
		/// <excludetoc />
		narrowRange: defineProperty("narrowRange", false),
		/// <field type="Number" defaultValue="0">
		/// The week start day when baseUnit is set to "weeks". The value should be a number from 0 to 6 where 0 is Sunday, 1 is Monday and so on.
		/// The default value is 0 (Sunday).
		/// </field>
		weekStartDay: defineProperty("weekStartDay", 0)
	});
	var _SeriesMarkersConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the markers of a chart series.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the background color of the markers.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings for the markers.
		/// </field>
		border: {get:function(){}},
		/// <field type="Number" defaultValue="6">
		/// Gets or sets the size of the markers.
		/// </field>
		size: defineProperty("size", 6),
		/// <field type="String" defaultValue="circle">
		/// Gets or sets the shape type of the markers. Accepted values are: "circle", "square" and "triangle". Default is "circle".
		/// </field>
		/// <options>
		/// <option value="circle">circle</option>
		/// <option value="square">square</option>
		/// <option value="triangle">triangle</option>
		/// </options>
		type: defineProperty("type", "circle"),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of the markers.
		/// </field>
		visible: defineProperty("visible", true)
	});
	var _SeriesHighlightConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the highlight of a chart series.
		/// </summary>
}, {
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the target. The border option is supported when series.type is set to "donut", "bubble", "pie", "candlestick" or "ohlc".
		/// </field>
		border: {get:function(){}},
		/// <field type="String">
		/// The highlight color. Accepts a valid CSS color string, including hex and rgb.
		/// The color option is supported when series.type is set to "donut" or "pie".
		/// </field>
		color: defineProperty("color", "#ffffff"),
		/// <field type="Telerik.UI.Chart._SeriesLineConfiguration">
		/// Gets the target line settings.
		/// </field>
		line: {get:function(){}},
		/// <field type="Number">
		/// The opacity of the highlighted points. The opacity option is supported when series.type is set to "bubble", "pie" or "donut".
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="Boolean">
		/// If set to true the chart will highlight the series when the user hovers it with the mouse. By default chart series highlighting is enabled.
		/// </field>
		visible: defineProperty("visible", true)
	});
	var _SeriesNegativeValuesConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the negative values for a chart series.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the color of the negative values.
		/// </field>
		color: defineProperty("color", "#ffffff"),
		/// <field type="Boolean">
		/// Gets or sets the visibility of the negative values.
		/// </field>
		visible: defineProperty("visible", false)
	});
	var _SeriesLineConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the lines of an area series in a chart.
	    /// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the color of the area series line.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the opacity of the area series line.
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="Number" defaultValue="4">
		/// Gets or sets the line width of the area series.
		/// </field>
		width: defineProperty("width", 4),
		/// <field type="String">
		/// Gets or sets the dash type of the line.
		/// </field>
		/// <options>
		/// <option value="solid">solid</option>
		/// <option value="dot">dot</option>
		/// <option value="dash">dash</option>
		/// <option value="longDash">longDash</option>
		/// <option value="dashDot">dashDot</option>
		/// <option value="longDashDot">longDashDot</option>
		/// <option value="longDashDotDot">longDashDotDot</option>
		/// </options>
		dashType: defineProperty("dashType", "solid"),
	    /// <field type="String" defaultValue="normal">
	    /// Gets or sets the style of the area series line.
	    /// </field>
	    /// <options>
	    /// <option value="normal">normal</option>
	    /// <option value="step">step</option>
	    /// <option value="smooth">smooth</option>
	    /// </options>
		style: defineProperty("style", "normal")
	});
	var _AreaLineConfiguration = derive(_SeriesLineConfiguration, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. Describes the properties of the lines of an area series in a chart.
	    /// </summary>
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var _PieLabelConnectorConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the pie series label connectors in a chart.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets teh color of the connector line.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="Number" defaultValue="4">
		/// Gets or sets the padding between the connector line and the label, and connector line and the pie chart.
		/// </field>
		padding: defineProperty("padding", 4),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the width of the connector line.
		/// </field>
		width: defineProperty("width", 1)
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var _PieLabelConfiguration = derive(_LabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the pie series labels in a chart.
		/// </summary>
}, {
		/// <field type="String" defaultValue="circle">
		/// Defines the alignment of the pie labels. Accepted values are "circle" - the labels are positioned
		/// in a circle around the pie chart; "column" - the labels are positioned in columns to the left and
		/// right of the pie chart.
		/// </field>
		/// <options>
		/// <option value="circle">circle</option>
		/// <option value="column">column</option>
		/// </options>
		align: defineProperty("align", "circle"),
		/// <field type="Number" defaultValue="35">
		/// Gets or sets the distance of the labels from the pie arcs.
		/// </field>
		distance: defineProperty("distance", 35),
		/// <field type="String" defaultValue="outsideEnd">
		/// Defines the position of the pie labels. Accepted values are: "outsideEnd" - labels are positioned outside,
		/// near the end of the pie segments; "insideEnd" - labels are positioned inside, near the end of the pie segments;
		/// "center" - labels are positioned at the center of the pie segments. Default value is "outsideEnd".
		/// </field>
		/// <options>
		/// <option value="outsideEnd">outsideEnd</option>
		/// <option value="insideEnd">insideEnd</option>
		/// <option value="center">center</option>
		/// </options>
		position: defineProperty("position", "outsideEnd")
	});
	var _SeriesTargetConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the target in a bullet chart.
		/// </summary>
}, {
		/// <field type="String" defaultValue="#ff0000">
		/// Gets or sets the color of the area series line.
		/// </field>
		color: defineProperty("color", "#ff0000"),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the target.
		/// </field>
		border: {get:function(){}},
		/// <field type="Telerik.UI.Chart._AxisLineConfiguration">
		/// Gets the target line settings.
		/// </field>
		line: {get:function(){}}
	});
	var Pane = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// Describes the properties of a chart pane.
		/// </summary>
},
	{
		/// <field type="String">
		/// Gets or sets the unique pane name.
		/// </field>
		name: defineProperty("name", ""),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin of the pane.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the padding of the pane.
		/// </field>
		padding: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the background color of the pane.
		/// </field>
		background: defineProperty("background", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the chart pane.
		/// </field>
		border: {get:function(){}},
		/// <field type="Number">
		/// Gets or sets the width of the crosshair in pixels.
		/// </field>
		height: defineProperty("height", 0),
		/// <field type="Telerik.UI.Chart._TitleConfiguration">
		/// Gets the title settings of the pane.
		/// </field>
		title: {get:function(){}}
	});
	var _FunnelLabelConfiguration = derive(_LabelConfiguration, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. Describes the properties of the funnel series labels in a chart.
	    /// </summary>
}, {
	    /// <field type="String" defaultValue="center">
	    /// Defines the alignment of the funnel labels. Accepted values are "center", "right", "left"
	    /// </field>
	    /// <options>
	    /// <option value="center">center</option>
	    /// <option value="right">right</option>
	    /// <option value="left">left</option>
	    /// </options>
	    align: defineProperty("align", "center"),
	    /// <field type="String" defaultValue="center">
	    /// Defines the position of the funnel labels. Accepted values are: "center" - labels are positioned at 
	    /// the center of the funnel segments; "top" - labels are positioned at the top of the funnel segments;
	    /// "bottom" - labels are positioned at the bottom of the funnel segments; Default value is "center".
	    /// </field>
	    /// <options>
	    /// <option value="center">center</option>
	    /// <option value="top">top</option>
	    /// <option value="bottom">bottom</option>
	    /// </options>
	    position: defineProperty("position", "center")
	});
	var _ErrorBarsConfiguration = derive(config, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. Describes the properties of the errorBars.
	    /// </summary>
}, {
	    /// <field type="String">
	    /// The error bars value. The value option is supported when series.type is set to "bar", "column", "line" or "area".
	    /// The following value types are supported:
        /// - "stderr" - the standard error of the series values will be used to calculate the point low and high value
        /// - "stddev(n)" - the standard deviation of the series values will be used to calculate the point low and high value. A number can be specified between the parentheses, that will be multiplied by the calculated standard deviation.
        /// - "percentage(n)" - a percentage of the point value
        /// - A number that will be subtracted/added to the point value
        /// - An array that holds the low and high difference from the point value
        /// - A function that returns the errorBars point value
	    /// </field>
	    value: defineProperty("value", ""),
	    /// <field type="String">
	    /// The xAxis error bars value. The xValue option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// The following value types are supported:
	    /// - "stderr" - the standard error of the series values will be used to calculate the point low and high value
	    /// - "stddev(n)" - the standard deviation of the series values will be used to calculate the point low and high value. A number can be specified between the parentheses, that will be multiplied by the calculated standard deviation.
	    /// - "percentage(n)" - a percentage of the point value
	    /// - A number that will be subtracted/added to the point value
	    /// - An array that holds the low and high difference from the point value
	    /// - A function that returns the errorBars point value
	    /// </field>
	    xValue: defineProperty("xValue", ""),
	    /// <field type="String">
	    /// The yAxis error bars value. The yValue option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// The following value types are supported:
	    /// - "stderr" - the standard error of the series values will be used to calculate the point low and high value
	    /// - "stddev(n)" - the standard deviation of the series values will be used to calculate the point low and high value. A number can be specified between the parentheses, that will be multiplied by the calculated standard deviation.
	    /// - "percentage(n)" - a percentage of the point value
	    /// - A number that will be subtracted/added to the point value
	    /// - An array that holds the low and high difference from the point value
	    /// - A function that returns the errorBars point value
	    /// </field>
	    yValue: defineProperty("yValue", ""),
	    /// <field type="Boolean" defaultValue="true">
	    /// If set to false, the error bars caps will not be displayed. By default the caps are visible.
	    /// </field>
	    endCaps: defineProperty("endCaps", true),
	    /// <field type="String">
	    /// The color of the error bars. Accepts a valid CSS color string, including hex and rgb.
	    /// </field>
	    color: defineProperty("color", ""),
	    /// <field type="Telerik.UI.Chart._ErrorBarsLineConfiguration">
	    /// Gets the line settings for the error bars.
	    /// </field>
	    line: {get:function(){}}
	});
	var _ErrorBarsLineConfiguration = derive(config, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. Describes the properties of the lines of error bars.
	    /// </summary>
}, {
	    /// <field type="Number" defaultValue="1">
	    /// Gets or sets the line width of the error bars.
	    /// </field>
	    width: defineProperty("width", 1),
	    /// <field type="String">
	    /// Gets or sets the dash type of the line.
	    /// </field>
	    /// <options>
	    /// <option value="solid">solid</option>
	    /// <option value="dot">dot</option>
	    /// <option value="dash">dash</option>
	    /// <option value="longDash">longDash</option>
	    /// <option value="dashDot">dashDot</option>
	    /// <option value="longDashDot">longDashDot</option>
	    /// <option value="longDashDotDot">longDashDotDot</option>
	    /// </options>
	    dashType: defineProperty("dashType", "solid")
	});
	var _OutliersConfiguration = derive(config, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. The chart series outliers configuration.
	    /// </summary>
}, {
	    /// <field type="String">
	    /// Gets or sets the background color of the series outliers.
	    /// </field>
	    background: defineProperty("background", ""),
	    /// <field type="Telerik.UI.Common._BorderConfiguration">
	    /// Gets the the color of the border. Accepts a valid CSS color string, including hex and rgb.
	    /// </field>
	    border: {get:function(){}},
	    /// <field type="Number" defaultValue="6">
	    /// Gets or sets the marker size in pixels.
	    /// </field>
	    size: defineProperty("size", 6),
	    /// <field type="String" defaultValue="circle">
	    /// Gets or sets the outliers shape.
	    /// The supported values are: 
	    /// "circle" - the marker shape is circle.
	    /// "square" - the marker shape is square.
	    /// "triangle" - the marker shape is triangle.
	    /// "cross" - the marker shape is cross.
	    /// </field>
	    /// <options>
	    /// <option value="circle">circle</option>
	    /// <option value="square">square</option>
	    /// <option value="triangle">triangle</option>
	    /// <option value="cross">cross</option>
	    /// </options>
	    type: defineProperty("type", "circle"),
	    /// <field type="Boolean" defaultValue="false">
	    /// If set to true the chart will display the series outliers. By default chart series outliers are not displayed.
	    /// </field>
	    visible: defineProperty("visible", false),
	    /// <field type="Number" defaultValue="6">
	    /// Gets or sets the rotation angle of the outliers.
	    /// </field>
	    rotation: defineProperty("rotation", 6)
	});
	var _ExtremesConfiguration = derive(config, function (owner, parentMapping, defaults) {
	    /// <summary>
	    /// For internal usage only. The chart series extremes configuration.
	    /// </summary>
}, {
	    /// <field type="String">
	    /// Gets or sets the background color of the series extremes.
	    /// </field>
	    background: defineProperty("background", ""),
	    /// <field type="Telerik.UI.Common._BorderConfiguration">
	    /// Gets the the color of the border. Accepts a valid CSS color string, including hex and rgb.
	    /// </field>
	    border: {get:function(){}},
	    /// <field type="Number" defaultValue="6">
	    /// Gets or sets the marker size in pixels.
	    /// </field>
	    size: defineProperty("size", 6),
	    /// <field type="String" defaultValue="circle">
	    /// Gets or sets the extremes shape.
	    /// The supported values are: 
	    /// "circle" - the marker shape is circle.
	    /// "square" - the marker shape is square.
	    /// "triangle" - the marker shape is triangle.
	    /// "cross" - the marker shape is cross.
	    /// </field>
	    /// <options>
	    /// <option value="circle">circle</option>
	    /// <option value="square">square</option>
	    /// <option value="triangle">triangle</option>
	    /// <option value="cross">cross</option>
	    /// </options>
	    type: defineProperty("type", "circle"),
	    /// <field type="Boolean" defaultValue="false">
	    /// If set to true the chart will display the series extremes. By default chart series extremes are not displayed.
	    /// </field>
	    visible: defineProperty("visible", false),
	    /// <field type="Number" defaultValue="6">
	    /// Gets or sets the rotation angle of the extremes.
	    /// </field>
	    rotation: defineProperty("rotation", 6)
	});
	namespace(nsName, {
		_TitleConfiguration: _TitleConfiguration,
		_LegendLabelConfiguration: _LegendLabelConfiguration,
		_LegendInactiveItemsConfiguration: _LegendInactiveItemsConfiguration,
		_LegendInactiveItemsColorConfiguration: _LegendInactiveItemsColorConfiguration,
		_LegendConfiguration: _LegendConfiguration,
		_TooltipConfiguration: _TooltipConfiguration,
		_PlotAreaConfiguration: _PlotAreaConfiguration,
		_LabelConfiguration: _LabelConfiguration,
		_AxisCrossHairConfiguration: _AxisCrossHairConfiguration,
		_CrossHairTooltipConfiguration: _CrossHairTooltipConfiguration,
		_AxisTitleConfiguration: _AxisTitleConfiguration,
		_AxisLabelDateFormatConfiguration: _AxisLabelDateFormatConfiguration,
		_AxisLabelConfiguration: _AxisLabelConfiguration,
		_AxisLineConfiguration: _AxisLineConfiguration,
		_AxisTickConfiguration: _AxisTickConfiguration,
		_SeriesMarkersConfiguration: _SeriesMarkersConfiguration,
		_SeriesNegativeValuesConfiguration: _SeriesNegativeValuesConfiguration,
		_SeriesLineConfiguration: _SeriesLineConfiguration,
		_AreaLineConfiguration: _AreaLineConfiguration,
		_PieLabelConnectorConfiguration: _PieLabelConnectorConfiguration,
		_PieLabelConfiguration: _PieLabelConfiguration,
		_SeriesTargetConfiguration: _SeriesTargetConfiguration,
		_ChartNoteLabelConfiguration: _ChartNoteLabelConfiguration,
		_ChartNoteIconConfiguration: _ChartNoteIconConfiguration,
		_ChartNoteLineConfiguration: _ChartNoteLineConfiguration,
		_SeriesNoteConfiguration: _SeriesNoteConfiguration,
		_AxisNoteConfiguration: _AxisNoteConfiguration,
		_FunnelLabelConfiguration: _FunnelLabelConfiguration,
		_ErrorBarsConfiguration: _ErrorBarsConfiguration,
		_OutliersConfiguration: _OutliersConfiguration,
		_ExtremesConfiguration: _ExtremesConfiguration,
		_SeriesHighlightConfiguration: _SeriesHighlightConfiguration,
		Axis: Axis,
		CategoryAxis: CategoryAxis,
		Pane: Pane
	});
})(this, jQuery);/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
(function (global, $, undefined) {
	"use strict";
	//override the default Candlestick point coloring to match the border and 
	//line colors to the specified series color
	var originalGetBorderColor = kendo.dataviz.Candlestick.prototype.getBorderColor;
	kendo.dataviz.Candlestick.prototype.getBorderColor = function () {
		var point = this,
			options = point.options;
		if (!options.border.color) {
			options.border.color = options.color;
		}
		if (!options.line.color) {
			options.line.color = options.color;
		}
		return originalGetBorderColor.apply(point, Array.apply(null, arguments));
	}
	//remove highlight fill overlay from hollow candlestick points
	var originalHighlightOverlay = kendo.dataviz.Candlestick.prototype.highlightOverlay;
	kendo.dataviz.Candlestick.prototype.highlightOverlay = function (view, options) {
		var point = this;
		if (point.value.close < point.value.open) {
			options.fillOpacity = 0;
		}
		return originalHighlightOverlay.apply(point, Array.apply(null, arguments));
	}
	//prepare dataSource for progress indication
	var ui = kendo.dataviz.ui,
		originalInitDataSource = ui.Chart.prototype._initDataSource,
		originalDestroy = ui.Chart.prototype.destroy,
		originalSetDataSource = ui.Chart.prototype.setDataSource;
	ui.Chart.prototype._initDataSource = function (userOptions) {
		var chart = this;
		originalInitDataSource.apply(chart, arguments);
		chart._progressHandler = $.proxy(chart._showBusy, chart);
		chart.dataSource.bind("progress", chart._progressHandler);
		chart.first("dataBound", $.proxy(chart._hideBusy, chart));
		if (chart.dataSource._requestInProgress) {
			chart._showBusy();
		}
	}
	ui.Chart.prototype.destroy = function () {
		var chart = this;
		originalDestroy.apply(chart, arguments);
		chart.dataSource.unbind("progress", chart._progressHandler);
	}
	ui.Chart.prototype.setDataSource = function (dataSource) {
		var chart = this;
		chart.dataSource.unbind("progress", chart._progressHandler);
		originalSetDataSource.apply(chart, arguments);
		chart.dataSource.bind("progress", chart._progressHandler);
	}
	ui.Chart.prototype._showBusy = function () {
		var that = this;
		if (that._busy) {
			return;
		}
		that._busy = setTimeout(function () {
			that.element.attr("aria-busy", true);
			Telerik.UI.progress(that.element, true);
		}, 10);
	}
	ui.Chart.prototype._hideBusy = function () {
		var that = this;
		clearTimeout(that._busy);
		Telerik.UI.progress(that.element, false);
		that.element.attr("aria-busy", false);
		that._busy = null;
	}
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Chart",
		ns = namespace(nsName),
		util = Telerik.Utilities,
		NULL = null,
		config = Telerik.UI._ControlConfiguration,
		defineProperty = config.defineProperty,
		getMapping = config.getMapping,
		priv = util.setPrivate;
	var Series = derive(config, function () {
		/// <summary>
		/// Interal base class for all chart series.
		/// </summary>
}, {
		/// <field type="String" hidden="true">
		/// Gets the type of this series.
		/// </field>
		type: { value: "" },
		/// <field type="String">
		/// Gets or sets the color with which this series is displayed on the plot area.
		/// </field>
		color: defineProperty("color", ""),
		/// <field type="Telerik.UI.Chart._LabelConfiguration">
		/// Gets or sets the settings for the series data labels.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Boolean">
		/// Indicates whether the series should be stacked.
		/// </field>
		stack: defineProperty("stack", false),
		/// <field type="Telerik.UI.Chart._TooltipConfiguration">
		/// Retrieves the tooltip settings for this series.
		/// </field>
		tooltip: {get:function(){}},
		/// <field type="Array">
		/// Gets or sets the array of data points for this series.
		/// </field>
		data: defineProperty("data", []),
		/// <field type="String">
		/// Gets or sets the data field containing the series value.
		/// </field>
		field: defineProperty("field", ""),
		/// <field type="String">
		/// Gets or sets the name template for auto-generated series when binding to grouped data.
		/// Template variables: series, group, group.field, group.value.
		/// </field>
		groupNameTemplate: defineProperty("groupNameTemplate", ""),
		/// <field type="String">
		/// Gets or sets the series name visible in the legend.
		/// </field>
		name: defineProperty("name", ""),
		/// <field type="Boolean" defaultValue="true">
		/// Indicates whether to show the series in the legend.
		/// </field>
		visibleInLegend: defineProperty("visibleInLegend", true),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets series opacity.
		/// </field>
		opacity: defineProperty("opacity", 1),
		/// <field type="Telerik.UI.Chart._SeriesNoteConfiguration">
		/// Retrieves the chart series notes settings.
		/// </field>
		notes: {get:function(){}},
		/// <field type="String">
		/// Gets or sets the data item field which contains the series note text.
		/// </field>
		noteTextField: defineProperty("noteTextField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The errorLowField option is supported when series.type is set to "bar", "column", "line" or "area".
	    /// </field>
		errorLowField: defineProperty("errorLowField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The errorHighField option is supported when series.type is set to "bar", "column", "line" or "area".
	    /// </field>
		errorHighField: defineProperty("errorHighField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The xErrorLowField option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// </field>
		xErrorLowField: defineProperty("xErrorLowField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The yErrorLowField option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// </field>
		yErrorLowField: defineProperty("yErrorLowField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The xErrorHighField option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// </field>
		xErrorHighField: defineProperty("xErrorHighField", ""),
	    /// <field type="String">
	    /// Gets or sets the data item field which contains the series.errorBars low value.
	    /// The yErrorHighField option is supported when series.type is set to "scatter", "scatterLine" or "bubble".
	    /// </field>
		yErrorHighField: defineProperty("yErrorHighField", ""),
		/// <field type="Telerik.UI.Chart._SeriesHighlightConfiguration">
		/// Retrieves the chart series highlight settings.
		/// </field>
		highlight: {get:function(){}}
	});
	/// <excludetoc />
	var _SeriesWithBorder = derive(Series, function () {
		/// <summary>
		/// Base class for all chart series with borders.
		/// </summary>
}, {
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings for this series.
		/// </field>
		border: {get:function(){}}
	});
	var AreaSeries = derive(Series, function () {
		/// <summary>
		/// Creates an instance of an area series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "area" },
	    /// <field type="Telerik.UI.Chart._AreaLineConfiguration">
		/// Gets the line settings for the area series.
		/// </field>
		line: {get:function(){}},
		/// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
		/// Gets the marker settings for the area series.
		/// </field>
		markers: {get:function(){}},
		/// <field type="String" defaultValue="gap">
		/// Gets or sets the behavior for handling missing values in area series. Accepted values are:
		/// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
		/// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
		/// </field>
		/// <options>
		/// <option value="gap">gap</option>
		/// <option value="interpolate">interpolate</option>
		/// <option value="zero">zero</option>
		/// </options>
		missingValues: defineProperty("missingValues", "gap"),
		/// <field type="Number" defaultValue="0.4">
		/// Gets or sets the opacity of the area series.
		/// </field>
		opacity: defineProperty("opacity", 0.4),
		/// <field type="String">
		/// Gets or sets the name of the value axis to use. Defaults to the primary axis.
		/// </field>
		axis: defineProperty("axis", ""),
	    /// <field type="Telerik.UI.Chart._ErrorBarsConfiguration">
	    /// The errorBars option is supported when series.type is set to "bar", "column", "line", "area", "scatter", "scatterLine" or "bubble".
	    /// </field>
		errorBars: {get:function(){}}
	});
	var _BarSeriesBase = derive(_SeriesWithBorder, function () {
		/// <summary>
		/// Creates an instance of a bar series for RadChart
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the name of the value axis to use. Defaults to the primary axis.
		/// </field>
		axis: defineProperty("axis", ""),
		/// <field type="Number" defaultValue="1.5">
		/// Gets or sets the distance between category clusters.
		/// </field>
		gap: defineProperty("gap", 1.5),
		/// <field type="Number" defaultValue="0.4">
		/// Gets or sets the space between bars.
		/// </field>
		spacing: defineProperty("spacing", 0.4),
		/// <field type="String" defaultValue="none">
		/// Gets or sets the overlay gradient used for this series. Allowed values are "none", "glass", "roundedBevel". Default value is "none".
		/// </field>
		/// <options>
		/// <option value="none">none</option>
		/// <option value="glass">glass</option>
		/// </options>
		overlayGradient: defineProperty("overlayGradient", "none"),
		/// <field type="String">
		/// Gets or sets the name of the data field that contains the series color.
		/// </field>
		colorField: defineProperty("colorField", "")
	});
	var BarSeries = derive(_BarSeriesBase, function () {
		/// <summary>
		/// Creates an instance of a bar series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "bar" },
		/// <field type="String">
		/// Gets or sets the color to use for bars with negative values.
		/// </field>
		negativeColor: defineProperty("negativeColor", ""),
	    /// <field type="Telerik.UI.Chart._ErrorBarsConfiguration">
	    /// The errorBars option is supported when series.type is set to "bar", "column", "line", "area", "scatter", "scatterLine" or "bubble".
	    /// </field>
		errorBars: {get:function(){}}
	});
	var ColumnSeries = derive(BarSeries, function () {
		/// <summary>
		/// Creates an instance of a column series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
	    type: { value: "column" }
	});
	var LineSeries = derive(Series, function () {
		/// <summary>
		/// Creates an instance of a line series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "line" },
		/// <field type="String">
		/// Gets or sets the name of the value axis to use. Defaults to the primary axis.
		/// </field>
		axis: defineProperty("axis", ""),
		/// <field type="String">
		/// Gets or sets the dash type of the line.
		/// </field>
		/// <options>
		/// <option value="solid">solid</option>
		/// <option value="dot">dot</option>
		/// <option value="dash">dash</option>
		/// <option value="longDash">longDash</option>
		/// <option value="dashDot">dashDot</option>
		/// <option value="longDashDot">longDashDot</option>
		/// <option value="longDashDotDot">longDashDotDot</option>
		/// </options>
		dashType: defineProperty("dashType", "solid"),
		/// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
		/// Gets the marker settings for the line series.
		/// </field>
		markers: {get:function(){}},
	    /// <field type="String" defaultValue="normal">
	    /// Gets or sets the style of the line series.
	    /// The step value is supported only when series.type is set to "line" or "area".
	    /// </field>
	    /// <options>
	    /// <option value="normal">normal</option>
	    /// <option value="step">step</option>
	    /// <option value="smooth">smooth</option>
	    /// </options>
		style: defineProperty("style", "normal"),
		/// <field type="String" defaultValue="gap">
		/// Gets or sets the behavior for handling missing values in line series. Accepted values are:
		/// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
		/// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
		/// </field>
		/// <options>
		/// <option value="gap">gap</option>
		/// <option value="interpolate">interpolate</option>
		/// <option value="zero">zero</option>
		/// </options>
		missingValues: defineProperty("missingValues", "gap"),
		/// <field type="Number" defaultValue="2">
		/// Gets or sets the line width for this series.
		/// </field>
		width: defineProperty("width", 2),
	    /// <field type="Telerik.UI.Chart._ErrorBarsConfiguration">
	    /// The errorBars option is supported when series.type is set to "bar", "column", "line", "area", "scatter", "scatterLine" or "bubble".
	    /// </field>
		errorBars: {get:function(){}}
	});
	var PieSeries = derive(_SeriesWithBorder, function () {
		/// <summary>
		/// Creates an instance of a pie series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "pie" },
		/// <field type="String">
		/// Gets or sets the data field containing the sector category name.
		/// </field>
		categoryField: defineProperty("categoryField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the sector color.
		/// </field>
		colorField: defineProperty("colorField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the boolean value that indicates if the sector is exploded.
		/// </field>
		explodeField: defineProperty("explodeField", ""),
		/// <field type="Telerik.UI.Chart._PieLabelConnectorConfiguration">
		/// Gets the settings for the label connector lines.
		/// </field>
		connectors: {get:function(){}},
		/// <field type="Telerik.UI.Chart._PieLabelConfiguration">
		/// Gets or sets the settings for the series data labels.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Number" defaultValue="0">
		/// Gets the padding value around the pie chart (equal on all sides).
		/// </field>
		padding: defineProperty("padding", 0),
		/// <field type="Number" defaultValue="90">
		/// Gets or sets the start angle of the first pie segment. Default is 90 degrees.
		/// </field>
		startAngle: defineProperty("startAngle", 90),
		/// <field type="String" defaultValue="roundedBevel">
		/// Gets or sets the overlay gradient used for this series. Accepted values are "roundedBevel", "glass" and "none".
		/// </field>
		/// <options>
		/// <option value="none">none</option>
		/// <option value="sharpBevel">sharpBevel</option>
		/// <option value="roundedBevel">roundedBevel</option>
		/// </options>
		overlayGradient: defineProperty("overlayGradient", "roundedBevel")
	});
	var DonutSeries = derive(PieSeries, function () {
		/// <summary>
		/// Creates an instance of a donut series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "donut" },
		/// <field type="Number">
		/// The the radius of the donut hole. If the value is not set, it will be automatically calculated based on the chart size.
		/// </field>
		holeSize: defineProperty("holeSize", 0),
		/// <field type="Number">
		/// The margin around each series (not available for the last level of the series).
		/// </field>
		margin: defineProperty("margin", 1),
		/// <field type="Number">
		/// The width of the donut ring. If the value is not set, it will be automatically calculated based on the chart size.
		/// </field>
		size: defineProperty("size", 0),
		/// <field type="String" defaultValue="none">
		/// Gets or sets the overlay gradient used for this series. Accepted values are "roundedBevel", "glass" and "none".
		/// </field>
		/// <options>
		/// <option value="none">none</option>
		/// <option value="sharpBevel">sharpBevel</option>
		/// <option value="roundedBevel">roundedBevel</option>
		/// </options>
		overlayGradient: defineProperty("overlayGradient", "none")
	});
	var _ScatterBaseSeries = derive(Series, function () {
		/// <summary>
		/// Creates an instance of a scatter series for RadChart
		/// </summary>
}, {
		/// <field type="String">
		/// The data field containing the scatter x value.
		/// </field>
		xField: defineProperty("xField", ""),
		/// <field type="String">
		/// The data field containing the scatter y value.
		/// </field>
		yField: defineProperty("yField", ""),
		/// <field type="String">
		/// Gets or sets name of the X axis to use. If not specified, defaults to the primary axis.
		/// </field>
		xAxis: defineProperty("xAxis", ""),
		/// <field type="String">
		/// Gets or sets name of the Y axis to use. If not specified, defaults to the primary axis.
		/// </field>
		yAxis: defineProperty("yAxis", ""),
	    /// <field type="Telerik.UI.Chart._ErrorBarsConfiguration">
	    /// The errorBars option is supported when series.type is set to "bar", "column", "line", "area", "scatter", "scatterLine" or "bubble".
	    /// </field>
		errorBars: {get:function(){}}
	});
	var ScatterSeries = derive(_ScatterBaseSeries, function () {
		/// <summary>
		/// Creates an instance of a scatter series for RadChart
	    /// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "scatter" },
		/// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
		/// Gets the marker settings for the scatter series.
		/// </field>
		markers: {get:function(){}},
	    /// <field type="String" defaultValue="normal">
	    /// Gets or sets the style of the line series.
	    /// </field>
	    /// <options>
	    /// <option value="normal">normal</option>
	    /// <option value="smooth">smooth</option>
	    /// </options>
		style: defineProperty("style", "normal"),
	});
	var BubbleSeries = derive(_ScatterBaseSeries, function () {
		/// <summary>
		/// Creates an instance of a bubble series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "bubble" },
		/// <field type="String">
		/// The data field containing the bubble category name.
		/// </field>
		categoryField: defineProperty("categoryField", ""),
		/// <field type="String">
		/// The data field containing the bubble color.
		/// </field>
		colorField: defineProperty("colorField", ""),
		/// <field type="Number">
		/// The max size of the bubble.
		/// </field>
		maxSize: defineProperty("maxSize", 100),
		/// <field type="Number">
		/// The min size of the bubble.
		/// </field>
		minSize: defineProperty("minSize", 5),
		/// <field type="Telerik.UI.Chart._SeriesNegativeValuesConfiguration">
		/// The settings for negative values.
		/// </field>
		negativeValues: {get:function(){}},
		/// <field type="String">
		/// The data field containing the bubble size value.
		/// </field>
		sizeField: defineProperty("sizeField", ""),
		/// <field type="String">
		/// The data field containing the bubble x value.
		/// </field>
		xField: defineProperty("xField", ""),
		/// <field type="String">
		/// The data field containing the bubble y value.
		/// </field>
		yField: defineProperty("yField", ""),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings for this series.
		/// </field>
		border: {get:function(){}}
	});
	var ScatterLineSeries = derive(ScatterSeries, function () {
		/// <summary>
		/// Creates an instance of a scatter line series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "scatterLine" },
		/// <field type="String">
		/// Gets or sets the dash type of the line.
		/// </field>
		/// <options>
		/// <option value="solid">solid</option>
		/// <option value="dot">dot</option>
		/// <option value="dash">dash</option>
		/// <option value="longDash">longDash</option>
		/// <option value="dashDot">dashDot</option>
		/// <option value="longDashDot">longDashDot</option>
		/// <option value="longDashDotDot">longDashDotDot</option>
		/// </options>
		dashType: defineProperty("dashType", "solid"),
		/// <field type="String" defaultValue="gap">
		/// Gets or sets the behavior for handling missing values in scatter line series. Accepted values are:
		/// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
		/// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
		/// </field>
		/// <options>
		/// <option value="gap">gap</option>
		/// <option value="interpolate">interpolate</option>
		/// <option value="zero">zero</option>
		/// </options>
		missingValues: defineProperty("missingValues", "gap"),
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the line width for this series.
		/// </field>
		width: defineProperty("width", 1)
	});
	var VerticalAreaSeries = derive(AreaSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical area series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "verticalArea" }
	});
	var VerticalLineSeries = derive(LineSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical line series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "verticalLine" }
	});
	var _CandleStickOhlcBase = derive(_BarSeriesBase, function () {
		/// <summary>
		/// Base for the candlestick and ohlc financial series for RadChart.
		/// </summary>
}, {
		/// <field type="Object">
		/// Aggregate function for date series. This function is used when a category (year, month, etc.) contains two or more points. The function return values are displayed instead of the individual points.
		/// </field>
		aggregates: NULL,
		/// <field type="String">
		/// Gets or sets the data field containing the base series color.
		/// </field>
		colorField: defineProperty("colorField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the open value.
		/// </field>
		openField: defineProperty("openField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the high value.
		/// </field>
		highField: defineProperty("highField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the low value.
		/// </field>
		lowField: defineProperty("lowField", ""),
		/// <field type="String">
		/// Gets or sets the data field containing the close value.
		/// </field>
		closeField: defineProperty("closeField", ""),
		/// <field type="Telerik.UI.Chart._SeriesLineConfiguration">
		/// Gets the line settings for this series.
		/// </field>
		line: {get:function(){}},
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the distance between category clusters.
		/// </field>
		gap: defineProperty("gap", 1),
		/// <field type="Number" defaultValue="0.3">
		/// Gets or sets the space between bars.
		/// </field>
		spacing: defineProperty("spacing", 0.3),
	});
	var CandleStickSeries = derive(_CandleStickOhlcBase, function () {
		/// <summary>
		/// Creates an instance of a candlestick financial series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "candlestick" },
		/// <field type="String">
		/// Gets or sets the series color when the close value is smaller than the open value.
		/// </field>
		downColor: defineProperty("downColor", ""),
		/// <field type="String">
		/// Gets or sets the field name that contains the series color when the close value is smaller than the open value.
		/// </field>
		downColorField: defineProperty("downColorField", "")
	});
	var OhlcSeries = derive(_CandleStickOhlcBase, function () {
		/// <summary>
		/// Creates an instance of a candlestick financial series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "ohlc" }
	});
	var BulletSeries = derive(_SeriesWithBorder, function () {
		/// <summary>
		/// Creates an instance of a bullet series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "bullet" },
		/// <field type="String">
		/// Gets or sets the field from the objects in the data array that will be used to retrieve
		/// the current value.
		/// </field>
		currentField: defineProperty("currentField", ""),
		/// <field type="String">
		/// Gets or sets the field from the objects in the data array that will be used to retrieve
		/// the target value.
		/// </field>
		targetField: defineProperty("targetField", ""),
		/// <field type="Telerik.UI.Chart._SeriesTargetConfiguration">
		/// Gets the target settings for this series.
		/// </field>
		target: {get:function(){}},
		/// <field type="Number" defaultValue="1.5">
		/// Gets or sets the distance between elements in the bullet chart.
		/// </field>
		gap: defineProperty("gap", 1.5)
	});
	var VerticalBulletSeries = derive(BulletSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical bullet series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "verticalBullet" }
	});
	var RadarLineSeries = derive(LineSeries, function () {
		/// <summary>
		/// Creates an instance of a radar line series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
	    type: { value: "radarLine" }
	});
	var RadarAreaSeries = derive(AreaSeries, function () {
		/// <summary>
		/// Creates an instance of a radar area series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "radarArea" }
	});
	var RadarColumnSeries = derive(_BarSeriesBase, function () {
		/// <summary>
		/// Creates an instance of a radar column series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "radarColumn" }
	});
	var PolarLineSeries = derive(LineSeries, function () {
		/// <summary>
		/// Creates an instance of a polar line series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "polarLine" },
		/// <field type="String">
		/// The data field containing the scatter x value.
		/// </field>
		xField: defineProperty("xField", ""),
		/// <field type="String">
		/// The data field containing the scatter y value.
		/// </field>
		yField: defineProperty("yField", ""),
		/// <field type="String">
		/// Gets or sets name of the X axis to use. If not specified, defaults to the primary axis.
		/// </field>
		xAxis: defineProperty("xAxis", ""),
		/// <field type="String">
		/// Gets or sets name of the Y axis to use. If not specified, defaults to the primary axis.
		/// </field>
		yAxis: defineProperty("yAxis", "")
	});
	var PolarAreaSeries = derive(AreaSeries, function () {
		/// <summary>
		/// Creates an instance of a polar area series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "polarArea" },
		/// <field type="String">
		/// The data field containing the scatter x value.
		/// </field>
		xField: defineProperty("xField", ""),
		/// <field type="String">
		/// The data field containing the scatter y value.
		/// </field>
		yField: defineProperty("yField", ""),
		/// <field type="String">
		/// Gets or sets name of the X axis to use. If not specified, defaults to the primary axis.
		/// </field>
		xAxis: defineProperty("xAxis", ""),
		/// <field type="String">
		/// Gets or sets name of the Y axis to use. If not specified, defaults to the primary axis.
		/// </field>
		yAxis: defineProperty("yAxis", "")
	});
	var PolarScatterSeries = derive(ScatterSeries, function () {
		/// <summary>
		/// Creates an instance of a polar scatter series for RadChart.
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "polarScatter" }
	});
	var FunnelSeries = derive(Series, function () {
	    /// <summary>
	    /// Creates an instance of a funnel series for RadChart
	    /// </summary>
}, {
	    /// <field type="String" readonly="true">
	    /// Gets the type of the series.
	    /// </field>
	    type: { value: "funnel" },
	    /// <field type="Telerik.UI.Chart._FunnelLabelConfiguration">
	    /// Gets or sets the settings for the series data labels.
	    /// </field>
	    labels: {get:function(){}},
	    /// <field type="Number" defaultValue="0">
	    /// Gets or sets the space in pixels between the different segments of the funnel chart.
	    /// </field>
	    segmentSpacing: defineProperty("segmentSpacing", 0),
	    /// <field type="Number" defaultValue="0.3">
	    /// Gets or sets the neckRatio.
	    /// neckRatio specifies the ratio top-base/bottom-base of the whole chart.
	    /// neckRatio set to three means the top base is three times smaller than the bottom base.
	    /// </field>
	    neckRatio: defineProperty("neckRatio", 0.3),
	    /// <field type="Boolean" defaultValue="false">
	    /// Gets or sets the dynamicSlope.
	    /// When set to true the ratio of the bases of each segment is calculated based on the ratio of 
	    /// currentDataItem.value/nextDataItem.value The last element is always created like a rectangle since there is no following element.
	    /// </field>
	    dynamicSlope: defineProperty("dynamicSlope", false),
	    /// <field type="Boolean" defaultValue="true">
	    /// Gets or sets the dynamicHeight.
	    /// When set to false all segments become with the same height, otherwise the height of each segment is based on its value.
	    /// </field>
	    dynamicHeight: defineProperty("dynamicHeight", true),
		/// <field type="String">
		/// Gets or sets the name of the data field that contains the series color.
		/// </field>
	    colorField: defineProperty("colorField", "")
	});
	var BoxPlotSeries = derive(_SeriesWithBorder, function () {
	    /// <summary>
	    /// Creates an instance of a boxplot scatter series for RadChart.
	    /// </summary>
}, {
	    /// <field type="String" readonly="true">
	    /// Gets the type of the series.
	    /// </field>
	    type: { value: "boxPlot" },
	    /// <field type="String">
	    /// Gets or sets the name of the value axis to use. Defaults to the primary axis.
	    /// </field>
	    axis: defineProperty("axis", ""),
	    /// <field type="Object">
	    /// Aggregate function for date series. This function is used when a category (year, month, etc.) contains two or more points. The function return values are displayed instead of the individual points.
	    /// </field>
	    aggregates: NULL,
	    /// <field type="String">
	    /// The data item field which contains the series lower value.
	    /// </field>
	    lowerField: defineProperty("lowerField", ""),
	    /// <field type="String">
	    /// The data item field which contains the series q1 value.
	    /// </field>
	    q1Field: defineProperty("q1Field", ""),
	    /// <field type="String">
	    /// The data item field which contains the series median value.
	    /// </field>
	    medianField: defineProperty("medianField", ""),
	    /// <field type="String">
	    /// The data item field which contains the series q3 value.
	    /// </field>
	    q3Field: defineProperty("q3Field", ""),
	    /// <field type="String">
	    /// The data item field which contains the series upper value.
	    /// </field>
	    upperField: defineProperty("upperField", ""),
	    /// <field type="String">
	    /// The data item field which contains the series mean value.
	    /// </field>
	    meanField: defineProperty("meanField", ""),
	    /// <field type="Telerik.UI.Chart._SeriesLineConfiguration">
	    /// Gets the line settings for this series.
	    /// </field>
	    line: {get:function(){}},
	    /// <field type="Number" defaultValue="1">
	    /// Gets or sets the distance between category clusters.
	    /// </field>
	    gap: defineProperty("gap", 1),
	    /// <field type="Number" defaultValue="0.3">
	    /// Gets or sets the space between bars.
	    /// </field>
	    spacing: defineProperty("spacing", 0.3),
	    /// <field type="String">
	    /// The data item field which contains the series mean value.
	    /// </field>
	    outliersField: defineProperty("outliersField", ""),
	    /// <field type="Telerik.UI.Chart._OutliersConfiguration">
	    /// Gets or sets the settings for the outliers.
	    /// </field>
	    outliers: {get:function(){}},
	    /// <field type="Telerik.UI.Chart._ExtremesConfiguration">
	    /// Gets or sets the settings for the extremes.
	    /// </field>
	    extremes: {get:function(){}}
	});
	namespace(nsName, {
		Series: Series,
		_SeriesWithBorder: _SeriesWithBorder,
		AreaSeries: AreaSeries,
		BarSeries: BarSeries,
		ColumnSeries: ColumnSeries,
		LineSeries: LineSeries,
		PieSeries: PieSeries,
		DonutSeries: DonutSeries,
		ScatterSeries: ScatterSeries,
		BubbleSeries: BubbleSeries,
		ScatterLineSeries: ScatterLineSeries,
		VerticalAreaSeries: VerticalAreaSeries,
		VerticalLineSeries: VerticalLineSeries,
		CandleStickSeries: CandleStickSeries,
		OhlcSeries: OhlcSeries,
		BulletSeries: BulletSeries,
		VerticalBulletSeries: VerticalBulletSeries,
		RadarLineSeries: RadarLineSeries,
		RadarAreaSeries: RadarAreaSeries,
		RadarColumnSeries: RadarColumnSeries,
		PolarLineSeries: PolarLineSeries,
		PolarAreaSeries: PolarAreaSeries,
		PolarScatterSeries: PolarScatterSeries,
		FunnelSeries: FunnelSeries,
		BoxPlotSeries: BoxPlotSeries
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		config = Telerik.UI._ControlConfiguration,
		util = Telerik.Utilities,
		chartConfig = Telerik.UI.Chart,
		defineProperty = config.defineProperty,
		nsName = "Telerik.UI.Sparkline",
		ns = namespace(nsName),
		getMapping = config.getMapping,
		priv = util.setPrivate,
		NULL = null;
	var Axis = derive(chartConfig.Axis, function () {
		/// <summary>
		/// Represents an axis on a chart.
		/// </summary>
}, {
		/// <field type="Boolean">
		/// Prevents the automatic axis range from snapping to 0.
		/// </field>
		narrowRange: defineProperty("narrowRange", true),
		/// <field type="Telerik.UI.Sparkline._AxisLineConfiguration">
		/// Gets the major grid line settings.
		/// </field>
		majorGridLines: {get:function(){}},
		/// <field type="Telerik.UI.Sparkline._AxisCrossHairConfiguration">
		/// Gets the axis crosshair settings.
		/// </field>
		crosshair: {get:function(){}},
		/// <excludetoc />
		pane: defineProperty("pane", ""),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets the visibility of this axis.
		/// </field>
		visible: defineProperty("visible", false)
	});
	/// <ancestor type="Telerik.UI._ControlConfiguration" />
	var CategoryAxis = derive(Axis, function () {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart category axis.
		/// </summary>
	});
	/// <excludetoc />
	var Pane = derive(chartConfig.Pane, function (owner, parentMapping, defaults) {
		/// <summary>
		/// Describes the properties of a chart pane.
		/// </summary>
	});
	var Series = derive(chartConfig.Series, function () {
		/// <summary>
		/// Interal base class for all chart series.
		/// </summary>
}, {
		/// <excludetoc />
		visibleInLegend: defineProperty("visibleInLegend", true)
	});
	var AreaSeries = derive(chartConfig.AreaSeries, function () {
		/// <summary>
		/// Creates an instance of an area series for RadChart
		/// </summary>
}, {
		/// <excludetoc />
		visibleInLegend: {}
	});
	var BarSeries = derive(chartConfig.BarSeries, function () {
		/// <summary>
		/// Creates an instance of a bar series for RadChart
		/// </summary>
}, {
		/// <excludetoc />
		visibleInLegend: {},
		/// <field type="Boolean">
		/// Indicates whether the series should be stacked.
		/// </field>
		stack: defineProperty("stack", true)
	});
	var BulletSeries = derive(chartConfig.BulletSeries, function () {
		/// <summary>
		/// Creates an instance of a bullet series for RadChart.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the field from the objects in the data array that will be used to retrieve
		/// the target value.
		/// </field>
		targetField: defineProperty("targetField", ""),
		/// <excludetoc />
		visibleInLegend: {}
	});
	var ColumnSeries = derive(BarSeries, function () {
		/// <summary>
		/// Creates an instance of a column series for RadChart
		/// </summary>
}, {
		/// <field type="String" readonly="true">
		/// Gets the type of the series.
		/// </field>
		type: { value: "column" },
		/// <excludetoc />
		visibleInLegend: {}
	});
	var LineSeries = derive(chartConfig.LineSeries, function () {
		/// <summary>
		/// Creates an instance of a line series for RadChart
		/// </summary>
}, {
		/// <excludetoc />
		visibleInLegend: {},
		/// <field type="Number" defaultValue="0.5">
		/// Gets or sets the line width of the area series.
		/// </field>
		width: defineProperty("width", 0.5)
	});
	/// <excludetoc />
	var CandleStickSeries = derive(chartConfig.CandleStickSeries, function () {
		/// <summary>
		/// Creates an instance of a candlestick financial series for RadChart.
		/// </summary>
	});
	/// <excludetoc />
	var OhlcSeries = derive(chartConfig.OhlcSeries, function () {
		/// <summary>
		/// Creates an instance of a candlestick financial series for RadChart.
		/// </summary>
	});
	/// <excludetoc />
	var BubbleSeries = derive(chartConfig.BubbleSeries, function () {
		/// <summary>
		/// Creates an instance of a bubble series for RadChart
		/// </summary>
	});
	var PieSeries = derive(chartConfig.PieSeries, function () {
		/// <summary>
		/// Creates an instance of a pie series for RadChart
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the field from the objects in the data array that will be used to retrieve
		/// the target value.
		/// </field>
		targetField: defineProperty("targetField", ""),
		/// <excludetoc />
		visibleInLegend: {},
		/// <field type="String" defaultValue="none">
		/// Gets or sets the overlay gradient used for this series. Accepted values are "roundedBevel", "glass" and "none".
		/// </field>
		/// <options>
		/// <option value="none">none</option>
		/// <option value="sharpBevel">sharpBevel</option>
		/// <option value="roundedBevel">roundedBevel</option>
		/// </options>
		overlayGradient: defineProperty("overlayGradient", "none")
	});
	/// <excludetoc />
	var DonutSeries = derive(chartConfig.PieSeries, function () {
		/// <summary>
		/// Creates an instance of a donut series for RadChart
		/// </summary>
	});
	/// <excludetoc />
	var ScatterSeries = derive(chartConfig.ScatterSeries, function () {
		/// <summary>
		/// Creates an instance of a scatter series for RadChart
		/// </summary>
	});
	/// <excludetoc />
	var ScatterLineSeries = derive(chartConfig.ScatterLineSeries, function () {
		/// <summary>
		/// Creates an instance of a scatter line series for RadChart
		/// </summary>
	});
	/// <excludetoc />
	var VerticalAreaSeries = derive(AreaSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical area series for RadChart
		/// </summary>
	});
	/// <excludetoc />
	var VerticalLineSeries = derive(LineSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical line series for RadChart
		/// </summary>
	});
	var VerticalBulletSeries = derive(BulletSeries, function () {
		/// <summary>
		/// Creates an instance of a vertical bullet series for RadChart.
		/// </summary>
}, {
		/// <field type="String">
		/// Gets or sets the field from the objects in the data array that will be used to retrieve
		/// the target value.
		/// </field>
		targetField: defineProperty("targetField", ""),
		/// <excludetoc />
		visibleInLegend: {}
	});
	var _AxisLineConfiguration = derive(chartConfig._AxisLineConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis line.
		/// </summary>
}, {
		/// <field type="Boolean">
		/// Gets or sets the visibility of the axis line.
		/// </field>
		visible: defineProperty("visible", false),
		/// <field type="Number" defaultValue="0.5">
		/// Gets or sets the width of the axis line in pixels.
		/// </field>
		width: defineProperty("width", 0.5)
	});
	var _AxisTickConfiguration = derive(chartConfig._AxisTickConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis tick.
		/// </summary>
	});
	var _CrossHairTooltipConfiguration = derive(chartConfig._CrossHairTooltipConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a crosshair tooltip.
		/// </summary>
	});
	var _AxisCrossHairConfiguration = derive(chartConfig._AxisCrossHairConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis crosshair.
		/// </summary>
}, {
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the visibility of the crosshair. Default is true
		/// </field>
		visible: defineProperty("visible", true),
	});
	var _AxisLabelConfiguration = derive(chartConfig._AxisLabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart axis labels.
		/// </summary>
	});
	var _AxisTitleConfiguration = derive(chartConfig._AxisTitleConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the date label format on a chart axis.
		/// </summary>
	});
	var _AxisLabelDateFormatConfiguration = derive(chartConfig._AxisLabelDateFormatConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart axis title.
		/// </summary>
	});
	/// <excludetoc />
	var _LegendLabelConfiguration = derive(chartConfig._LegendLabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart legend labels.
		/// </summary>
	});
	/// <excludetoc />
	var _LegendConfiguration = derive(chartConfig._LegendConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart legend.
		/// </summary>
}, {
		/// <field type="Boolean" defautlValue="false">
		/// Gets or sets the legend visibility. Default is false.
		/// </field>
		visible: defineProperty("visible", false)
	});
	var _LabelConfiguration = derive(chartConfig._LabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of chart labels.
		/// </summary>
	});
	var _PieLabelConnectorConfiguration = derive(chartConfig._PieLabelConnectorConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the pie series label connectors in a chart.
		/// </summary>
	});
	var _PieLabelConfiguration = derive(chartConfig._PieLabelConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the pie series labels in a chart.
		/// </summary>
	});
	var _SeriesLineConfiguration = derive(chartConfig._SeriesLineConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the lines of an area series in a chart.
		/// </summary>
}, {
		/// <field type="Number" defaultValue="0.5">
		/// Gets or sets the line width of the area series.
		/// </field>
		width: defineProperty("width", 0.5)
	});
	var _TitleConfiguration = derive(chartConfig._TitleConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart title.
		/// </summary>
	});
	var _TooltipConfiguration = derive(chartConfig._TooltipConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart tooltip.
		/// </summary>
}, {
		/// <field type="Boolean">
		/// Gets or sets the tooltip visibility. Default is true.
		/// </field>
		visible: defineProperty("visible", true),
		/// <field type="Boolean">
		/// A value indicating if the tooltip should be shared. Default is true.
		/// </field>
		shared: defineProperty("shared", true)
	});
	var _PlotAreaConfiguration = derive(chartConfig._PlotAreaConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the chart plot area.
		/// </summary>
	});
	var _SeriesMarkersConfiguration = derive(chartConfig._SeriesMarkersConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the markers of a chart series.
		/// </summary>
}, {
		/// <field type="Number" defaultValue="2">
		/// Gets or sets the size of the markers.
		/// </field>
		size: defineProperty("size", 2),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets the visibility of the markers.
		/// </field>
		visible: defineProperty("visible", false)
	});
	var _SeriesNegativeValuesConfiguration = derive(chartConfig._SeriesNegativeValuesConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the negative values for a chart series.
		/// </summary>
	});
	var _SeriesTargetConfiguration = derive(chartConfig._SeriesTargetConfiguration, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of the negative values for a chart series.
		/// </summary>
	});
	namespace(nsName, {
		Axis: Axis,
		CategoryAxis: CategoryAxis,
		AreaSeries: AreaSeries,
		BarSeries: BarSeries,
		ColumnSeries: ColumnSeries,
		LineSeries: LineSeries,
		PieSeries: PieSeries,
		Series: Series,
		CandleStickSeries: CandleStickSeries,
		OhlcSeries: OhlcSeries,
		BubbleSeries: BubbleSeries,
		DonutSeries: DonutSeries,
		ScatterSeries: ScatterSeries,
		ScatterLineSeries: ScatterLineSeries,
		VerticalAreaSeries: VerticalAreaSeries,
		VerticalLineSeries: VerticalLineSeries,
		BulletSeries: BulletSeries,
		VerticalBulletSeries: VerticalBulletSeries,
		_AxisLineConfiguration: _AxisLineConfiguration,
		_AxisTickConfiguration: _AxisTickConfiguration,
		_AxisCrossHairConfiguration: _AxisCrossHairConfiguration,
		_AxisLabelConfiguration: _AxisLabelConfiguration,
		_AxisTitleConfiguration: _AxisTitleConfiguration,
		_AxisLabelDateFormatConfiguration: _AxisLabelDateFormatConfiguration,
		_TooltipConfiguration: _TooltipConfiguration,
		_PlotAreaConfiguration: _PlotAreaConfiguration,
		_CrossHairTooltipConfiguration: _CrossHairTooltipConfiguration,
		_LegendLabelConfiguration: _LegendLabelConfiguration,
		_LegendConfiguration: _LegendConfiguration,
		_LabelConfiguration: _LabelConfiguration,
		_PieLabelConnectorConfiguration: _PieLabelConnectorConfiguration,
		_PieLabelConfiguration: _PieLabelConfiguration,
		_TitleConfiguration: _TitleConfiguration,
		_SeriesLineConfiguration: _SeriesLineConfiguration,
		_SeriesMarkersConfiguration: _SeriesMarkersConfiguration,
		_SeriesNegativeValuesConfiguration: _SeriesNegativeValuesConfiguration,
		_SeriesTargetConfiguration: _SeriesTargetConfiguration
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		utilities = win.Utilities,
		mix = win.Class.mix,
		util = Telerik.Utilities,
		ui = Telerik.UI,
		nsName = "Telerik.UI.Sparkline",
		ns = namespace(nsName),
		common = ui.Common,
		OBJECT = "object",
		ARRAY = "array",
		FUNCTION = "function",
		NULL = null,
		config = ui._ControlConfiguration,
		defineProperty = config.defineProperty,
		getMapping = config.getMapping,
		priv = util.setPrivate;
	/// <summary>
	/// A charting control that can visualize sparkline chart type.
	/// </summary>
	/// <icon src="sparkline_html_12.png" width="12" height="12" />
	/// <icon src="sparkline_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadSparkline"></div>]]></htmlSnippet>
	/// <event name="axislabelclick">Fires when an axis label is clicked.</event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <event name="dragstart">Fires when the user has used the mouse or a swipe gesture to drag the chart.</event>
	/// <event name="drag">Fires as long as the user is dragging the chart using the mouse or swipe gestures.</event>
	/// <event name="dragend">Fires when the user stops dragging the chart.</event>
	/// <event name="plotareaclick">Fires when the plot area is clicked.</event>
	/// <event name="seriesclick">Fires when any of the chart series is clicked.</event>
	/// <event name="serieshover">Fires when any of the chart series is hovered.</event>
	/// <event name="zoomstart">Fires when the user has used the mousewheel to zoom the chart..</event>
	/// <event name="zoom">Fires as long as the user is zooming the chart using the mousewheel.</event>
	/// <event name="zoomend">Fires when the user stops zooming the chart.</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadSparkline = derive(ui.RadChart, function (element, options) {
		/// <summary>
		/// Creates a new RadSparkline control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Gets the margin settings of the chart area.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Array">
		/// The data for the default sparkline series. Will be discarded if series are supplied.
		/// </field>
		data: {get:function(){}, set:function(value){}},
		/// <excludetoc />
		legend: {},
		/// <excludetoc />
		panes: {},
		/// <field type="Number" defaultValue="5">
		/// The width to allocate for each data point.
		/// </field>
		pointWidth: defineProperty("pointWidth", 5),
		refresh: function () {
			/// <summary>
			/// Reloads the data and repaints the chart.
			/// </summary>
},
		redraw: function () {
			/// <excludetoc />
			/// <summary>
			/// Repaints the chart.
			/// </summary>
},
		/// <excludetoc />
		title: {},
		/// <field type="String">
		/// Gets or sets the type of the serie
		/// </field>
		type: {get:function(){}, set:function(value){}},
		/// <excludetoc />
		xAxis: {},
		/// <excludetoc />
		xAxes: {},
		/// <excludetoc />
		yAxis: {},
		/// <excludetoc />
		yAxes: {},
		/// <excludetoc />
		categoryAxes: {}
	});
	mix(RadSparkline, utilities.createEventProperties("axislabelclick", "databound", "dragstart", "drag", "dragend", "plotareaclick", "seriesclick", "serieshover", "zoomstart", "zoom", "zoomend"));
	namespace("Telerik.UI", {
		RadSparkline: RadSparkline
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datasource.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Grid",
		config = Telerik.UI._ControlConfiguration,
		defineProperty = config.defineProperty,
		util = Telerik.Utilities,
		templateValidator = util._validators.unifiedTemplate,
		STRING = "string",
		ARRAY = "array",
		OBJECT = "object",
		FUNCTION = "function",
		NULL = "null";
	namespace(nsName, {
		Column: derive(config, function () {
			/// <summary>
			/// A class representing a grid column.
			/// </summary>
}, {
			/// <field type="Object">
			/// Definition of column cells' HTML attributes.
			/// Reserved words in Javascript should be enclosed in quotation marks.
			/// </field>
			attributes: defineProperty("attributes", null),
			/// <field type="Object">
			/// Definition of column header cell's HTML attributes.
			/// Reserved words in Javascript should be enclosed in quotation marks.
			/// </field>
			headerAttributes: defineProperty("headerAttributes", null),
			/// <field type="Object">
			/// Definition of column footer cell's HTML attributes.
			/// Reserved words in Javascript should be enclosed in quotation marks.
			/// </field>
			footerAttributes: defineProperty("footerAttributes", null),
			/// <field type="Object">
			/// The aggregates to be used when grouping is applied.
			/// </field>
			aggregates: defineProperty("aggregates", null),
			/// <field type="String">
			/// Definition of command column. The supported built-in commands are: "create", "cancel", "save", "destroy".
			/// Accepts a string or an array of strings to specify multiple commands.
			/// </field>
			command: defineProperty("command", ""),
			/// <field type="Function">
			/// Provides a way to specify custom editor for this column.
			/// </field>
			editor: defineProperty("editor", null),
			/// <field type="Boolean" defaultValue="true">
			/// Specified whether the column content is escaped. Disable encoding if the data contains HTML markup.
			/// </field>
			encoded: defineProperty("encoded", true),
			/// <field type="String">
			/// The field from the datasource that will be displayed in the column.
			/// </field>
			field: defineProperty("field", ""),
			/// <field type="Telerik.UI.Grid._ColumnFilterableConfiguration">
			/// Specifies filtering options for this column. This property is read-only, but accepts a boolean
			/// value indicating whether filtering is enabled for the column, providing a shortcut for filterable.enabled.
			/// </field>
			filterable: {get:function(){}, set:function(value){}},
			/// <field type="Array">
			/// Gets or sets an array of values that will be displayed instead of the bound values.
			/// Each item in the array must have a text and a value field.
			/// </field>
			values: defineProperty("values", null),
			/// <field type="String">
			/// The format that will be applied on the column cells.
			/// </field>
			format: defineProperty("format", ""),
			/// <field type="Boolean" defaultValue="false">
			/// Specifies whether given column is hidden.
			/// </field>
			hidden: defineProperty("hidden", false),
			/// <field type="Boolean" defaultValue="true">
			/// Specifies whether given column is sortable.
			/// </field>
			sortable: defineProperty("sortable", true),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for column's cells.
			/// </field>
			template: defineProperty("template", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for column's header cells.
			/// </field>
			headerTemplate: defineProperty("headerTemplate", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for column's footer cells.
			/// </field>
			footerTemplate: defineProperty("footerTemplate", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for column's group header cells.
			/// </field>
			groupHeaderTemplate: defineProperty("groupHeaderTemplate", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for column's group footer cells.
			/// </field>
			groupFooterTemplate: defineProperty("groupFooterTemplate", null),
			/// <field type="String">
			/// The text that will be displayed in the column header.
			/// </field>
			title: defineProperty("title", ""),
			/// <field type="String">
			/// The width of the column.
			/// </field>
			width: defineProperty("width", "")
			}),
		_ColumnFilterableConfiguration: derive(config, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the filtering properties in a grid.
			/// </summary>			
}, {
			/// <field type="Boolean" defaultvalue="true">
			/// Gets or sets whether editing is enabled in the grid. Default is false.
			/// </field>
			enabled: defineProperty("enabled", true),
			/// <field type="Object">
			/// Gets or sets the template rendered in the filter menu.
			/// </field>
			template: defineProperty("template", null),
			/// <field type="Function" defaultValue="null">
			/// Gets or sets a function that will update the custom filter UI with values from the grid's filter expression. The
			/// function accepts two arguments - the HTML element that contains the rendered filter menu and a filter expressions object
			/// that contains the filter state of the grid.
			/// </field>
			refresh: defineProperty("refresh", null),
			/// <field type="Function" defaultValue="null">
			/// Gets or sets a function that will collect and return a filter expression from a custom filter UI. The functions accepts
			/// a single parameter - the HTML element that contains the rendered filter menu. The developer must collect filter data
			/// and return a filter expression object from the function.
			/// </field>
			apply: defineProperty("apply", null)
			}, {
			adjust: function (userOptions) {
				if (userOptions && util.getType(userOptions.columns) === ARRAY) {
					userOptions.columns.forEach(function (column, index) {
						if (util.getType(column) === STRING) {
							userOptions.columns[index] = column = { field: column };
						}
						if (util.getType(column) === OBJECT) {
							delete column._filterable;
							if (util.getType(column.filterable) === OBJECT &&
								column.filterable.enabled === false) {
								column._filterable = column.filterable;
								column.filterable = false;
							}
							else if (column.filterable === false) {
								column._filterable = { enabled: false }
							}
						}
					});
				}
			}
		}),
		/// <excludetoc />
		ToolBarItem: derive(config, function () {
			/// <summary>
			/// A class representing a grid toolbar command.
			/// </summary>
}, {
			/// <field type="String">
			/// The name of the command. One of the predefined or a custom.
			/// </field>
			name: defineProperty("name", ""),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// The template for the command button.
			/// </field>
			template: defineProperty("template", null),
			/// <field type="String">
			/// The text of the command that will be set on the button.
			/// </field>
			text: defineProperty("text", "")
			}),
		EditableConfiguration: derive(config, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the editing properties in a grid.
			/// </summary>
}, {
			/// <field type="Boolean" defaultvalue="false">
			/// Gets or sets whether editing is enabled in the grid. Default is false.
			/// </field>
			enabled: {get:function(){}, set:function(value){}},
			/// <field type="Boolean" defaultvalue="true">
			/// Gets or sets whether items should be immediately deleted or only marked for deletion. Default is true.
			/// </field>
			destroy: defineProperty("destroy", true),
			/// <field type="String" defaultvalue="cell">
			/// Gets or sets the editing mode. Accepted values are "cell", "cellBatch", and "row". Default is "cell".
			/// </field>
			/// <options>
			/// <option value="cell">cell</option>
			/// <option value="cellBatch">cellBatch</option>
			/// <option value="row">row</option>
			/// </options>
			mode: defineProperty("mode", "cell"),
			/// <field type="String" defaultvalue="top">
			/// Indicates whether the created record should be inserted at the top or at the bottom of the current page. Available values are "top" and "bottom". Default value is "top".
			/// </field>
			/// <options>
			/// <option value="top">top</option>
			/// <option value="bottom">bottom</option>
			/// </options>
			createAt: defineProperty("createAt", "top"),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Gets or sets the template for that will be used when editing in "popup" mode.
			/// </field>
			template: defineProperty("template", null),
			/// <field type="Boolean" defaultvalue="true">
			/// Gets or sets whether an item should be switched to edit mode on click. Default is true.
			/// </field>
			update: defineProperty("update", true),
			/// <field type="Boolean" defaultvalue="true">
			/// Gets or sets whether an the insert new item button is visible. Default is true.
			/// </field>
			create: defineProperty("create", true)
			})
	});
})(this, jQuery);
//Override kendo editable with our own editors
(function ($, kendo) {
	var utilities = WinJS.Utilities,
		BOOLEAN = "boolean";
	function fieldType(field) {
		field = field != null ? field : "";
		return field.type || $.type(field) || "string";
	}
	function createAttributes(options) {
		var specialRules = ["url", "email", "number", "date", "boolean"],
			field = (options.model.fields || options.model)[options.field],
			type = fieldType(field),
			validation = field ? field.validation : {},
			ruleName,
			DATATYPE = kendo.attr("type"),
			BINDING = kendo.attr("bind"),
			rule,
			attr = {
				name: options.field
			};
		for (ruleName in validation) {
			rule = validation[ruleName];
			if ($.inArray(ruleName, specialRules) >= 0) {
				attr[DATATYPE] = ruleName;
			} else if (!$.isFunction(rule)) {
				attr[ruleName] = $.isPlainObject(rule) ? rule.value || ruleName : rule;
			}
			attr[kendo.attr(ruleName + "-msg")] = rule.message;
		}
		if ($.inArray(type, specialRules) >= 0) {
			attr[DATATYPE] = type;
		}
		attr[BINDING] = (type === BOOLEAN ? "checked:" : "value:") + options.field;
		return attr;
	}
	kendo.ui.Editable.prototype._originalEditor = kendo.ui.Editable.prototype.editor;
	kendo.ui.Editable.prototype.editor = function winEditorOverride(field, modelField) {
		var that = this,
			nameSpecialCharRegExp = /("|'|\[|\]|\$|\.|\:|\+)/g,
				isObject = $.isPlainObject(field),
				fieldName = isObject ? field.field : field,
			containerFor = fieldName.replace(nameSpecialCharRegExp, "\\$1"),
				cellWrapper = document.createElement("div");
			cellWrapper.className = "t-edit-cell-wrapper";
		cellWrapper.setAttribute(kendo.attr("container-for"), containerFor);
		if (that.element && that.element.length) {	
			if (that.element[0].tagName === "TD") {
			that.element[0].appendChild(cellWrapper);
			} else {
				var cell = that.element.find("td:visible").eq(0).filter("[data-container-for=" + containerFor + "]");
				if (cell[0]) {
					cell[0].removeAttribute(kendo.attr("container-for"));
					cell[0].appendChild(cellWrapper);
				}
			}
		}
		that._originalEditor(field, modelField);
	};
	kendo.ui.Editable.prototype.options.editors.number = function winNumberEditor(container, options) {
		var attr = createAttributes(options),
			numInput = $("<input/>").attr(attr),
			numericBox = new Telerik.UI.RadNumericBox(numInput[0], { swipe: false, format: options.format });
		var el = numericBox.element;
		container.append(el);
		$('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
	};
	kendo.ui.Editable.prototype.options.editors.values = function winValuesEditor(container, options) {
		var attr = createAttributes(options),
			ddlInput = $("<input/>").attr(attr),
			ddl = new Telerik.UI.RadDropDownList(ddlInput[0], { dataSource: options.values });
		var el = ddl.element;
		container.append(el);
		$('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
	};
	kendo.ui.Editable.prototype.options.editors.date = function winDateEditor(container, options) {
		var attr = createAttributes(options);
		//var format = options.format;
		//TODO: Format
		//if (format) {
		//	format = kendo._extractFormat(format);
		//	attr[kendo.attr("format")] = format;
		//}
		var dpel = document.createElement("div");
		container.append(dpel);
		var datePicker = new Telerik.UI.RadDatePicker(dpel, { value: options.model[options.field] });
		datePicker.onchange = function myfunction(args) {
			var hiddenInput = $(args.target._hiddenInput),
				newValue = args.target.value instanceof Date ? args.target.value.toISOString() : "";
			hiddenInput.val(newValue).change();
		}
		// fix when navigatable is true and you focused the datepicker you should not be able to navigate with arrows
		$(datePicker.element).on("keydown.kendoGrid", function (e) {
			e.stopPropagation();
		});
		$(datePicker._hiddenInput).attr(attr);
		setImmediate(function () {
			var initialValue = datePicker.value instanceof Date && !isNaN(datePicker.value.getTime()) ? datePicker.value.toISOString() : "";
			datePicker._hiddenInput.value = initialValue;
		});
		$('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
	};
	//override instances of window.confirm in kendo grid
	kendo.ui.Grid.prototype._showMessage = function _showMessageWin(text) {
		return true;
	}
	var original_CloseCell = kendo.ui.Grid.prototype.closeCell;
	kendo.ui.Grid.prototype.closeCell = function replacedCloseCell(isCancel) {
		var that = this,
			cell = that._editContainer;
		if (cell && cell.length) {
			//remove custom CSS class added in grid._startEdit()
			cell.removeClass("t-edit-container");
			var cancelButton = cell.find(".k-grid-cancel");
			//remove onclick event added in grid._startEdit()
			if (cancelButton.length && cancelButton[0].onclick) cancelButton[0].onclick = null;
		}
		var grid = that.element.parents(".t-table-view")[0],
			cellEditMode = grid && grid.winControl && grid.winControl.editable.mode === "cell",
			dirtyClass = "k-dirty-cell",
			shouldSync = false;
		if (cellEditMode) {
			if (cell.hasClass(dirtyClass)) {
				cell.removeClass(dirtyClass);
				shouldSync = true;
			}
		}
		original_CloseCell.apply(that, arguments);
		if (shouldSync) {
			//save changes immediately if not batch
			var stopDB = function tempDisableRefresh(e) {
				e.preventDefault();
				return false;
			}
			that.one("dataBinding", stopDB);
			that.saveChanges();
		}
	};
	kendo.ui.Grid.prototype._originalEditable = kendo.ui.Grid.prototype._editable;
	kendo.ui.Grid.prototype._editable = function replacedEditable() {
		var that = this,
			DBLCLICK = "dblclick",
			NS = ".kendoGrid";
		//changes have been made in the original code as well to support cell double click editing
		that._originalEditable();
		//edit rows by double click as well
		var mode = that._editMode();
		if (mode === "inline") {
			if (that.options.editable.update !== false) {
				that.wrapper.on(DBLCLICK + NS, "tr:not(.k-grouping-row) > td", function (e) {
					if (that.editable) {
						if (that.editable.end() && $(e.target).closest("tr").attr("data-uid") !== $(that.editable.element).attr("data-uid"))
							that.saveRow();
						else
							return;
					}
					that.editRow($(this).closest("tr"));
				});
			}
			that.wrapper.on(DBLCLICK + NS, function (e) {
				var cell = $(e.target).closest("td"),
					parent = cell.closest("tr"),
					target = kendo._activeElement();
				if (!parent.length || parent.hasClass("k-grouping-row")) cell = {};
				if (!cell.length || (!$.contains(cell[0], target) && cell[0] !== target && !$(target).closest(".k-animation-container,.t-date-selector,.t-time-selector").length)) {
					if (that.editable) {
						if (that.editable.end() && $(e.target).closest("tr").attr("data-uid") !== $(that.editable.element).attr("data-uid"))
							that.saveRow();
					}
				}
			});
		}
	};
	kendo.ui.Grid.prototype._originalRemoveRow = kendo.ui.Grid.prototype.removeRow;
	kendo.ui.Grid.prototype.removeRow = function replacedRemoveRow(row) {
		if (!row || !row.length) return;
		var that = this,
			confirmMessage = that.options.editable && that.options.editable.messages.confirmation,
			rowDeleteButton = row.find("td a.k-grid-delete");
		//no confirmation message - delete immediately
		if (!confirmMessage) return that._originalRemoveRow(row);
		if (rowDeleteButton.length) {
			if (utilities.hasClass(rowDeleteButton[0], "t-edit-delete-expanded")) {
				//confirmed - delete
				if (!that._deleteRowTransition)
					that._originalRemoveRow(row);
			}
			else {
				//expand delete button to confirm
				utilities.addClass(rowDeleteButton[0], "t-edit-delete-expanded");
				rowDeleteButton[0].textContent = confirmMessage;
				that._deleteRowTransition = true;
				setTimeout(function () {
					that._deleteRowTransition = false;
				}, 367);
			}
		}
		else {
			//show a normal flyout if no delete button is onscreen
			var flyoutContainer = document.createElement("div");
			utilities.addClass(flyoutContainer, "t-gridConfirmation");
			var spanText = document.createElement("p");
			spanText.innerText = confirmMessage;
			var buttonConfirm = document.createElement("button");
			buttonConfirm.type = "button";
			buttonConfirm.innerText = "OK";//TODO: LOCALIZATION
			buttonConfirm.addEventListener("click", function deleteConfirmedFunc() {
				that._originalRemoveRow(row);
				flyoutContainer.winControl.hide();
			}, false);
			flyoutContainer.appendChild(spanText);
			flyoutContainer.appendChild(buttonConfirm);
			document.body.appendChild(flyoutContainer);
			var dialog = new WinJS.UI.Flyout(flyoutContainer);
			dialog.anchor = row[0];
			dialog.onafterhide = function confirmAfterHide() {
				flyoutContainer.removeNode(true);
			}
			dialog.show();
		}
	};
})(jQuery, kendo);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
(function (global, $, undefined) {
	"use strict";
	var kendo = window.kendo,
		ui = kendo.ui,
        proxy = $.proxy,
        POPUP = "kendoPopup",
        INIT = "init",
        NS = ".kendoFilterMenu",
        EQ = "Is equal to",
        NEQ = "Is not equal to",
        roles = {
        	"number": "numerictextbox",
        	"date": "datepicker"
        },
        isFunction = $.isFunction,
        Widget = ui.Widget,
		oldFilterMenu = ui.FilterMenu;
	var booleanTemplate =
            '<div class="t-filter-menu t-filter-boolean">' +
                '<div class="k-filter-help-text">#=messages.info#</div>' +
                '<label>' +
                    '<input type="radio" data-#=ns#bind="checked: filters[0].value" value="true" name="filters[0].value"/>' +
                    '#=messages.isTrue#' +
                '</label>' +
                '<label>' +
                    '<input type="radio" data-#=ns#bind="checked: filters[0].value" value="false" name="filters[0].value"/>' +
                    '#=messages.isFalse#' +
                '</label>' +
				'<button type="submit" class="k-button">#=messages.filter#</button>' +
                '<div class="t-filter-buttons">' +
					'<button type="reset" class="k-button">#=messages.clear#</button>' +
                '</div>' +
            '</div>';
	var defaultTemplate =
            '<div class="t-filter-menu">' +
                '<div class="k-filter-help-text">#=messages.info#</div>' +
                '<select data-class="t-filter-operators" data-#=ns#bind="value: filters[0].operator" data-#=ns#role="dropdownlist">' +
                    '#for(var op in operators){#' +
                        '<option value="#=op#">#=operators[op]#</option>' +
                    '#}#' +
                '</select>' +
                '#if(values){#' +
                    '<select data-#=ns#bind="value:filters[0].value" data-#=ns#role="dropdownlist">' +
						'<option value="">#=messages.selectValue#</option>' +
						'#for(var i in values){#' +
							'<option value="#=values[i].value#">#=values[i].text#</option>' +
						'#}#' +
                    '</select>' +
                '#}else{#' +
                    '<input data-#=ns#bind="value:filters[0].value" class="k-textbox" type="text" #=role ? "data-" + ns + "role=\'" + role + "\'" : ""# />' +
                '#}#' +
                '#if(extra){#' +
					'<div class="t-extra">' +
						'<select data-class="k-filter-and" data-#=ns#bind="value: logic" data-#=ns#role="dropdownlist">' +
							'<option value="and">#=messages.and#</option>' +
							'<option value="or">#=messages.or#</option>' +
						'</select>' +
						'<select data-class="t-filter-operators" data-#=ns#bind="value: filters[1].operator" data-#=ns#role="dropdownlist">' +
							'#for(var op in operators){#' +
								'<option value="#=op#">#=operators[op]#</option>' +
							'#}#' +
						'</select>' +
						'#if(values){#' +
							'<select data-#=ns#bind="value:filters[1].value" data-#=ns#role="dropdownlist">' +
								'<option value="">#=messages.selectValue#</option>' +
								'#for(var i in values){#' +
									'<option value="#=values[i].value#">#=values[i].text#</option>' +
								'#}#' +
							'</select>' +
						'#}else{#' +
							'<input data-#=ns#bind="value: filters[1].value" class="k-textbox" type="text" #=role ? "data-" + ns + "role=\'" + role + "\'" : ""#/>' +
						'#}#' +
					'</div>' +
                '#}#' +
				'<button type="submit" class="k-button">#=messages.filter#</button>' +
                '<div class="t-filter-buttons">' +
					'<button type="button" class="k-button"></button>' +
					'<button type="reset" class="k-button">#=messages.clear#</button>' +
                '</div>' +
            '</div>';
	var customTemplateWrap =
		'<div class="t-filter-menu">' +
			'<div class="k-filter-help-text">#=messages.info#</div>' +
			'</div>' +
		'</div>';
	function convertItems(items) {
		var idx,
            length,
            item,
            value,
            text,
            result;
		if (items && items.length) {
			result = [];
			for (idx = 0, length = items.length; idx < length; idx++) {
				item = items[idx];
				text = item.text || item.value || item;
				value = item.value == null ? (item.text || item) : item.value;
				result[idx] = { text: text, value: value };
			}
		}
		return result;
	}
	var newFilterMenu = oldFilterMenu.extend({
		init: function (element, options) {
			var that = this;
			oldFilterMenu.prototype.init.apply(that, arguments);
			//prevent user from being able to drag the filter element itself (only the row)
			if (that.link && that.link.length) that.link[0].draggable = false;
			that._updateFilterUI();
		},
		_init: function winCore_FilterMenu_init() {
			var that = this,
                options = that.options,
                template = options.template ? Telerik.Utilities.getTemplate(options.template) : null,
                role = roles[type],
                type = that.type,
				operators = (that.operators || {})[type] || options.operators[type] || {},
                context = {
                	field: that.field,
                	format: options.format,
                	messages: options.messages,
                	operators: operators,
                	extra: options.extra,
                	ns: kendo.ns,
                	type: type,
                	role: role,
                	values: convertItems(options.values)
                };
			// fix header dislocation after popup close
			var originalCloseCallback = options.closeCallback;
			if (originalCloseCallback)
				options.closeCallback = function (e) {
					if (that.element.parents("table").length)
						originalCloseCallback(e);
				};
			//prevent unsafe HTML exception
			MSApp.execUnsafeLocalFunction(function () {
				that.form = $('<form class="k-filter-menu"/>')
					.on("keydown" + NS, proxy(that._keydown, that))
					.on("submit" + NS, proxy(that._submit, that))
					.on("reset" + NS, proxy(that._reset, that));
				if (isFunction(template)) {
					that.template = template;
					context.operators = Object.keys(operators).map(function (key) {
						return { text: operators[key], value: key }
					});
					that.form.append(customTemplateWrap)
						.find(".t-filter-menu")
						.append(template(context));
				}
				else {
					that.form.html(kendo.template(type === "boolean" ? booleanTemplate : defaultTemplate)(context));
				}
				if (!options.appendToElement) {
					that.popup = that.form[POPUP]({
						anchor: that.link,
						open: proxy(that._open, that),
						activate: proxy(that._activate, that),
						close: options.closeCallback,
						position: "top right",
						origin: "bottom right"
					}).data(POPUP);
				} else {
					that.element.append(that.form);
					that.popup = that.element.closest(".k-popup").data(POPUP);
				}
				that.form.find("[" + kendo.attr("role") + "=dropdownlist]").removeAttr(kendo.attr("role")).each(function createDDLs() {
					var ddl = new Telerik.UI.RadDropDownList(this),
						elem = ddl.element,
						cls = this.getAttribute("data-class");
					if (cls) {
						elem.className += " " + cls;
					}
				});
				that.form.find(".k-textbox")
                    .removeClass("k-textbox")
                    .each(function () {
                    	switch (type) {
                    		case "number":
                    			new Telerik.UI.RadNumericBox(this, { swipe: false });
                    			break;
                    		case "date":
                    			new Telerik.UI.RadDatePicker(this, { _requiresLayout: false });
                    			break;
                    		case "string":
                    		default:
                    			$(this).addClass("k-textbox");
                    			break;
                    	}
                    });
			});
			that.form
                 .find("[" + kendo.attr("role") + "=numerictextbox]")
                 .removeClass("k-textbox")
                 .end()
                 .find("[" + kendo.attr("role") + "=datetimepicker]")
                 .removeClass("k-textbox")
                 .end()
                 .find("[" + kendo.attr("role") + "=timepicker]")
                 .removeClass("k-textbox")
                 .end()
                 .find("[" + kendo.attr("role") + "=datepicker]")
                 .removeClass("k-textbox");
			that._delegates = {
				moreFilters: that._toggleMoreFilters.bind(that),
				closePopup: that._closePopup.bind(that)
			};
			that.form.find("button[type='button']").on("click" + NS, that._delegates.moreFilters).end();
			that.link.on(Telerik.Utilities._pointerEvent("down") + NS, that._delegates.closePopup);
			that.refresh();
			that.trigger(INIT, { field: that.field, container: that.form });
		},
		_closePopup: function winCore_FilterMenu_closePopup() {
			var that = this;
			if (that.popup && that.popup.visible()) {
				that._popupClosingFlag = true;
				that.popup.close();
			}
			else {
				that._popupClosingFlag = false;
			}
		},
		_toggleMoreFilters: function winCore_FilterMenu_toggleMoreFilters(e) {
			//go to wrapper div
			$(e.target).parents("div").toggleClass("t-expanded");
			var that = this;
			that.popup._position();
			that._fixPopupPosition();
		},
		_fixPopupPosition: function winCore_FilterMenu_fixPopupPosition() {
			//move popup 2px up/down so borders overlap
			var that = this,
				fixLine = that.popup.element.find(".k-filter-help-text");
			if (fixLine.length) {
				var parentElement = that.popup.element.parent()[0],
					filterElement = that.element.find(".k-grid-filter")[0],
					popupPosition = parentElement ? WinJS.Utilities.getPosition(parentElement) : { left: 0 },
					iconPosition = filterElement ? WinJS.Utilities.getPosition(filterElement) : { left: 0 },
                    borderWidth = parseInt(that.element.css("border-left-width")),
                    gridBorderWidth = parseInt(that.element.closest(".k-grid").css("border-left-width"), 10),
					diff = parseInt(popupPosition.left, 10) - parseInt(iconPosition.left, 10);
				fixLine.css("left", (diff >= 0 ? diff - borderWidth + gridBorderWidth : -diff + borderWidth + gridBorderWidth));
			}
		},
		_updateFilterUI: function (expression) {
			var that = this;
			that.element.closest("th").removeClass("t-filtered");
			if (!expression) {
				if (that.dataSource && that.dataSource.filter) {
					var filterExpr = that.dataSource.filter();
					if (filterExpr) {
						that._updateFilterUI(filterExpr);
					}
				}
				return;
			}
			for (var i = 0, len = expression.filters.length; i < len; i++) {
				var field = expression.filters[i].field;
				if (!field && expression.filters[i].filters && expression.filters[i].filters.length)
					that._updateFilterUI(expression.filters[i]);
				if (field === that.field) {
					that.element.closest("th").addClass("t-filtered");
					break;
				}
			}
		},
		refresh: function () {
			var that = this,
				expression = that.dataSource.filter() || { filters: [], logic: "and" },
				callback = that.options.refresh;
			oldFilterMenu.prototype.refresh.apply(that, arguments);
			that._updateFilterUI();
			if (that.form && that.form.length && isFunction(callback)) {
				callback(that.form[0], expression);
			}
		},
		clear: function () {
			var that = this;
			oldFilterMenu.prototype.clear.call(that);
			that.element.closest("th").removeClass("t-filtered");
			//find datepickers and clear their values
			$(that.form).find(".t-date-picker, .t-time-picker").each(function datePicker_clear() {
				var dp = this.winControl;
				if (dp) dp.value = null;
			});
		},
		_submit: function (e) {
			var that = this,
				callback = that.options.apply,
				expression = that._merge(that.filterModel.toJSON()),
				result;
			e.preventDefault();
			if (typeof callback === "function") {
				result = callback(that.form[0], $.extend(true, {}, expression));
				if (result === false) {
					//return and prevent the menu from closing
					return;
				}
				if (Telerik.Utilities.getType(result) === "object") {
					expression = result;
				}
			}
			if (expression.filters && expression.filters.length) {
				that.dataSource.filter(expression);
			}
			that.popup.close();
		},
		_open: function wincore_FilterMenu_open(e) {
			var that = this;
			oldFilterMenu.prototype._open.call(that, e);
			msSetImmediate(that._fixPopupPosition.bind(that));
		},
		_click: function wincore_FilterMenu_click(e) {
			var that = this;
			//do not open the popup if it was closed during the mspointerdown event fired just before this one
			if (that._popupClosingFlag) {
				that._popupClosingFlag = false;
				e.stopPropagation();
			} else {
				oldFilterMenu.prototype._click.call(that, e);
			}
		},
		destroy: function winCore_FilterMenu_destroy() {
			var that = this;
			if (that._delegates) {
				that.form.find("button[type='button']").off(NS);
				that.link.off(NS);
				that._delegates = null;
			}
			oldFilterMenu.prototype.destroy.call(that);
		}
	});
	ui.plugin(newFilterMenu);
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datasource.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Grid",
		config = Telerik.UI._ControlConfiguration,
		defineProperty = config.defineProperty,
		utilities = WinJS.Utilities,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		DataSource = Telerik.Data.DataSource,
		templateValidator = util._validators.unifiedTemplate,
		pevent = Telerik.Utilities._pointerEvent,
		STRING = "string",
		BOOLEAN = "boolean",
		OBJECT = "object",
		ARRAY = "array",
		FUNCTION = "function",
		POINTERDOWN = pevent("down"),
		POINTERMOVE = pevent("move"),
		POINTERUP = pevent("up"),
		css = {
			tableView: "t-table-view",
			selected: "k-state-selected",
			groupingRow: "k-grouping-row",
			expand: "t-expand",
			active: "t-active",
			rangeStart: "t-range-start",
			northWest: "t-nw",
			serviceView: "t-service-view",
			serviceColumn: "t-service-column",
			serviceCommands: "t-service-commands",
			groupEdit: "t-group-edit",
			beforeMasterExpand: "t-before-masterExpand",
			detailRowCollapse: "t-detailRow-collapse",
			masterRowExpand: "t-masterRow-expand",
			serviceButton: "t-service-button",
			insertCommand: "t-insert-command",
			saveAllCommand: "t-save-command",
			cancelAllCommand: "t-cancel-command"
		};
	namespace(nsName, {
		TableView: derive(Telerik.UI.WidgetWrapper, function (element, options) {
			/// <summary>
			/// Represents a table object in a Grid control.
			/// </summary>
			/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
			/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
			//prevent options from going to the widget
			//prevent options from going to the widget, but set as local wrapper properties
			/// <field type="Telerik.UI.RadGrid" readonly="true" hidden="true">
			/// Gets the owner RadGrid instance.
			/// </field>
			owner: {get:function(){}},
			/// <field type="HTMLElement" readonly="true" hidden="true">
			/// Gets the parent row of the table if it is nested.
			/// </field>
			parentRow: {get:function(){}},
			/// <field type="Telerik.UI.Grid.TableView" readonly="true" hidden="true">
			/// Gets the parent row of the table if it is nested.
			/// </field>
			parentTable: {get:function(){}},
			/// <field type="Array" elementType="Telerik.UI.Grid.TableView" readonly="true" hidden="true">
			/// Gets an array of all initialized child tables for this table.
			/// </field>
			detailTables: {get:function(){}},
			/// <field type="Object">
			/// Gets or sets the options for the detail tables. All newly initialized detail
			/// tables will inherit these options automatically.
			/// </field>
			detailTable: {get:function(){}, set:function(value){}},
			/// <field type="Object">
			/// Gets the parent relations for this table as an object or an array of objects in the form: 
			/// { masterField: 'field1', detailField: 'field2' }. To configure parent relations, set the
			/// detailTable.parentRelation property of the parent table.
			/// </field>
			parentRelation: {get:function(){}, set:function(value){}},
			/// <field type="Boolean" defaultValue="true">
			/// Indicates whether the grid will call read on the DataSource initially.
			/// </field>
			autoBind: defineProperty("autoBind", true),
			/// <field type="Array" elementType="Telerik.UI.Grid.Column">
			/// A collection of column objects or collection of strings that represents the name of the fields.
			/// </field>
			columns: {get:function(){}, set:function(value){}},
			/// <field type="Telerik.Data.DataSource">
			/// Gets or sets the data source object for this control.
			/// </field>
			dataSource: {get:function(){}, set:function(value){}},
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Template to be used for rendering the detail rows. 
			/// </field>
			detailTemplate: defineProperty("detailTemplate", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Template to be used for rendering the rows. 
			/// </field>
			rowTemplate: defineProperty("rowTemplate", null),
			/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
			/// Template to be used for rendering the alternating rows. 
			/// </field>
			altRowTemplate: defineProperty("altRowTemplate", null),
			/// <field type="Number" defaultValue="null">
			/// Sets the height of the grid.
			/// </field>
			height: defineProperty("height", null),
			/// <field type="String" defaultValue="none">
			/// Indicates whether grouping is enabled.
			/// </field>
			/// <options>
			/// <option value="none">none</option>
			/// <option value="enabled">enabled</option>
			/// <option value="staticHeaders">staticHeaders</option>
			/// <option value="enabled, staticHeaders">enabled, staticHeaders</option>
			/// </options>
			groupable: {get:function(){}, set:function(value){}},
			/// <field type="String">
			/// Indicates whether selection is enabled.
			/// </field>
			/// <options>
			/// <option value="none">none</option>
			/// <option value="row">row</option>
			/// <option value="cell">cell</option>
			/// <option value="multiple, row">multiple, row</option>
			/// <option value="multiple, cell">multiple, cell</option>
			/// </options>
			selectable: {get:function(){}, set:function(value){}},
			/// <field type="Object">
			/// Gets or sets selected rows/cells.
			/// </field>
			selection: {get:function(){}, set:function(value){}},
			/// <field type="Telerik.UI.Grid.EditableConfiguration">
			/// Gets and sets the editing related (create/update/delete) options.
			/// </field>
			editable: {get:function(){}, set:function(value){}},
			/// <field type="String">
			/// Indicates whether sorting is enabled.
			/// </field>
			/// <options>
			/// <option value="none">none</option>
			/// <option value="single">single</option>
			/// <option value="multiple">multiple</option>
			/// <option value="single, allowUnsort">single, allowUnsort</option>
			/// <option value="multiple, allowUnsort">multiple, allowUnsort</option>
			/// </options>
			sortable: {get:function(){}, set:function(value){}},
			/// <field type="Boolean">
			/// Indicates whether column resizing is enabled/disable.
			/// </field>
			resizable: {get:function(){}, set:function(value){}},
			/// <field type="Boolean" defaultValue="false">
			/// Indicates whether filtering is enabled/disabled.
			/// </field>
			filterable: {get:function(){}, set:function(value){}},
			/// <field type="Boolean">
			/// Gets or sets a value indicating whether column reordering is enabled.
			/// </field>
			reorderable: {get:function(){}, set:function(value){}},
			/// <field type="Boolean" defaultValue="false">
			/// Indicates whether keboard navigation is enabled/disabled.
			/// </field>
			navigatable: defineProperty("navigatable", false),
			///// <field type="Array">
			///// This is a list of commands for which the corresponding buttons will be rendered. 
			///// The supported built-in commands are: "create", "cancel", "save", "destroy".
			///// </field>
			//toolbar: {
			//	get: function () {
			//		var that = this;
			//		if (!that._toolbar) {
			//			var arr = [];
			//			if (that._widget) {
			//				that._syncToolbar(arr);
			//			}
			//			priv(that, "_toolbar", arr, true);
			//		}
			//		return that._toolbar;
			//	},
			//	set: function (value) {
			//		if (util.getType(value) === ARRAY) {
			//			priv(this, "_toolbar", value, true);
			//		}
			//	}
			//},
			/// <field type="Object">
			/// Gets the localization messages used by the control.
			/// </field>
			messages: {},
			clearSelection: function () {
				/// <summary>
				/// Clears currently selected items.
				/// </summary>
},
			collapseGroup: function (element) {
				/// <summary>
				/// Collapses specified group.
				/// </summary>
				/// <param name="element" domElement="true">Target group item to collapse.</param>
},
			collapseRow: function (element) {
				/// <summary>
				/// Collapses specified master row.
				/// </summary>
				/// <param name="element" domElement="true">Target master row to collapse.</param>
},
			dataItem: function (element) {
				/// <summary>
				/// Returns the data item to which a given table row (tr DOM element) is bound.
				/// </summary>
				/// <param name="element" domElement="true">Target row.</param>
},
			expandGroup: function (element) {
				/// <summary>
				/// Expands specified group.
				/// </summary>
				/// <param name="element" domElement="true">Target group item to expand.</param>
},
			expandRow: function (element) {
				/// <summary>
				/// Expands specified master row.
				/// </summary>
				/// <param name="element" domElement="true">Target master row to expand.</param>
},
			hideColumn: function (column) {
				/// <summary>
				/// Hides the specified column.
				/// </summary>
				/// <param name="column">The index or the bound field of the column to hide.</param>
},
			refresh: function (isInitial) {
				/// <summary>
				/// Reloads the data and repaints the control.
				/// </summary>
},
			reorderColumn: function (destIndex, column) {
				/// <summary>
				/// Changes the position of the specified column.
				/// </summary>
				/// <param name="destIndex">Destination column index</param>
				/// <param name="column">Column index, DOM element or array element from columns option</param>
},
			showColumn: function (column) {
				/// <summary>
				/// Shows the specified column.
				/// </summary>
				/// <param name="column">The index or the bound field of the column to show.</param>
},
			editCell: function (cell) {
				/// <summary>
				/// Switches the specified table cell in edit mode. Requires editable: { mode: "cell" }.
				/// </summary>
				/// <param name="cell" domElement="true">The cell to edit.</param>
}
		})
	});
	WinJS.Class.mix(Telerik.UI.Grid.TableView, utilities.createEventProperties(
		"cancel",
		"change",
		"columnhide",
		"columnmenuinit",
		"columnreorder",
		"columnresize",
		"columnshow",
		"databinding",
		"databound",
		"detailcollapse",
		"detailexpand",
		"detailinit",
		"edit",
		"filtermenuinit",
		"remove",
		"save",
		"savechanges"
	));
	/// <summary>
	/// A grid control that can display and edit data.
	/// </summary>
	/// <icon src="grid_html_12.png" width="12" height="12" />
	/// <icon src="grid_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadGrid"></div>]]></htmlSnippet>
	/// <event name="cancel">Fired when the user clicks the cancel "X" button while editing a grid row/column.</event>
	/// <event name="change">Fires when the grid selection has changed.</event>
	/// <event name="columnmenuinit">Fired when the column menu is initialized.</event>
	/// <event name="columnresize" argsType="Telerik.UI.Grid.ColumnResizeEventArgs">
	/// Fires when the user resizes a column.
	/// <param name="column" type="Telerik.UI.Grid.Column">The resized column object.</param>
	/// <param name="newWidth" type="Number">The new column width.</param>
	/// <param name="oldWidth" type="Number">The previous column width.</param>
	/// </event>
	/// <event name="databinding" argsType="Telerik.UI.Grid.DataBindingEventArgs">
	/// Fires when the grid is about to receive data from the data source.
	/// <param name="items" type="Object">The data items to which RadGrid is about to bind.</param>
	/// </event>
	/// <event name="databound">Fires when the grid has received data from the data source.</event>
	/// <event name="detailcollapse" argsType="Telerik.UI.Grid.DetailCollapseEventArgs">
	/// Fires when the grid detail row is collapsed.
	/// <param name="detailRow" type="Object">The jQuery element representing the detail row.</param>
	/// <param name="masterRow" type="Object">The jQuery element representing the master row.</param>
	/// </event>
	/// <event name="detailexpand" argsType="Telerik.UI.Grid.DetailExpandEventArgs">
	/// Fires when the grid detail row is expanded.
	/// <param name="detailRow" type="Object">The jQuery element representing the detail row.</param>
	/// <param name="masterRow" type="Object">The jQuery element representing the master row.</param>
	/// </event>
	/// <event name="detailinit" argsType="Telerik.UI.Grid.DetailInitEventArgs">
	/// Fires when the grid detail is initialized.
	/// <param name="data" type="Object">The data for the master row.</param>
	/// <param name="detailCell" type="Object">The jQuery element representing detail cell.</param>
	/// <param name="detailRow" type="Object">The jQuery element representing detail row.</param>
	/// <param name="detailTable" type="Telerik.UI.Grid.TableView">The detail table object.</param>
	/// <param name="masterRow" type="Object">The jQuery element representing master row.</param>
	/// <param name="parentTable" type="Telerik.UI.Grid.TableView"> The master table object to which the event has been attached.</param>
	/// </event>
	/// <event name="edit" argsType="Telerik.UI.Grid.EditEventArgs">
	/// Fires when the grid enters edit mode.
	/// <param name="container" type="Object">The jQuery object representing the container element. That element contains the editing UI.</param>
	/// <param name="model" type="Object"> The data item which is going to be edited.</param>
	/// </event>
	/// <event name="filtermenuinit">Fired when the grid filter menu is initialized.</event>
	/// <event name="remove" argsType="Telerik.UI.Grid.RemoveEventArgs">
	/// Fires before the grid item is removed.
	/// <param name="model" type="Object"> The data item which is going to be deleted.</param>
	/// <param name="row" type="Object">The jQuery object representing the table row that is going to be deleted.</param>
	/// </event>
	/// <event name="save" argsType="Telerik.UI.Grid.SaveEventArgs">
	/// Fires before the grid item is changed.
	/// <param name="model" type="Object"> The data item to which the table row is bound.</param>
	/// <param name="row" type="Object">The jQuery object representing the current table row.</param>
	/// <param name="values" type="Object">The values entered by the user. Availabe only when the editable.mode option is set to "cell" or "cellBatch".</param>
	/// </event>
	/// <event name="savechanges">Fires before the grid calls DataSource sync.</event>
	/// <part name="grid" class="k-grid">The RadGrid widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadGrid = derive(Telerik.UI.Grid.TableView, function (element, options) {
		/// <summary>
		/// Creates a new RadGrid control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Enable/disable scrolling. Possible values are "none", "enabled" and "virtual".
		/// </field>
		/// <options>
		/// <option value="none">none</option>
		/// <option value="enabled">enabled</option>
		/// <option value="virtual">virtual</option>
		/// </options>
		scrollable: {get:function(){}, set:function(value){}}
	});
	namespace("Telerik.UI", {
		RadGrid: RadGrid
	});
	var originalCellTmpl = kendo.ui.Grid.prototype._cellTmpl;
	kendo.ui.Grid.prototype._cellTmpl = function (column, state) {
		var that = this,
			fields = (that.dataSource.options.schema.model || {}).fields,
			field = column.field,
			boolTemplate = "<span class='#= " + field + " == null ? 't-check-indeterminate' : " + field + " ? 't-check-true' : 't-check-false' #'>#=" + field + "==null?'':" + field + "#</span>";
		if (!column.template && fields && util.getType(fields) === OBJECT) {
			Object.keys(fields).forEach(function (key) {
				if (key === field && fields[key].type === "boolean") {
					column.template = boolTemplate;
				}
			});
		}
		return originalCellTmpl.apply(that, arguments);
	}
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datasource.js" />
(function (global, $, undefined) {
	"use strict";
	var define = WinJS.Class.define,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Grid",
		util = Telerik.Utilities,
		tmpl = kendo.template,
		pevent = Telerik.Utilities._pointerEvent,
		POINTERDOWN = pevent("down"),
		css = {
			groupPanel: "t-group-panel",
			groupCaption: "t-group-caption",
			groupPopup: "t-group-popup",
			serviceCommands: "t-service-commands",
			serviceButton: "t-service-button",
			//groupEdit: "t-group-edit",
			hasGroups: "t-has-groups",
			highlight: "t-highlight",
			over: "t-over",
			open: "t-open",
			dragged: "t-dragged",
			fixedHeaderTable: "t-fixedGroupHeader"
		},
		templates = {
			groupPopup: "<div>" +
					"# for (var i = 0; i < data.length; i++) { #" +
						"<ul class='k-reset' data-level='#=i#'>" +
							"# for (var j = 0, groups = data[i].groups; j < groups.length; j++) { #" +
								"<li data-field='#=groups[j].field#' data-desc='#=groups[j].desc#'>" +
									"<div>" +
										"<span>" +
											"<span class='k-icon'>Drag group to arrange</span>" +
											"<span>#=groups[j].title#</span>" +
											"<span class='k-icon k-i-arrow-#=groups[j].desc ? \'s\' : \'n\'#'></span>" +
										"</span>" +
										"<button class='k-icon'>Tap here to ungroup</button>" +
									"</div>" +
								"</li>" +
							"# } #" +
						"</ul>" +
					"# } #" +
				"</div>"
		},
		selectors = {
			header: ".k-header:not(.k-group-cell):not(.k-hierarchy-cell)[data-field]"
		};
	namespace(nsName, {
		/// <excludetoc />
		Grouping: define(function (owner) {
			/// <summary>
			/// Internal use only.
			/// </summary>
}, {
			owner: null,
			dispose: function () {
}
		})
	});
	function groupRowClick(e, staticHeaderRow) {
		if (!e.currentTarget || e.currentTarget.nodeName != "TR") return;
		var group = $(e.currentTarget),
			element = group.find("a"),
			grid = group.parents(".k-grid").data("kendoGrid");
		if (grid) {
			if (element.hasClass('k-i-collapse')) {
				grid.collapseGroup(group);
				if (staticHeaderRow) grid.collapseGroup(staticHeaderRow);
			} else {
				grid.expandGroup(group);
				if (staticHeaderRow) grid.expandGroup(staticHeaderRow);
			}
		}
		e.preventDefault();
		e.stopPropagation();
	}
	//override default groupable to make clicking the whole grid row possible 
	var CLICK = "click",
		NS = ".kendoGrid";
	kendo.ui.Grid.prototype._groupable = function () {
		var that = this;
		if (that._groupableClickHandler) {
			that.table.off(CLICK + NS, that._groupableClickHandler);
		} else {
			that._groupableClickHandler = groupRowClick;
		}
		//WinJS: remove .k-i-expand, .k-i-collapse
			that.table.on(CLICK + NS, ".k-grouping-row", that._groupableClickHandler);
		that._attachGroupable();
	};
	var oldExpandGroup = kendo.ui.Grid.prototype.expandGroup,
		oldCollapseGroup = kendo.ui.Grid.prototype.collapseGroup,
		callUpdateGroupedRows = function (grid) {
			var tableView = grid.element.parents(".t-table-view"),
				winGrid = tableView[0];
			if (winGrid && winGrid.winControl && winGrid.winControl._grouping) {
				var grouping = winGrid.winControl._grouping;
				if (!grouping._updateGroupedRowsInProgress) {
					grouping._updateGroupedRowsInProgress = true;
					grouping._updateGroupedRows();
				}
			}
		},
		toggleStaticHeader = function (group, oldExpandCollapseMethod) {
			var that = this,
				fixedHeader = that.element.parents(".t-table-view").find(".t-fixedGroupHeader"),
				groupId = $(group).attr("data-group-id");
			if (fixedHeader.length && groupId) {
				oldExpandCollapseMethod.call(that, fixedHeader.find("[data-group-id='" + groupId + "']"));
			}
		};
	//override expand/collapse group to update grouped rows
	kendo.ui.Grid.prototype.expandGroup = function (group) {
		toggleStaticHeader.apply(this, [group, oldExpandGroup]);
		oldExpandGroup.apply(this, [group]);
		callUpdateGroupedRows(this);
	}
	kendo.ui.Grid.prototype.collapseGroup = function (group) {
		toggleStaticHeader.apply(this, [group, oldCollapseGroup]);
		oldCollapseGroup.apply(this, [group]);
		callUpdateGroupedRows(this);
	}
	//override set current method to highlight group headers when using keyboard navigation
	kendo.ui.Grid.prototype._oldCurrent = kendo.ui.Grid.prototype.current,
	kendo.ui.Grid.prototype.current = function (element) {
		var that = this;
		if (element && element.length && that.dataSource) {
			var group = that.dataSource.group(),
				isGrouped = group && group.length,
				fixedHeader = that.element.find(".t-fixedGroupHeader");
			if (isGrouped && fixedHeader.length) {
				var parent = element.parents("TR"),
					parentGroup = parent.attr("data-group-id");
				fixedHeader.find("TD").removeClass("k-state-focused");
				if (parentGroup) {
					fixedHeader.find("TR").each(function (index, item) {
						var $item = $(item);
						if ($item.attr("data-group-id") === parentGroup) {
							$item.find("TD").addClass("k-state-focused");
						}
					});
				}
			}
		}
		return that._oldCurrent(element);
	}
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datasource.js" />
/// <reference path="/js/behaviors.js" />
(function (global, $, undefined) {
	"use strict";
	var define = WinJS.Class.define,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Grid";
	namespace(nsName, {
		/// <excludetoc />
		Reorder: define(function (owner) {
			/// <summary>
			/// Internal use only.
			/// </summary>
}, {
			owner: null,
			dispose: function () {
}
		})
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	'use strict';
	// WinJS refs
	var win = WinJS,
        define = win.Class.define,
		derive = win.Class.derive,
        namespace = win.Namespace.define,
		MINHEADERWIDTH = 40,
		NULL = null,
		DOTGRIDHEADERFIRST = '.k-grid-header:first ',
		DOTKHEADER = '.k-header',
		NOTGROUPANDHIERARCHYCELL = ':not(.k-group-cell,.k-hierarchy-cell)',
		TSELECTED = 't-selected',
		TLAST = 't-last-column',
		TRESIZEHANDLE = 't-resize-handle',
		DOTRESIZING = '.resizing',
		COLONVISIBLE = ':visible',
		CLICK = 'click',
        MSPOINTERDOWN = Telerik.Utilities._pointerEvent("down"),
		PX = 'px',
        DATABOUND = 'dataBound';
	var ops = {
		negate: function (value) {
			return value * (-1);
		},
		same: function (value) {
			return value;
		}
	}
	/// <excludetoc />
	var Resizing = define(function (kendoGrid, isRtl) {
		/// <summary>
		/// Internal use only.
		/// </summary>
}, {
		resizeHandleElement: {get:function(){}},
		attachResizeHandle: function (th) {
			/// <summary>
			/// Attaches the resize handle to the specified column's th element.
			/// This must be done before calling the resizeColumn method.
			/// </summary>
},
		detachResizeHandle: function () {
},
		resizeColumn: function (deltaX) {
},
		refresh: function () {
},
		dispose: function () {
}
	}, {
		create: function (kendoGrid, grid) {
			var isRtl = grid ? grid._isRtl : false;
			if (kendoGrid.options.scrollable) {
				if (grid && grid.detailTable) {
					return new ResizingTableLayoutFixedHierarchy(kendoGrid, isRtl);
				}
				else {
					return new ResizingTableLayoutFixed(kendoGrid, isRtl);
				}
			}
			else {
				return new ResizingTableLayoutAuto(kendoGrid, isRtl);
			}
		},
		getPreciseWidth: function (element) {
			var computedStyle = window.getComputedStyle(element),
				width = parseFloat(computedStyle.width);
			width += parseFloat(computedStyle.borderLeftWidth);
			width += parseFloat(computedStyle.borderRightWidth);
			width += parseFloat(computedStyle.paddingLeft);
			width += parseFloat(computedStyle.paddingRight);
			return width;
		}
	});
	/// <excludetoc />
	var ResizingTableLayoutFixed = derive(Resizing, function (kendoGrid, isRtl) {
		/// <summary>
		/// Internal use only.
		/// Use it to enable resizing only when the grid is scrollable.
		/// </summary>
}, {
		resizeColumn: function (deltaX) {
			/// <summary>
			/// Resizes the column to which the resize handle has been attached prior to calling the method.
			/// </summary>
},
		dispose: function () {
}
	});
	/// <excludetoc />
	var ResizingTableLayoutFixedHierarchy = derive(ResizingTableLayoutFixed, function (kendoGrid, isRtl) {
		/// <summary>
		/// Internal use only.
		/// Use it to enable resizing only when the grid is scrollable.
		/// </summary>
}, {
		attachResizeHandle: function (th) {
},
		detachResizeHandle: function () {
},
		resizeColumn: function (deltaX) {
},
		dispose: function () {
}
	}, {
		_masterResizings: NULL,
		registerMasterResizing: function (resizing) {
			var that = this;
			if (!that._masterResizings) {
				that._masterResizings = [];
			}
			that._masterResizings.push(resizing);
		},
		unregisterMasterResizing: function (resizing) {
			var that = this,
				resizings = that._masterResizings,
				index;
			if (resizings) {
				index = resizings.indexOf(resizing);
				if (index > -1) {
					resizings.splice(index, 1);
				}
			}
			if (!resizings.length) {
				that._masterResizings = NULL;
			}
		},
		notifyDetailRowExpand: function (row) {
			var that = this,
				masterResizings = that._masterResizings,
				length,
				master;
			if (masterResizings) {
				length = masterResizings.length;
				master = that._getMasterGridWidget(row);
				for (var i = 0; i < length; i++) {
					if (masterResizings[i]._grid == master) {
						masterResizings[i]._onDetailExpanded(row.find('.k-grid').data('kendoGrid'));
					}
				}
			}
		},
		_getMasterGridWidget: function (detailRow) {
			var master = detailRow.parents('.k-grid')
				.filter(function () {
					return !$(this).parents('.k-detail-cell').length; // filter out parent detail grids
				});
			return master.data('kendoGrid');
		}
	});
	kendo.ui.Grid.prototype._details = function () {
		var that = this,
			NS = ".kendoGrid",
			CLICK = "click",
			DETAILINIT = "detailInit",
			DETAILEXPAND = "detailExpand",
			DETAILCOLLAPSE = "detailCollapse";
		that.table.on(CLICK + NS, ".k-hierarchy-cell .k-plus, .k-hierarchy-cell .k-minus", function (e) {
			var button = $(this),
				expanding = button.hasClass("k-plus"),
				masterRow = button.closest("tr.k-master-row"),
				detailRow,
				detailTemplate = that.detailTemplate,
				data,
				hasDetails = that._hasDetails();
			button.toggleClass("k-plus", !expanding)
				.toggleClass("k-minus", expanding);
			if (hasDetails && !masterRow.next().hasClass("k-detail-row")) {
				data = that.dataItem(masterRow);
				$(detailTemplate(data))
					.addClass(masterRow.hasClass("k-alt") ? "k-alt" : "")
					.insertAfter(masterRow);
				that.trigger(DETAILINIT, { masterRow: masterRow, detailRow: masterRow.next(), data: data, detailCell: masterRow.next().find(".k-detail-cell") });
			}
			detailRow = masterRow.next();
			that.trigger(expanding ? DETAILEXPAND : DETAILCOLLAPSE, { masterRow: masterRow, detailRow: detailRow });
			detailRow.toggle(expanding);
			if (expanding) {
				ResizingTableLayoutFixedHierarchy.notifyDetailRowExpand(detailRow);
			}
			if (that._current) {
				that._current.attr("aria-expanded", expanding);
			}
			e.preventDefault();
			return false;
		});
	};
	/// <excludetoc />
	var ResizingTableLayoutAuto = derive(Resizing, function (kendoGrid, isRtl) {
		/// <summary>
		/// Internal use only.
		/// Use it to enable resizing only when the grid is scrollable: 'none'.
		/// </summary>
}, {
		attachResizeHandle: function (th) {
},
		detachResizeHandle: function () {
},
		resizeColumn: function (deltaX) {
			/// <summary>
			/// Resizes the column to which the resize handle has been attached prior to calling the method
			/// as well as the next sibling (or the previous in the case of the last column).
			/// The sibling is resized in the opposite direciton to compensate the width.
			/// </summary>
},
		refresh: function () {
},
		dispose: function () {
}
	}, {
		getPreciseWidth: function(element) {
			var computedStyle = window.getComputedStyle(element),
				width = parseFloat(computedStyle.width);
			width += parseFloat(computedStyle.borderLeftWidth);
			width += parseFloat(computedStyle.borderRightWidth);
			width += parseFloat(computedStyle.paddingLeft);
			width += parseFloat(computedStyle.paddingRight);
			return width;
		},
		initializeHeadersParameters: function (kendoGrid) {
			var that = this,
				header, preciseWidth, minWidth,
				headers = kendoGrid.wrapper.find(DOTGRIDHEADERFIRST + DOTKHEADER + COLONVISIBLE);
			// Calculate the initial and min widths of the columns.
			// 1) Get the initial widths as they are.
			// 2) Remove all widths of the columns (set to auto).
			// 3) Set each column width to 1px to get is min width; reset its width to auto.
			// 4) Set the initial widths explicitly.
			// If the above is not done soe,
			// the minWidth of the first (only when all cols have fixed widths)
			// and last column (always) are calculated incorrectly,
			// because the browser cannot resize a col to its minimum width when all other cols
			// have explicit widths already set.
			kendoGrid.wrapper.find('col').each(function (index) {
				header = headers.eq(index);
				preciseWidth = ResizingTableLayoutAuto.getPreciseWidth(header[0]);
				header.data('info', {
					col: this,
					width: preciseWidth
				});
			}).each(function () {
				this.style.width = '';
			}).each(function (index) {
				header = headers.eq(index);
				this.style.width = '1px';
				minWidth = ResizingTableLayoutAuto.getPreciseWidth(header[0]);
				this.style.width = '';
				if (header.data('info').width >= MINHEADERWIDTH) {
					minWidth = Math.max(minWidth, MINHEADERWIDTH);
				}
				header.data('info').minWidth = minWidth;
			}).each(function (index) {
				this.style.width = headers.eq(index).data('info').width + PX;
			});
		}
	});
	namespace("Telerik.UI.Grid", {
		_Resizing: Resizing,
		_ResizingTableLayoutFixed: ResizingTableLayoutFixed,
		_ResizingTableLayoutFixedHierarchy: ResizingTableLayoutFixedHierarchy,
		_ResizingTableLayoutAuto: ResizingTableLayoutAuto
	});
})(this, jQuery);
(function (global, $, undefined) {
	"use strict";
//helper functions
	var indexDetailTables = function (masterTable, dataSource) {
	//first pass - calculate total items for each table view (DFS)
	var queue = [masterTable];
	while (queue.length > 0) {
		var childTable = queue.pop(), childTotal = 0;
		if (childTable._indices && childTable._indices.length) {
			if (!childTable._childCalculated) queue.push(childTable);
			for (var index in childTable._indices) {
				if (childTable._indices[index].open) {
					var detailTable = childTable._indices[index].detailTable;
					if (!childTable._childCalculated) {
						queue.push(detailTable);
					}
					else {
						var detailTableTotal = childTable._indices[index].detailTable._childTotal;
						childTotal += detailTableTotal ? detailTableTotal : 0;
					}
				}
			}
		}
		//count header row
		childTotal++;
			childTable._childTotal = childTotal + (childTable.dataSource ? childTable.dataSource.total : 0);
			//dataSource is the kendo dataSource object so call total() function instead of total field!
			if (childTable === masterTable && !childTable.dataSource && dataSource) childTable._childTotal += dataSource.total();
		childTable._childCalculated = true;
	}
	//dont count header row on master table
	if (masterTable._childTotal) masterTable._childTotal--;
	//second pass - calculate virtual item index for each table view (BFS)
	queue.push(masterTable);
	masterTable._virtualItemStart = 0;
	while (queue.length > 0) {
		var parentTable = queue.shift();
		parentTable._childCalculated = false;
		if (parentTable._indices && parentTable._indices.length) {
			var childStartIndex = 0;
			for (var index = 0, len = parentTable._indices.length; index < len; index++) {
				if (parentTable._indices[index].open) {
					var detailTable = parentTable._indices[index].detailTable;
					detailTable._virtualItemStart = parentTable._virtualItemStart + childStartIndex + parentTable._indices[index].index;
					childStartIndex += detailTable._childTotal;
					queue.push(detailTable);
				}
			}
		}
	}
	queue = null;
	return masterTable._childTotal;
};
//kendo overrides
var math = Math;
kendo.ui.Grid.prototype._averageRowHeight = function () {
	var that = this,
	rowHeight = that._rowHeight;
	if (!that._rowHeight) {
		that._rowHeight = rowHeight = that.table.outerHeight() / that.table[0].rows.length;
	}
	return rowHeight;
};
kendo.ui.VirtualScrollable.prototype._foundParentTableView = null;
kendo.ui.VirtualScrollable.prototype._getParentTableView = function (element) {
	var that = this;
	if (that._foundParentTableView == null) {
		//find parent table view
		var elParent = element.parent();
		while (elParent && elParent.length && !elParent[0].winControl) { elParent = elParent.parent(); }
		if (elParent && elParent.length)
			that._foundParentTableView = elParent[0].winControl;
	}
	return that._foundParentTableView;
};
kendo.ui.VirtualScrollable.prototype._scroll = function (e) {
	var that = this,
		scrollTop = e.currentTarget.scrollTop,
		dataSource = that.dataSource,
		rowHeight = that.itemHeight,
		skip = dataSource.skip() || 0,
		start = that._rangeStart || skip,
		height = that.element.innerHeight(),
		isScrollingUp = !!(that._scrollbarTop && that._scrollbarTop > scrollTop),
		firstItemIndex = math.max(math.floor(scrollTop / rowHeight), 0),
		lastItemIndex = math.max(firstItemIndex + math.floor(height / rowHeight), 0);
	that._scrollTop = scrollTop - (start * rowHeight);
	that._scrollbarTop = scrollTop;
	//Take into account hierarchy
	var itemsToSubtract = 0;
	var winTableView = that._getParentTableView(that.element);
	if (winTableView._indices && winTableView._indices.length) {
		for (var i = 0, len = winTableView._indices.length; i < len; i++) {
			if (winTableView._indices[i].open) {
				var detailTable = winTableView._indices[i].detailTable;
				if (detailTable._virtualItemStart < firstItemIndex) {
					if ((detailTable._virtualItemStart + detailTable._childTotal) >= firstItemIndex) {
						firstItemIndex = detailTable._virtualItemStart;
						break;
					}
					else {
						itemsToSubtract += detailTable._childTotal;
					}
				}
				else {
					break;
				}
			}
		}
		firstItemIndex -= itemsToSubtract;
		lastItemIndex = math.max(firstItemIndex + math.floor(height / rowHeight), 0);
	}
	that._isScrollingUp = isScrollingUp;
	//END MODIFICATION
	if (!that._fetch(firstItemIndex, lastItemIndex, isScrollingUp)) {
		that.wrapper[0].scrollTop = that._scrollTop;
	}
	//Take into account hierarchy
	else if (itemsToSubtract > 0) {
		that.wrapper[0].scrollTop = that._scrollTop + itemsToSubtract * rowHeight;
	}
	//END MODIFICATION
};
kendo.ui.VirtualScrollable.prototype._oldWrap = kendo.ui.VirtualScrollable.prototype.wrap;
kendo.ui.VirtualScrollable.prototype._newScrollbar = function () {
	var that = this;
	if (!that._newScrollbarWidth) {
		//same as kendo.support.scrollbar() but with added style -ms-overflow-style:scrollbar;
		var div = document.createElement("div");
		div.style.cssText = "-ms-overflow-style:scrollbar;overflow:scroll;overflow-x:hidden;zoom:1;clear:both";
		div.innerHTML = "&nbsp;";
		document.body.appendChild(div);
		that._newScrollbarWidth = div.offsetWidth - div.scrollWidth;
		document.body.removeChild(div);
	}
	return that._newScrollbarWidth;
};
kendo.ui.VirtualScrollable.prototype.wrap = function () {
	var that = this,
		scrollbarwidth = that._newScrollbar() + 1;
	that._oldWrap();
	that.verticalScrollbar.css("width", scrollbarwidth + "px")
};
kendo.ui.VirtualScrollable.prototype.refresh = function () {
	var that = this,
		html = "",
		maxHeight = 250000,
		dataSource = that.dataSource,
		rangeStart = that._rangeStart,
		scrollbar = kendo.support.scrollbar(),
		wrapperElement = that.wrapper[0],
		totalHeight,
		idx,
		itemHeight;
	kendo.ui.progress(that.wrapper.parent(), false);
	clearTimeout(that._timeout);
	itemHeight = that.itemHeight = that.options.itemHeight() || 0;
	var addScrollBarHeight = (wrapperElement.scrollWidth > wrapperElement.offsetWidth) ? scrollbar : 0;
	//Take into account Hierarchy
		var winTableView = that._getParentTableView(that.element);
		//pass the dataSource here in case the TableView doesn't have one yet.
		var total = indexDetailTables(winTableView, dataSource);
	totalHeight = total * itemHeight + addScrollBarHeight;
	//END MODIFICATION
	for (idx = 0; idx < math.floor(totalHeight / maxHeight) ; idx++) {
		html += '<div style="width:1px;height:' + maxHeight + 'px"></div>';
	}
	if (totalHeight % maxHeight) {
		html += '<div style="width:1px;height:' + (totalHeight % maxHeight) + 'px"></div>';
	}
	that.verticalScrollbar.html(html);
	//make sure element is still in the DOM as this method runs async
	if (wrapperElement.parentNode) wrapperElement.scrollTop = that._scrollTop;
	if (that.drag) {
		that.drag.cancel();
	}
	if (rangeStart && !that._fetching) { // we are rebound from outside local range should be reset
		that._rangeStart = dataSource.skip();
	}
	that._fetching = false;
};
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var define = WinJS.Class.define,
		derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		nsName = "Telerik.UI.Grid",
		NS = namespace(nsName),
		utilities = WinJS.Utilities,
		util = Telerik.Utilities,
		setOptions = WinJS.UI.setOptions,
		root = document.documentElement,
		pevent = Telerik.Utilities._pointerEvent,
		NOOP = function () { },
		POINTERDOWN = pevent("down"),
		POINTERMOVE = pevent("move"),
		POINTERUP = pevent("up"),
		POINTERCANCEL = pevent("cancel"),
		css = {
			selected: "k-state-selected",
			expand: "t-expand",
			active: "t-active",
			northWest: "t-nw"
		};
	var SelectionRange = function (options) {
		setOptions(this, options);
	}
	SelectionRange.prototype = {
		items: null,
		isCell: false,
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		dispose: function () {
			this.items = null;
		}
	}
	//create a selection range only if the selected items form a regular rectangle for range selection
	SelectionRange.create = function (selected, isCell) {
		var left, top, right, bottom;
		if (!selected.length) {
			return null;
		}
		if (isCell) {
			left = selected[0].cellIndex;
			top = selected[0].parentNode.rowIndex;
			right = selected[selected.length - 1].cellIndex;
			bottom = selected[selected.length - 1].parentNode.rowIndex;
			//ensure no "gaps" in the selection, i.e. all cells inside the bounding rectangle are selected
			if (selected.length !== (right - left + 1) * (bottom - top + 1)) {
				return null;
			}
			//ensure no outstanding cell beyond the rectangle marked by the first and last cell position
			for (var i = 0, len = selected.length; i < len; i++) {
				var cell = selected[i],
					x = cell.cellIndex,
					y = cell.parentNode.rowIndex;
				if (x < left || x > right || y < top || y > bottom) {
					return null;
				}
			}
		}
		else {
			left = 0;
			top = selected[0].rowIndex;
			right = 0;
			bottom = selected[selected.length - 1].rowIndex;
			//check consecutive row indexes when row selection is used
			if (top + selected.length - 1 !== bottom) {
				return null;
			}
		}
		return new SelectionRange({
			items: selected,
			isCell: isCell,
			left: left,
			top: top,
			width: right - left + 1,
			height: bottom - top + 1
		});
	}
	namespace(nsName, {
		/// <excludetoc />
		SelectionExpander: define(function (range) {
}, {
			//override this function to get notified on range change
			onchange: NOOP,
			//override these empty methods in derived classes
			dispose: function () {
}
		})
	});
	namespace(nsName, {
		/// <excludetoc />
		RowSelectionExpander: derive(NS.SelectionExpander, function (range) {
			/// <summary>
			/// Internal use only.
			/// </summary>
}, {
			}),
		/// <excludetoc />
		CellSelectionExpander: derive(NS.SelectionExpander, function (original) {
			/// <summary>
			/// Internal use only.
			/// </summary>
}, {
			})
	});
	namespace(nsName, {
		/// <excludetoc />
		Selection: define(function (owner) {
			/// <summary>
			/// Internal use only.
			/// </summary>
}, {
			owner: null,
			//supports range selection only if the table does not have grouping, hierarchy and is not a detail table itself
			dispose: function () {
}
		})
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, undefined) {
	'use strict';
	var namespace = WinJS.Namespace.define;
	namespace('Telerik.UI.DateTimePickers', {
		/// <enum />
		StepMode: {
			/// <field type="String">
			/// This is the default mode of the step functionality. 
			/// The first (base) value is the first from the available range and each subsequent one
			/// is the previous value + the value of the step property.
			/// </field>
			startFromBase: 'startFromBase',
			/// <field type="String">
			/// In this mode only the multiples of the specified step are rendered.
			/// </field>
			multiplesOnly: 'multiplesOnly',
			/// <field type="String">
			/// In this mode the first (base) value and all multiples of the specified step are rendered.
			/// </field>
			baseAndMultiples: 'baseAndMultiples'
		}
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	'use strict';
		// WinJS refs
	var win = WinJS,
        define = win.Class.define,
        namespace = win.Namespace.define,
		utilities = win.Utilities;
	var _LoopingListItem = define(function (element) {
}, {
		element: null,
		value: {get:function(){}, set:function(value){}},
		enabled: {get:function(){}, set:function(value){}},
		selected: {get:function(){}, set:function(value){}}
	});
	namespace('Telerik.UI', {
		_LoopingListItem: _LoopingListItem
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        define = win.Class.define,
        namespace = win.Namespace.define,
		StepMode = Telerik.UI.DateTimePickers.StepMode,
		// Constants
		NULL = null;
	namespace("Telerik.UI", {
		_Range: define(function (options) {
}, {
			start: {get:function(){}},
			end: {get:function(){}, set:function(value){}},
			length: {get:function(){}},
			value: function (index) {
},
			index: function (value) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_Range = ui._Range;
	namespace("Telerik.UI", {
		_LoopingRange: derive(_Range, function (options) {
}, {
			rangeFrom: function (value) {
},
			range: function () {
},
			prev: function () {
},
			next: function () {
},
			centerValue: {get:function(){}},
			centerAt: function (value) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
	// WinJS refs
	var win = WinJS,
        define = win.Class.define,
        namespace = win.Namespace.define;
	namespace("Telerik.UI", {
		_LoopingQueue: define(function (array) {
}, {
			array: {get:function(){}},
			add: function (item) {
},
			shiftLeft: function () {
},
			shiftRight: function () {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict"
	var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        animation = win.UI.Animation,
        ui = Telerik.UI,
		pevent = Telerik.Utilities._pointerEvent,
		_LoopingListItem = ui._LoopingListItem,
		_LoopingRange = ui._LoopingRange,
		_LoopingQueue = ui._LoopingQueue,
		NULL = null,
        ITEMCOUNT = 3,
        ITEMLENGTH = 70,
        ITEMSPACING = 10,
        PX = "px",
        TLOOPINGLIST = "t-looping-list",
        TSELECTED = "t-selected",
		TFOCUSED = "t-focused",
        TRUE = true,
        FALSE = false;
	var _LoopingList = derive(ui.Control, function (element, options) {
}, {
		/// <field type="HTMLElement" domElement="TRUE" hidden="TRUE">
		/// Gets the DOM element that hosts this control.
		/// </field>
		element: NULL,
		itemCount: {get:function(){}, set:function(value){}},
		itemLength: {get:function(){}, set:function(value){}},
		itemSpacing: {get:function(){}, set:function(value){}},
		value: {get:function(){}, set:function(value){}},
		minValue: {get:function(){}, set:function(value){}},
		maxValue: {get:function(){}, set:function(value){}},
		maxHeight: {get:function(){}, set:function(value){}},
		itemBound: {set:function(value){}},
		moveSelectionUp: function () {
},
		moveSelectionDown: function () {
},
		showOutline: function () {
},
		hideOutline: function () {
},
		bind: function (loopingRange) {
},
		showSelectionItems: function () {
},
		hideSelectionItems: function () {
},
		focus: function () {
},
		blur: function () {
},
		createItem: function (element) {
},
		refresh: function () {
},
		// Gesture handling methods
		});	
	mix(_LoopingList, win.Utilities.eventMixin);
	namespace("Telerik.UI", {
		_LoopingList: _LoopingList
	});
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_LoopingList = ui._LoopingList,
		// Constants
		NULL = null,
		TRUE = true;
	namespace("Telerik.UI", {
		_SlidingList: derive(_LoopingList, function (element, options) {
}, {
			moveSelectionUp: function () {
},
			moveSelectionDown: function () {
},
			refresh: function () {
},
			bind: function (loopingRange) {
},
			})
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datetimepickers/lists/base/loopinglist/loopinglistitem.js" />
(function (global, undefined) {
	'use strict';
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
		// Imports
		_LoopingListItem = Telerik.UI._LoopingListItem;
	namespace('Telerik.UI', {
		_DateListItem: derive(_LoopingListItem, function (element) {
}, {
			label: {get:function(){}, set:function(value){}},
			})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		calendar = Windows.Globalization.Calendar,
		// Imports
		_LoopingList = ui._LoopingList;
	namespace("Telerik.UI", {
		_YearList: derive(_LoopingList, function (element, options) {
}, {
			createItem: function (element) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_LoopingList = ui._LoopingList;
	namespace("Telerik.UI", {
		_MonthList: derive(_LoopingList, function (element, options) {
}, {
			createItem: function (element) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_LoopingList = ui._LoopingList;
	namespace("Telerik.UI", {
		_DayList: derive(_LoopingList, function (element, options) {
}, {
			createItem: function (element) {
},
			updateRangeEnd: function (date) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/datetimepickers/lists/base/loopinglist/loopinglistitem.js" />
(function (global, undefined) {
	'use strict';
	// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
		// Imports
		_LoopingListItem = Telerik.UI._LoopingListItem;
	namespace('Telerik.UI', {
		_TimeListItem: derive(_LoopingListItem, function (element) {
}, {
			})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
	// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_LoopingList = ui._LoopingList,
		TWELVE = 12,
		NULL = null;
	namespace("Telerik.UI", {
		_HourList: derive(_LoopingList, function (element, options) {
}, {
			createItem: function (element) {
}
		}, {
			getHourInPeriod: function (date, twentyFourHour) {
				var shortTime = twentyFourHour ? 0 : 12,
					lastHour = shortTime ? TWELVE : 23,
					hour = date.getHours(),
					hourLastHourDelta = hour - lastHour;
				if (!hour) {
					return shortTime;
				}
				return hourLastHourDelta > 0 ? hourLastHourDelta : hour;
			}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_LoopingList = ui._LoopingList;
	namespace("Telerik.UI", {
		_MinuteList: derive(_LoopingList, function (element, options) {
}, {
			createItem: function (element) {
}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_SlidingList = ui._SlidingList;
	namespace("Telerik.UI", {
		_PeriodList: derive(_SlidingList, function (element, options) {
}, {
			createItem: function (element) {
}
		}, {
			_getPeriodIndexFromHour: function (date, twentyFourHour) {
				var lastHour = twentyFourHour ? 23 : 12,
					hour = date.getHours(),
					hourLastHourDelta = hour - lastHour;
				return hourLastHourDelta >= 0 ? 2 : 1;
			},
			_getPeriodIndexFromString: function (periodList, periodString) {
				if (periodString == periodList._AM) {
					return 1;
				}
				if (periodString == periodList._PM) {
					return 2;
				}
				return null;
			}
		})
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, undefined) {
	"use strict";
	WinJS.Namespace.define("Telerik.UI", {
		_DisplayMode: {
			/// <field type="String">
			/// This is the default mode of the control. Both the picker and selector parts of the control
			/// are available. Selection changes when the 'OK' button in the selector is pressed.
			/// </field>
			standard: 'standard',
			/// <field type="String">
			/// In this mode the picker part of the control is not available. The selector renders
			/// inline in the document and is always open. Once the selected value of any of the lists
			/// changes, the control.value property is immediately updated.
			/// </field>
			inline: 'inline'
		}
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_DisplayMode = ui._DisplayMode;
	namespace("Telerik.UI", {
		_Utility: {
			removeRtlMarks: function (string) {
				var sanitizedString = [],
					i, c;
				for (i = 0; i < string.length; i++) {
					c = string.charAt(i);
					if (c != "\u200E" && c != "\u200F") {
						sanitizedString.push(c);
					}
				}
				return sanitizedString.join("");
			},
			tryParseObject: function (value) {
				if (typeof value == 'string') {
					var trimmed = value.trim();
					if (trimmed[0] == "{" && trimmed[trimmed.length - 1] == "}")
						return JSON.parse(trimmed);
				}
				return value;
			},
			isInline: function (control) {
				return control.displayMode == _DisplayMode.inline;
			}
		}
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        define = win.Class.define,
        namespace = win.Namespace.define,
		// Constants
		TPRESS = "t-press",
        TOUTLINE = "t-outline",
		NULL = null;
	var _SelectorButton = define(function (element, value) {
}, {
		element: NULL,
		value: {get:function(){}},
		focus: function () {
},
		blur: function () {
},
		focused: function () {
},
		press: function () {
},
		release: function () {
}
	});
	namespace("Telerik.UI", {
		_SelectorButton: _SelectorButton
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        define = win.Class.define,
        namespace = win.Namespace.define;
	var _SelectorControlList = define(function (lists, buttons, isRtl) {
}, {
		focusNextList: function () {
},
		focusPreviousList: function () {
},
		focusNext: function () {
},
		focusPrevious: function () {
},
		pressButton: function () {
},
		releaseButton: function () {
},
		moveListSelectionDown: function () {
},
		moveListSelectionUp: function () {
},
		focusList: function (list) {
},
		blur: function () {
},
		hasFocusedControl: function () {
},
		isFirstControlFocused: function () {
},
		isLastControlFocused: function () {
},
		getFocusedList: function () {
}
	});
	namespace("Telerik.UI", {
		_SelectorControlList: _SelectorControlList
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        animation = win.UI.Animation,
        ui = Telerik.UI,
        util = Telerik.Utilities,
		priv = util.setPrivate,
		cul = Telerik.Culture,
		pevent = util._pointerEvent,
		// Imports
		_SelectorButton = ui._SelectorButton,
		_SelectorControlList = ui._SelectorControlList,
		_DisplayMode = ui._DisplayMode,
		_Utility = ui._Utility,
		// Constants
		ITEMSPACING = 10,
		ITEMLENGTH = 70,
		ITEMCOUNT = 3,
		THEADER = "t-header",
        TBODY = "t-body",
        TFOOTER = "t-footer",
        TCOL = "t-col",
        TBUTTON = "t-button",
        TOK = "t-ok",
        TCANCEL = "t-cancel",
        OK = "OK",
        OPEN = "open",
        CLOSE = "close",
		NULL = null,
		TRUE = true,
		FALSE = false,
		VISIBLE = 'visible',
		HIDDEN = 'hidden',
		BLOCK = 'block',
		NONE = 'none',
		FUNCTION = 'function',
		PX = 'px';
	namespace("Telerik.UI", {
		_DateTimeSelector: derive(ui.Control, function (element, options) {
}, {
			culture: {get:function(){}, set:function(value){}},
			itemCount: {get:function(){}, set:function(value){}},
			itemSpacing: {get:function(){}, set:function(value){}},
			itemLength: {get:function(){}, set:function(value){}},
			format: {get:function(){}, set:function(value){}},
			value: {get:function(){}, set:function(value){}},
			minValue: {get:function(){}, set:function(value){}},
			maxValue: {get:function(){}, set:function(value){}},
			isOpen: {get:function(){}},
			headerContent: {get:function(){}, set:function(value){}},
			headerTemplate: {get:function(){}, set:function(value){}},
			itemTemplate: {get:function(){}, set:function(value){}},
			displayMode: {get:function(){}, set:function(value){}},
			step: {get:function(){}, set:function(value){}},
			open: function () {
},
			close: function (keepFocus) {
},
			repaint: function () {
}
			})
	});
	mix(Telerik.UI._DateTimeSelector, win.Utilities.eventMixin,
        win.Utilities.createEventProperties(OK, OPEN, CLOSE));
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	'use strict';
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		cul = Telerik.Culture,
		// Imports
		_Utility = ui._Utility,
		_DateTimeSelector = ui._DateTimeSelector,
		_YearList = ui._YearList,
		_MonthList = ui._MonthList,
		_DayList = ui._DayList,
		// Constants
        TDATESELECTOR = 't-date-selector',
        Y = 'y',
		M = 'm',
		D = 'd',
        OK_LOWERCASE = "ok",
		ONE = 1,
		NULL = null;
	var _DateSelector = derive(_DateTimeSelector, function (element, options) {
}, {
		});
	namespace('Telerik.UI', {
		_DateSelector: _DateSelector
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	'use strict';
		// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_Utility = ui._Utility,
		_DateTimeSelector = ui._DateTimeSelector,
		_HourList = ui._HourList,
		_MinuteList = ui._MinuteList,
		_PeriodList = ui._PeriodList,
		// Constants
        TTIMESELECTOR = 't-time-selector',
        H = 'h',
		M = 'm',
		T = 't',
        OK_LOWERCASE = 'ok',
		NULL = null;
	var _TimeSelector = derive(_DateTimeSelector, function (element, options) {
}, {
		});
	namespace('Telerik.UI', {
		_TimeSelector: _TimeSelector
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	var namespace = WinJS.Namespace.define,
		derive = WinJS.Class.derive,
		ui = Telerik.UI,
		config = ui._Configuration,
		stepMode = ui.DateTimePickers.StepMode;
	function defineConfigurationProperty(key) {
		return {
			get: function () {
				var that = this;
				if (!that['_' + key]) {
					that['_' + key] = new StepComponentConfiguration({
						onchange: that.onchange
					});
				}
				return that['_' + key];
			},
			set: function (value) {
				var that = this;
				if (Telerik.Utilities.getType(value) === "object") {
					value.onchange = that.onchange;
					that['_' + key] = new StepComponentConfiguration(value);
					that.onchange();
				}
			}
		};
	}
	var StepComponentConfiguration = derive(config, function (options) {
		/// <summary>
		/// For internal usage only. Describes the style properties of a menu item.
		/// </summary>
}, {
		/// <excludetoc />
		onchange: {set:function(value){}},
		/// <field type="Number" defaultValue="1">
		/// Gets or sets an step value of the list.
		/// </field>
		value: config.defineProperty('value', 1, null),
		/// <field type="Telerik.UI.DateTimePickers.StepMode" defaultValue="startFromBase">
		/// Gets or sets the logic under which the step value is applied to the list.
		/// </field>
		mode: config.defineProperty('mode', stepMode.startFromBase, null)
	});
	var StepConfiguration = derive(config, function (options) {
		/// <summary>
		/// For internal usage only. Describes the style properties of a menu item.
		/// </summary>
}, {
		/// <excludetoc />
		onchange: function () {
},
		/// <field type="Telerik.UI.DateTimePickers._StepComponentConfiguration">
		/// Gets or sets the configuration object for the year list.
		/// </field>
		year: defineConfigurationProperty('year'),
		/// <field type="Telerik.UI.DateTimePickers._StepComponentConfiguration">
		/// Gets or sets the configuration object for the month list.
		/// </field>
		month: defineConfigurationProperty('month'),
		/// <field type="Telerik.UI.DateTimePickers._StepComponentConfiguration">
		/// Gets or sets the configuration object for the day list.
		/// </field>
		day: defineConfigurationProperty('day'),
	});
	namespace('Telerik.UI.DateTimePickers', {
		_StepComponentConfiguration: StepConfiguration,
		_StepConfiguration: StepConfiguration
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		cul = Telerik.Culture,
		pevent = util._pointerEvent,
		_DisplayMode = ui._DisplayMode,
		_Utility = ui._Utility,
		_DateTimeSelector = ui._DateTimeSelector,
		OBJECT = "object",
		FUNCTION = "function",
		DIV = "DIV",
		PX = "px",
		TPICKER = "t-picker",
		TPRESS = "t-press",
		TINPUT = "t-input",
		TARROW = "t-arrow",
		TDISABLED = "t-disabled",
		TEMPTY = "t-empty",
		TFOCUSED = "t-focused",
		OK_LOWERCASE = "ok",
		OPEN = "open",
		CLOSE = "close",
		EMPTYSTRING = "",
		CHANGE = "change",
		MSPOINTERDOWN = pevent("down"),
		NULL = null,
		TRUE = true,
		FALSE = false,
		ITEMCOUNT = 3,
		ITEMLENGTH = 70,
		ITEMSPACING = 10;
	var _DateTimePicker = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Creates a new RadDatePicker/RadTimePicker control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		 // Change to -1 when (if??) IE10's bug is fixed: tabIndex: -1 cannot be focused with focus().
	    /// <field type="Date">
	    /// Gets or sets the value of the picker. (Only the date/time part of the Date object
	    /// will be applied.) It can be null/undefined (not set).
	    /// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field type="String" readonly="true">
		/// Gets the string representation of the current value. 
		/// The string representation is the current value formatted 
		/// according to the settings of the device and the control.
		/// </field>
		valueString: {get:function(){}},
		/// <field type="Date">
		/// Gets or sets the minimum value of the value range for the control.
		/// (Only the date/time part of the Date object will be applied.)
		/// </field>
		minValue: {get:function(){}, set:function(value){}},
		/// <field type="Date">
		/// Gets or sets the maximum value of the value range for the control.
		/// (Only the date/time part of the Date object will be applied.)
		/// </field>
		maxValue: {get:function(){}, set:function(value){}},
		/// <field type="Number" Integer="true">
		/// Gets or sets the number of items visible within the selector part of the control.
		/// This property is used to determine the height of the selector part when opened. 
		/// The calculated height will not exceed the height of the view port.
		/// Pass non-positive value to stretch the selector vertically.
		/// Default value is 3.
		/// </field>
		itemCount: {get:function(){}, set:function(value){}},
		/// <field type="Number" Integer="true">
		/// Gets or sets the length (width and height; in pixels) of the items that appear in the selector part of the control.
		/// Default value is 70.
		/// </field>
		itemLength: {get:function(){}, set:function(value){}},
		/// <field type="Number" Integer="true">
		/// Gets or sets the spacing (in pixels) between the items that appear in the selector part of the control.
		/// This propery also determines the spacing between the different 
		/// parts of the selector, e.g. lists, buttons, header.
		/// Default value is 10.
		/// </field>
		itemSpacing: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the selector format. This value defines how the different selector components will be ordered. 
		/// By setting this property, you can also define which editable parts of the selector will be visible. 
		/// For example 'y/m' will display the Year and Month components in a DatePicker.
		/// Valid values are:
		/// * h - hour, m - minute, t - period [AM/PM] if applicable for a TimePicker;
		/// * y - year, m - month, d - day for a DatePicker;
		/// </field>
		selectorFormat: {get:function(){}, set:function(value){}},
		/// <field type="Date">
		/// Gets or sets the value that represents the default value displayed in the selector part. 
		/// The default value is shown when the value property is not set (null/undefined).
		/// If no default value is specified, the current date/time on the system is displayed when the selector opens.
		/// </field>
		selectorDefaultValue: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value determining whether the selector part of the control is open.
		/// </field>
		isSelectorOpen: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value determining whether the control is in read only mode. 
		/// If set to true, the control does not allow the user to modify its value.
		/// </field>
		isReadOnly: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a string representing the value format for the control. 
		/// The value format determines how the edited value is displayed on the screen after it has been selected. 
		/// If not set, the format from the current system clock configuration is used.
		/// </field>
		displayValueFormat: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether the control will automatically calculate its picker width,
		/// so that it equals the width of the selector part.
		/// </field>
		autoSizeWidth: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether the data/time selector will be closed automatically on blur.
		/// Default value is true.
		/// </field>
		closeSelectorOnBlur: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether the control is enabled (default).
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining how the items in all lists in the selector will be rendered.
		/// With this propery the default template can be overridden.
		/// Internally all items are bound to a data object having two fields: 'value' and 'label'.
		/// These correspond to the number of year, month, hour, etc. and to the name of the
		/// month, day and whether the year is leap respectively. In order to utilize either or both of the
		/// data object properties the template should have mappings to them, e.g.
		/// <div>#= value #</div>'#= label #'
		/// </field>
		itemTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets or sets the header displayed in the selector.
		/// By default the 'Select Date' text is shown.
		/// This property value can be either a string or a data object.
		/// If the value is an object, the selectorHeaderTemplate property must also be set
		/// to specify which properties of the object will be rendered.
		/// </field>
		selectorHeader: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining how the selectorHeader property value will be rendered.
		/// If the selectorHeader property is of a primitive type, this property should not be set - 
		/// the value will render as text.
		/// If the selectorHeader is an object the template should specify mappings in the form #= objectPropertyName #.
		/// Example:
		/// <div class="selector-header">#= value #</div>
		/// provided that the selectorHeader property is set to { value: 'Header Text' }.
		/// </field>
		selectorHeaderTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets or sets the object that represents the header content.
		/// This property value can be either a string or a data object.
		/// If the value is an object, the headerTemplate property must also be set
		/// to specify which properties of the object will be rendered.
		/// </field>
		header: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining how the header property value will be rendered.
		/// If the header property is of a primitive type, this property should not be set - 
		/// the value will render as text.
		/// If the header is an object the template should specify mappings in the form #= objectPropertyName #.
		/// Example:
		/// <div class="header">#= value #</div>
		/// provided that the header property is set to { value: 'Header Text' }.
		/// </field>
		headerTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets or sets the empty content of the picker part of the control. 
		/// The empty content is displayed when there is no value defined.
		/// This property value can be either a string or a data object.
		/// If the value is an object, the headerTemplate property must also be set
		/// to specify which properties of the object will be rendered.
		/// </field>
		emptyContent: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining how the emptyContent property value will be rendered.
		/// If the emptyContent property is of a primitive type, this property should not be set - 
		/// the value will render as text.
		/// If the emptyContent is an object the template should specify mappins in the form #= objectPropertyName #.
		/// Example:
		/// <div class="empty-content">#= value #</div>
		/// provided that the emptyContent property is set to { value: 'Empty' }.
		/// </field>
		emptyContentTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Number" Integer="true">
		/// Gets or sets the tab index of the control.
		/// The default value is -1.
		/// </field>
		tabIndex: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Specifies the rendering and functioning mode of the control.
		/// Accepts values from the enums RadDatePicker.DisplayMode and RadTimePicker.DisplayMode.
		/// (Both enums are one and the same - they are available in both places for convenience.
		/// Default value is DisplayMode.standard.
		/// </field>
		displayMode: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// BCP-47 language tag with language and region. For example: en-US, fr-FR, ar-KW
		/// </field>
		culture: {get:function(){}, set:function(value){}},
		//the kendo binding model does not trigger change event of inputs, so we another way to monitor value change
		});
	mix(_DateTimePicker, win.Utilities.eventMixin,
			win.Utilities.createEventProperties(CHANGE, OPEN, CLOSE));
	namespace("Telerik.UI", {
		_DateTimePicker: _DateTimePicker
	});
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	'use strict';
	// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_DateTimePicker = ui._DateTimePicker,
		_DateSelector = ui._DateSelector,
		_DisplayMode = ui._DisplayMode,
		// Constants
        TDATEPICKER = 't-date-picker';
		/// <summary>
		/// Allows the selection of a date value from maximum three different components:
		/// year/month/day via intuitive and easy to use vertical looping lists that show in a popup.
		/// </summary>
		/// <icon src="datepicker_html_12.png" width="12" height="12" />
		/// <icon src="datepicker_html_16.png" width="16" height="16" />
		/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadDatePicker"></span>]]></htmlSnippet>
		/// <event name="open">Fires after the selector popup opens.</event>
		/// <event name="close">Fires after the selecotr popup closes.</event>
		/// <event name="change">Fires when the date is changed via the selector.</event>
		/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
		/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
		/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
		/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadDatePicker = derive(_DateTimePicker, function (element, options) {
		/// <summary>
		/// Create a new RadDatePicker control that allows selection of a date using year/month/day pickers.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.UI.DateTimePickers._StepConfiguration">
		/// Gets or sets an object with the step values of the year, month and day lists of the control.
		/// </field>
		step: {get:function(){}, set:function(value){}},
		}, {
		/// <field type="String" static="true">
		/// Specifies the rendering and functioning mode of RadDatePicker.
		/// Same as RadTimePicker.DisplayMode.
		/// </field>
		DisplayMode: _DisplayMode
	});
	namespace('Telerik.UI', {
		RadDatePicker: RadDatePicker
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
	'use strict';
	// WinJS refs
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
		// Imports
		_DateTimePicker = ui._DateTimePicker,
		_TimeSelector = ui._TimeSelector,
		_DisplayMode = ui._DisplayMode,
		// Constants
        TTIMEPICKER = 't-time-picker',
		NULL = null;
		/// <summary>
		/// Allows the selection of a time value from maximum three different components:
		/// hour/minute/perio via intuitive and easy to use vertical looping lists that show in a popup.
		/// </summary>
		/// <icon src="timepicker_html_12.png" width="12" height="12" />
		/// <icon src="timepicker_html_16.png" width="16" height="16" />
		/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadTimePicker"></span>]]></htmlSnippet>
		/// <event name="open">Fires after the selector popup opens.</event>
		/// <event name="close">Fires after the selecotr popup closes.</event>
		/// <event name="change">Fires when the time is changed via the selector.</event>
		/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
		/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
		/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
		/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadTimePicker = derive(_DateTimePicker, function (element, options) {
		/// <summary>
		/// Create a new RadTimePicker control that allows selection of a time using hour/minute/period pickers.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element that hosts this control.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Date">
		/// Gets or sets the Date object, which date components (year, month, day)
		/// will be used as base for the Date object returned by the value property.
		/// Default value is null; in this case the value property returns a Date object
		/// with date components equal to today's.
		/// </field>
		baseDate: {get:function(){}, set:function(value){}},
		/// <field type="Number" defaultValue="1">
		/// Gets or sets the step value of the minute list of the control.
		/// </field>
		minuteStep: {get:function(){}, set:function(value){}},
		}, {
		/// <field type="String" static="true">
		/// Specifies the rendering and functioning mode of RadTimePicker.
		/// Same as RadDatePicker.DisplayMode.
		/// </field>
		DisplayMode: _DisplayMode
	});
	namespace('Telerik.UI', {
		RadTimePicker: RadTimePicker
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	'use strict'
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		controlConfig = Telerik.UI._ControlConfiguration;
	var _MonthConfiguration = derive(controlConfig, function (owner, parentMapping, defaults, onchange) {
		/// <summary>
		/// For internal usage only. Describes the properties of the Calendar month object.
		/// </summary>
}, {
		/// <field type="String" defaultValue="">
		/// Template to be used for rendering the cells in the 'month' view, which are in range.
		/// Default value is "".
		/// </field>
		template: controlConfig.defineProperty('template', ''),
		/// <field type="String"  defaultValue="">
		/// Template to be used for rendering the cells in the 'month' view, which are not in the min/max range.
		/// Default value is "".
		/// </field>
		disabledTemplate: controlConfig.defineProperty('disabledTemplate', '')
	});
	var _FooterConfiguration = derive(controlConfig, function (owner, parentMapping, defaults, onchange) {
		/// <summary>
		/// For internal usage only. Describes the properties of the Calendar footer object.
		/// </summary>
}, {
		/// <field type="String" defaultValue="">
		/// Template to be used for rendering the footer.
		/// Default value is "".
		/// </field>
		template: controlConfig.defineProperty('template', function () {
			var owner = this._owner,
				widget = owner ? owner._widget : null,
				footer = widget ? widget.options.footer : '';
			if (typeof footer == 'string') {
				return footer;
			}
			else if (typeof footer == 'boolean') {
				return '';
			}
			return '';
		}),
		/// <field type="Boolean" defaultValue="true">
		/// If false, the footer will not be rendered.
		/// Default value is true.
		/// </field>
		enabled: controlConfig.defineProperty('enabled', function () {
			var owner = this._owner,
				widget = owner ? owner._widget : null,
				value = widget ? widget.options.footer : true;
			if (typeof value == 'string') {
				value = true;
			}
			return value;
		})
	});
	namespace('Telerik.UI.Calendar', {
		_MonthConfiguration: _MonthConfiguration,
		_FooterConfiguration: _FooterConfiguration
	});
})(this, jQuery);/// <reference path="/kendo/js/kendo.winjs.js" />
(function () {
	var DATE = Date,
		template = kendo.template,
		getCulture = kendo.getCulture,
		views = kendo.calendar.viewsEnum,
		cellTemplate = template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link" href="\\#" data-#=data.ns#value="#=data.dateString#">#=data.value#</a></td>', { useWithBlock: false }),
        emptyCellTemplate = template('<td role="gridcell">&nbsp;</td>', { useWithBlock: false }),
        OTHERMONTH = "k-other-month",
        OTHERMONTHCLASS = ' class="' + OTHERMONTH + '"';
	function getCalendarInfo(culture) {
		return getCulture(culture).calendars.standard;
	}
	function isInRange(date, min, max) {
		return +date >= +min && +date <= +max;
	}
	function view(options) {
		var idx = 0,
            data,
            min = options.min,
            max = options.max,
            start = options.start,
            setter = options.setter,
            build = options.build,
            length = options.cells || 12,
            cellsPerRow = options.perRow || 4,
            content = options.content || cellTemplate,
            empty = options.empty || emptyCellTemplate,
            html = options.html || '<table tabindex="0" role="grid" class="k-content k-meta-view" cellspacing="0"><tbody><tr role="row">';
		for (; idx < length; idx++) {
			if (idx > 0 && idx % cellsPerRow === 0) {
				html += '</tr><tr role="row">';
			}
			data = build(start, idx);
			html += isInRange(start, min, max) ? content(data) : empty(data);
			setter(start, 1);
		}
		return html + "</tr></tbody></table>";
	}
	kendo.calendar.views[views.year].content = function (options) {
		var namesAbbr = getCalendarInfo(options.culture).months.namesAbbr,
			toDateString = this.toDateString,
			min = options.min,
			max = options.max;
		return view({
			perRow: 2,
			min: new DATE(min.getFullYear(), min.getMonth(), 1),
			max: new DATE(max.getFullYear(), max.getMonth(), 1),
			start: new DATE(options.date.getFullYear(), 0, 1),
			setter: this.setDate,
			build: function (date) {
				return {
					value: namesAbbr[date.getMonth()],
					ns: kendo.ns,
					dateString: toDateString(date),
					cssClass: ""
				};
			}
		});
	};
	kendo.calendar.views[views.decade].content = function (options) {
		var year = options.date.getFullYear(),
			toDateString = this.toDateString;
		return view({
			perRow: 2,
			start: new DATE(year - year % 10 - 1, 0, 1),
			min: new DATE(options.min.getFullYear(), 0, 1),
			max: new DATE(options.max.getFullYear(), 0, 1),
			setter: this.setDate,
			build: function (date, idx) {
				return {
					value: date.getFullYear(),
					ns: kendo.ns,
					dateString: toDateString(date),
					cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ""
				};
			}
		});
	};
	kendo.calendar.views[views.century].content = function (options) {
		var year = options.date.getFullYear(),
			min = options.min.getFullYear(),
			max = options.max.getFullYear(),
			toDateString = this.toDateString,
			minYear = min,
			maxYear = max;
		minYear = minYear - minYear % 10;
		maxYear = maxYear - maxYear % 10;
		if (maxYear - minYear < 10) {
			maxYear = minYear + 9;
		}
		return view({
			perRow: 2,
			start: new DATE(year - year % 100 - 10, 0, 1),
			min: new DATE(minYear, 0, 1),
			max: new DATE(maxYear, 0, 1),
			setter: this.setDate,
			build: function (date, idx) {
				var start = date.getFullYear(),
					end = start + 9;
				if (start < min) {
					start = min;
				}
				if (end > max) {
					end = max;
				}
				return {
					ns: kendo.ns,
					value: start + " - " + end,
					dateString: toDateString(date),
					cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ""
				};
			}
		});
	};
})();(function (global, $, undefined) {
	'use strict'
	var NULL = null;
	WinJS.Namespace.define('Telerik.UI.Calendar', {
		DateRange: WinJS.Class.define(function (start, end) {
			var that = this;
			that._start = start;
			that._end = end;
		}, {
			_start: NULL,
			_end: NULL,
			start: {
				get: function () {
					return this._start;
				}
			},
			end: {
				get: function () {
					return this._end;
				}
			}
		})
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	var unselect = function (cell) {
		$(cell).removeClass('k-state-selected');
	};
	var select = function (cell) {
		$(cell).addClass('k-state-selected');
	};
	var getDateValueFromCell = function (cell) {
		var dataValue = $(cell).find('a').attr('data-value'),
			parts;
		if (dataValue) {
			parts = dataValue.split('/');
			return new Date(parts[0], parts[1], parts[2])
		}
		return null;
	}
	function normalizeDate(date) {
		if (date instanceof Date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate());
		}
		else if (typeof date === 'string') {
			return new Date(date);
		}
		return null;
	}
	function isAdjacent(pivot, cell, offset) {
		var temp = new Date(pivot.getFullYear(), pivot.getMonth(), pivot.getDate() + offset),
			year = temp.getFullYear() == cell.getFullYear(),
			month = temp.getMonth() == cell.getMonth(),
			day = temp.getDate() == cell.getDate();
		return year && month && day;
	}
	function isNext(pivot, next) {
		return isAdjacent(pivot, next, 1);
	}
	function isPrevious(pivot, previous) {
		return isAdjacent(pivot, previous, -1);
	}
	function isSubRange(subRange, range) {
		return subRange.start >= range.start && subRange.end <= range.end;
	}
	function isProperSuperRange(superRange, range) {
		return superRange.start < range.start && superRange.end > range.end;
	}
	WinJS.Namespace.define('Telerik.UI.Calendar', {
		_SelectionInteraction: WinJS.Class.define(function (calendar) {
			var that = this;
			that._calendar = calendar;
			that._isMultiple = calendar.selection.mode == 'multipleRanges';
			that._selectedCells = [];
			that._originalSelectedCells = [];
			that._bindEventHandlers();
			if (calendar._options.selection._isEndCalendar) {
				that._isEnabled = false;
				that._attachEventHandlersIfRelated();
			}
			else {
				that._attachEventHandlers();
			}
		}, {
			_isEnabled: true,
			_calendar: null,
			_isMultiple: false,
			_isNewSelection: false,
			_isAppending: false,
			_isPointerMoved: false,
			_startCell: null,
			_selectedCells: null,
			_originalSelectedCells: null,
			_selectHandle: null,
			_bindEventHandlers: function () {
				var that = this;
				that._onClick = that._onClick.bind(that);
				that._onPointerDown = that._onPointerDown.bind(that);
				that._onPointerMove = that._onPointerMove.bind(that);
				that._onPointerUp = that._onPointerUp.bind(that);
				that._processKeyDown = that._processKeyDown.bind(that);
				that._processKeyPress = that._processKeyPress.bind(that);
				that._onTap = that._onTap.bind(that);
				that._onHold = that._onHold.bind(that);
				that._onHoldEnd = that._onHoldEnd.bind(that);
				that._onGestureWhileHolding = that._onGestureWhileHolding.bind(that);
				that._onGestureWhileHoldingEnd = that._onGestureWhileHoldingEnd.bind(that);
			},
			_attachEventHandlers: function () {
				var that = this,
					calendar = that._calendar,
					events = calendar._interactionEvents,
					element = calendar.element;
				that._removeKendoClickHandler();
				events.addEventListener('click', that._onClick, false);
				events.addEventListener('pointerDown', that._onPointerDown, false);
				events.addEventListener('pointerMove', that._onPointerMove, false);
				events.addEventListener('pointerUp', that._onPointerUp, false);
				events.addEventListener('tap', that._onTap, false);
				events.addEventListener('hold', that._onHold, false);
				events.addEventListener('holdEnd', that._onHoldEnd, false);
				events.addEventListener('gestureWhileHolding', that._onGestureWhileHolding, false);
				events.addEventListener('gestureWhileHoldingEnd', that._onGestureWhileHoldingEnd, false);
				that._calendar.element.addEventListener('keydown', that._processKeyDown, false);
				document.addEventListener('keypress', that._processKeyPress, false);
			},
			_detachEventHandlers: function () {
				var that = this,
					events = that._calendar._interactionEvents;
				that._restoreKendoClickHandler();
				events.removeEventListener('click', that._onClick, false);
				events.removeEventListener('pointerDown', that._onPointerDown, false);
				events.removeEventListener('pointerMove', that._onPointerMove, false);
				events.removeEventListener('pointerUp', that._onPointerUp, false);
				events.removeEventListener('tap', that._onTap, false);
				events.removeEventListener('hold', that._onHold, false);
				events.removeEventListener('holdEnd', that._onHoldEnd, false);
				events.removeEventListener('gestureWhileHolding', that._onGestureWhileHolding, false);
				events.removeEventListener('gestureWhileHoldingEnd', that._onGestureWhileHoldingEnd, false);
				that._calendar.element.removeEventListener('keydown', that._processKeyDown, false);
				document.removeEventListener('keypress', that._processKeyPress, false);
			},
			_removeKendoClickHandler: function () {
				// Remove kendo's click handler.
				// We will listen to our click event
				// and use kendo's original code as a base.
				this._calendar._widget.element
					.off('click.kendoCalendar');
			},
			_restoreKendoClickHandler: function () {
				var that = this,
					widget = that._calendar._widget;
				$(widget.element)
					.on('click.kendoCalendar', 'td:has(.k-link)', function (e) {
						var link = e.currentTarget.firstChild;
						if (link.href.indexOf("#") != -1) {
							e.preventDefault();
						}
						widget._click($(link));
					});
			},
			_handleClick: function (e) {
				var that = this,
					target = e.detail.target,
					cell = $(target).closest('td[role=gridcell]').get(0),
					range = that._calendar.selectedDateRange,
					cellValue, rangeStartValue,
					originalEvent = e.detail.originalEvent;
				if (!cell || !$(cell).has('a').length) {
					return;
				}
				if (originalEvent && (originalEvent.ctrlKey || originalEvent.shiftKey)) {
					that._processSelectionWithModifierKey(originalEvent, cell);
				}
				else if (range) {
					cellValue = getDateValueFromCell(cell);
					rangeStartValue = normalizeDate(range.start);
					if (+cellValue == +rangeStartValue && that._calendar.view == 'month') {
						that._calendar._widget.value(cellValue);
						that._calendar.dispatchEvent('change');
					}
					else {
						that.detachSelectHandle();
						var link = cell.firstChild;
						if (link.href.indexOf("#") != -1 && e.detail.originalEvent) {
							e.detail.originalEvent.preventDefault();
						}
						if (!$(cell).hasClass('k-other-month')) {
							that._calendar._widget._current = cellValue;
						}
						that._calendar._widget._click($(link));
					}
				}
				else {
					var link = cell.firstChild;
					if (link.href.indexOf("#") != -1 && e.detail.originalEvent) {
						e.detail.originalEvent.preventDefault();
					}
					that._calendar._widget._click($(link));
				}
			},
			_onClick: function (e) {
				var that = this;
				if (!that._isPointerMoved) {
					that._handleClick(e);
				}
			},
			_onTap: function (e) {
				var that = this;
				that._handleClick(e);
			},
			_onPointerDown: function (e) {
				e = e.detail.originalEvent;
				this.start(e.target, e.shiftKey);
			},
			_onPointerMove: function (e) {
				this.move(e.detail.target);
			},
			_onPointerUp: function (e) {
				var that = this;
				that._removeDeadCells();
				that.stop();
			},
			_onHold: function (e) {
				var that = this,
					target = e.detail.target;
				that.detachSelectHandle();
				that.attachSelectHandle(target);
				that.start(target);
			},
			_onHoldEnd: function() {
				this.detachSelectHandle();
			},
			_onGestureWhileHolding: function (e) {
				var that = this;
				if (that._selectedCells.indexOf(that._startCell) < 0) {
					// GestureWhileHolding hasn't occurred over the start cell,
					// so first move over it.
					that.move(that._startCell);
				}
				that.detachSelectHandle();
				that.move(e.detail.target);
			},
			_onGestureWhileHoldingEnd: function (e) {
				this.stop();
			},
			_simulateInternalKendoClickCall: function () {
				(function () {
					this._click($(this._cell[0].firstChild));
				}).apply(this._calendar._widget);
			},
			_extendSingleDateRange: function (value, adjacent) {
				var calendar = this._calendar,
					selectedRange = calendar.selectedDateRange,
					start = selectedRange.start,
					end = selectedRange.end;
				if (adjacent && (isNext(end, value) || isPrevious(start, value)) || (!adjacent && +start == +end)) {
					if (+value < +start) {
						calendar.selectedDateRange = {
							start: value,
							end: end
						};
					}
					else if (+value > +end) {
						calendar.selectedDateRange = {
							start: start,
							end: value
						};
					}
				}
			},
			_shiftClick: function (cell) {
				var that = this,
					calendar = that._calendar,
					value = getDateValueFromCell(cell),
					selectedRange = calendar.selectedDateRange;
				if (+value < +normalizeDate(selectedRange.start)) {
					calendar.selectedDateRange = {
						start: value,
						end: selectedRange.start
					};
				}
				else {
					calendar.selectedDateRange = {
						start: selectedRange.start,
						end: value
					};
				}
			},
			_processSelectionWithModifierKey: function (e, cell) {
				var that = this,
					calendar = that._calendar,
					value = getDateValueFromCell(cell),
					selectedRange = calendar.selectedDateRange,
					callKendoClick = false;
				if ($(e.target).closest('.k-meta-view').length) {
					callKendoClick = true;
				}
				else if (calendar.selection.mode == 'singleRange') {
					if (selectedRange && e.ctrlKey) {
						that._extendSingleDateRange(value, true);
					}
					else if (selectedRange && e.shiftKey) {
						that._shiftClick(cell);
					}
					else if (selectedRange && +value == +that._calendar.value) {
						that._calendar.value = value;
					}
					else {
						callKendoClick = true;
					}
				}
				else if (calendar.selection.mode == 'multipleRanges') {
					if (e.ctrlKey) {
						this._addToSelectedDateRanges({
							start: value,
							end: value
						});
					}
					else {
						that._calendar.value = value;
					}
				}
				else {
					callKendoClick = true;
				}
				if (callKendoClick) {
					that._simulateInternalKendoClickCall();
				}
				else {
					that._focusCell(cell);
				}
				that._calendar.dispatchEvent('change');
			},
			_processKeyDown: function (e) {
				if ($(e.target).closest('.k-header').length) {
					return;
				}
				var that = this,
					focusedCell = $(that._calendar.element).find('.k-state-focused').get(0),
					callKendoClick = false,
					value = getDateValueFromCell(focusedCell);
				// CTRL + DOWN: handle it differently than kendo (see keyboardsupport.js).
				if (e.keyCode == 40 && e.ctrlKey) {
					if ($(e.target).closest('.k-meta-view').length) {
						callKendoClick = true;
					}
					else if (that._calendar.selectedDateRange && +value == +that._calendar.value) {
						that._calendar.value = value;
					}
					else {
						callKendoClick = true;
					}
					if (callKendoClick) {
						that._simulateInternalKendoClickCall();
					}
					that._calendar.dispatchEvent('change');
					e.preventDefault();
				}
				else if (e.keyCode == 13 || e.keyCode == 32) {
					that._processSelectionWithModifierKey(e, focusedCell);
					e.preventDefault();
				}
			},
			_processKeyPress: function (e) {
				if (e.keyCode == 27) {
					this.cancel();
				}
			},
			_attachEventHandlersIfRelated: function () {
				var that = this;
				that._processKeyDownIfRelated = that._processKeyDownIfRelated.bind(that);
				that._calendar.element.addEventListener('keydown', that._processKeyDownIfRelated, false);
			},
			_detachEventHandlersIfRelated: function () {
				var that = this;
				that._calendar.element.removeEventListener('keydown', that._processKeyDownIfRelated, false);
			},
			_processKeyDownIfRelated: function (e) {
				if ($(e.target).closest('.k-header').length) {
					return;
				}
				if (e.keyCode == 13 || e.keyCode == 32 || (e.keyCode == 40 && e.ctrlKey)) {
					var that = this;
					(function () {
						this._click($(this._cell[0].firstChild));
					}).apply(that._calendar._widget);
					e.preventDefault();
					that._calendar.dispatchEvent('change');
				}
			},
			_removeDeadCells: function () {
				var that = this;
				// Remove all cells, which do not have a parent.
				// If the MSPointerUP event has been triggered before the control
				// has been fully destroyed, the cells don't have parents
				// and the subsequent execution tree breaks.
				// This usually happens when the GC hasn't yet destroyed all controls
				// but the user has clicked somewhere in the app.
				that._selectedCells = $(that._selectedCells).filter(function () {
					return $(this).parents('.k-content').length;
				}).toArray();
			},
			_addToSelectedDateRanges: function (newRange) {
				this._mergeToSelectedDateRanges(newRange);
				this._compactSelectedRanges();
				this._sortSelectedDateRange();
				this._calendar.selectedDateRanges = this._calendar.selectedDateRanges;
			},
			_mergeToSelectedDateRanges: function (newRange) {
				var merged = false,
					ranges = this._calendar.selectedDateRanges,
					length = ranges.length,
					range,
					normalized,
					exists;
				for (var i = 0; i < length; i++) {
					range = ranges[i];
					normalized = {
						start: normalizeDate(range.start),
						end: normalizeDate(range.end)
					};
					if (+newRange.start == +normalized.start && +newRange.end == +normalized.end) {
						exists = true;
					}
					else if (isSubRange(newRange, normalized)) {
						merged = true;
					}
					else if (isProperSuperRange(newRange, normalized)) {
						range.start = newRange.start;
						range.end = newRange.end;
						merged = true;
					}
					else if (newRange.start >= normalized.start && newRange.start <= normalized.end ||
						isNext(normalized.end, newRange.start)) {
						range.end = newRange.end;
						merged = true;
					}
					else if (newRange.end >= normalized.start && newRange.start < normalized.end ||
						isPrevious(normalized.start, newRange.end)) {
						range.start = newRange.start;
						merged = true;
					}
				}
				if (!merged && !exists) {
					this._calendar.selectedDateRanges.push(newRange);
				}
				return merged;
			},
			_compactSelectedRanges: function () {
				var that = this,
					ranges = that._calendar.selectedDateRanges,
					range,
					normalized,
					merged;
				for (var i = 0; i < ranges.length; i++) {
					range = ranges[i];
					normalized = {
						start: normalizeDate(range.start),
						end: normalizeDate(range.end)
					};
					if (that._mergeToSelectedDateRanges(normalized)) {
						ranges.splice(i, 1);
						i--;
					}
				}
			},
			_sortSelectedDateRange: function () {
				var that = this,
					ranges = that._calendar.selectedDateRanges;
				ranges.sort(function (a, b) {
					return +a.start - +b.start;
				});
			},
			_focusCell: function (cell) {
				/// <summary>
				/// This method only adds the focused CSS class to the cell matching the provided value.
				/// So, in order for this to work, the view must have been already focused.
				/// </summary>
				var that = this,
					calendar = that._calendar,
					widget = calendar._widget,
					value = getDateValueFromCell(cell),
					isOtherMonth = $(cell).hasClass('k-other-month');
				if (isOtherMonth) {
					$(cell).removeClass('k-other-month');
				}
				widget._class('k-state-focused', widget._view.toDateString(value));
				widget._current = value;
				if (isOtherMonth) {
					$(cell).addClass('k-other-month');
				}
			},
			attachSelectHandle: function (cell) {
				cell = $(cell).closest('td[role=gridcell]').get(0);
				if ($(cell).parents('.k-meta-view').length ||
					!getDateValueFromCell(cell)) {
					return;
				}
				this._selectHandle = this._selectHandle ||
					$('<span class="t-select-handle"></span>');
				$(cell).closest('td[role=gridcell]')
					.addClass('t-attach-handle')
					.prepend(this._selectHandle);
			},
			detachSelectHandle: function () {
				var that = this;
				if (that._selectHandle) {
					that._selectHandle.parent(".t-attach-handle").removeClass("t-attach-handle");
					that._selectHandle.remove();
				}
			},
			start: function (cell, append) {
				var that = this;
				that._isPointerMoved = false;
				cell = $(cell).closest('td[role=gridcell]').get(0);
				if (that._calendar.view != 'month' || !getDateValueFromCell(cell)) {
					return;
				}
				that._startCell = cell;
				that._isNewSelection = !that._isMultiple;
				that._isAppending = false;
				$(that._calendar.element).find('.k-content td').each(function () {
					if ($(this).hasClass('k-state-selected')) {
						that._originalSelectedCells.push(this);
					}
				});
				if (append && !that._isMultiple && that._calendar.selectedDateRange) {
					if (that._originalSelectedCells.length) {
						that._startCell = that._originalSelectedCells[0];
					}
					else {
						var cellValue = getDateValueFromCell(cell),
							getIndex = -1;
						if (+cellValue > +normalizeDate(that._calendar.selectedDateRange.end)) {
							getIndex = 0;
						}
						that._startCell = $(that._calendar.element).find('.k-content td').get(getIndex);
						select(that._startCell);
						that._originalSelectedCells.push(that._startCell);
					}
					that._isNewSelection = false;
					that._isAppending = true;
					that._selectedCells = that._originalSelectedCells.slice(0);
					var allCells = $(that._calendar.element).find('.k-content td'),
						startCellIndex = allCells.index(cell);
					that.move(allCells[startCellIndex], true);
				}
			},
			move: function (cell, skipDetectDragSelection) {
				cell = $(cell).closest('td[role=gridcell]').get(0);
				if (!this._startCell || !cell || !getDateValueFromCell(cell)) {
					return;
				}
				this._isPointerMoved = !skipDetectDragSelection;
				if (this._isNewSelection) {
					this._selectedCells.forEach(unselect);
					this._originalSelectedCells.forEach(unselect);
					this._selectedCells = [];
					this._isNewSelection = false;
				}
				if (!this._selectedCells.length) {
					$(cell).addClass('k-state-selected');
					this._selectedCells.push(cell);
				}
				else {
					var allCells = $(this._calendar.element).find('.k-content td'),
						currentCellIndex = allCells.index(cell),
						selectedCellIndex = this._selectedCells.indexOf(cell),
						pivotCell = this._startCell,
						pivotCellIndex = allCells.index(pivotCell),
						pivotSelectedIndex = this._selectedCells.indexOf(pivotCell),
						direction = currentCellIndex > pivotCellIndex ? 1 : currentCellIndex < pivotCellIndex ? -1 : 0,
						cells = [];
					if (direction == 1) {
						if (selectedCellIndex >= 0) {
							// Clear all cells (usually one) after the current one.
							for (var i = selectedCellIndex + 1; i < this._selectedCells.length; i++) {
								// When selection is multiple: only if they are not from the original selection.
								if (!this._isMultiple || this._originalSelectedCells.indexOf(this._selectedCells[i]) == -1) {
									$(this._selectedCells[i]).removeClass('k-state-selected');
									cells.push(this._selectedCells[i]);
								}
							}
							this._selectedCells = this._selectedCells.slice(0, this._selectedCells.length - cells.length);
						}
						// Clear all cells before the pivot cell because we are totally in the opposite direction.
						for (var i = 0; i < pivotSelectedIndex; i++) {
							if (!this._isMultiple || this._originalSelectedCells.indexOf(this._selectedCells[i]) == -1) {
								$(this._selectedCells[i]).removeClass('k-state-selected');
							}
						}
						this._selectedCells = this._selectedCells.slice(pivotSelectedIndex, this._selectedCells.length);
						pivotCell = this._selectedCells[this._selectedCells.length - 1];
						pivotCellIndex = allCells.index(pivotCell);
						for (var i = pivotCellIndex + 1; i <= currentCellIndex; i++) {
							allCells.eq(i).addClass('k-state-selected');
							this._selectedCells.push(allCells.get(i));
						}
					}
					else if (direction == -1) {
						if (selectedCellIndex >= 0) {
							// Clear all cells (usually one) before the current one.
							for (var i = 0; i < selectedCellIndex; i++) {
								if (!this._isMultiple || this._originalSelectedCells.indexOf(this._selectedCells[i]) == -1) {
									$(this._selectedCells[i]).removeClass('k-state-selected');
								}
							}
							this._selectedCells = this._selectedCells.slice(i);
						}
						// Clear all cells after the pivot cell because we are totally in the opposite direction.
						for (var i = pivotSelectedIndex + 1; i < this._selectedCells.length; i++) {
							if (!this._isMultiple || this._originalSelectedCells.indexOf(this._selectedCells[i]) == -1) {
								$(this._selectedCells[i]).removeClass('k-state-selected');
							}
						}
						this._selectedCells = this._selectedCells.slice(0, pivotSelectedIndex + 1);
						pivotCellIndex = allCells.index(this._selectedCells[0]);
						for (var i = currentCellIndex; i < pivotCellIndex; i++) {
							allCells.eq(i).addClass('k-state-selected');
							cells.push(allCells.get(i));
						}
						[].unshift.apply(this._selectedCells, cells);
					}
					else {
						for (var i = 0; i < this._selectedCells.length; i++) {
							if (this._selectedCells[i] != this._startCell &&
								(!this._isMultiple || this._originalSelectedCells.indexOf(this._selectedCells[i]) == -1)) {
								$(this._selectedCells[i]).removeClass('k-state-selected');
							}
						}
						this._selectedCells = [this._startCell];
					}
				}
			},
			stop: function () {
				var that = this,
					calendar = that._calendar,
					selectedCells = that._selectedCells,
					length = selectedCells.length,
					firstSelectedCell = selectedCells[0],
					lastSelectedCell = selectedCells[length - 1],
					isEndCellAfterPivot;
				if (length && that._isPointerMoved) {
					isEndCellAfterPivot = +getDateValueFromCell(that._startCell) == +getDateValueFromCell(firstSelectedCell);
					if (that._isMultiple) {
						that._addToSelectedDateRanges({
							start: getDateValueFromCell(firstSelectedCell),
							end: getDateValueFromCell(selectedCells.pop())
						});
					}
					else {
						var cells = $(calendar.element).find('.k-content td');
						if (that._isAppending && (+normalizeDate(calendar.selectedDateRange.start) < +getDateValueFromCell(cells.get(0)))) {
							calendar.selectedDateRange = {
								start: calendar.selectedDateRange.start,
								end: getDateValueFromCell(selectedCells.pop())
							};
						}
						else if (that._isAppending && (+normalizeDate(calendar.selectedDateRange.end) > +getDateValueFromCell(cells.get(-1)))) {
							calendar.selectedDateRange = {
								start: getDateValueFromCell(firstSelectedCell),
								end: calendar.selectedDateRange.start
							};
						}
						else {
							calendar.selectedDateRange = {
								start: getDateValueFromCell(firstSelectedCell),
								end: getDateValueFromCell(selectedCells.pop())
							};
						}
					}
					if (isEndCellAfterPivot) {
						that._focusCell(lastSelectedCell);
					}
					else {
						that._focusCell(firstSelectedCell);
					}
					calendar.dispatchEvent('change');
					that._selectedCells = [];
				}
				that._startCell = null;
				that._originalSelectedCells = [];
			},
			cancel: function () {
				if (this._startCell) {
					this._selectedCells.forEach(unselect);
					this._originalSelectedCells.forEach(select);
					this._startCell = null;
					this._selectedCells = [];
				}
			},
			toggle: function (enable) {
				var that = this;
				if (enable != that._isEnabled) {
					enable ? that._attachEventHandlers() : that._detachEventHandlers();
					!enable ? that._attachEventHandlersIfRelated() : that._detachEventHandlersIfRelated();
					that._isEnabled = enable;
				}
			},
			destroy: function () {
				var that = this;
				that._detachEventHandlers();
				that._detachEventHandlersIfRelated();
				that._calendar = null;
				that._startCell = null;
				that._selectedCells = null;
				that._originalSelectedCells = null;
			}
		})
	});
	// Fix for past/future navigation one-month-skipping when the focused cell is in on an other month's date.
	var _navigate = kendo.ui.Calendar.prototype._navigate;
	kendo.ui.Calendar.prototype._navigate = function () {
		var widget = this,
			current = widget._current,
			currentMonth = current.getMonth(),
			$element = $(widget.element),
			focusedOtherMonthCell = $element.find('.k-state-focused.k-other-month').get(0),
			firstCellOfTheCurrentMonth = $element.find('td').not(".k-other-month").get(0),
			date = function (cell) { return getDateValueFromCell(cell); },
			modifier = 0;
		if (focusedOtherMonthCell) {
			modifier += date(focusedOtherMonthCell) > date(firstCellOfTheCurrentMonth) ? -1 : 1;
		}
		current.setMonth(currentMonth + modifier);
		_navigate.apply(widget, arguments);
	};
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	var ui = Telerik.UI,
		RadCalendar = ui.RadCalendar,
		DateRange = ui.Calendar.DateRange,
		SelectionInteraction = ui.Calendar._SelectionInteraction,
		define = WinJS.Class.define,
		namespace = WinJS.Namespace.define;
	function normalizeDate(date) {
		if (date instanceof Date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate());
		}
		else if (typeof date === 'string') {
			return new Date(date);
		}
		return null;
	}
	var getDateValueFromCell = function (cell) {
		var dataValue = $(cell).find('a').attr('data-value'),
			parts;
		if (dataValue) {
			parts = dataValue.split('/');
			return new Date(parts[0], parts[1], parts[2])
		}
		return null;
	};
	var transferClassesBetweenTables = function (from, to) {
		$(from).find('td').each(function (index) {
			var $td = $(this);
			['k-state-focused', 'k-state-selected', 'k-today'].forEach(function (selector) {
				if ($td.hasClass(selector)) {
					// Transfer the focused cell state from the 'to' table to the grid.
					// This improves the animation, which had a flicker of the focused cell before.
					$(to).find('td').eq(index).addClass(selector);
				}
			});
		});
	};
	var Selection = WinJS.Class.define(function (calendar) {
		this._calendar = calendar;
	}, {
		_calendar: null,
		normalizeOptions: function (options) {
			/// <summary>
			/// Call this before the widget has been initialized.
			/// Sets the default values for all selection options.
			/// </summary>
			options.selection = options.selection || {};
			options.selection.mode = options.selection.mode || 'singleDate';
			options.value = options.value || null;
			options.selectedDateRange = options.selectedDateRange || null;
			options.selectedDateRanges = options.selectedDateRanges || [];
		}
	}, {
		create: function (selection, calendar) {
			var selectionMode = (selection && selection.mode) || 'singleDate',
				related = selection && selection.singleRange;
			switch (selectionMode) {
				case 'singleRange':
					if (related) {
						return new SelectionSingleRangeRelated(calendar);
					}
					else {
						return new SelectionSingleRange(calendar);
					}
				case 'multipleRanges':
					return new SelectionMultipleRanges(calendar);
				default:
					return new SelectionSingleDate(calendar);
			}
		}
	});
	var SelectionSingleDate = WinJS.Class.derive(Selection, function (calendar) {
		Selection.call(this, calendar);
	}, {
		initialize: function () {
			this._overrideWidgetValueMethod();
		},
		destroy: function () {
			this._restoreWidgetValueMethod();
		},
		initializeInteraction: function () {
			var that = this;
			that._processKeyDown = that._processKeyDown.bind(that);
			that._calendar.element.addEventListener('keydown', that._processKeyDown, false);
		},
		destroyInteraction: function () {
			var that = this;
			that._calendar.element.removeEventListener('keydown', that._processKeyDown, false);
		},
		setValue: function (value) {
			var that = this;
			that._calendar._options.value = value;
			if (that._calendar._widget) {
				that._calendar._widget.value(value, true);
			}
		},
		setSelectedDateRange: function (value) {
			this._calendar._options.selectedDateRange = value;
		},
		setSelectedDateRanges: function (value) {
			this._calendar._options.selectedDateRanges = value;
		},
		setMin: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.min = value;
				that._calendar._widget.min(value);
				that._calendar._reInitialize();
			}
		},
		setMax: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.max = value;
				that._calendar._widget.max(value);
				that._calendar._reInitialize();
			}
		},
		_processKeyDown: function (e) {
			if ($(e.target).closest('.k-header').length) {
				return;
			}
			if (e.keyCode == 13 || e.keyCode == 32 || (e.keyCode == 40 && e.ctrlKey)) {
				var that = this;
				(function () {
					this._click($(this._cell[0].firstChild));
				}).apply(that._calendar._widget);
				e.preventDefault();
				that._calendar.dispatchEvent('change');
			}
		},
		/// KENDO .value() OVERRIDE:
		_originalWidgetValueMethod: null,
		_onWidgetValueChange: function (value, calledFromWrapper) {
			var that = this;
			if (value === undefined) {
				// get
				return that._originalWidgetValueMethod();
			}
			else {
				// set
				if (!calledFromWrapper) {
					that._calendar._options.value = value;
				}
				that._originalWidgetValueMethod(value);
			}
		},
		_overrideWidgetValueMethod: function () {
			/// <summary>
			/// Call this after the widget has been initialized.
			/// Overrides kendo's value() method to listen for changes in the value property of the calendar.
			/// Calls the original method of widget after the new value has been stored in the wrapper._options object.
			/// </summary>
			var that = this,
				widget = that._calendar._widget;
			that._originalWidgetValueMethod = widget.value.bind(widget); // this in wrapper override is the widget.
			widget.value = that._onWidgetValueChange.bind(that); // this in kendo.value() is the wrapper.
		},
		_restoreWidgetValueMethod: function () {
			var that = this,
				widget = that._calendar._widget;
			widget.value = that._originalWidgetValueMethod;
		}
	});
	var SelectionRange = WinJS.Class.derive(Selection, function (calendar) {
		Selection.call(this, calendar);
	}, {
		_selectionInteraction: null,
		_widgetValueChangeInProcess: false,
		_skipNavigateIfOtherMonth: false,
		initialize: function () {
			var that = this;
			that._overrideWidgetValueMethod();
			that._overrideWidgetNavigateMethod();
			that._overrideWidgetValueBackingField();
			that._refreshWidgetValue(that._calendar._options.value);
			that._refreshSelectionVisualState();
		},
		destroy: function () {
			var that = this;
			that._restoreWidgetValueMethod();
			that._restoreWidgetNavigateMethod();
			that._restoreWidgetValueBackingField();
		},
		setSelectionMode: function (value) {
			var that = this,
				options = that._calendar._options;
			options.selectionMode = value;
			that.initializeInteraction();
			that.normalizeOptions(options);
			that._refreshWidgetValue(options.value);
			that._refreshSelectionVisualState();
		},
		setValue: function (value) {
			var that = this,
				options = that._calendar._options;
			options.value = value;
			that._refreshWidgetValue(value);
			that._refreshSelectedDateRange(value);
			that._refreshSelectionVisualState();
		},
		setSelectedDateRange: function (value) {
			var that = this,
				options = that._calendar._options,
				isEndCalendar = options.selection._isEndCalendar;
			options.value = value ? isEndCalendar ? normalizeDate(value.end) : normalizeDate(value.start) : null;
			that._refreshWidgetValue(options.value, true);
			options.selectedDateRange = value;
			if (value) {
				options.selectedDateRanges = [
					value
				];
			}
			else {
				options.selectedDateRanges = [];
			}
			that._refreshSelectionVisualState();
		},
		setSelectedDateRanges: function (value) {
			var that = this;
			that._calendar._options.value = value && value.length ? value[0].start : null;
			that._refreshWidgetValue(that._calendar._options.value, true);
			that._calendar._options.selectedDateRange = value && value.length ? value[0] : null;
			that._calendar._options.selectedDateRanges = value;
			that._refreshSelectionVisualState();
		},
		initializeInteraction: function () {
			var that = this,
				calendar = that._calendar;
			if (that._selectionInteraction) {
				that._selectionInteraction.destroy();
			}
			that._selectionInteraction = new SelectionInteraction(calendar);
		},
		destroyInteraction: function () {
			this._selectionInteraction.destroy();
		},
		toggleInteraction: function (enable) {
			this._selectionInteraction.toggle(enable);
		},
		_refreshWidgetValue: function (value, isSelectedDateRangeChanged) {
			var that = this;
			that._skipNavigateIfOtherMonth = false;
			if (isSelectedDateRangeChanged) {
				if (that._isValueInOtherMonth(value) ||
					that._isValueInOtherMonth(that._calendar._widget._current)) {
					that._skipNavigateIfOtherMonth = true;
				}
			}
			if (that._calendar._widget) {
				that._calendar._widget.value(value, true);
			}
			that._skipNavigateIfOtherMonth = false;
		},
		_isValueInOtherMonth: function (value) {
			var cell = $(this._calendar.element).find('.k-content td').filter(function () {
				return +getDateValueFromCell(this) == +normalizeDate(value);
			});
			return !cell.length || cell.hasClass('k-other-month');
		},
		_refreshSelectionVisualState: function (table) {
			var that = this,
				element = that._calendar.element,
				container = table && table.length ? table : that._calendar.element,
				selector = table && table.length ? 'td a' : '.k-content td a',
				cells = $(container).find(selector + ':not(.t-animation-grid a)'),
				start, end;
			if (!that._calendar.selectedDateRange ||
				($(container).closest('.k-meta-view').length)) {
				cells.each(function () {
					$(this).parent().removeClass('k-state-selected');
				});
				return;
			}
			cells.each(function () {
				var cell = this,
					dataValue = $(cell).attr('data-value'),
					parts = dataValue.split('/'),
					value = new Date(parts[0], parts[1], parts[2]),
					isInRange = false;
				that._calendar.selectedDateRanges.forEach(function (range) {
					start = normalizeDate(range.start);
					end = normalizeDate(range.end);
					if (value >= start && value <= end) {
						isInRange = true;
						return false;
					}
				});
				if (isInRange) {
					$(cell).parent().addClass('k-state-selected');
				}
				else {
					$(cell).parent().removeClass('k-state-selected');
				}
			});
			transferClassesBetweenTables($(element).find('.t-animation-to-grid'), $(element).find('.t-animation-grid'));
		},
		/// KENDO .value() OVERRIDE:
		_originalWidgetValueMethod: null,
		_onWidgetValueChange: function (value, calledFromWrapper) {
			var that = this;
			if (value === undefined) {
				// get
				return that._originalWidgetValueMethod();
			}
			else {
				// set
				that._widgetValueChangeInProcess = true;
				that._originalWidgetValueMethod(value);
				that._widgetValueChangeInProcess = false;
				if (!calledFromWrapper) {
					that._calendar._options.value = value;
					that._refreshSelectedDateRange(value);
					that._refreshSelectionVisualState();
				}
			}
		},
		_overrideWidgetValueMethod: function () {
			/// <summary>
			/// Call this after the widget has been initialized.
			/// Overrides kendo's value() method to listen for changes in the value property of the calendar.
			/// Calls the original method of widget after the new value has been stored in the wrapper._options object.
			/// </summary>
			var that = this,
				widget = that._calendar._widget;
			that._originalWidgetValueMethod = widget.value.bind(widget); // this in wrapper override is the widget.
			widget.value = that._onWidgetValueChange.bind(that); // this in kendo.value() is the wrapper.
		},
		_restoreWidgetValueMethod: function () {
			var that = this,
				widget = that._calendar._widget;
			widget.value = that._originalWidgetValueMethod;
		},
		/// KENDO .navigate() OVERRIDE:
		_originalWidgetNavigateMethod: null,
		_overrideWidgetNavigateMethod: function () {
			var that = this,
				widget = that._calendar._widget,
				navigate = widget.navigate;
			that._originalWidgetNavigateMethod = widget.navigate.bind(widget);
			widget.navigate = function (value, view) {
				navigate.call(widget, value, view,
					that._refreshSelectionVisualState.bind(that), that._skipNavigateIfOtherMonth,
					transferClassesBetweenTables);
			};
		},
		_restoreWidgetNavigateMethod: function () {
			var that = this,
				widget = that._calendar._widget;
			widget.navigate = that._originalWidgetNavigateMethod;
		},
		/// KENDO ._value OVERRIDE:
		// This is a special case: when clicking on today's link,
		// Kendo changes its value directly, i.e. it sets this._value,
		// so the wrapper has no way of knowing when the value has changed in this case.
		// Here we override the today's link click handler, so that we make sure we update the related values:
		// 1) the value property's value in the backing field of the wrapper (i.e. in the options),
		// 2) the selected date range becomes a range of one element, today's date and
		// 3) we refresh the selected state to reflect the change.
		// Kendo navigates afterwards to the view where today's date is.
		// If the view is the same we need to refresh the visual state.
		// If the view is on another view, then the refresh code in
		// the .navigate method override will refresh the state there.
		_overrideWidgetValueBackingField: function () {
			var that = this,
				widget = that._calendar._widget,
				valueField = widget._value;
			Object.defineProperty(widget, '_value', {
				get: function () {
					return valueField;
				},
				set: function (value) {
					valueField = value;
					// If the ._value property is changed outside of the value() method of the widget,
					// we assume that this is the call in _todayClick 
					// (: the only place where ._value is called instead of value()).
					if (!that._widgetValueChangeInProcess) {
						that._calendar._options.value = value;
						that._refreshSelectedDateRange(value);
						that._refreshSelectionVisualState();
					}
				}
			});
		},
		_restoreWidgetValueBackingField: function () {
			var that = this,
				widget = that._calendar._widget,
				valueField = widget._value;
			Object.defineProperty(widget, '_value', {
				value: valueField,
				writable: true
			});
		}
	});
	var SelectionSingleRange = WinJS.Class.derive(SelectionRange, function (calendar) {
		SelectionRange.call(this, calendar);
	}, {
		normalizeOptions: function (options) {
			/// <summary>
			/// Call this before the widget has been initialized.
			/// Normalizes the value, selectedDateRange and selectedDateRanges options
			/// in the initialization options object depending on their relations and the
			/// the current selectionMode.
			/// </summary>
			Selection.prototype.normalizeOptions.call(this, options);
			if (options.value) {
				options.selectedDateRange = {
					start: options.value,
					end: options.value
				};
				options.selectedDateRanges = [
						{
							start: options.selectedDateRange.start,
							end: options.selectedDateRange.end
						}
				];
			}
			else if (options.selectedDateRange) {
				if (options.min && options.selectedDateRange.start < options.min) {
					options.selectedDateRange.start = options.min;
				}
				if (options.max && options.selectedDateRange.end > options.max) {
					options.selectedDateRange.end = options.max;
				}
				if (typeof options.selectedDateRange.start == 'string') {
					options.value = new Date(options.selectedDateRange.start);
				}
				else {
					options.value = options.selectedDateRange.start;
				}
				options.selectedDateRanges = [
						{
							start: options.selectedDateRange.start,
							end: options.selectedDateRange.end
						}
				];
			}
		},
		setMin: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.min = value;
				that._calendar._reInitialize();
				if (that._calendar.selectedDateRange) {
					var end = that._calendar.selectedDateRange.end;
					if (that._calendar.selectedDateRange.start < value) {
						that._calendar.selectedDateRange = {
							start: value,
							end: end
						};
					}
				}
			}
		},
		setMax: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.max = value;
				that._calendar._reInitialize();
				if (that._calendar.selectedDateRange) {
					var start = that._calendar.selectedDateRange.start;
					if (that._calendar.selectedDateRange.end > value) {
						that._calendar.selectedDateRange = {
							start: start,
							end: value
						};
					}
				}
			}
		},
		setSelectedDateRanges: function (value) {
			// When setting the selectedDateRanges property,
			// set the selectedDateRange property to the first range
			// to run through the singleRange selection logic, instead of through multipleRanges.
			// Otherwise all ranges are selected in singleRange, which is wrong.
			SelectionRange.prototype.setSelectedDateRange.call(this, value[0]);
		},
		_refreshSelectedDateRange: function (value) {
			var that = this;
			if (value) {
				that._calendar._options.selectedDateRange = {
					start: value,
					end: value
				};
				that._calendar._options.selectedDateRanges = [
						{
							start: that._calendar._options.selectedDateRange.start,
							end: that._calendar._options.selectedDateRange.end
						}
				];
			}
			else {
				that._calendar._options.selectedDateRange = null;
				that._calendar._options.selectedDateRanges = [];
			}
		}
	});
	var SelectionMultipleRanges = WinJS.Class.derive(SelectionRange, function (calendar) {
		SelectionRange.call(this, calendar);
	}, {
		normalizeOptions: function (options) {
			/// <summary>
			/// Call this before the widget has been initialized.
			/// Normalizes the value, selectedDateRange and selectedDateRanges options
			/// in the initialization options object depending on their relations and the
			/// the current selectionMode.
			/// </summary>
			Selection.prototype.normalizeOptions.call(this, options);
			if (options.value) {
				options.selectedDateRange = {
					start: options.value,
					end: options.value
				};
				options.selectedDateRanges = [
						{
							start: options.value,
							end: options.value
						}
				];
			}
			else if (options.selectedDateRange) {
				if (options.min && options.selectedDateRange.start < options.min) {
					options.selectedDateRange.start = options.min;
				}
				if (options.max && options.selectedDateRange.end > options.max) {
					options.selectedDateRange.end = options.max;
				}
				if (typeof options.selectedDateRange.start == 'string') {
					options.value = new Date(options.selectedDateRange.start);
				}
				else {
					options.value = options.selectedDateRange.start;
				}
				options.selectedDateRanges = [
						{
							start: options.selectedDateRange.start,
							end: options.selectedDateRange.end
						}
				];
			}
			else if (options.selectedDateRanges && options.selectedDateRanges.length) {
				if (options.min && options.selectedDateRanges[0].start < options.min) {
					options.selectedDateRanges[0].start = options.min;
				}
				if (options.max && options.selectedDateRanges[options.selectedDateRanges.length - 1].end > options.max) {
					options.selectedDateRanges[options.selectedDateRanges.length - 1].end = options.max;
				}
				if (typeof options.selectedDateRanges[0].start == 'string') {
					options.value = new Date(options.selectedDateRanges[0].start);
				}
				else {
					options.value = options.selectedDateRanges[0].start;
				}
				options.selectedDateRange = {
					start: options.selectedDateRanges[0].start,
					end: options.selectedDateRanges[0].end
				};
			}
		},
		setMin: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.min = value;
				that._calendar._reInitialize();
				var ranges = that._calendar.selectedDateRanges;
				while (ranges.length && ranges[0].end < value) {
					ranges.shift();
				}
				if (ranges[0]) {
					if (normalizeDate(ranges[0].start) < value) {
						ranges[0].start = value;
					}
					that._calendar._options.value = ranges[0].start;
					that._refreshWidgetValue(that._calendar._options.value, true);
					that._calendar._options.selectedDateRange = {
						start: ranges[0].start,
						end: ranges[0].end
					};
					that._refreshSelectionVisualState();
				}
			}
		},
		setMax: function (value) {
			var that = this;
			if (that._calendar._widget) {
				that._calendar._options.max = value;
				that._calendar._reInitialize();
				var ranges = that._calendar.selectedDateRanges;
				while (ranges.length && ranges[ranges.length - 1].start > value) {
					ranges.pop();
				}
				if (ranges[ranges.length - 1]) {
					if (ranges[ranges.length - 1].end > value) {
						ranges[ranges.length - 1].end = value;
					}
					that._calendar._options.selectedDateRange = {
						start: ranges[0].start,
						end: ranges[0].end
					};
				}
			}
		},
		_refreshSelectedDateRange: function (value) {
			var that = this;
			if (value) {
				that._calendar._options.selectedDateRange = {
					start: value,
					end: value
				};
				that._calendar._options.selectedDateRanges = [
					{
						start: value,
						end: value
					}
				];
			}
			else {
				that._calendar._options.selectedDateRange = null;
				that._calendar._options.selectedDateRanges = [];
			}
		}
	});
	var SelectionSingleRangeRelated = WinJS.Class.derive(SelectionSingleRange, function (calendar) {
		SelectionSingleRange.call(this, calendar);
	}, {
		_endCalendar: null,
		_initTimeout: null,
		_isDestroyed: false,
		_getEndCalendar: function () {
			var that = this,
				endCalendarSelector = this._calendar.selection.singleRange.endCalendar;
			return new WinJS.Promise(function defer(complete, error) {
				var element = document.querySelector(endCalendarSelector),
				widget;
				that._endCalendar = element && element.winControl;
				widget = that._endCalendar && that._endCalendar._widget;
				// wait for the end calendar and the widget
				if (!that._endCalendar || !widget) {
					that._initTimeout = setImmediate(defer, complete, error);
					return;
				}
				that._initTimeout = null;
				complete();
			});
		},
		initialize: function () {
			SelectionRange.prototype.initialize.call(this);
			var that = this;
			that._getEndCalendar().done(function () {
				that._endCalendar.selection.mode = that._calendar.selection.mode;
				that._endCalendar.selection._isEndCalendar = true;
				that._endCalendar.value = that._calendar.value;
				that._endCalendar.selectedDateRange = that._calendar.selectedDateRange;
				that._endCalendar.min = that._calendar.min;
				that._endCalendar.max = that._calendar.max;
				that._onEndCalendarChange = that._onEndCalendarChange.bind(that);
				that._endCalendar.addEventListener('change', that._onEndCalendarChange, false);
			});
			WinJS.Promise.timeout(1000).done(function () {
				if (!that._isDestroyed && !that._endCalendar) {
					throw new Telerik.Error("Telerik.UI.Control.EndCalendarIsNotFound", Telerik.Localization._strings.endCalendarIsNotFound);
				}
			});
		},
		destroy: function () {
			var that = this;
			SelectionRange.prototype.destroy.call(this);
			that._initTimeout && clearImmediate(that._initTimeout) && (that._initTimeout = null);
			if (that._endCalendar) {
				that._endCalendar.removeEventListener('change', that._onEndCalendarChange, false);
				that._endCalendar = null;
			}
			that._isDestroyed = true;
		},
		initializeInteraction: function () {
			var that = this;
			that._processKeyDown = that._processKeyDown.bind(that);
			that._calendar.element.addEventListener('keydown', that._processKeyDown, false);
		},
		destroyInteraction: function () {
			var that = this;
			that._calendar.element.removeEventListener('keydown', that._processKeyDown, false);
		},
		setValue: function (value) {
			var that = this;
			if (value && +value < +that._endCalendar.value) {
				that.setSelectedDateRange({
					start: value,
					end: that._endCalendar.value
				});
			}
			else {
				SelectionSingleRange.prototype.setValue.call(that, value);
				that._endCalendar.value = value;
			}
		},
		setSelectedDateRange: function (value) {
			var that = this;
			SelectionSingleRange.prototype.setSelectedDateRange.call(that, value);
			that._endCalendar.selectedDateRange = value;
		},
		_processKeyDown: function (e) {
			if ($(e.target).closest('.k-header').length) {
				return;
			}
			if (e.keyCode == 13 || e.keyCode == 32 || (e.keyCode == 40 && e.ctrlKey)) {
				var that = this;
				(function () {
					this._click($(this._cell[0].firstChild));
				}).apply(that._calendar._widget);
				e.preventDefault();
				that._calendar.dispatchEvent('change');
			}
		},
		_refreshSelectedDateRange: function (value) {
			var that = this;
			if (!that._endCalendar.value) {
				that._endCalendar.value = value;
				SelectionSingleRange.prototype._refreshSelectedDateRange.call(that, value);
			}
			else if (value && +value < +that._endCalendar.value) {
				var range = {
					start: value,
					end: that._endCalendar.value
				};
				that._calendar._options.selectedDateRange = range;
				that._calendar._options.selectedDateRanges = [
						{
							start: range.start,
							end: range.end
						}
				];
				that._endCalendar.selectedDateRange = range;
			}
			else {
				that._endCalendar.value = value;
				SelectionSingleRange.prototype._refreshSelectedDateRange.call(that, value);
			}
		},
		_onEndCalendarChange: function (e) {
			var calendar = this._calendar,
				startDate = calendar.value,
				endDate = e.target.value;
			if (!startDate || +endDate < +startDate) {
				calendar.value = endDate;
			}
			else {
				calendar.selectedDateRange = {
					start: startDate,
					end: endDate
				};
			}
		}
	});
	var _SelectionConfiguration = define(function (calendar) {
		/// <summary>
		/// For internal usage only. Describes the properties of the Calendar month object.
		/// </summary>
}, {
		/// <field type="Telerik.UI.Calendar.SelectionMode">
		/// Gets or sets the selection mode of the control.
		/// </field>
		mode: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Configures the type of the 'singleRange' selection mode of the control.
		/// If the endCalendar sub-property is set to a selector that matches another RadCalendar on the same page,
		/// both calendars will work together to allow the user to select a single date range only by tapping/clicking.
		/// </field>
		singleRange: {get:function(){}}
		});
	namespace('Telerik.UI.Calendar', {
		/// <enum />
		SelectionMode: {
			/// <field type="String">
			/// This is the default selection mode of the control.
			/// In this mode the user can select a single date only.
			/// </field>
			singleDate: 'singleDate',
			/// <field type="String">
			/// In this selection mode the user can select a consecutive range of dates.
			/// </field>
			singleRange: 'singleRange',
			/// <field type="String">
			/// In this selection mode the user can select multiple ranges of dates.
			/// </field>
			multipleRanges: 'multipleRanges'
		}
	});
	namespace('Telerik.UI.Calendar', {
		_Selection: Selection,
		_SelectionSingleDate: SelectionSingleDate,
		_SelectionSingleRangeRelated: SelectionSingleRangeRelated,
		_SelectionConfiguration: _SelectionConfiguration
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/calendar/selectionmodes.js" />
(function (global, $, undefined) {
	'use strict'
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		utilities = Telerik.Utilities,
		cul = Telerik.Culture,
		DateRange = ui.Calendar.DateRange,
		Selection = ui.Calendar._Selection,
		SelectionConfiguration = ui.Calendar._SelectionConfiguration;
	var UNDEFINED = 'undefined',
		OBJECT = 'object',
		ANIMATIONDURATION = 367,
		EASINGOUTEXPO = 'cubic-bezier(0.19, 1, 0.22, 1)';
	/// <summary>
	/// A calendar control for picking dates, with navigation.
	/// </summary>
	/// <icon src="calendar_html_12.png" width="12" height="12" />
	/// <icon src="calendar_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadCalendar"></div>]]></htmlSnippet>
	/// <event name="change">Fires when the selected date is changed.</event>
	/// <event name="navigate">Fires when the control navigates.</event>
	/// <part name="calendar" class="t-calendar">The RadCalendar widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadCalendar = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// Creates a new RadCalendar control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Gets or sets the culture of the calendar.
		/// </field>
		culture: {get:function(){}, set:function(value){}},
		/// <field type="Array" elementType="Date" defaultValue="[]">
		/// Specifies a list of dates, which will be passed to the month template. Default value is [].
		/// </field>
		dates: {get:function(){}, set:function(value){}},
		/// <field type="String" defaultValue="month">
		/// Specifies the navigation depth.
		/// Valid values are: 'month', 'year', 'decade', 'century'. Default value is "month".
		/// </field>
		/// <options>
		/// <option value="month">month</option>
		/// <option value="year">year</option>
		/// <option value="decade">decade</option>
		/// <option value="century">century</option>
		/// </options>
		depth: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Calendar._FooterConfiguration">
		/// Configuration options for the footer.
		/// </field>
		footer: {get:function(){}},
		/// <field type="Date" defaultValue="11/31/2099">
		/// Specifies the maximum date, which the calendar can show. Default value is Date(2099, 11, 31).
		/// </field>
		max: {get:function(){}, set:function(value){}},
		/// <field type="Date" defaultValue="0/1/1900">
		/// Specifies the minimum date, which the calendar can show. Default value is Date(1900, 0, 1).
		/// </field>
		min: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Calendar._MonthConfiguration">
		/// Templates for the cells rendered in the "month" view.
		/// </field>
		month: {get:function(){}},
		/// <field type="String" defaultValue="month">
		/// Gets or sets the current view.
		/// Valid values are: 'month', 'year', 'decade', 'century'. Default value is "month".
		/// </field>
		/// <options>
		/// <option value="month">month</option>
		/// <option value="year">year</option>
		/// <option value="decade">decade</option>
		/// <option value="century">century</option>
		/// </options>
		view: {get:function(){}, set:function(value){}},
		/// <field type="Date" hidden="true">
		/// Returns the currently focused date.
		/// </field>
		current: {get:function(){}},
		/// <field type="Telerik.UI.Calendar._SelectionConfiguration">
		/// Configures the selection mode of the control.
		/// </field>
		selection: {get:function(){}},
		/// <field type="Date" defaultValue="null">
		/// Specifies the selected date. Default value is null.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		///	Gets or sets an object that contains the start and end date of the current selection. 
		/// Use this property when the selection mode is "singleRange".
		/// The object has two properties: start and end, which are of type Date.
		/// </field>
		selectedDateRange: {get:function(){}, set:function(value){}},
		/// <field type="Array" elementType="Object">
		///	Gets or sets an array of objects containing the start and end dates of each selected range.
		/// The elements of the array have two properties: start and end, which are of type Date.
		/// Use this property when the selection mode is "multipleRanges".
		/// </field>
		selectedDateRanges: {get:function(){}, set:function(value){}},
		navigate: function (value, view) {
			/// <summary>
			/// Navigates to the value in the specified view.
			/// View defaults to 'month'.
			/// Value defaults to today.
			/// </summary>
			/// <param name="value" type="Date" optional="true">The value to navigate to.</param>
			/// <param name="view" type="string" optional="true">The view to navigate to.</param>
},
		navigateDown: function (value) {
			/// <summary>
			/// Navigates with one step to a more specific period view.
			/// </summary>
			/// <param name="value" type="Date">The value to navigate to.</param>
},
		navigateToFuture: function () {
			/// <summary>
			/// Navigates to the next period (e.g. month, year, century, decade).
			/// </summary>
},
		navigateToPast: function () {
			/// <summary>
			/// Navigates to the previous period (e.g. month, year, century, decade).
			/// </summary>
},
		navigateUp: function (value) {
			/// <summary>
			/// Navigates with one step to a more general period view.
			/// </summary>
			/// <param name="value" type="Date" optional="true">The value to navigate to.</param>
},
		destroy: function (keepEvents) {
			/// <excludetoc />
			/// <summary>
			/// Destroys the widget and clears the content of the container element.
			/// Does not remove the container element from the DOM.
			/// </summary>
},
		});
	WinJS.Class.mix(RadCalendar, WinJS.Utilities.createEventProperties('navigate', 'change'));
	namespace('Telerik.UI', {
		RadCalendar: RadCalendar
	});
})(this, jQuery);
(function (global, $, undefined) {
	var RELATIVE = 'relative',
		HIDDEN = 'hidden',
		DIV = '<div/>',
		DISPLAY = 'display',
		THEAD = 'thead',
		transitions = kendo.support.transitions,
        transitionOrigin = transitions ? transitions.css + "transform-origin" : "",
		kendoPrototype = kendo.ui.Calendar.prototype,
        kendoNavigate = kendoPrototype.navigate,
		animationTo,
        animationGrid;
	kendoPrototype.navigate = function (value, view, fnRefreshVisualState, skipNavigateIfOtherMonth, transferClasses) {
		if (skipNavigateIfOtherMonth) {
			this._changeView = true;
			return;
		}
		kendoNavigate.call(this, value, view);
		if (animationTo && animationGrid) {
			if (fnRefreshVisualState) {
				fnRefreshVisualState(animationTo);
			}
			if (transferClasses) {
				transferClasses(animationTo, animationGrid);
			}
		}
		else if (animationTo) {
			if (fnRefreshVisualState) {
				fnRefreshVisualState(animationTo);
			}
			// SELECTED RANGE STATE SEQ. 2
			animationTo = null; // Nullify here, because the animation complete callback will not fire in this case.
			// This code runs when the views are changed too quickly for an animation to occur.
		}
	};
	kendoPrototype._animate = function (options, fnRefreshVisualState) {
		var that = this,
			from = options.from,
			to = options.to,
			active = that._active;
		if (that._cellsHeight) {
			// Sets the Calendar cells's height only if we have cached ones
			var height = that._view.name === "month" ? that._cellsHeight.realMonthHeight : that._cellsHeight.realMetaHeight;
			to.find("td").height(height);
		}
		if (!from) {
			to.insertAfter(that.element[0].firstChild);
			that._bindTable(to);
		} else if (from.parent().data("animating")) {
			from.parent().kendoStop(true, true).remove();
			from.remove();
			to.insertAfter(that.element[0].firstChild);
			// SELECTED RANGE STATE SEQ. 1
			// Store a reference to the to table because navigate is called after that
			// and the selected range state is applied there.
			animationTo = to;
			that._focusView(active);
		} else if (!from.is(":visible") || that.options.animation === false) {
			to.insertAfter(from);
			from.remove();
			that._focusView(active);
		} else {
			that[options.vertical ? "_vertical" : "_horizontal"](from, to, options.future);
		}
	};
	kendoPrototype._horizontal = function (from, to, future) {
		var that = this,
			active = that._active,
			horizontal = that.options.animation.horizontal,
			effects = horizontal.effects,
			// Use precise height otherwise the calendar header jumps with one pixel
			// at the start and end of the animation.
			viewHeight = from[0].getBoundingClientRect().height,
			header = from.find('thead')[0],
			headerHeight = header ? header.getBoundingClientRect().height : 0,
			animatedViewHeight = viewHeight - headerHeight,
			grid = animationGrid = $(from).clone().css({
				position: 'absolute',
				top: from.prev()[0].offsetHeight,
				zIndex: 1
			}),
			filler = $('<div></div>').css({
				height: headerHeight
			});
		animationTo = to.addClass('t-animation-to-grid');
		grid.addClass("t-animation-grid");
		grid.find('a').css('visibility', HIDDEN);
		grid.find('th').css('background-color', that.element[0].currentStyle.backgroundColor);
		grid.find('.k-state-selected').removeClass('k-state-selected');
		grid.find('.k-state-focused').removeClass('k-state-focused');
		grid.find('.k-today').removeClass('k-today');
		if (effects && effects.indexOf('slideIn') != -1) {
			from.add(to).find('thead').css(DISPLAY, 'none');
			from.add(to).find('td').css({ borderColor: 'transparent' });
			from.wrap($(DIV).css({
					position: RELATIVE,
					height: (animatedViewHeight * 2)
				}))
				.parent().wrap($(DIV).css({
					overflow: HIDDEN,
					height: animatedViewHeight,
					position: 'relative',
					zIndex: 2
				})).addClass('t-animating')
				.parent().before(filler).after(grid);
			that._focusView(active, from);
			to[future ? 'insertAfter' : 'insertBefore'](from);
			// Set top after the to table has been added
			// otherwise the animation container is off with one (possibly more in some cases) pixels.
			from.parent().css({
				top: future ? 0 : -animatedViewHeight
			});
			$.extend(horizontal, {
				effects: 'slideIn:' + (future ? 'down' : 'up'),
				complete: function () {
					from.add(to).find('td, th').css({
						borderColor: ''
					});
					from.add(to).find('thead').css(DISPLAY, '');
					from.remove();
					filler.remove();
					grid.remove();
					to.parent().unwrap();
					to.unwrap();
					to.removeClass('t-animation-to-grid');
					that._focusView(active);
					that._oldTable = undefined;
					animationTo = null;
					animationGrid = null;
				}
			});
			from.parent().kendoStop(true, true).kendoAnimate(horizontal);
		}
	};
	kendoPrototype._vertical = function (from, to) {
		var that = this,
			vertical = that.options.animation.vertical,
			effects = vertical.effects,
			active = that._active, //active state before from's blur
			position;
		if (effects && effects.indexOf("zoom") != -1) {
			to.css({
				position: "absolute",
				top: from.prev()[0].offsetHeight,
				left: 0
			}).insertBefore(from);
			if (transitionOrigin) {
				position = (parseInt(from.width() / 2, 10)) + "px" + " " + (parseInt(from.height() / 2, 10) + "px");
				to.css(transitionOrigin, position);
			}
			from.kendoStop(true, true).kendoAnimate({
				effects: "fadeOut",
				duration: 367,
				complete: function() {
					from.remove();
					to.css({
						position: "static",
						top: 0,
						left: 0
					});
					that._focusView(active);
					that._oldTable = undefined;
				}
			});
			// SELECTED RANGE STATE SEQ. 1
			// Store a reference to the to table because navigate is called after that
			// and the selected range state is applied there.
			animationTo = to;
			to.kendoStop(true, true).kendoAnimate(vertical);
		}
	};
	(function (originalFocusView) {
		originalFocusView = kendoPrototype._focusView;
		kendoPrototype._focusView = function () {
			var that = this;
			if (that._table.parent().data('animating')) {
				return;
			}
			originalFocusView.apply(that, arguments);
		};
	})();
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	/*
		Events to emit:
			+ mouseDown
			+ mouseMove
			+ mouseUp
			+ tap
			- hold
			+ gesture
			- gestureWhileHolding
			- gestureWhileHoldingEnd
			+ gestureEnd
	*/
	var MOUSE = 'mouse',
		pevent = Telerik.Utilities._pointerEvent;
	var InteractionEvents = WinJS.Class.define(function (calendar) {
		var that = this;
		that._calendar = calendar;
		that._container = calendar.element;
		that._initialize();
	}, {
		_calendar: null,
		_container: null,
		_target: null,
		_gr: null,
		_isMouseClick: false,
		calendar: {
			get: function () {
				return this._calendar;
			}
		},
		_bindEventHandlers: function () {
			var that = this;
			that._onClick = that._onClick.bind(that);
			that._onPointerDown = that._onPointerDown.bind(that);
			that._onPointerMove = that._onPointerMove.bind(that);
			that._onPointerUp = that._onPointerUp.bind(that);
			that._onManipulationUpdated = that._onManipulationUpdated.bind(that);
			that._onManipulationCompleted = that._onManipulationCompleted.bind(that);
			that._onTapped = that._onTapped.bind(that);
			that._onHolding = that._onHolding.bind(that);
		},
		_isHolding: false,
		_initialize: function () {
			var that = this,
				container = that._container,
				gr;
			that._gr = gr = new Windows.UI.Input.GestureRecognizer();
			gr.showGestureFeedback = false;
			gr.gestureSettings =
				Windows.UI.Input.GestureSettings.manipulationTranslateY |
				Windows.UI.Input.GestureSettings.manipulationScale |
				Windows.UI.Input.GestureSettings.tap |
				Windows.UI.Input.GestureSettings.hold;
			that._bindEventHandlers();
			// Register event listeners for the gestures that we just configured
			gr.addEventListener('manipulationstarted', that._onManipulationUpdated);
			gr.addEventListener('manipulationupdated', that._onManipulationUpdated);
			gr.addEventListener('manipulationcompleted', that._onManipulationCompleted);
			gr.addEventListener('tapped', that._onTapped);
			gr.addEventListener('holding', that._onHolding);
			container.addEventListener('click', that._onClick, false);
			container.addEventListener(pevent("down"), that._onPointerDown, false);
			container.addEventListener(pevent("move"), that._onPointerMove, false);
			container.addEventListener(pevent("cancel"), that._onPointerUp, false);
			container.addEventListener('dragstart', that._cancelEvent, false);
			// Listen on the document to catch pointer ups outside of the Calendar.
			// Listening only on the calendar prevents pointers ending outside of it
			// to be tracked again, which results in the exceptions caught in the
			// pointer event handlers below.
			document.addEventListener(pevent("up"), that._onPointerUp, false);
		},
		destroy: function () {
			var that = this,
				container = that._container,
				gr = that._gr;
			container.removeEventListener('click', that._onClick, false);
			container.removeEventListener(pevent("down"), that._onPointerDown, false);
			container.removeEventListener(pevent("move"), that._onPointerMove, false);
			container.removeEventListener(pevent("cancel"), that._onPointerUp, false);
			document.removeEventListener(pevent("up"), that._onPointerUp, false);
			container.removeEventListener('dragstart', that._cancelEvent, false);
			gr.removeEventListener('manipulationstarted', that._onManipulationUpdated);
			gr.removeEventListener('manipulationupdated', that._onManipulationUpdated);
			gr.removeEventListener('manipulationcompleted', that._onManipulationCompleted);
			gr.removeEventListener('tapped', that._onTapped);
			gr.removeEventListener('holding', that._onHolding);
			that._calendar = null;
			that._container = null;
			that._target = null;
			that._gr = null;
		},
		_cancelEvent: function (e) {
			e.preventDefault();
		},
		_onClick: function (e) {
			var that = this;
			if (that._isMouseClick) {
				that.dispatchEvent('click', {
					target: e.target,
					originalEvent: e
				});
				that._isMouseClick = false;
			}
		},
		_onPointerDown: function (e) {
			var that = this,
				pp;
			that._target = e.target;
			// If pointer is MOUSE, re-dispatch the event to listeners.
			// Otherwise, feed the gesture recognizer.
			if (e.pointerType == e.MSPOINTER_TYPE_MOUSE || e.pointerType == MOUSE) { // Remove the first check when IE stops supporting the old model (long).
				that.dispatchEvent('pointerDown', {
					originalEvent: e
				});
			}
			else {
				try {
					pp = e.getCurrentPoint(that._container);
					// Abusing the calendar with > 2 contact points breaks the gesture recognizer,
					// so at least suppress the exceptions.
					that._gr.processDownEvent(pp);
				} catch (e) { }
			}
		},
		_onPointerMove: function (e) {
			var that = this,
				pps;
			that._target = e.target;
			// If pointer is MOUSE, re-dispatch the event to listeners.
			// Otherwise, feed the gesture recognizer.
			if (e.pointerType == e.MSPOINTER_TYPE_MOUSE || e.pointerType == MOUSE) { // Remove the first check when IE stops supporting the old model (long).
				that.dispatchEvent('pointerMove', {
					target: e.target
				});
			}
			else {
				try {
					pps = e.getIntermediatePoints(that._container);
					// Abusing the calendar with > 2 contact points breaks the gesture recognizer,
					// so at least suppress the exceptions.
					that._gr.processMoveEvents(pps);
				} catch (e) { }
			}
		},
		_onPointerUp: function (e) {
			var that = this,
				pp;
			// If pointer is MOUSE, re-dispatch the event to listeners.
			// Otherwise, feed the gesture recognizer.
			if (e.pointerType == e.MSPOINTER_TYPE_MOUSE || e.pointerType == MOUSE) { // Remove the first check when IE stops supporting the old model (long).
				that._isMouseClick = true;
				that.dispatchEvent('pointerUp', {
					target: e.target
				});
			}
			else {
				try {
					pp = e.getCurrentPoint(that._container);
					// Abusing the calendar with > 2 contact points breaks the gesture recognizer,
					// so at least suppress the exceptions.
					that._gr.processUpEvent(pp);
				} catch (e) { }
				that._target = null;
			}
		},
		_onManipulationUpdated: function (e) {
			var that = this;
			if (that._isHolding) {
				that.dispatchEvent('gestureWhileHolding', {
					target: that._target
				});
			}
			else {
				that.dispatchEvent('gesture', {
					delta: e.delta,
					completeGesture: function () {
						that._gr.completeGesture();
					}
				});
			}
		},
		_onManipulationCompleted: function (e) {
			var that = this;
			if (that._isHolding) {
				that.dispatchEvent('gestureWhileHoldingEnd', {
					target: that._target
				});
				that._isHolding = false;
			}
			else {
				that.dispatchEvent('gestureEnd');
			}
		},
		_onTapped: function (e) {
			var that = this;
			that.dispatchEvent('tap', {
				target: that._target
			});
		},
		_onHolding: function (e) {
			var that = this;
			if (e.holdingState == Windows.UI.Input.HoldingState.started) {
				that.dispatchEvent('hold', {
					target: that._target
				});
				that._isHolding = true;
			}
			else if (e.holdingState == Windows.UI.Input.HoldingState.completed) {
				that.dispatchEvent('holdEnd');
				that._isHolding = false;
			}
		}
	});
	WinJS.Class.mix(InteractionEvents, WinJS.Utilities.eventMixin);
	WinJS.Namespace.define('Telerik.UI.Calendar', {
		_InteractionEvents: InteractionEvents
	});
})(this, jQuery);(function (global, $, undefined) {
	var DATE = Date,
		keys = kendo.keys;
	function getToday() {
		var today = new DATE();
		return new DATE(today.getFullYear(), today.getMonth(), today.getDate());
	}
	function restrictValue(value, min, max) {
		var today = getToday();
		if (value) {
			today = new DATE(+value);
		}
		if (min > today) {
			today = new DATE(+min);
		} else if (max < today) {
			today = new DATE(+max);
		}
		return today;
	}
	kendo.ui.Calendar.prototype._move = function (e) {
		var that = this,
			options = that.options,
			key = e.keyCode,
			view = that._view,
			index = that._index,
			currentValue = new DATE(+that._current),
			isRtl = kendo.support.isRtl(that.wrapper),
			value, prevent, method, temp;
		if (e.target === that._table[0]) {
			that._active = true;
		}
		if (e.ctrlKey) {
			if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
				that.navigateToFuture();
				prevent = true;
			} else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
				that.navigateToPast();
				prevent = true;
			} else if (key == keys.UP) {
				that.navigateUp();
				prevent = true;
			//} else if (key == keys.DOWN) {
			//	that._click($(that._cell[0].firstChild));
			//	prevent = true;
			}
		} else {
			if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
				value = 1;
				prevent = true;
			} else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
				value = -1;
				prevent = true;
			} else if (key == keys.UP) {
				// Original meta view has three columns,
				// whereas ours has two.
				//value = index === 0 ? -7 : -4;
				value = index === 0 ? -7 : -2;
				prevent = true;
			} else if (key == keys.DOWN) {
				// Original meta view has three columns,
				// whereas ours has two.
				//value = index === 0 ? 7 : 4;
				value = index === 0 ? 7 : 2;
				prevent = true;
			// Handle Enter in our code because of the different selection modes.
			//} else if (key == keys.ENTER) {
			//	that._click($(that._cell[0].firstChild));
			//	prevent = true;
			} else if (key == keys.HOME || key == keys.END) {
				method = key == keys.HOME ? "first" : "last";
				temp = view[method](currentValue);
				currentValue = new DATE(temp.getFullYear(), temp.getMonth(), temp.getDate(), currentValue.getHours(), currentValue.getMinutes(), currentValue.getSeconds(), currentValue.getMilliseconds());
				prevent = true;
			} else if (key == keys.PAGEUP) {
				prevent = true;
				that.navigateToPast();
			} else if (key == keys.PAGEDOWN) {
				prevent = true;
				that.navigateToFuture();
			}
			if (value || method) {
				if (!method) {
					view.setDate(currentValue, value);
				}
				that._focus(restrictValue(currentValue, options.min, options.max));
			}
		}
		if (prevent) {
			e.preventDefault();
		}
		return that._current;
	};
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	var SWIPETRESHOLD = .2;
	WinJS.Namespace.define('Telerik.UI.Calendar', {
		_NavigationInteraction: WinJS.Class.define(function (calendar) {
			var that = this;
			that._calendar = calendar;
			that._initialize();
		}, {
			_calendar: null,
			_isSwiping: false,
			_initialize: function() {
				var that = this,
					events = that._calendar._interactionEvents;
				that._onGesture = that._onGesture.bind(that);
				that._onGestureEnd = that._onGestureEnd.bind(that);
				events.addEventListener('gesture', that._onGesture, false);
				events.addEventListener('gestureEnd', that._onGestureEnd, false);
			},
			destroy: function () {
				var that = this,
					events = that._calendar._interactionEvents;
				events.removeEventListener('gesture', that._onGesture, false);
				events.removeEventListener('gestureEnd', that._onGestureEnd, false);
				that._calendar = null;
			},
			_onGesture: function (e) {
				if (e.detail.delta) {
					var that = this,
						calendar = that._calendar,
						translationY = e.detail.delta.translation.y,
						expansion = e.detail.delta.expansion;
					if (expansion < -SWIPETRESHOLD) { // detect only pinch
						calendar.navigateUp(new Date());
					}
					else if (Math.abs(translationY) >= SWIPETRESHOLD && !that._isSwiping) { // swipe
						that._isSwiping = true;
						if (translationY < 0) {
							calendar.navigateToFuture();
						}
						else {
							calendar.navigateToPast();
						}
					}
					e.detail.completeGesture();
				}
			},
			_onGestureEnd: function () {
				this._isSwiping = false;
			}
		})
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var nsName = "Telerik.UI.Scheduler",
		namespace = WinJS.Namespace.define,
		derive = WinJS.Class.derive;
	/// <excludetoc />
	var _DateTimePicker = derive(Telerik.UI._Disposable, function (input) {
		/// <excludetoc />
		/// <summary>
		/// For internal use only.
		/// </summary>
}, {
		});
	namespace(nsName, {
		_DateTimePicker: _DateTimePicker
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var nsName = "Telerik.UI.Scheduler",
		namespace = WinJS.Namespace.define,
		derive = WinJS.Class.derive,
		config = Telerik.UI._ControlConfiguration,
		util = Telerik.Utilities,
		templateValidator = util._validators.unifiedTemplate,
		defineProperty = config.defineProperty,
		priv = util.setPrivate,
		getMapping = config.getMapping,
		DataSource = Telerik.Data.DataSource;
	//common = Telerik.UI.Common,
	//cul = Telerik.Culture,
	//NULL = null,
	//SANS12 = "12px Arial,Helvetica,sans-serif",
	var Resource = derive(config, function () {
		/// <summary>
		/// A class representing a scheduler resource.
		/// </summary>
}, {
		/// <field type="String" defaultValue="color">
		/// The field of the resource data item which contains the resource color.
		/// </field>
		dataColorField: defineProperty("dataColorField", "color"),
		/// <field type="Telerik.Data.DataSource">
		/// The data source which contains resource data items. Can be a JavaScript object which represents a valid data source configuration, a JavaScript array or an existing Telerik.Data.DataSource instance.
		/// If the dataSource option is set to a JavaScript object or array the widget will initialize a new Telerik.Data.DataSource instance using that value as data source configuration.
		/// If the dataSource option is an existing Telerik.Data.DataSource instance the widget will use that instance and will not initialize a new one.
		/// </field>
		dataSource: {get:function(){}, set:function(value){}},
		/// <field type="String" defaultValue="text">
		/// The field of the resource data item which represents the resource text.
		/// </field>
		dataTextField: defineProperty("dataTextField", "text"),
		/// <field type="String" defaultValue="value">
		/// The field of the resource data item which represents the resource value. The resource value is used to link a scheduler event with a resource.
		/// </field>
		dataValueField: defineProperty("dataValueField", "value"),
		/// <field type="String">
		/// The field of the scheduler event which contains the resource id.
		/// </field>
		field: defineProperty("field", ""),
		/// <field type="Boolean" defaultValue="false">
		/// If set to true the scheduler event can be assigned multiple instances of the resource. The scheduler event field specified via the field option will contain an array of resources. By default only one resource instance can be assigned to an event.
		/// </field>
		multiple: defineProperty("multiple", false),
		/// <field type="String">
		/// The name of the resource used to distinguish resource. If not set the value of the field option is used.
		/// </field>
		name: defineProperty("name", ""),
		/// <field type="String">
		/// The user friendly title of the resource displayed in the scheduler edit form. If not set the value of the field option is used.
		/// </field>
		title: defineProperty("title", ""),
		/// <field type="Boolean" defaultValue="true">
		/// Set to false if the scheduler event field specified via the field option contains a resource data item. By default the scheduler expects that field to contain a primitive value (string, number) which corresponds to the "value" of the resource (specified via dataValueField).
		/// </field>
		valuePrimitive: defineProperty("valuePrimitive", true)
		});
	var _GroupConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the properties of a chart title.
		/// </summary>
}, {
		/// <field type="Array">
		///An array of resource names by which the scheduler events will be grouped.
		/// </field>
		resources: defineProperty("resources", []),
		/// <field type="String" defaultValue="horizontal">
		/// The orientation of the group headers. Supported values are "horizontal" or "vertical". Note that the agenda view is always in vertical orientation.
		/// Default value is "horizontal".
		/// </field>
		/// <options>
		/// <option value="horizontal">horizontal</option>
		/// <option value="vertical">vertical</option>
		/// </options>
		orientation: defineProperty("orientation", "top")
	});
	var _EditableConfiguration = derive(config, function (owner, parentMapping, defaults) {
		/// <summary>
		/// For internal usage only. Describes the editing properties in a scheduler.
		/// </summary>
}, {
		/// <field type="Boolean" defaultvalue="false">
		/// If set to true the user would be able to create new scheduler events and modify or delete existing ones. Default is false.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultvalue="true">
		/// If set to true the user can create new events. Default is true.
		/// </field>
		create: defineProperty("create", true),
		/// <field type="Boolean" defaultvalue="true">
		/// If set to true the user can delete events from the view by clicking the "destroy" button. Default is true.
		/// </field>
		destroy: defineProperty("destroy", true),
		/// <field type="Boolean" defaultvalue="true">
		/// If set to true the scheduler allows event resizing. Dragging the resize handles changes the start or end time of the event. Default is true.
		/// </field>
		resize: defineProperty("resize", true),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template which renders the editor.
		/// The template should contain elements whose name HTML attributes are set as the editable fields.
		/// This is how the scheduler will know which field to update.
		/// </field>
		template: defineProperty("template", null),
		/// <field type="Boolean" defaultvalue="true">
		/// If set to true the user can update events. Default is true.
		/// </field>
		update: defineProperty("update", true)
		});
	var View = derive(config, function () {
		/// <summary>
		/// A class representing a scheduler view.
		/// </summary>
}, {
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template to be used to render the "all day" scheduler events.
		/// The fields which can be used in the template are:
		/// description [String] - the event description; 
		/// end [Date] - the event end date; 
		/// resources [Array] - the event resources; 
		/// start [Date] - the event start date; 
		/// title [String] - the event title 
		/// </field>
		allDayEventTemplate: defineProperty("allDayEventTemplate", null),
		/// <field type="Boolean" defaultValue="true">
		/// If set to true the scheduler will display a slot for "all day" events.
		/// </field>
		allDaySlot: defineProperty("allDaySlot", true),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the date header cells.
		/// By default the scheduler renders the date using the current culture date format.
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		dateHeaderTemplate: defineProperty("dateHeaderTemplate", null),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the day slots in month view. The dayTemplate option is only supported when views.type is set to "month".
		/// The fields which can be used in the template are:
		/// date [Date] - represents the current day.
		/// </field>
		dayTemplate: defineProperty("dayTemplate", null),
		/// <field type="Telerik.UI.Common._BoxConfiguration">
		/// Sets whether the user would be able to create new scheduler events and modify or delete existing ones.
		/// Overrides the editable option of the scheduler.
		/// </field>
		editable: {get:function(){}},
		/// <field type="Date">
		/// The end time of the view. The scheduler will display events ending before the endTime.
		/// </field>
		endTime: defineProperty("endTime", null),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used by the agenda view to render the date of the scheduler events.
		/// The fields which can be used in the template are:
		/// date [Date] - represents the event date.
		/// </field>
		eventDateTemplate: defineProperty("eventDateTemplate", null),
		/// <field type="Number" defaultValue="25">
		/// The height of the scheduler event rendered in month view.
		/// </field>
		eventHeight: defineProperty("eventHeight", 25),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template to be used to render the scheduler events.
		/// The fields which can be used in the template are:
		/// description [String] - the event description; 
		/// end [Date] - the event end date; 
		/// resources [Array] - the event resources; 
		/// start [Date] - the event start date; 
		/// title [String] - the event title 
		/// </field>
		eventTemplate: defineProperty("eventTemplate", null),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template to be used to render the agenda view scheduler events. The eventTimeTemplate option is onlt supported when views.type is set to "agenda".
		/// The fields which can be used in the template are:
		/// description [String] - the event description; 
		/// end [Date] - the event end date; 
		/// isAllDay [Boolean] - if true the event is "all day"; 
		/// resources [Array] - the event resources; 
		/// start [Date] - the event start date; 
		/// title [String] - the event title 
		/// </field>
		eventTimeTemplate: defineProperty("eventTimeTemplate", null),
		//////////////////////////////////////////////////////////////////////////////////////Group
		/// <field type="Number" defaultValue="60">
		/// The number of minutes represented by a major tick. The majorTick option is supported only when views.type is set to "day" or "week".
		/// </field>
		majorTick: defineProperty("majorTick", 60),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the major ticks. The majorTimeHeaderTemplate option is supported when views.type is set to "day" or "week".
		/// By default the scheduler renders the time using the current culture date format.
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		majorTimeHeaderTemplate: defineProperty("majorTimeHeaderTemplate", null),
		/// <field type="Number" defaultValue="2">
		/// The number of time slots to display per major tick. The minorTickCount option is supported when views.type is set to "day" or "week".
		/// </field>
		minorTickCount: defineProperty("minorTickCount", 2),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the minor ticks. The minorTimeHeaderTemplate option is supported when views.type is set to "day" or "week".
		/// By default the scheduler renders a space " ".
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		minorTimeHeaderTemplate: defineProperty("minorTimeHeaderTemplate", null),
		/// <field type="Boolean" defaultValue="false">
		/// If set to true the view will be initially selected by the scheduler widget. If more than one view is selected then the last one will be used.
		/// </field>
		selected: defineProperty("selected", false),
		/// <field type="String">
		/// The format used to display the selected date. Contains two placeholders - "{0}" and "{1}" which represent the start and end date displayed by the view.
		/// </field>
		selectedDateFormat: defineProperty("selectedDateFormat", ""),
		/// <field type="Date">
		/// The start time of the view. The scheduler will display events starting after the startTime.
		/// </field>
		startTime: defineProperty("startTime", null),
		//HACK - the title is not shown - instead we show icons.
		/// <field type="String">
		/// The user-friendly title of the view displayed by the scheduler.
		/// </field>
		//title: defineProperty("title", ""),
		/// <field type="String">
		/// The type of the view. The built-in views are: "day", "week", "month" and "agenda".
		/// </field>
		/// <options>
		/// <option value="day">day</option>
		/// <option value="week">week</option>
		/// <option value="month">month</option>
		/// <option value="agenda">agenda</option>
		/// </options>
		type: {get:function(){}, set:function(value){}}
		});
	namespace(nsName, {
		_GroupConfiguration: _GroupConfiguration,
		_EditableConfiguration: _EditableConfiguration,
		Resource: Resource,
		View: View
	});
})(this, jQuery);(function (global, $, undefined) {
	var namespace = WinJS.Namespace.define,
		derive = WinJS.Class.derive;
	var SchedulerDataSource = derive(Telerik.Data.DataSource, function (options) {
		/// <summary>
		/// Initializes a new instance of the Telerik.Data.SchedulerDataSource component.
		/// </summary>
		/// <param name="options" type="Object" optional="true">The configuration options for this SchedulerDataSource component.</param>
		/// <event name="change">Fires when the underlying data is changed.</event>
		/// <event name="error" type="Telerik.Data.DataSource.ErrorEventArgs">
		/// Fires when an error occurs during data retrieval.
		/// <param name="errorThrown" type="Object">An object containing information about the thrown error. 
		/// It includes: description, message, number and stack properties.</param>
		/// <param name="status" type="String">A string describing the type of the error.</param>
		/// <param name="xhr" type="Object">The xhr object of the request.</param>
		/// </event>
		/// <event name="requeststart">Fires before a data request is made.</event>
		/// <event name="requestend" type="Telerik.Data.DataSource.RequestEndEventArgs">
		/// Fires when a request ends.
		/// <param name="requestType" type="String">The type of the request-"create", "read", "update" or "destroy".</param>
		/// <param name="response" type="Object">The raw remote service response.</param>
		/// </event>
		/// <event name="sync">Fires after changes are synced.</event>
},
	{
	});
	namespace("Telerik.Data", {
		SchedulerDataSource: SchedulerDataSource
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		utilities = win.Utilities,
		derive = win.Class.derive,
		config = Telerik.UI._ControlConfiguration,
		defineProperty = config.defineProperty,
		namespace = win.Namespace.define,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		templateValidator = util._validators.unifiedTemplate,
		DataSource = Telerik.Data.DataSource,
		SchedulerDataSource = Telerik.Data.SchedulerDataSource,
		ui = Telerik.UI,
		mix = WinJS.Class.mix,
		FUNCTION = "function",
		OBJECT = "object";
	/// <summary>
	/// Scheduler control - CTP version
	/// </summary>
	/// <icon src="scheduler_html_12.png" width="12" height="12" />
	/// <icon src="scheduler_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div style="height: 600px" data-win-control="Telerik.UI.RadScheduler"></div>]]></htmlSnippet>
	/// <event name="remove">Fired when the user clicks the "destroy" button.</event>
	/// <event name="edit">Fired when the user opens a scheduler event in edit mode by or creates a new event.</event>
	/// <event name="cancel">Fired when the user cancels editing by clicking the "cancel" button.</event>
	/// <event name="save">Fired when the user saves a scheduler event by clicking the "save" button.</event>
	/// <event name="add">Fired when the a new event is about to be added.</event>
	/// <event name="databinding">Fired before the scheduler binds to its data source.</event>
	/// <event name="databound">Fired after the scheduler binds to its data source.</event>
	/// <event name="movestart">Fired when the user starts to drag an event.</event>
	/// <event name="move">Fired when the user is moving an event.</event>
	/// <event name="moveend">Fired when the user stops moving an event.</event>
	/// <event name="resizestart">Fired when the user starts to resize an event.</event>
	/// <event name="resize">Fired when the user is resizing an event.</event>
	/// <event name="resizeend">Fired when the user releases the mouse after resizing an event.</event>
	/// <event name="navigate">Fired when the user changes selected date, view or of the scheduler.</event>
	/// <part name="scheduler" class="t-scheduler">The RadScheduler widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadScheduler = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// Creates a new RadScheduler control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		refresh: function (isInitial) {
			/// <summary>
			/// This function is used to redraw the scheduler control and refresh its data.
			/// </summary>
},
		/// <field type="Object">
		/// Gets the localization messages used by the control.
		/// </field>
		messages: {},
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template to be used to render the "all day" scheduler events.
		/// The fields which can be used in the template are:
		/// description [String] - the event description; 
		/// end [Date] - the event end date; 
		/// isAllDay [Boolean] - if true the event is "all day"; 
		/// resources [Array] - the event resources; 
		/// start [Date] - the event start date; 
		/// title [String] - the event title 
		/// </field>
		allDayEventTemplate: defineProperty("allDayEventTemplate", null),
		/// <field type="Boolean" defaultValue="true">
		/// If set to true the scheduler will display a slot for "all day" events.
		/// </field>
		allDaySlot: defineProperty("allDaySlot", true),
		/// <field type="Telerik.Data.SchedulerDataSource">
		/// Gets or sets the data source object for the scheduler.
		/// </field>
		dataSource: {get:function(){}, set:function(value){}},
		/// <field type="Date">
		/// The current date of the scheduler. Used to determine the period which is displayed by the control.
		/// </field>
		date: defineProperty("date", null),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the date header cells.
		/// By default the scheduler renders the date using the current culture date format.
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		dateHeaderTemplate: defineProperty("dateHeaderTemplate", null),
		/// <field type="Telerik.UI.Scheduler._EditableConfiguration">
		/// Gets and sets the editing related (create/update/delete) options for the scheduler.
		/// </field>
		editable: {get:function(){}, set:function(value){}},
		/// <field type="Date">
		/// The end time of the week and day views. The scheduler will display events ending before the endTime.
		/// </field>
		endTime: defineProperty("endTime", null),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the scheduler events.
		/// The fields which can be used in the template are:
		/// description [String] - the event description; 
		/// end [Date] - the event end date; 
		/// resources [Array] - the event resources; 
		/// start [Date] - the event start date; 
		/// title [String] - the event title
		/// </field>
		eventTemplate: defineProperty("eventTemplate", null),
		/// <field type="Telerik.UI.Scheduler._GroupConfiguration">
		/// The configuration of the scheduler resource(s) grouping.
		/// </field>
		group: {get:function(){}},
		/// <field type="Number">
		/// Sets the height of the scheduler.
		/// </field>
		height: defineProperty("height", null),
		/// <field type="Number" defaultValue="60">
		/// The number of minutes represented by a major tick.
		/// </field>
		majorTick: defineProperty("majorTick", 60),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the major ticks.
		/// By default the scheduler renders the time using the current culture date format.
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		majorTimeHeaderTemplate: defineProperty("majorTimeHeaderTemplate", null),
		/// <field type="Number" defaultValue="2">
		/// The number of time slots to display per major tick.
		/// </field>
		minorTickCount: defineProperty("minorTickCount", 2),
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// The template used to render the minor ticks.
		/// By default the scheduler renders a space " ".
		/// The fields which can be used in the template are:
		/// date [Date] - represents the major tick date.
		/// </field>
		minorTimeHeaderTemplate: defineProperty("minorTimeHeaderTemplate", null),
		/// <field type="Array" elementType="Telerik.UI.Scheduler.Resource">
		/// The configuration of the scheduler resource(s). A scheduler resource is optional metadata that can be associated with a scheduler event.
		/// </field>
		resources: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// If set to true the user would be able to select scheduler cells and events. By default selection is disabled.
		/// </field>
		selectable: defineProperty("selectable", false),
		/// <field type="Date">
		/// The start time of the week and day views. The scheduler will display events starting after the startTime.
		/// </field>
		startTime: defineProperty("startTime", null),
		/// <field type="String">
		/// The timezone which the scheduler will use to display the scheduler appointment dates. By default the current system timezone is used. This is an acceptable default when the scheduler control is bound to local array of events. It is advisable to specify a timezone if the scheduler is bound to a remote service. That way all users would see the same dates and times no matter their configured system timezone.
		/// </field>
		timezone: defineProperty("timezone", null),
		/// <field type="Object" readonly="true">
		/// Gets the current scheduler view object.
		/// </field>
		view: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.Scheduler.View">
		/// The views displayed by the scheduler and their configuration. The array items can be either objects specifying the view configuration or strings representing the view types (assuming default configuration). By default the RadScheduler control displays "day" and "week" views.
		/// </field>
		views: {get:function(){}, set:function(value){}},
		/// <field type="Number" defaultValue="null">
		/// Sets the width of the scheduler.
		/// </field>
		width: defineProperty("width", null),
		addEvent: function (data) {
			/// <summary>
			/// Adds a new scheduler event and opens the edit form.
			/// </summary>
			/// <param name="data" type="Object">The object containing the scheduler event fields.</param>
},
		cancelEvent: function () {
			/// <summary>
			/// Cancels the scheduler event editing. Closes the edit form.
			/// </summary>
},
		editEvent: function (event) {
			/// <summary>
			/// Opens the specified scheduler event in the edit form.
			/// </summary>
			/// <param name="event" type="String">The event which should be put in edit mode. Value should be a string which is the uid of the event which should be edited.</param>
},
		removeEvent: function (event) {
			/// <summary>
			/// Removes the specified scheduler event.
			/// </summary>
			/// <param name="event" type="String">The event which should be removed. Value should be a string which is the uid of the event which should be removed.</param>
},
		saveEvent: function () {
			/// <summary>
			/// Saves the scheduler event which is open in the edit form and closes it.
			/// </summary>
},
		setView: function (name) {
			/// <summary>
			/// Sets the scheduler view to the one with the specified name.
			/// </summary>
			/// <param name="name" type="String">The name of the scheduler view (e.g. "month").</param>
}
	});
	mix(RadScheduler, utilities.createEventProperties("remove", "edit", "cancel", "save", "add", "databinding", "databound", "movestart", "move", "moveend", "resizestart", "resize", "resizeend", "navigate"));
	namespace("Telerik.UI", {
		RadScheduler: RadScheduler
	});
	function popupTransition(element, toState) {
		return WinJS.UI.executeTransition(element, {
			property: "transform",
			delay: 0,
			duration: 367,
			timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
			to: toState
		});
	}
	function showPopup(popupContent, that) {
		if (!popupContent || !that) return;
		var defaultPopupHeight = 500,
			view = that.view(),
			table = view && view.table,
			tableHeight = (table && table.height()) || defaultPopupHeight,
			toolbar = table.prev(),
			toolbarHeight = (toolbar && toolbar.length && toolbar[0].offsetHeight) || 0,
			transform = kendo.support.isRtl(popupContent) ? "translateX(-" + popupContent.offsetWidth + "px)" : "translateX(" + popupContent.offsetWidth + "px)";
			popupContent.classList.add("t-dialog-popup");
			popupContent.style.height = tableHeight + "px";
			$(popupContent).css("transform", transform)
								.wrap("<div class='t-popup-wrapper' style='top: " + toolbarHeight + "px'></div>");
			popupTransition(popupContent, "none");
	}
	var old_createPopupEditor = kendo.ui.Scheduler.prototype._createPopupEditor;
	kendo.ui.Scheduler.prototype._createPopupEditor = function (model) {
		var that = this,
	 	oldOpen = kendo.ui.Window.prototype.open;
		kendo.ui.Window.prototype.open = function () { };
		MSApp.execUnsafeLocalFunction(function () {
		    old_createPopupEditor.call(that, model);
		    kendo.ui.Window.prototype.open = oldOpen;
		    var old_close = that._editor.close;
			if (that._editor.container) {// && that._editor.data("PopupEditor")
			    that._editor.close = function () {
			        var popupWrapper = that._editor.container && that._editor.container.parents(".t-popup-wrapper");
			        if (!popupWrapper || !popupWrapper.length) popupWrapper = that.element.parent().find(".t-popup-wrapper");
			        popupWrapper = popupWrapper[0];
			        var ec = that._editor.container && that._editor.container[0];
			        old_close.apply(this, arguments);
			        if (popupWrapper) {
			            popupWrapper.removeNode(true);
			            if (ec) ec.innerText = "";
			        }
			    }
			}
			oldOpen = null;
		});
		var popupContent = document.createElement("div"),
			scheduler = that.element.parent();
		scheduler.find('.t-popup-wrapper').remove();
		popupContent.classList.add("t-edit-dialog");
		scheduler.append(popupContent);
		//move kendow window edit container to popup
		that._editor.container.appendTo(popupContent);
		//replace date inputs with date pickers
		var datePickers = that._editor.container.find("[data-role='datepicker']"), i;
		for (i = 0; i < datePickers.length; i++) {
			datePickers[i].removeNode();
		}
		var dateTimePickers = that._editor.container.find("[data-role='datetimepicker']");
		for (i = 0; i < dateTimePickers.length; i++) {
			new Telerik.UI.Scheduler._DateTimePicker(dateTimePickers[i]);
		}
		if (model.isAllDay) that._editor.container.find(".t-time-picker").css("display", "none");
		showPopup(popupContent, that);
	}
	kendo.ui.Scheduler.prototype.showDialog = function (options) {
		if (!options) return;
		var that = this,
			text = options.text || "",
			buttons = options.buttons || [],
			createButtonClickHandler = function (handler) {
				return function dialogButtonClickHandler(e) {
					if (popupContent) {
						var popupWrapper = $(popupContent).parent(),
							transform = kendo.support.isRtl(popupContent) ? "translateX(-" + popupContent.offsetWidth + "px)" : "translateX(" + popupContent.offsetWidth + "px)";
						popupTransition(popupContent, transform).then(function () {
							popupWrapper[0].removeNode(true);
							popupWrapper = null;
							handler(e);
						});
					}
				};
			},
			popupContent;
		that.cancelEvent();
		that.element.parent().find('.t-popup-wrapper').remove();
		popupContent = document.createElement("div");
		if (text) {
			var textElement = document.createElement("div");
			textElement.className = "t-dialog-text";
			textElement.innerText = text;
			popupContent.appendChild(textElement);
		}
		if (buttons.length) {
			var buttonsElement = document.createElement("div"),
				hasCancelButton = false;
			buttonsElement.className = "t-dialog-buttons";
			for (var i = 0, len = buttons.length; i < len; i++) {
				var buttonElement = document.createElement("a");
				buttonElement.className = "t-dialog-button";
				buttonElement.href = "#";
				buttonElement.innerText = buttons[i].text;
				buttonElement.name = buttons[i].name;
				buttonElement.addEventListener("click", createButtonClickHandler(buttons[i].click), false);
				buttonsElement.appendChild(buttonElement);
				if (buttonElement.name === "canceledit") hasCancelButton = true;
			}
			if (!hasCancelButton) {
				var cancelButton = document.createElement("a");
				cancelButton.className = "t-dialog-button";
				cancelButton.href = "#";
				cancelButton.innerText = that.options.messages.cancel;
				cancelButton.addEventListener("click", createButtonClickHandler(function () { that.cancelEvent() }), false);
				buttonsElement.appendChild(cancelButton);
			}
			popupContent.appendChild(buttonsElement);
		}
		that.element.parent().append(popupContent);
		showPopup(popupContent, that);
	};
	//Fix recurrence editor from throwing unsafe HTML exceptions
	var old_setView = kendo.ui.RecurrenceEditor.prototype.setView;
	kendo.ui.RecurrenceEditor.prototype.setView = function () {
		var args = arguments,
			that = this;
		MSApp.execUnsafeLocalFunction(function () {
			old_setView.apply(that, args);
		});
	}
	//Remove kendo datepicker control so it won't be used automatically
	kendo.ui.roles.datepicker = null;
	//show/hide timepicker on change of isAllDay
	var old_set = kendo.data.SchedulerEvent.prototype.set;
	kendo.data.SchedulerEvent.prototype.set = function (key, value) {
		var that = this,
			isAllDay = that.isAllDay || false;
		if (key == "isAllDay" && value != isAllDay) {
			var elem = window.event && window.event.srcElement;
			if (elem) {
				var editContainer = $(elem).parents(".k-edit-form-container");
				editContainer.find(".t-time-picker").css("display", value ? "none" : "");
				editContainer.find("[data-role='datetimepicker']").each(function (index, item) {
					setImmediate(function myfunction() {
						item.value = (new Date(item.value)).toISOString();
					});
				})
			}
		}
		old_set.apply(that, arguments);
	}
	//change display of view's time span
	function getWeekNumber(oldDate) {
		var weekDate = oldDate ? new Date(oldDate) : new Date();
		weekDate.setHours(0, 0, 0);
		weekDate.setDate(weekDate.getDate() + 4 - (weekDate.getDay() || 7));
		var janFirst = new Date(weekDate.getFullYear(), 0, 1);
		return Math.ceil((((weekDate - janFirst) / 86400000) + 1) / 7);
	}
	var old_renderView = kendo.ui.Scheduler.prototype._renderView;
	kendo.ui.Scheduler.prototype._renderView = function (name) {
		var that = this,
			view = old_renderView.apply(that, arguments),
			messages = (that.options && that.options.messages) || {};
		var newTitle = "";
		switch (name) {
			case "agenda":
				//agenda - Agenda
				newTitle = (messages.views && messages.views.agenda) || "Agenda";
				break;
			case "week":
				//week - prev, this, next week, then week number
				var currentWeekNum = getWeekNumber(),
					viewWeekNum = getWeekNumber(view.endDate()),
					diffWeek = viewWeekNum - currentWeekNum;
				if (diffWeek == 0)
					newTitle = messages.thisWeek || "This Week";
				else
					if (diffWeek == -1)
						newTitle = messages.lastWeek || "Last Week";
					else
						if (diffWeek == 1)
							newTitle = messages.nextWeek || "Next Week";
						else
							newTitle = (messages.week || "Week ") + viewWeekNum;
				break;
			case "day":
				//day - yest, toda, tomr, name of week day
				var currentDayNum = new Date().setHours(0, 0, 0, 0),
					viewDayNum = new Date(view.startDate()).setHours(0, 0, 0, 0),
					diffDay = (viewDayNum - currentDayNum) / 86400000;
				if (diffDay == 0)
					newTitle = messages.today || "Today";
				else
					if (diffDay == -1)
						newTitle = messages.yesterday || "Yesterday";
					else
						if (diffDay == 1)
							newTitle = messages.tomorrow || "Tomorrow";
						else
							newTitle = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("dayofweek.full").format(new Date(view.startDate()));
				break;
		}
		if (newTitle) {
			that._model.set("formattedDate", newTitle);
		}
		return view;
	}
	//support editing of events
	kendo.ui.MonthView.prototype._touchEditable = kendo.ui.MonthView.prototype._mouseEditable;
	kendo.ui.MultiDayView.prototype._touchEditable = kendo.ui.MultiDayView.prototype._mouseEditable;
})(this, jQuery);
/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		NULL = null,
		VISIBLE = "t-visible",
		HIDDEN = "t-hidden",
		DURATION = 500;
	var _ColorBase = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Base class for HSB, RGB and Palette controls.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables tooltips.
		/// </field>
		tooltip: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables transitions.
		/// </field>
		transitions: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the width of the control.
		/// When opacity is off the minimal width of the control is 350px. When opacity is on the minimal width is 450px.
		/// </field>
		width: {get:function(){}, set:function(value){}},
		// xoc - x origin center
		// yoc - y origin center
		// distance = sqrt(x*x + y*y)
		// Parametric equations
		// x = cx + r * cos(a)
		// y = cx + r * sin(a)
		});
	mix(_ColorBase, win.Utilities.eventMixin,
			win.Utilities.createEventProperties("change", "select"));
	namespace("Telerik.UI", {
		_ColorBase: _ColorBase
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		NULL = null,
		EASING = "easeOutQuad";
	var Animations = win.Class.define(function (options) {
		var that = this,
			options = options || {};
		priv(that, "_selector", options.selector);
		priv(that, "_picker", options.picker);
		priv(that, "_start", null, true);
	}, {
		play: function (property, start) {
			var that = this,
				duration = that._picker._duration,
				firstStep = that._start !== null ? that._start : start;
			$(that._selector).stop(true, false).animate(property, {
				duration: duration,
				easing: EASING,
				step: function(now, fx) {
					now = firstStep !== false ? firstStep : now;
					fx.start = now;
					$(this).attr(fx.prop, now);
					that._start = now;
					firstStep = false;
				}
			});
		}
	});
	namespace('Telerik.UI._ColorBase', {
		_Animations: Animations
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		prevent = Telerik.Utilities._pointerEvent,
		NULL = null,
		svgNS = "http://www.w3.org/2000/svg",
		NS = ".telerikColorPicker",
		POINTERDOWN_NS = prevent("down") + NS,
		POINTERUP_NS = prevent("up") + NS;
	/// <summary>
	/// A ColorPicker control.
	/// </summary>
	/// <icon src="colorpicker_html_12.png" width="12" height="12" />
	/// <icon src="colorpicker_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadColorPicker"></div>]]></htmlSnippet>
	/// <event name="change">Fires when a color was selected</event>
	/// <event name="select">Fires while selecting a color</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadColorPicker = derive(ui.Control, function (element, options) {
		/// <summary>
		/// ColorPicker control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Object">
		/// Like value(), but it returns a Color object.
		/// This does not trigger the "change" event.
		/// </field>
		color: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Get or set the selected color. If no argument is given, this returns the currently selected color as a string in format #FFFFFF 
		/// when the opacity option is off, or rgba(255, 255, 255, 1) when opacity is requested. If one argument is given, it selects the new color and updates the UI. 
		/// The argument can be a string in hex, rgb or rbga format, or a Color object. This does not trigger the "change" event.
		/// Returns the string representation of the current color.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the previous color.
		/// Returns the string representation of the previous color.
		/// </field>
		previousColor: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// Enable or disable opacity.
		/// Only for the HSB and RGB pickers.
		/// </field>
		opacity: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Get or set opacity. The values are between 0 and 1.
		/// This does not trigger the "change" event.
		/// Only for the HSB and RGB pickers.
		/// </field>
		opacityValue: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Get or set brightness. The values are between 0 and 100.
		/// Only for the HSB picker.
		/// </field>
		brightness: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the width of the pop-up.
		/// </field>
		width: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the default pre-defined palette of colors.
		/// It can be an array of Telerik.Utilities.color objects or of strings that parseColor understands.
		/// Only for the Palette picker.
		/// </field>
		defaultPalette: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the pre-defined palette of colors.
		/// It can be an array of Telerik.Utilities.color objects or of strings that parseColor understands.
		/// Only for the Palette picker.
		/// </field>
		palette: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set sector width.
		/// It change the width of the control in a way that each sector's width equals the set value.
		/// Only for the Palette picker.
		/// </field>
		sectorWidth: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or sets the current mode.
		/// </field>
		/// <options>
		/// <option value="hsb">hsb</option>
		/// <option value="rgb">rgb</option>
		/// <option value="palette">palette</option>
		/// </options>
		mode: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables tooltips.
		/// </field>
		tooltip: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables transitions.
		/// </field>
		transitions: {get:function(){}, set:function(value){}},
		toggle: function () {
			/// <summary>
			/// Toggles the visual state of the pop-up.
			/// </summary>
},
		expand: function () {
			/// <summary>
			/// expands the pop-up.
			/// </summary>
},
		collapse: function () {
			/// <summary>
			/// collapses the pop-up.
			/// </summary>
},
		});
	mix(RadColorPicker, win.Utilities.eventMixin,
			win.Utilities.createEventProperties("change", "select", "expand", "collapse"));
	namespace("Telerik.UI", {
		RadColorPicker: RadColorPicker
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		NULL = null,
		STROKEWIDTH = 2;
	var Handle = win.Class.define(function (options) {
		var that = this,
			options = options || {};
		win.UI.setOptions(that, options);
		priv(that, "_groupId", uniqueId());
	}, {
		position: function (value) {
			$("#" + this._groupId).attr("transform", "translate("+ value[0] +", "+ value[1] +")");
		},
		render: function () {
			var that = this,
				picker = that.picker,
				point2D = viz.Point2D,
				view = picker._view,
				mainGroup = picker._mainGroup,
				r  = that.radius * picker._ratio,
				group = view.createGroup({id: that._groupId}),
				handle, handleInner;
			handle = view.createCircle(point2D(0, 0), r, {
				fillOpacity: 1,
				stroke: "#000000",
				strokeWidth: STROKEWIDTH
			});
			group.children.push(handle);
			handleInner = view.createCircle(point2D(0, 0), r-STROKEWIDTH, {
				fillOpacity: 1,
				stroke: "#ffffff",
				strokeWidth: STROKEWIDTH
			});
			group.children.push(handleInner);
			mainGroup.children.push(group);
		}
	});
	namespace('Telerik.UI._ColorBase', {
		_Handle: Handle
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		utils = WinJS.Utilities,
		color = util.color,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		anim = Telerik.UI._ColorBase._Animations,
		uniqueId = viz.uniqueId,
		svgNS = "http://www.w3.org/2000/svg",
		NULL = null,
		STROKEWIDTH = 2,
		HANDLERADIUS = 10,
		STICKAREA = 20, // opacity stick area - 30%
		OUTLINEWIDTH = 2; // the fake border made by circles with bigger radius
	var CurrentColor = win.Class.define(function (picker, diameter) {
		var that = this;
		priv(that, "_originalDiameter", diameter * picker._ratio);
		priv(that, "_r", diameter/2 * picker._ratio, true);
		priv(that, "_width", (diameter * picker._ratio) + STROKEWIDTH);
		priv(that, "_picker", picker);
		priv(that, "_id", uniqueId());
		priv(that, "_groupId", uniqueId());
		priv(that, "_gradientId", uniqueId());
		priv(that, "_backgroundId", uniqueId());
		priv(that, "_opacityCircleId", uniqueId());
		priv(that, "_handleRadius", HANDLERADIUS * picker._ratio);
		priv(that, "_handle", new Telerik.UI._ColorBase._Handle({
			picker: picker,
			radius: HANDLERADIUS
		}));
		priv(that, "_animBorder", new anim({selector: "#" + that._id, picker: picker}));
		priv(that, "_animGradient", new anim({selector: "#g" + that._gradientId, picker: picker}));
		priv(that, "_animBackground", new anim({selector: "#" + that._opacityCircleId, picker: picker}));
	}, {
		_expanded: false,
		render: function () {
			var that = this,	
				point2D = viz.Point2D,
				picker = that._picker,
				fillColor = picker.color,
				mainGroup = picker._mainGroup,
				view = picker._view,
				c = picker.width / 2,
				group = view.createGroup({id: that._groupId}),
				fill = picker.opacity ? "url(#g"+ that._gradientId +")" : picker.value,
				gradient;
			group.children.push(view.createCircle(point2D(c, c), that._r, {
				id: that._opacityCircleId,
				fill: "url(#"+ that._backgroundId +")"
			}));
			group.children.push(view.createCircle(point2D(c, c), that._r, {
				id: that._id,
				fill: fill,
				fillOpacity: 1,
				stroke: "#000000",
				strokeWidth: STROKEWIDTH
			}));
			if (picker.opacity) {
				gradient = view.createGradient({
					id: "g" + that._gradientId,
					type: "radial",
					cx: c,
					cy: c,
					r: that._r,
					stops: [{
						offset: 0,
						color: fillColor.toHex(),
						opacity: 1
					}, {
						offset: 0.3,
						color: fillColor.toHex(),
						opacity: 0.8
					}, {
						offset: 0.6,
						color: fillColor.toHex(),
						opacity: 0.6
					}, {
						offset: 0.9,
						color: fillColor.toHex(),
						opacity: 0.1
					}, {
						offset: 1,
						color: fillColor.toHex(),
						opacity: 0
					}]
				});
				group.children.push(gradient);
			}
			mainGroup.children.push(group);
			if (picker.opacity) {
				that._handle.render();
			}
		},
		changeFill: function (value) {
			var that = this,
				picker = that._picker,
				stops = $("#g" + that._gradientId).children(),
				len = stops.length,
				i;
			if (!value) {
				value = picker.color;
			}
			if (picker.opacity) {
				value = $.extend({}, value);
				value.a = 1;
				for (i=0; i<len-1; i++) {
					stops[i].style.stopColor = value.toCssRgba();
				}
				if (stops[len-1]) {
					stops[len-1].style.stopColor = "rgba(255, 255, 255, 0)";
				}
			} else {
				$("#" + that._id).attr("fill", value.toCssRgba());
			}
		},
		opacityByXY: function () {
			var that = this,
				picker = that._picker,
				xoc = picker._xoc,
				yoc = picker._yoc,
				ir = 0,
				hr = that._handleRadius,
				width = that._r - ir - hr - STROKEWIDTH,
				stickradius = (100-STICKAREA),
				deg, value, d;
			deg = (( Math.atan2(yoc,xoc) * 180/Math.PI + 360 ) % 360) + 90;
			d = picker._distanceFromCenter(xoc, yoc) - ir - (hr/2);
			d = picker._normalizeRange(0, width, d);
			value = d*100/(width-(OUTLINEWIDTH*2));
			value = picker._normalizeRange(0, 100, value);
			value = Math.abs(value - 100); // reverse because 100 must be the inner value
			return value/stickradius >= 1 ? 1 : value/stickradius;
		},
		positionHandle: function (opacity, mirror, ignoreUI) {
			var that = this,
				picker = that._picker,
				stickarea = ignoreUI ? 0 : STICKAREA,
				opacity = (opacity >= 0 ? opacity : picker.opacityValue) * (100 - stickarea), 
				opacity = Math.abs(opacity - 100), // reverse
				mirror = mirror || false,
				ir = 0,
				hr = that._handleRadius,
				width = that._r - ir - hr - STROKEWIDTH,
				xoc = picker._xoc,
				yoc = picker._yoc,
				c = picker._outerR, // center
				deg = ignoreUI ? -90 : (( Math.atan2(yoc, xoc) * 180/Math.PI + 360 ) % 360),
				radians = picker._toRadians(deg),
				d = (opacity/100 * (width-(OUTLINEWIDTH*2))) + ir + (hr/2), // distance from center by opacity
				x = d * Math.cos(radians), // x = cx + r * cos(a)
				y = d * Math.sin(radians); // y = cx + r * sin(a)
			if (opacity === stickarea) {
				x = y = 0;
			}
			if (mirror && y > 0) {
				y = y * (-1);
			}
			that._handle.position([c + x, c + y]);
		},
		_appendDefs: function () {
			var that = this,
				picker = that._picker,
				defsId = picker._view.defsId,
				defs = document.getElementById(defsId),
				pattern, rect, rect2, rect3;
			// transperant pattern
			pattern = document.createElementNS(svgNS, 'pattern');
			pattern.id = that._backgroundId;
			pattern.setAttribute("patternUnits", "userSpaceOnUse");
			pattern.setAttribute("width", 20);
			pattern.setAttribute("height", 20);
			rect = document.createElementNS(svgNS, 'rect');
			rect.setAttribute("width", 20);
			rect.setAttribute("height", 20);
			rect.setAttribute("fill", "#fff");
			pattern.appendChild(rect);
			rect2 = document.createElementNS(svgNS, 'rect');
			rect2.setAttribute("width", 10);
			rect2.setAttribute("height", 10);
			rect2.setAttribute("fill", "#ccc");
			pattern.appendChild(rect2);
			rect3 = document.createElementNS(svgNS, 'rect');
			rect3.setAttribute("x", 10);
			rect3.setAttribute("y", 10);
			rect3.setAttribute("width", 10);
			rect3.setAttribute("height", 10);
			rect3.setAttribute("fill", "#ccc");
			pattern.appendChild(rect3);
			defs.appendChild(pattern);
		},
		_changeRadius: function () {
			var that = this,
				expanded = that._expanded,
				r = that._r,
				i;
			if (expanded) {
				r = r / 1.8;
			} else {
				r = r * 1.8;
			}
			that._expanded = !expanded;
			that._animBorder.play({r: r}, that._r);
			that._animGradient.play({r: r}, that._r);
			that._animBackground.play({r: r}, that._r);
			that._r = r;
		}
	});
	namespace('Telerik.UI._ColorBase', {
		_CurrentColor: CurrentColor
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		color = util.color,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		NULL = null,
		HANDLERADIUS = 19,
		STROKEWIDTH = 2;
	var RingSlider = win.Class.define(function (picker, options) {
		var that = this,
			options = options || {};
		priv(that, "_picker", picker);
		priv(that, "_width", 42 * picker._ratio);
		priv(that, "_fill", options.fill);
		priv(that, "_radius", options.radius);
		priv(that, "_value", options.value);
		priv(that, "_points", options.points);
		priv(that, "_groupId", uniqueId());
		priv(that, "_handleRadius", HANDLERADIUS);
		priv(that, "_handle", new Telerik.UI._ColorBase._Handle({
			picker: picker,
			radius: that._handleRadius
		}));
		that._minMaxSliderDegrees();
	}, {
		render: function() {
			var that = this,
				picker = that._picker,
				view = picker._view,
				mainGroup = picker._mainGroup,
				point2D = viz.Point2D,
				c = picker.width / 2,
				r = that._radius,
				group = view.createGroup({id: that._groupId}),
				i;
			for(i=0; i<=359; i++) {
				var that = this,
					width = i < 359 ? 2 : 1,
					ring, child;
				// it's r-1 to hide a glitch with the rendering
				ring = new viz.Ring(point2D(c, c), r-that._width, r, i, width);
				child = view.createRing(ring, {});
				group.children.push(child);
			}
			mainGroup.children.push(group);
			that._handle.render();
		},
		fill: function (args) {
			this._fill(args);
		},
		valueByXY: function () {
			var that = this,
				picker = that._picker,
				xoc = picker._xoc,
				yoc = picker._yoc,
				gradiend = that._points/360,
				deg;
			deg = (( Math.atan2(yoc,xoc) * 180/Math.PI + 180 ) % 360);
			deg = deg >= that._maxDegrees ? deg = 360 : deg <= that._minDegrees ? 0 : deg;
			return deg * gradiend;
		},
		positionHandle: function (value) {
			var that = this,
				picker = that._picker,
				gradiend = that._points/360,
				v = value >= 0 ? value : that._value,
				deg = (v/gradiend),
				deg = picker._normalizeRange(that._minDegrees, that._maxDegrees, deg) + 180,
				radians = picker._toRadians(deg),
				r = that._radius,
				c = picker.width / 2, // center
				d = r - (that._width / 2), // distance from center
				x = c + d * Math.cos(radians), // x = cx + r * cos(a)
				y = c + d * Math.sin(radians); // y = cx + r * sin(a)
			that._handle.position([x, y]);
		},
		_minMaxSliderDegrees: function () {
			var that = this,
				picker = that._picker,
				circumference = that._radius*2 * Math.PI,
				coef = 360/circumference;
			that._minDegrees = coef * that._handleRadius * picker._ratio + (STROKEWIDTH * coef);
			that._maxDegrees = 360 - that._minDegrees;
		}
	});
	namespace('Telerik.UI._ColorBase', {
		_RingSlider: RingSlider
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		color = util.color,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		pevent = Telerik.Utilities._pointerEvent,
		NULL = null,
		NS = ".telerikColorPicker",
		POINTERDOWN_NS = pevent("down") + NS,
		POINTERMOVE_NS = pevent("move") + NS,
		POINTERUP_NS = pevent("up") + NS,
		BRIGHTNESSRINGWIDTH = 42,
		STROKEWIDTH = 2,
		HANDLERADIUS = 19,
		OUTLINEWIDTH = 2, // the fake border made by circles with bigger radius
		PRIVIOUSCOLORCLASS = "t-previousColor";
	/// <summary>
	/// A ColorPicker control.
	/// </summary>
	/// <icon src="colorpicker_html_12.png" width="12" height="12" />
	/// <icon src="colorpicker_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadHSBPicker"></div>]]></htmlSnippet>
	/// <event name="change">Fires when a color was selected</event>
	/// <event name="select">Fires while selecting a color</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadHSBPicker = derive(ui._ColorBase, function (element, options) {
		/// <summary>
		/// HSB ColorPicker control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Object">
		/// Like value(), but it returns a Color object.
		/// This does not trigger the "change" event.
		/// </field>
		color: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Get or set the selected color. If no argument is given, this returns the currently selected color as a string in format #FFFFFF 
		/// when the opacity option is off, or rgba(255, 255, 255, 1) when opacity is requested. If one argument is given, it selects the new color and updates the UI. 
		/// The argument can be a string in hex, rgb or rgba format, or a Color object. This does not trigger the "change" event.
		/// Returns the string representation of the current color.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the previous color.
		/// Returns the string representation of the previous color.
		/// </field>
		previousColor: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// Enable or disable opacity.
		/// </field>
		opacity: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Get or set opacity. The values are between 0 and 1.
		/// This does not trigger the "change" event.
		/// </field>
		opacityValue: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Get or set brightness. The values are between 0 and 100.
		/// </field>
		brightness: {get:function(){}, set:function(value){}},
		// args[0] must be a color object
		});
	namespace("Telerik.UI", {
		RadHSBPicker: RadHSBPicker
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		color = util.color,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		pevent = Telerik.Utilities._pointerEvent,
		NULL = null,
		NS = ".telerikColorPicker",
		POINTERDOWN_NS = pevent("down") + NS,
		POINTERMOVE_NS = pevent("move") + NS,
		POINTERUP_NS = pevent("up") + NS,
		RINGWIDTH = 42,
		TOUCHHANDLERADIUS = 19,
		STROKEWIDTH = 2,
		OUTLINEWIDTH = 2, // the fake border made by circles with bigger radius
		PRIVIOUSCOLORCLASS = "t-previousColor";
	/// <summary>
	/// A ColorPicker control.
	/// </summary>
	/// <icon src="colorpicker_html_12.png" width="12" height="12" />
	/// <icon src="colorpicker_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRGBPicker"></div>]]></htmlSnippet>
	/// <event name="change">Fires when a color was selected</event>
	/// <event name="select">Fires while selecting a color</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadRGBPicker = derive(ui._ColorBase, function (element, options) {
		/// <summary>
		/// RGB ColorPicker control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Object">
		/// Like value(), but it returns a Color object.
		/// </field>
		color: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Get or set the selected color. If no argument is given, this returns the currently selected color as a string in format #FFFFFF 
		/// when the opacity option is off, or rgba(255, 255, 255, 1) when opacity is requested. If one argument is given, it selects the new color and updates the UI. 
		/// The argument can be a string in hex, rgb or rbga format, or a Color object. This does not trigger the "change" event.
		/// Returns the string representation of the current color.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the previous color.
		/// Returns the string representation of the previous color.
		/// </field>
		previousColor: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// Enable or disable opacity.
		/// </field>
		opacity: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Get or set opacity. The values are between 0 and 1.
		/// This does not trigger the "change" event.
		/// </field>
		opacityValue: {get:function(){}, set:function(value){}},
		});
	namespace("Telerik.UI", {
		RadRGBPicker: RadRGBPicker
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-1.9.1.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		utils = win.Utilities,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		color = util.color,
		priv = util.setPrivate,
		viz = kendo.dataviz,
		uniqueId = viz.uniqueId,
		anim = Telerik.UI._ColorBase._Animations,
		isArray = Array.isArray,
		prevent = Telerik.Utilities._pointerEvent,
		svgNS = "http://www.w3.org/2000/svg",
		NULL = null,
		NS = ".telerikColorPicker",
		POINTERDOWN_NS = prevent("down") + NS,
		POINTERMOVE_NS = prevent("move") + NS,
		POINTERUP_NS = prevent("up") + NS,
		STROKEWIDTH = 2,
		OUTLINEWIDTH = 2;
	/// <summary>
	/// A ColorPicker control.
	/// </summary>
	/// <icon src="colorpicker_html_12.png" width="12" height="12" />
	/// <icon src="colorpicker_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadPalettePicker"></div>]]></htmlSnippet>
	/// <event name="change">Fires when a color was selected</event>
	/// <event name="select">Fires while selecting a color</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadPalettePicker = derive(ui._ColorBase, function (element, options) {
		/// <summary>
		/// Palette ColorPicker control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field>
		/// Get or set the default pre-defined palette of colors.
		/// It can be an array of Telerik.Utilities.color objects or of strings that parseColor understands.
		/// </field>
		defaultPalette: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the pre-defined palette of colors.
		/// It can be an array of Telerik.Utilities.color objects or of strings that parseColor understands.
		/// </field>
		palette: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the width of the control.
		/// </field>
		width: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Like value(), but it returns a Color object.
		/// </field>
		color: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Get or set the selected color. If no argument is given, this returns the currently selected color as a string in format #FFFFFF
		/// If one argument is given, it selects the new color (if exists in the palette) and updates the UI. 
		/// The argument can be a string in hex, rgb or rgba format, or a Color object. This does not trigger the "change" event.
		/// Returns the string representation of the current color.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set the previous color.
		/// Returns the string representation of the previous color.
		/// </field>
		previousColor: {get:function(){}, set:function(value){}},
		/// <field>
		/// Get or set sector width.
		/// It change the width of the control in a way that each sector's width equals the set value.
		/// </field>
		sectorWidth: {get:function(){}, set:function(value){}},
		// This palette is for internal use only!!!
		});
	namespace("Telerik.UI", {
		RadPalettePicker: RadPalettePicker
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities,
        RADIX = 10;
	/// <summary>
	/// A textbox providing text suggestions.
	/// </summary>
	/// <icon src="autocompletebox_html_12.png" width="12" height="12" />
	/// <icon src="autocompletebox_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadAutoCompleteBox"></span>]]></htmlSnippet>
	/// <event name="open">Fires when the drop-down list of RadAutoComplete is shown.</event>
	/// <event name="close">Fires when the drop-down list of RadAutoComplete is closed.</event>
	/// <event name="select" argsType="Telerik.UI.AutoCompleteBox.SelectEventArgs">
	/// Fires when an item is selected from the drop-down list.
	/// <param name="item" type="Object">The jQuery object that represents the selected item.</param>
	///</event>
	/// <event name="change">Fires when the value of the RadAutoComplete changes.</event>
	/// <event name="databinding">Fires when the control is about to databind.</event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <part name="autoCompleteBox" class="k-autocomplete">The RadAutoCompleteBox widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadAutoCompleteBox = derive(ui.ListBase, function (element, options) {
		/// <summary>
		/// Creates a new RadAutoCompleteBox control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Gets or sets the value of the control.
		/// </field>
		text: {get:function(){}, set:function(value){}},
		/// <excludetoc />
		/// <field type="String">
		/// This property is not applicable to this control. Please use the dataTextField property instead.
		/// </field>
		dataValueField: {get:function(){}, set:function(value){}},
		/// <field type="String" defaultValue="startswith">
		/// Gets or sets the type of filtration to use when filtering the data items. Possible values include "startswith", "endswith", "contains", "eq", "neq". Default value is "startswith".
		/// </field>
		filter: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true" defaultValue="1">
		/// Gets or sets the minimum amount of characters that should be typed before RadAutoCompleteBox queries the dataSource.
		/// </field>
		minLength: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the string that appears in the textbox when it has no value.
		/// </field>
		placeholder: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether RadAutoCompleteBox should automatically auto-type the rest of text.
		/// </field>
		autoSuggest: {get:function(){}, set:function(value){}},
		suggest: function (value) {
			/// <summary>
			/// Forces a suggestion onto the text of the AutoComplete.
			/// </summary>
			/// <param name="value" type="String">Characters to force a suggestion.</param>
},
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether RadAutoCompleteBox should automatically highlight the first shown item. Default value is false.
		/// </field>
		highlightFirst: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the separator for completion. Empty by default, allowing for only one completion.
		/// </field>
		separator: {get:function(){}, set:function(value){}},
		});
	namespace("Telerik.UI", {
		RadAutoCompleteBox: RadAutoCompleteBox
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
(function (global, $, undefined) {
	"use strict";
	var define = WinJS.Class.define,
		derive = WinJS.Class.derive,
		mix = WinJS.Class.mix,
		namespace = WinJS.Namespace.define,
		utilities = WinJS.Utilities,
		util = Telerik.Utilities,
		priv = util.setPrivate,
		root = document.documentElement,
		setOptions = WinJS.UI.setOptions,
		executeTransition = WinJS.UI.executeTransition,
		nsName = "Telerik.UI.Behaviors",
		NS = namespace(nsName),
		Promise = WinJS.Promise,
		pevent = util._pointerEvent,
		OBJECT = "object",
		STRING = "string",
		NUMBER = "number",
		NULL = null,
		POINTERDOWN = pevent("down"),
		POINTERMOVE = pevent("move"),
		POINTERUP = pevent("up"),
		POINTERCANCEL = pevent("cancel"),
		//Drag events
		DRAGSTART = "dragstart",
		DRAG = "drag",
		DRAGEND = "dragend",
		DRAGCANCEL = "dragcancel",
		TRANSITIONEND = "transitionend",
		//DropTarget events
		DRAGENTER = "dragenter",
		DRAGLEAVE = "dragleave",
		DROP = "drop", //both a DropTarget and a Reorder event
		//Reorder events
		REORDER = "reorder",
		TRANSFORM = "transform",
		TIMING = "cubic-bezier(0.1, 0.9, 0.2, 1)",
		css = {
			dragged: "t-dragged",
			noscroll: "t-no-scroll"
		};
	namespace(nsName, {
		Behavior: define(function (options) {
			/// <summary>
			/// Base Behavior class.
			/// </summary>
			/// <param name="options" type="Object">The configuration options for this behavior.</param>
}, {
			dispose: function () {
				/// <summary>
				/// Override this method in a derived class and call to dispose the behavior.
				/// </summary>
}
		})
	});
	mix(NS.Behavior, Telerik.UI.Common.eventMixin);
	namespace(nsName, {
		Drag: derive(NS.Behavior, function (options) {
			/// <summary>
			/// Provides the ability to drag elements and drop them on predefined targets.
			/// </summary>
			/// <param name="options" type="Object">The configuration options for the drag behavior.</param>
}, {
			/// <field type="HTMLElement" domElement="true">Gets the DOM element, array of DOM elements or string selector that defines the draggable elements.</field>
			element: NULL,
			/// <field type="HTMLElement" domElement="true">Gets the DOM element, array of DOM elements or string selector that defines the handle through which dragging can start.</field>
			handle: NULL,
			/// <field type="String" canBeNull="true">Gets the axis along which dragging is allowed.</field>
			axis: NULL,
			/// <field type="HTMLElement" domElement="true">Gets the container that defines the draggable boundaries.</field>
			container: NULL,
			/// <field type="String">If defined, specifies a set of child items, where transformations will be applied to them instead of the parent draggable element.</field>
			transformSelector: "",
			/// <field type="Number">Gets the duration of the cancel transition. Set to 0 to disable the transition.</field>
			cancelTransition: 167,
			/// <field type="Number">Gets the timining function used in the cancel transition.</field>
			cancelTiming: TIMING,
			/// <field type="Array" elementType="Telerik.UI.Behaviors.DropTarget">An array of DropTarget instances specifying the allowes drop targets.</field>
			dropTargets: {get:function(){}, set:function(value){}},
			/// <field type="Number">Gets or sets the threshold delta after which drag starts.</field>
			threshold: 20,
			//read-only properties
			/// <field type="Boolean">Indicates whether the user is currently dragging the element.</field>
			dragging: {get:function(){}},
			/// <field type="HTMLElement" domElement="true">Gets the currently dragged DOM element.</field>
			dragged: {get:function(){}},
			/// <field type="Object">Gets the initial position of the dragged DOM element.</field>
			position: {get:function(){}},
			/// <field type="Object">Gets the position of the bounding container.</field>
			containerPosition: {get:function(){}},
			/// <field type="Object">Gets the offset of the pointer from the top left corner of the dragged element.</field>
			pointerOffset: {get:function(){}},
			/// <field type="Object">Gets the origin point from which dragging started.</field>
			origin: {get:function(){}},
			/// <field type="Object">Gets the coordinates of the last point to which the element was dragged.</field>
			coordinates: {get:function(){}},
			/// <field type="Function">A filter function that is provided the dragged element. A boolean return value must indicate whether the element can be dragged.</field>
			filter: function () {
},
			drag: function (e) {
},
			dispose: function () {
				/// <summary>
				/// Disposes the Drag behavior.
				/// </summary>
}
		})
	});
	mix(NS.Drag, utilities.createEventProperties(DRAGSTART, DRAG, DRAGEND, DRAGCANCEL, TRANSITIONEND));
	function collides(pos1, pos2) {
		var right1 = pos1.left + pos1.width,
			bottom1 = pos1.top + pos1.height,
			right2 = pos2.left + pos2.width,
			bottom2 = pos2.top + pos2.height;
		return !(bottom1 < pos2.top || pos1.top > bottom2 || right1 < pos2.left || pos1.left > right2);
	}
	namespace(nsName, {
		DropTarget: derive(NS.Behavior, function (element, options) {
			/// <summary>
			/// Represents a drop target in a drag behavior
			/// </summary>
			/// <param name="element" type="HTMLElement" domElement="true">The drop target element.</param>
			/// <param name="options" type="Object">The configuration options for this DropTarget.</param>
}, {
			/// <field type="HTMLElement" domElement="true">Gets the drop target element.</field>
			element: NULL,
			/// <field type="Boolean" defaultValue="true">			
			/// If set to false, uses the current pointer position to determine whether the drop target is hovered.
			/// By defaul, collision detection is used between the drop target and the dragged element to identify whether the 
			/// drop target is hovered.
			/// </field>
			detectBoundary: true,
			isOver: function (drag, e) {
				/// <summary>
				/// Gets a value indicating whether the currently dragged element is over this drop target.
				/// </summary>
				/// <param name="drag" type="Telerik.UI.Behaviors.Drag">The drag behavior instance.</param>
				/// <param name="e" type="DOMEvent">The DOM pointer event arguments.</param>
				/// <returns type="Boolean"></returns>
},
			pointerMove: function (drag, e) {
				/// <summary>
				/// Notifies this drop target of a pointer movement and fires any required events. Returns a boolean
				/// value indicating whether the pointer is currently over this drop target.
				/// </summary>
				/// <param name="drag" type="Telerik.UI.Behaviors.Drag">The drag behavior instance.</param>
				/// <param name="e" type="DOMEvent">The DOM pointer event arguments.</param>
				/// <returns type="Boolean"></returns>
},
			pointerUp: function (e, canceled) {
				/// <summary>
				/// Notifies this drop target of a pointer up action and fires any required events.
				/// </summary>
				/// <param name="e" type="DOMEvent">The DOM pointer event arguments.</param>
				/// <param name="canceled" type="Boolean">Indicates whether the pointer event was canceled.</param>
}
		})
	});
	mix(NS.DropTarget, utilities.createEventProperties(DRAGENTER, DRAGLEAVE, DROP));
	namespace(nsName, {
		Reorder: derive(NS.Behavior, function (options) {
}, {
			drag: NULL,
			container: NULL,
			handle: NULL,
			itemsSelector: "",
			transformSelector: "",
			threshold: 0.5,
			transitions: true,
			deferTimeout: 50,
			sensitivity: 3,
			transitionDuration: 167,
			transitionTiming: TIMING,
			isRtl: NULL,
			dispose: function () {
				/// <summary>
				/// Disposes this reorder behavior.
				/// </summary>
}
		})
	});
	mix(NS.Reorder, utilities.createEventProperties(REORDER, DROP));
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities;
	/// <summary>
	/// An input control that allows selecting one of some predefined values from a drop-down or entering a custom value.
	/// </summary>
	/// <icon src="combobox_html_12.png" width="12" height="12" />
	/// <icon src="combobox_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadComboBox"></span>]]></htmlSnippet>
	/// <event name="open">Fires when the drop-down list of RadComboBox is shown.</event>
	/// <event name="close">Fires when the drop-down list of RadComboBox is closed.</event>
	/// <event name="select" argsType="Telerik.UI.ComboBox.SelectEventArgs">
	/// Fires when an item is selected from the drop-down list.
	/// <param name="item" type="Object">The jQuery object which represents the selected item.</param>
	/// </event>
	/// <event name="change">Fires when the value of the RadComboBox changes.</event>
	/// <event name="databinding">Fires when the control is about to databind.</event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <part name="comboBox" class="k-combobox">The RadComboBox widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadComboBox = derive(ui.CascadingListBase, function (element, options) {
		/// <summary>
		/// Creates a new RadComboBox control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Gets or sets the text of the control.
		/// </field>
		text: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the zero-based index of the selected item.
		/// </field>
		index: {get:function(){}, set:function(value){}},
		/// <field type="String" defaultValue="none">
		/// Gets or sets the type of filtration to use when filtering the data items. Possible values include "startswith", "endswith", "contains", "eq"(equals), "neq"(does not equal). Default value is "none".
		/// </field>
		filter: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the minimum amount of characters that should be typed before RadComboBox queries the dataSource.
		/// </field>
		minLength: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the string that appears in the textbox when it has no value.
		/// </field>
		placeholder: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether RadComboBox should automatically auto-type the rest of text.
		/// </field>
		autoSuggest: {get:function(){}, set:function(value){}},
		open: function () {
			/// <summary>
			/// Opens the drop-down list.
			/// </summary>
},
		toggle: function (toggle) {
			/// <summary>
			/// Toggles the drop-down list between its open and closed state.
			/// </summary>
			/// <param name="toggle" type="Boolean">Optional. Specifies whether to open or close the drop-down list.</param>
},
		suggest: function (value) {
			/// <summary>
			/// Forces a suggestion onto the text of the combobox.
			/// </summary>
			/// <param name="value" type="String">Characters to force a suggestion.</param>
},
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether RadComboBox should automatically highlight the first shown item.
		/// </field>
		highlightFirst: {get:function(){}, set:function(value){}},
	});
	namespace("Telerik.UI", {
		RadComboBox: RadComboBox
	});
})(this, jQuery);(function (global, undefined) {
	"use strict";
	var kendo = global.kendo,
		deepExtend = kendo.deepExtend,
		registerTheme = kendo.dataviz.ui.registerTheme;
	var BLACK = "#000",
		GREY = "#808080",
		NONE = "none",
		OUTSIDE = "outside",
		OUTSIDEEND = "outsideEnd",
		SEGOE = "Segoe UI",
		SEMIBOLD = " Semibold",
		SEGOE11 = "11px " + SEGOE,
		SEGOE11SEMIBOLD = SEGOE11 + SEMIBOLD,
		SEGOE12 = "12px " + SEGOE,
		SEGOE12SEMIBOLD = SEGOE12 + SEMIBOLD,
		SEGOE14 = "14px " + SEGOE,
		SEGOE15 = "15px " + SEGOE,
		SEGOE30 = "30px " + SEGOE,
		//Chart colors
		BLACKCHARTTITLE = "#292929",
		BLACKAXISTITLE = BLACKCHARTTITLE,
		BLACKAXISLABEL = "#4B4B4B",
		BLACKLEGENDLABELS = BLACKAXISLABEL,
		BLACKRGBANOFILTER = "rgba(0, 0, 0, ",
		BLACK14PERCENT = BLACKRGBANOFILTER + "0.14)",
		BLACK35PERCENT = BLACKRGBANOFILTER + "0.35)",
		WHITERGBANOFILTER = "rgba(255, 255, 255, ",
		WHITE12PERCENT = WHITERGBANOFILTER + "0.12)",
		WHITE35PERCENT = WHITERGBANOFILTER + "0.35)",
		WHITE40PERCENT = WHITERGBANOFILTER + "0.4)",
		WHITE60PERCENT = WHITERGBANOFILTER + "0.6)",
		WHITE80PERCENT = WHITERGBANOFILTER + "0.8)",
		//Gauge colors
		//BLACKRGBANOFILTER = "rgba(0, 0, 0, ",
		BLACK60PERCENTFILTER = BLACKRGBANOFILTER + "0.6)",
		WHITE = "#fff",
		WHITE60PERCENTFILTER = WHITERGBANOFILTER + "0.6)";
	var chartBaseTheme = {
		title: {
			font: SEGOE30
		},
		axisDefaults: {
			title: {
				font: SEGOE11SEMIBOLD
			},
			labels: {
				font: SEGOE11
			},
			majorGridLines: {
				dashType: "dash"
			},
			crosshair: {
				color: GREY,
				tooltip: {
					font: SEGOE11,
					color: BLACK,
					background: WHITE,
					border: {
						color: GREY,
						width: 2
					}
				}
			}
		},
		categoryAxis: {
			justified: true,
			majorGridLines: {
				visible: false
			}
		},
		tooltip: {
			font: SEGOE14,
			color: BLACK,
			background: WHITE,
			border: {
				color: GREY,
				width: 2
			}
		},
		legend: {
			labels: {
				font: SEGOE11
			},
			inactiveItems: {
				labels: {
					color: "#919191"
				},
				markers: {
					color: "#919191"
				}
			}
		},
		seriesDefaults: {
			visible:true,
			overlay: {
				gradient: NONE
			},
			highlight: {
				visible: true
			},
			labels: {
				position: OUTSIDEEND,
				font: SEGOE12SEMIBOLD,
				background: "",
				color: ""
			},
			errorBars: {
			    color: "#232323"
			},
			area: {
				opacity: 0.4,
				line: {
					width: 1,
					opacity: 1,
                    style: "normal"
				},
				markers: {
					visible: true,
					size: 8
				},
			},
			line: {
				width: 2
			},
			pie: {
				overlay: {
					gradient: "roundedBevel"
				}
			},
			candlestick: {
				//TODO: remove #ccc and use the current series color (by design) when kendo fix bug and allow this
				downColor: "#ccc",
				line: {
					color: "#ccc"
				}
			},
			ohlc: {
				highlight: {
					line: {
						width: 2
					}
				}
			},
			bullet: {
				gap: 1.5,
				spacing: 0.4,
				target: {
					color: "#ff0000"
				}
			},
			verticalBullet: {
				gap: 1.5,
				spacing: 0.4,
				target: {
					color: "#ff0000"
				}
			},
			funnel: {
			    labels: {
                    position: "center"
			    },
			    segmentSpacing: 0,
			    neckRatio: 0.3,
			    dynamicSlope: false
			}
		},
		seriesColors: [
			"#1E98E4", "#FFC500", "#FF2A00", "#CACACA", "#434343",
			"#00FF9C", "#6D31FF", "#00B2A1", "#B9FF85", "#FF8000"
		]
	};
	var chartThemes = {
		dark: {
			title: {
				color: WHITE80PERCENT
			},
			legend: {
				labels: {
					color: WHITE40PERCENT
				}
			},
			axisDefaults: {
				title: {
					color: WHITE60PERCENT
				},
				labels: {
					color: WHITE40PERCENT
				},
				line: {
					color: WHITE35PERCENT
				},
				majorGridLines: {
					color: WHITE12PERCENT
				}
			},
			chartArea: {
				background: NONE
			},
			seriesDefaults: {
				labels: {
					color: "#CACACA"
				},
				errorBars: {
				    color: "#ffffff"
				}
			}
		},
		light: {
			title: {
				color: BLACKCHARTTITLE
			},
			legend: {
				labels: {
					color: BLACKLEGENDLABELS
				}
			},
			axisDefaults: {
				title: {
					color: BLACKAXISTITLE
				},
				labels: {
					color: BLACKAXISLABEL
				},
				line: {
					color: BLACK35PERCENT
				},
				majorGridLines: {
					color: BLACK14PERCENT
				}
			},
			seriesDefaults: {
				labels: {
					color: "#545454"
				}
			}
		}
	};
	var gaugeBaseTheme = {
		scale: {
			labels: {
				font: SEGOE15,
				position: OUTSIDE
			}
		}
	};
	var gaugeThemes = {
		light: {
			scale: {
				labels: {
					color: BLACK60PERCENTFILTER
				},
				majorTicks: {
					color: BLACK60PERCENTFILTER
				},
				minorTicks: {
					color: BLACK60PERCENTFILTER
				},
				rangePlaceholderColor: BLACK60PERCENTFILTER
			}
		},
		dark: {
			pointer: {
				color: WHITE
			},
			scale: {
				labels: {
					color: WHITE60PERCENTFILTER
				},
				majorTicks: {
					color: WHITE60PERCENTFILTER
				},
				minorTicks: {
					color: WHITE60PERCENTFILTER
				},
				rangePlaceholderColor: WHITE60PERCENTFILTER
			}
		}
	};
	registerTheme("dark", {
		chart: deepExtend({}, chartBaseTheme, chartThemes.dark),
		gauge: deepExtend({}, gaugeBaseTheme, gaugeThemes.dark)
	});
	registerTheme("light", {
		chart: deepExtend({}, chartBaseTheme, chartThemes.light),
		gauge: deepExtend({}, gaugeBaseTheme, gaugeThemes.light)
	});
})(this);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities;
        /// <summary>
        /// Allows selection of a single value from a list in a dropdown.
        /// </summary>
        /// <icon src="dropdownlist_html_12.png" width="12" height="12" />
        /// <icon src="dropdownlist_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadDropDownList"></span>]]></htmlSnippet>
        /// <event name="open">Fires when the drop-down list of RadDropDownList is shown.</event>
        /// <event name="close">Fires when the drop-down list of RadDropDownList is closed.</event>
        /// <event name="select" argsType="Telerik.UI.DropDownList.SelectEventArgs">
		/// Fires when an item is selected from the drop-down list.
		/// <param name="item" type="Object">The jQuery object which represents the selected item.</param>
		/// </event>
        /// <event name="change">Fires when the value of the RadDropDownList changes.</event>
        /// <event name="databinding">Fires when the control is about to databind.</event>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <part name="dropDownList" class="k-dropdown">The RadDropDownList widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadDropDownList = derive(ui.CascadingListBase, function (element, options) {
        /// <summary>
        /// Creates a new RadDropDownList control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
    	/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
    	/// <field type="String">
    	/// Gets or sets the text of the control.
    	/// </field>
    	text: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the zero-based index of the selected item.
        /// </field>
        index: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the text of the default empty item.
        /// </field>
        optionLabel: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// The valueTemplate used to render the selected value. By default the widget displays only the text of the data item (configured via dataTextField).
        /// </field>
        valueTemplate: {get:function(){}, set:function(value){}},
        open: function () {
        	/// <summary>
        	/// Opens the drop-down list.
            /// </summary>
},        
        search: function (word) {
        	/// <summary>
        	/// Selects the item that starts with the specified substring.
        	/// </summary>
            /// <param name="word" type="String">The value to search by.</param>
},
        toggle: function (toggle) {
        	/// <summary>
        	/// Toggles the drop-down list between its open and closed state.
        	/// </summary>
            /// <param name="toggle" type="Boolean">Optional. Specifies whether to open or close the drop-down list.</param>
}
    });
    namespace("Telerik.UI", {
        RadDropDownList: RadDropDownList
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	var win = WinJS,
		derive = win.Class.derive,
		utilities = win.Utilities,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		nsName = "Telerik.UI.Gauge",
		ns = namespace(nsName),
		common = ui.Common,
		NUMBER = "number",
		FUNCTION = "function",
		config = ui._ControlConfiguration,
		defineProperty = config.defineProperty,
		getMapping = config.getMapping,
		priv = util.setPrivate;
	namespace(nsName, {
		_LabelConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the gauge labels.
			/// </summary>
}, {
			/// <field type="String">
			/// Gets or sets the background of the gauge labels. Any valid CSS color string is accepted.
			/// </field>
			background: defineProperty("background", ""),
			/// <field type="Telerik.UI.Common._BorderConfiguration">
			/// Gets the border settings of the gauge labels.
			/// </field>
			border: {get:function(){}},
			/// <field type="String">
			/// Gets or sets the text color of the gauge labels. Any valid CSS color string is accepted.
			/// </field>
			color: defineProperty("color", ""),
			/// <field type="String">
			/// Gets or sets the font style of the gauge labels.
			/// </field>
			font: defineProperty("font", ""),
			/// <field type="String">
			/// Gets or sets the format of the gauge labels.
			/// </field>
			format: defineProperty("format", ""),
			/// <field type="Telerik.UI.Common._BoxConfiguration">
			/// Retrieves the margin settings of the gauge labels.
			/// </field>
			margin: {get:function(){}},
			/// <field type="Telerik.UI.Common._BoxConfiguration">
			/// Retrieves the padding settings of the gauge labels.
			/// </field>
			padding: {get:function(){}},
			/// <field type="String" defaultValue="outside">
			/// Gets or sets the labels position. Valid values are "inside" and "outside". Default value is "outside".
			/// </field>
			/// <options>
			/// <option value="inside">inside</option>
			/// <option value="outside">outside</option>
			/// </options>
			position: defineProperty("position", "outside"),
			/// <field type="String">
			/// Gets or sets the template of the gauge labels.
			/// </field>
			template: defineProperty("template", ""),
			/// <field type="Boolean" defaultValue="true">
			/// Gets or sets the visibility of the gauge labels. Default value is true.
			/// </field>
			visible: defineProperty("visible", true)
		}),
		_TickConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the gauge ticks.
			/// </summary>
}, {
			/// <field type="String">
			/// Gets or sets the color of the ticks. Any valid CSS color string is accepted.
			/// </field>
			color: defineProperty("color", ""),
			/// <field type="Number">
			/// Gets or sets the tick length in pixels.
			/// </field>
			size: defineProperty("size", 0),
			/// <field type="Boolean" defaultValue="true">
			/// Gets or sets the visibility of the ticks. Default is true.
			/// </field>
			visible: defineProperty("visible", true),
			/// <field type="Number" defaultValue="0.5">
			/// Gets or sets the width of the ticks in pixels. Default is 0.5
			/// </field>
			width: defineProperty("width", 0.5)
		}),
		_RadialPointerConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the radial gauge pointer.
			/// </summary>
}, {
			/// <field type="Number">
			/// Gets or sets the size of the value in percents (from 0 to 1).
			/// </field>
			capSize: defineProperty("capSize", 0.5),
			/// <field type="String">
			/// Gets or sets the color of the pointer cap. Any valid CSS color string is accepted.
			/// </field>
			capColor: defineProperty("capColor", ""),
			/// <field type="String">
			/// Gets or sets the color of the pointer. Any valid CSS color string is accepted.
			/// </field>
			color: defineProperty("color", "")
		}),
		_LinearPointerTrackConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the linear pointer track.
			/// </summary>
}, {
			/// <field type="Telerik.UI.Common._BorderConfiguration">
			/// Gets the border settings for the gauge pointer track.
			/// </field>
			border: {get:function(){}},
			/// <field type="String">
			/// Gets or sets the color of the pointer track. Any valid CSS color string is accepted.
			/// </field>
			color: defineProperty("color", ""),
			/// <field type="Number" defaultValue="1">
			/// Gets or sets the opacity of the pointer track.
			/// </field>
			opacity: defineProperty("opacity", 1),
			/// <field type="Number">
			/// Gets or sets the size of the pointer track.
			/// </field>
			size: defineProperty("size", 0),
			/// <field type="Boolean">
			/// Gets or sets the visibility of the pointer track.
			/// </field>
			visible: defineProperty("visible", false)
		}),
		_LinearPointerConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the linear gauge pointer.
			/// </summary>
}, {
			/// <field type="Telerik.UI.Common._BorderConfiguration">
			/// Gets the border settings for the gauge pointer.
			/// </field>
			border: {get:function(){}},
			/// <field type="String">
			/// Gets or sets the color of pointer. Any valid CSS color string is accepted.
			/// </field>
			color: defineProperty("color", ""),
			/// <field type="Telerik.UI.Common._BoxConfiguration">
			/// Gets the margin settings of the pointer.
			/// </field>
			margin: {get:function(){}},
			/// <field type="Number" defaultValue="1">
			/// Gets or sets the opacity of the pointer. Default value is 1.
			/// </field>
			opacity: defineProperty("opacity", 1),
			/// <field type="String" defaultValue="barIndicator">
			/// Gets or sets the shape of the pointer. Possible values are "barIndicator" and "arrow". Default is "barIndicator."
			/// </field>
			/// <options>
			/// <option value="barIndicator">barIndicator</option>
			/// <option value="arrow">arrow</option>
			/// </options>
			shape: defineProperty("shape", "barIndicator"),
			/// <field type="Number">
			/// Gets or sets the size of the pointer.
			/// </field>
			size: defineProperty("size", 0),
			/// <field type="Telerik.UI.Gauge._LinearPointerTrackConfiguration">
			/// Retrieves the settings for the pointer track.
			/// </field>
			track: {get:function(){}}
		}),
		_LineConfiguration: derive(ui.Common._BorderConfiguration, function (owner, parentMapping, defaults) {
			/// <summary>
			/// For internal usage only. Describes the properties of the linear gauge scale line.
			/// </summary>
}, {
			/// <field type="Boolean" defaultValue="true">
			/// Gets or sets the visibility of the gauge scale line. Default value is true.
			/// </field>
			visible: defineProperty("visible", true)
		})
	});
	/// <excludetoc />
	var RadGauge = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// A base class for the RadLinearGauge and RadRadialGauge controls.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String" defaultValue="dark">
		/// Gets or sets the name of the visual theme applied to the gauge.
		/// </field>
		theme: defineProperty("theme", "dark"),
		/// <field type="String">
		/// Gets or sets the background of the gauge area. Any valid CSS color string is accepted.
		/// </field>
		background: defineProperty("background", "none"),
		/// <field type="Telerik.UI.Common._BorderConfiguration">
		/// Gets the border settings of the gauge area.
		/// </field>
		border: {get:function(){}},
		/// <field type="Number">
		/// Gets the width of the gauge area.
		/// </field>
		width: defineProperty("width", function () {
			var widget = this._widget,
				width = widget.options.gaugeArea.width;
			if (typeof width !== NUMBER) {
				width = widget.wrapper.find("svg").width();
			}
			return width;
		}),
		/// <field type="Number" defaultValue="200">
		/// Gets the height of the gauge area.
		/// </field>
		height: defineProperty("height", function () {
			var widget = this._widget,
				height = widget.options.gaugeArea.height;
			if (typeof height !== NUMBER) {
				height = widget.wrapper.find("svg").height();
			}
			return height;
		}),
		/// <field type="Telerik.UI.Common._BoxConfiguration" value="{left: 5, right: 5, top: 5, bottom: 5}">
		/// Gets the margin of the gauge area.
		/// </field>
		margin: {get:function(){}},
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables transitions. True by default.
		/// </field>
		transitions: defineProperty("transitions", true),
		/// <field type="Telerik.UI.Gauge._LabelConfiguration">
		/// Retrieves the label settings for this gauge.
		/// </field>
		labels: {get:function(){}},
		/// <field type="Number">
		/// Gets or sets the interval between minor divisions
		/// </field>
		minorUnit: defineProperty("minorUnit", function () {
			var that = this,
				minorUnit = parseFloat(that._widget.options.scale.minorUnit);
			return isNaN(minorUnit) ? that._getDefaultScale().options.minorUnit : minorUnit;
		}),
		/// <field type="Number">
		/// Gets or sets the interval between major divisions
		/// </field>
		majorUnit: defineProperty("majorUnit", function () {
			var that = this,
				majorUnit = parseFloat(that._widget.options.scale.majorUnit);
			return isNaN(majorUnit) ? that._getDefaultScale().options.majorUnit : majorUnit;
		}),
		/// <field type="Number">
		/// Gets or sets the minimum value of the scale.
		/// </field>
		min: defineProperty("min", 0),
		/// <field type="Number">
		/// Gets or sets the maximum value of the scale.
		/// </field>
		max: defineProperty("max", function () {
			var that = this,
				max = parseFloat(that._widget.options.scale.max),
				defaultMax = that instanceof ui.RadLinearGauge ? 50 : 100;
			return isNaN(max) ? defaultMax : max;
		}),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether the axis direction is reversed.
		/// Reversed axis values increase from right to left and from top to bottom.
		/// </field>
		reverse: defineProperty("reverse", false),
		/// <field type="Telerik.UI.Gauge._TickConfiguration">
		/// Retrieves the major tick settings.
		/// </field>
		majorTicks: {get:function(){}},
		/// <field type="Telerik.UI.Gauge._TickConfiguration">
		/// Retrieves the minor tick settings.
		/// </field>
		minorTicks: {get:function(){}},
		/// <field type="Array" elementType="{ from:0, to: 100, color: 'navy', opacity: 1 }" defaultValue="[]">
		/// Gets or sets the array of ranges that will appear on the scale.
		/// </field>
		ranges: defineProperty("ranges", []),
		/// <field type="Number">
		/// The width of the ranges that will appear on the scale. If the property is not set, it will be calculated to 10% of the scale radius.
		/// </field>
		rangeSize: defineProperty("rangeSize", null),
		/// <field type="String" devaultValue="rgba(255, 255, 255, 0.6)">
		/// Gets or sets the default color for the ranges.
		/// </field>
		rangePlaceholderColor: defineProperty("rangePlaceholderColor", "rgba(255, 255, 255, 0.6)"),
		/// <field type="String" hidden="true">
		/// Gets the SVG representation of the current gauge.
		/// </field>
		svg: {get:function(){}},
		/// <field type="Number">
		/// Gets or sets the current gauge value.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		redraw: function () {
			/// <summary>
			/// Redraws the gauge.
			/// </summary>
}
	});
	/// <summary>
	/// A linear gauge control that can visualize a value on a linear scale.
	/// </summary>
	/// <icon src="gauge_html_12.png" width="12" height="12" />
	/// <icon src="gauge_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadLinearGauge"></div>]]></htmlSnippet>
	/// <part name="linearGauge" class="k-gauge">The RadLinearGauge widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadLinearGauge = derive(RadGauge, function (element, options) {
		/// <summary>
		/// Creates a new RadLinearGauge control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether the scale labels and ticks are mirrored. Mirroring the
		/// scale will render the labels and ticks on the opposite side.
		/// </field>
		mirror: defineProperty("mirror", false),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the position of the gauge.
		/// </field>
		vertical: defineProperty("vertical", true),
		/// <field type="Telerik.UI.Gauge._LineConfiguration">
		/// Provides access to the line options of the linear gauge.
		/// </field>
		line: {get:function(){}},
		/// <field type="Telerik.UI.Gauge._LinearPointerConfiguration">
		/// Retrieves the gauge pointer settings.
		/// </field>
		pointer: {get:function(){}}
	});
	/// <summary>
	/// A radial gauge control that can visualize a value on a radial scale.
	/// </summary>
	/// <icon src="gauge_html_12.png" width="12" height="12" />
	/// <icon src="gauge_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRadialGauge"></div>]]></htmlSnippet>
	/// <part name="radialGauge" class="k-gauge">The RadRadialGauge widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadRadialGauge = derive(RadGauge, function (element, options) {
		/// <summary>
		/// Creates a new RadRadialGauge control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Number" defaultValue="4.75">
		/// The distance of ranges from the edge of the scale. If this property is not set, it will be calculated to 5% of the scale radius.
		/// </field>
		rangeDistance: defineProperty("rangeDistance", function () {
			return this._widget._model._plotArea.scale.options.rangeDistance;
		}),
		/// <field type="Number" defaultValue="-30">
		/// Gets or sets the start angle of the gauge scale. The scale is rendered clockwise,
		/// where a start angle of 0 is equal to 180 degrees in the polar coordinate system.
		/// </field>
		startAngle: defineProperty("startAngle", function () {
			return this._widget._model._plotArea.scale.options.startAngle;
		}),
		/// <field type="Number" defaultValue="210">
		/// Gets or sets the end angle of the gauge scale. The scale is rendered clockwise,
		/// where a start angle of 0 is equal to 180 degrees in the polar coordinate system.
		/// </field>
		endAngle: defineProperty("endAngle", function () {
			return this._widget._model._plotArea.scale.options.endAngle;
		}),
		/// <field type="Telerik.UI.Gauge._RadialPointerConfiguration">
		/// Retrieves the gauge pointer settings.
		/// </field>
		pointer: {get:function(){}}
	});
	namespace("Telerik.UI", {
		RadRadialGauge: RadRadialGauge,
		RadLinearGauge: RadLinearGauge
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		namespace = WinJS.Namespace.define,
		ui = Telerik.UI,
		pevent = Telerik.Utilities._pointerEvent,
		POINTERDOWN = pevent("down"),
		POINTERUP = pevent("up"),
		POINTEROUT = pevent("out");
	namespace("Telerik.UI.HubTile", {
		/// <enum />
		MosaicFlipMode: {
			individual: "individual",
			row: "row"
		}
	});
	/// <event name="tileinvoked" bubbles="true">Raised when the user taps or clicks on the hub tile.</event>
	var _HubTileBase = derive(ui.Control, function (element, options) {
}, {
		/// <field type="Number" integer="true" defaultValue="3">
		/// Gets or sets the UpdateInterval in seconds. This interval determines how often the tile will
		/// update its visual states when it is not frozen.
		/// </field>
		updateInterval: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true" defaultValue="0">
		/// Gets or sets the update deviation in seconds. The number will be used to make each update happen at random intervals
		/// from (updateInterval-updateDeviation) to (updateInterval+updateDeviation). For example, with updateInterval=5 and updateDeviation=2,
		/// the update can happen at any time between 3 and 7 seconds.
		/// </field>
		updateDeviation: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets the IsFrozen property. Freezing a hub tile means that it will cease to
		/// periodically update itself. For example when it is offscreen.
		/// </field>
		isFrozen: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the Title.
		/// </field>
		title: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining what the backside of the tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// </field>
		backContentTemplate: {get:function(){}, set:function(value){}},
		flip: function () {
			/// <summary>
			/// Flips the tile between its front and back sides. This method is called automatically if the tile update interval is set and the tile is not frozen.
			/// Note that the tile will not flip if there is another animation in progress (e.g. slide) or if the back tile has no content.
			/// </summary>
}
		});
	WinJS.Class.mix(_HubTileBase, WinJS.Utilities.createEventProperties("tileinvoked"));
	/// <summary>
	/// RadHubTile is the most commonly used tile. It consists of a title, an icon, a notification count and an optional message.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubControl">The RadHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Number" integer="true">
		/// Gets or sets the notification count of the tile.
		/// </field>
		notification: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the source of the tile image.
		/// </field>
		imageSource: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the message of the tile.
		/// </field>
		message: {get:function(){}, set:function(value){}}
	});
	/// <summary>
	/// RadCustomHubTile defines a hub tile with custom front and back contents and a swivel transition between them.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadCustomHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubCustom">The RadCustomHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadCustomHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadCustomHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Gets or sets a value determining what the backside of the tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// </field>
		frontContentTemplate: {get:function(){}, set:function(value){}}
	});
	/// <summary>
	/// RadPictureRotatorHubTile defines a hub tile that shows a set of pictures.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadPictureRotatorHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubPictureRotator">The RadPictureRotatorHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadPictureRotatorHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadPictureRotatorHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Array">
		/// Gets or sets the images displayed by the tile.
		/// </field>
		picturesSource: {get:function(){}, set:function(value){}},
	});
	/// <summary>
	/// RadSlideHubTile defines a hub tile that can show content and a picture and has a slide animation between the two.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadSlideHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubSlide">The RadSlideHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadSlideHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadSlideHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Object">
		/// Gets or sets a value determining what the upper part of the slide tile will render.
		/// The value can be either a HTML string or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// You can also just use the URI of an image (string that starts with 'http://', 'https://', 'ms-appx://', '/', or 'data:image/png;base64,' for relative ones) to display the image
		/// </field>
		topContentTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Object">
		/// Gets or sets a value determining what the lower part of the slide tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// You can also just use the URI of an image (string that starts with 'http://', 'https://', 'ms-appx://', '/', or 'data:image/png;base64,' for relative ones) to display the image
		/// </field>
		bottomContentTemplate: {get:function(){}, set:function(value){}},
	});
	/// <summary>
	/// RadMosaicHubTile is a grid of nine small tiles that individually flip themselves to display a random image. 
	/// Every now and then, an image is selected and is displayed magnified by four tiles in one of the corners the mosaic tile.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadMosaicHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubMosaic">The RadMosaicHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadMosaicHubTile = derive(RadPictureRotatorHubTile, function (element, options) {
		/// <summary>
		/// Creates a new RadMosaicHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.UI.HubTile.MosaicFlipMode" defaultValue="individual">
		/// Determines how the cells of the mosaic tile are flipped.
		/// </field>
		flipMode: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a custom CSS class that will be applied to each mosaic tile.
		/// </field>
		tileCssClass: {get:function(){}, set:function(value){}}
	});
	namespace("Telerik.UI", {
		_HubTileBase: _HubTileBase,
		RadHubTile: RadHubTile,
		RadCustomHubTile: RadCustomHubTile,
		RadPictureRotatorHubTile: RadPictureRotatorHubTile,
		RadSlideHubTile: RadSlideHubTile,
		RadMosaicHubTile: RadMosaicHubTile
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var NOTIFICATION_CLASS = "t-notification",
		FADING_CLASS = "t-fading",
		PRESSED_CLASS = "t-pressed",
		JNS = ".RadNotification",
		CONTENT_TEMPLATE = "<a href='#' draggable='false'></a><img /><h3></h3><p></p>",
		pevent = Telerik.Utilities._pointerEvent;
	/// <excludetoc />
	/// <summary>
	/// For internal use only.
	/// </summary>
	var RadNotification = WinJS.Class.derive(Telerik.UI.Control, function (element, options) {
		/// <summary>
		/// A charting control that can visualize different chart types.
		/// </summary>
		var that = this;
		if (!element) {
			element = document.createElement("div");
			document.body.appendChild(element);
			that._autoElement = true;
		}
		WinJS.UI.setOptions(that, options);
		Telerik.UI.Control.call(that, element, options);		
		MSApp.execUnsafeLocalFunction(function () {
			$(element).empty()
				.addClass(NOTIFICATION_CLASS)
				.append(CONTENT_TEMPLATE)
				.on("click" + JNS, that._click.bind(that))
				.on("mouseenter" + JNS, that._timeout.bind(that, false))
				.on("mouseleave" + JNS, that._timeout.bind(that, true))
				.on(pevent("down") + JNS, that._pressed.bind(that))					
				.find("img").attr("src", that.iconUrl)[that.iconUrl ? "show" : "hide"]().end()
				.find("h3").text(that.title).end()
				.find("p").html(that.text);
		});
		if (that.visible) {
			//show initially if the option is specified
			that.show();
		}
	}, {
		visible: false,
		title: "",
		text: "",
		iconUrl: "",
		url: "",
		autoDispose: false,
		showDuration: 5000,
		fadeDuration: 3000,
		show: function () {
			var that = this;
			if (that._disposed) return;
			RadNotification.register(that);
			that.element.style.display = "";
			that.element.style.right = "0";
			that.visible = true;
			that._timeout(true);
		}, 
		hide: function (withFade) {
			var that = this,
				right = "-" + WinJS.Utilities.getTotalWidth(that.element) + "px";
			if (that._disposed) return;
			that._timeout(false);
			that.visible = false;			
			if (withFade) {
				that.element.classList.add(FADING_CLASS);
				that._fadeTimeout = setTimeout(function () {
					RadNotification.unregister(that);
					that.element.style.display = "none";
					that.element.style.right = right;
					that.element.classList.remove(FADING_CLASS);
					if (that.autoDispose) that.dispose();
				}, that.fadeDuration);
			}
			else {
				that.element.style.right = right;
				setTimeout(function () {
					RadNotification.unregister(that);
					if (that.autoDispose) that.dispose();
				}, 300);
			}
		},
		_click: function (e) {
			var that = this,
				prevented;
			if (that._canceled) return;
			if (e.target.tagName === "A") {
				//close button clicked
				that.hide();
			}
			else {
				prevented = that.dispatchEvent("click", { domEvent: e });
				if (!prevented && that.url) {
					Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(that.url));					
				}
				if (!prevented) {
					that.hide();
				}
			}
		},
		_timeout: function (on) {
			var that = this;
			//clear all timeouts in all cases
			clearTimeout(that._hideTimeout);
			clearTimeout(that._fadeTimeout);
			that.element.classList.remove(FADING_CLASS);
			if (on) {				
				that._hideTimeout = setTimeout(function () {
					that.hide(true);
				}, that.showDuration);
			}
		},
		_pressed: function (e) {
			var that = this,
				root = $(document.documentElement),
				evt = e.originalEvent,
				isPointer = evt.pointerType === 2 || evt.pointerType === "touch";
			if (e.target.tagName === "A") return;
			that.element.classList.add(PRESSED_CLASS);
			root.one(pevent("up"), that._released.bind(that));
			that._canceled = false;
			if (isPointer) {
				root.on(pevent("move") + JNS, that._moved.bind(that))
				that._start = {
					x: evt.pageX,
					y: evt.pageY
				}
				that._prevX = evt.pageX;
			}
		},
		_moved: function (e) {
			var that = this,
				element = that.element,
				evt = e.originalEvent,
				start = that._start || { x: evt.pageX, y: evt.pageY },				
				threshold = 20,
				deltaX = evt.pageX - start.x,				
				toCancel = Math.abs(deltaX) >= threshold || Math.abs(start.y - evt.pageY) >= threshold;
			that._timeout(false);			
			if (toCancel) {
				that._canceled = true;
				element.classList.remove(PRESSED_CLASS);
			}
			if (that._canceled) {
				element.style.transition = "none";
				element.style.right = -Math.max(0, deltaX) + "px";
			}
			that._velo = evt.pageX - that._prevX;
			that._prevX = evt.pageX;
		},
		_released: function (e) {
			var that = this,
				element = that.element,
				delta = Math.abs(parseInt(element.style.right));
			element.classList.remove(PRESSED_CLASS);
			element.style.transition = "";
			if (delta >= element.offsetWidth / 2 || that._velo > 10) {
				that._canceled = true;
				that.hide();
			}
			else {				
				element.style.right = "0";
				that._timeout(true);
			}
			delete that._start;
			delete that._prevX;
			delete that._velo;
			$(document.documentElement).off(pevent("move") + JNS);			
		},
		dispose: function () {
			//dispose the control and remove its element if it was created automatically
			var that = this,
				elem = $(that.element).off(JNS);
			that._disposed = true;
			if (that._autoElement) {
				elem.remove();
			}
			else {
				elem.empty().removeClass(NOTIFICATION_CLASS).css({
					top: "",
					right: "",
					display: ""
				});
			}
		}
	}, {
		_instances: [],
		register: function (instance) {
			var arr = RadNotification._instances,
				slot = arr.length;
			if (arr.indexOf(instance) > -1) return;
			for (var i = 0; i < arr.length; i++) {
				if (!arr[i]) {
					slot = i;
					break;
				}
			}
			arr[slot] = instance;
			if (arr[slot - 1]) {
				var prev = arr[slot - 1],
					top = parseFloat(prev.element.currentStyle.top);
				if (isNaN(top)) top = 0;
				//position the control under currently open notifications				
				instance.element.style.top = top + WinJS.Utilities.getTotalHeight(prev.element) + 10 + "px";
			}
		},
		unregister: function (instance) {
			var arr = RadNotification._instances,
				index = arr.indexOf(instance);
			if (index > -1) {
				arr[index] = null;
				if (index === arr.length - 1) {
					arr.pop();
				}
				instance.element.style.top = "";
			}
		},
	});
	WinJS.Class.mix(RadNotification, WinJS.Utilities.createEventProperties("click"));
	WinJS.Namespace.define("Telerik.UI", {
		RadNotification: RadNotification
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
/// <reference path="/kendo/js/kendo.winjs.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		mix = win.Class.mix,
		namespace = win.Namespace.define,
		utilities = win.Utilities,
		util = Telerik.Utilities,
		ui = Telerik.UI,
		cul = Telerik.Culture,
		pevent = util._pointerEvent,
		POINTERDOWN = pevent("down"),
		POINTERMOVE = pevent("move"),
		POINTERUP = pevent("up"),
		BOOLEAN = "boolean",
		NUMBER = "number",
		NULL = null,
		RADIX = 10,
		CONTAINERCSSCLASS = "t-numericbox",
		DISABLEPANZOOMCSSCLASS = "t-disablePanZoom",
		INTERACTIVECSSCLASS = "win-interactive",
		UPARROWSELECTOR = ".k-icon.k-i-arrow-n",
		DOWNARROWSELECTOR = ".k-icon.k-i-arrow-s";
	/// <summary>
	/// A textbox control for numeric input.
	/// </summary>
	/// <icon src="numericbox_html_12.png" width="12" height="12" />
	/// <icon src="numericbox_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadNumericBox"></span>]]></htmlSnippet>
	/// <event name="change">Fires when the value of RadNumericBox changes.</event>
	/// <event name="spin">Fires when any of the increment/decrement buttons is clicked.</event>
	/// <part name="numericBox" class="k-numerictextbox">The RadNumericBox widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadNumericBox = derive(ui.WidgetWrapper, function (element, options) {
		/// <summary>
		/// Creates a new RadNumericBox control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Number" integer="true">
		/// Gets or sets how long you have to drag (in px) before spin happens. Default is 1.
		/// </field>
		sensitivity: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets mousewheel option.
		/// </field>
		wheel: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets swipe option.
		/// </field>
		swipe: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets the enabled state of the control.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="Number" mayBeNull="true">
		/// Gets or sets the current numeric value.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the number precision. If not set precision defined by current culture is returned.
		/// </field>
		decimals: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the format of the number. Any valid number format is allowed.
		/// </field>
		format: {get:function(){}, set:function(value){}},
		/// <field type="Number" mayBeNull="true">
		/// Gets or sets the smallest value the user can enter.
		/// </field>
		min: {get:function(){}, set:function(value){}},
		/// <field type="Number" mayBeNull="true">
		/// Gets or sets the largest value the user can enter.
		/// </field>
		max: {get:function(){}, set:function(value){}},
		/// <field type="Number">
		/// Gets or sets the increment/decrement step.
		/// </field>
		step: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the text displayed when the input is empty.
		/// </field>
		placeholder: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the text of tooltip on the increment button.
		/// </field>
		incrementTooltip: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the text of tooltip on the decrement button.
		/// </field>
		decrementTooltip: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets current culture of the control.
		/// The format is BCP-47 language tag with language and region for example: en-US, fr-FR
		/// </field>
		culture: {get:function(){}, set:function(value){}},
		focus: function () {
			/// <summary>
			/// Focuses the numeric box.
			/// </summary>
}
	});
	mix(RadNumericBox, utilities.createEventProperties("change", "spin"));
	namespace("Telerik.UI", {
		RadNumericBox: RadNumericBox
	});
	// HACK: Override arrows code to workaround a bug in Blend. After Blend guys fix it, remove this code
	var ns = ".kendoNumericTextBox",
		MOUSELEAVE = "mouseleave" + ns,
		MOUSEUP = "touchcancel" + ns + " " + "touchend" + ns + " mouseup" + ns + " " + MOUSELEAVE,
		SELECTED = "k-state-selected";
	function buttonHtml(className, text) {
		return '<span unselectable="on" class="k-link"><span unselectable="on" class="k-icon k-i-arrow-' + className + '" title="' + text + '">' + text + '</span></span>';
	}
	kendo.ui.NumericTextBox.prototype._arrows = function () {
		var that = this, arrows, options = that.options, spinners = options.spinners, element = that.element;
		arrows = element.siblings(".k-icon");
		if (!arrows[0]) {
			//WinJS: modify so jquery does not use a documentfragment. Fixes a bug in Blend.
			arrows = $(buttonHtml("n", options.upArrowText)).insertAfter(element);
			$(buttonHtml("s", options.downArrowText)).insertAfter(arrows);
			arrows = element.siblings(".k-link");
			arrows.wrapAll('<span class="k-select"/>');
		}
		//WinJS: use userevents object instead of the elements directly (fixes problem where spin continues after mouseup)
		//arrows.on(MOUSEUP, function () {
		//	clearTimeout(that._spinning);
		//	arrows.removeClass(SELECTED);
		//});
		if (!spinners) {
			arrows.parent().toggle(spinners);
			that._inputWrapper.addClass("k-expand-padding");
		}
		that._upArrow = arrows.eq(0);
		that._upArrowEventHandler = new kendo.UserEvents(that._upArrow);
		that._downArrow = arrows.eq(1);
		that._downArrowEventHandler = new kendo.UserEvents(that._downArrow);
		//WinJS: use userevents object instead of the elements directly (fixes problem where spin continues after mouseup)
		var endHandler = function endCancelTapHandler() {
			clearTimeout(that._spinning);
			arrows.removeClass(SELECTED);
		}
		that._upArrowEventHandler.bind(["tap", "end", "cancel"], endHandler);
		that._downArrowEventHandler.bind(["tap", "end", "cancel"], endHandler);
	};
	// Override the click and stop it if the numeric box is not visible.
	// In cell editing of the grid, this breaks IE because an element's
	// selection cannot be altered if it is invisible (display: none).
	// This case happens when the grid is rebound after editing of a numeric box cell
	// and the user has clicked on another one.
	(function () {
		var kendoPrototype = kendo.ui.NumericTextBox.prototype,
			original_click = kendoPrototype._click,
			_click = function () {
				var that = this,
					setSelectionRange = that.element[0].setSelectionRange;
				that.element[0].setSelectionRange = function () {
					var that = this;
					if ($(that).parents("body").length) {
						setSelectionRange.apply(that, arguments);
					}
					that.setSelectionRange = setSelectionRange;
				};
				original_click.apply(that, arguments);
			};
		kendoPrototype._click = _click;
	})();
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var ui = Telerik.UI,
        define = WinJS.Class.define,
        derive = WinJS.Class.derive,
        mix = WinJS.Class.mix,
        namespace = WinJS.Namespace.define,
        nsName = "Telerik.UI.Pagination",
        createEventProperties = WinJS.Utilities.createEventProperties,
        util = Telerik.Utilities,
        priv = util.setPrivate,
        addClass = WinJS.Utilities.addClass,
        removeClass = WinJS.Utilities.removeClass,
        setOptions = WinJS.UI.setOptions,
        unsafe = MSApp.execUnsafeLocalFunction,
        loc = Telerik.Localization._strings,
		DataSource = Telerik.Data.DataSource,
        css = {
        	container: "t-pagination",
        	button: "t-button",
        	prev: "t-prev",
        	next: "t-next",
        	thumbnails: "t-thumbnails",
        	defaultTemplate: "t-default",
        	customTemplate: "t-custom",
        	label: "t-label",
        	item: "t-item",
        	selected: "t-selected",
        	afterSelected: "t-after-selected",
        	disabled: "t-disabled"
        },
        NULL = null,
        RADIX = 10,
        STRING = "string",
        FUNCTION = "function",
        ARRAY = "array",
        CHANGE = "change",
        SELECTIONCHANGED = "selectionchanged",
        CLICK = "click";
	/// <summary>
	/// Displays a simple list of items. For internal use only.
	/// </summary>
	/// <event name="selectionchanged">Fires when the value of the control changes.</event>
	/// <excludetoc />
	var _ListView = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Displays a simple list of items. For internal use only.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.Data.DataSource">
		/// Gets or sets the data source of the control.
		/// </field>
		dataSource: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the selected index.
		/// </field>
		selectedIndex: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Pagination._ListViewItem">
		/// Gets or sets the selected item.
		/// </field>
		selectedItem: {get:function(){}, set:function(value){}},
		/// <field type="Array" elementType="Telerik.UI.Pagination._ListViewItem">
		/// Gets the array of items in the list view.
		/// </field>
		items: {get:function(){}},
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template for list items.
		/// </field>
		itemTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets the enabled state of the control.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="Boolean">
		/// Gets or sets whether scroll transitions are enabled.
		/// </field>
		transitions: true,
		refresh: function () {
			/// <summary>
			/// Reloads the data and refreshes the items in the list view.
			/// </summary>
},
		});
	mix(_ListView, createEventProperties(SELECTIONCHANGED));
	/// <excludetoc />
	var _ListViewItem = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Represents an item in a list view. For internal use only.
		/// </summary>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Telerik.UI.Pagination._ListView">
		/// Gets the owner ListView instance.
		/// </field>
		owner: NULL,
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template used to render the HTML for this item.
		/// </field>
		template: NULL,
		/// <field type="Object">
		/// Gets or sets the data item that is passed to the template for rendering the HTML for this item.
		/// </field>
		dataItem: NULL,
		/// <field type="Number" integer="true">
		/// Gets or sets the index of this item in the collection of items in the owner ListView.
		/// </field>
		index: -1,
		/// <field type="Boolean">
		/// Gets or sets whether this item is selected.
		/// </field>
		selected: false,
		render: function () {
			/// <summary>
			/// Renders the HTML for this item based on the specified template and data item.
			/// </summary>
},
		dispose: function () {
			/// <summary>
			/// Removes the rendered HTML and clears any item data.
			/// </summary>
}
	});
	mix(_ListViewItem, createEventProperties(CLICK));
	var PageProvider = define(function () {
		/// <summary>
		/// Base page provider class.
		/// </summary>
}, {
		/// <field type="Number" integer="true">
		/// Gets or sets the index of the currently selected item.
		/// </field>
		currentIndex: -1,
		/// <field type="Number" integer="true">
		/// Gets the number of pages.
		/// </field>
		pageCount: 0,
		/// <field type="Object">
		/// Gets the data source for the thumbnails.
		/// </field>
		dataSource: NULL,
		previous: function () {
			/// <summary>
			/// Navigates to the previous item.
			/// </summary>
},
		next: function () {
			/// <summary>
			/// Navigates to the next item.
			/// </summary>
},
		dispose: function () {
			/// <summary>
			/// Disposes the provider.
			/// </summary>
}
	});
	mix(PageProvider, Telerik.UI.Common.eventMixin, createEventProperties("change"));
	var FlipViewPageProvider = derive(PageProvider, function (flipView) {
		/// <summary>
		/// Represents a page provider that can be attached to a WinJS.UI.FlipView control.
		/// </summary>
		/// <param name="flipView" type="WinJS.UI.FlipView">The FlipView control instance to attach to.</param>
}, {
		/// <field type="WinJS.UI.FlipView">
		/// Gets the FlipView instance attached to this provider.
		/// </field>
		flipView: NULL,
		/// <field type="Number" integer="true">
		/// Gets or sets the index of the currently selected item.
		/// </field>
		currentIndex: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets the number of pages available in the FlipView.
		/// </field>
		pageCount: {get:function(){}},
		/// <field type="Object">
		/// Gets the data source for the thumbnails.
		/// </field>
		dataSource: {get:function(){}},
		previous: function () {
			/// <summary>
			/// Navigates to the previous item in the FlipView.
			/// </summary>
},
		next: function () {
			/// <summary>
			/// Navigates to the next item in the FlipView.
			/// </summary>
},
		dispose: function () {
			/// <summary>
			/// Detaches registered event handlers from the target FlipView and disposes this provider object.
			/// </summary>
},
		});
	var _PageIndexLabel = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Label control inside Telerik.UI.RadPagination. For internal use only.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Number" integer="true" hidden="true">
		/// Gets or sets the current index.
		/// </field>
		currentIndex: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the numeric format of the current index value.
		/// </field>
		currentIndexFormat: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true" hidden="true">
		/// Gets or sets the total item count.
		/// </field>
		itemCount: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the numeric format of the item count value.
		/// </field>
		itemCountFormat: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the separator string between the current item and the item count.
		/// </field>
		separator: {get:function(){}, set:function(value){}},
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template used to render the label. The template provides the "page", "count" and "separator" parameters.
		/// </field>
		template: {get:function(){}, set:function(value){}},
		});
	/// <summary>
	/// A navigation control that tracks the current position within a pageable container like WinJS.UI.FlipView.
	/// </summary>
	/// <icon src="pagination_html_12.png" width="12" height="12" />
	/// <icon src="pagination_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadPagination"></div>]]></htmlSnippet>
	/// <part name="prevButton" class="t-prev">The previous button.</part>
	/// <part name="nextButton" class="t-next">The next button.</part>
	/// <part name="thumbnails" class="t-thumbnails">The thumbnails list.</part>
	/// <part name="label" class="t-label">The label.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadPagination = derive(ui.Control, function (element, options) {
		/// <summary>
		/// A navigation control that tracks the current position within a pageable container like WinJS.UI.FlipView.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Object" potentialValueSelector="[data-win-control]">
		/// Gets or sets the page provider control that RadPagination will navigate.
		/// </field>
		pageProvider: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.Pagination._ListView" hidden="true">
		/// Gets the thumbnails list for this control.
		/// </field>
		thumbnails: {get:function(){}},
		/// <field type="Telerik.UI.Pagination._PageIndexLabel">
		/// Gets the thumbnails list for this control.
		/// </field>
		label: {get:function(){}},
		/// <field type="Object" potentialValueSelector="[data-win-control='WinJS.Binding.Template']">
		/// Gets or sets the template used for rendering thumbnail items. Accepts any of: WinJS.BindingTemplate instance
		/// or an HTML element hosting a template; a function returning an HTML string or a DOM element; an HTML string
		/// with binding expressions defining the template.
		/// </field>
		itemTemplate: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Indicates whether the control displays previous and next buttons for navigation.
		/// </field>
		showButtons: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Indicates whether the control displays thumbnails for navigation.
		/// </field>
		showThumbnails: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Indicates whether the control displays a label.
		/// </field>
		showLabel: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the enabled state of the control.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the index of the currently selected item.
		/// </field>
		currentIndex: {get:function(){}, set:function(value){}},
		previous: function () {
			/// <summary>
			/// Navigates to the previous item.
			/// </summary>
},
		next: function () {
			/// <summary>
			/// Navigates to the next item
			/// </summary>
},
		}, {
		_pageableTypes: [],
		_pageProviders: [],
		defaultItemTemplate: "<div class=" + css.item + "></div>",
		defaultLabelTemplate: "<span>#=page#</span><span>#=separator#</span><span>#=count#</span>",
		registerPageProvider: function (controlConstructor, providerConstructor) {
			/// <summary>
			/// Registers a custom page provider class for particular pageable control.
			/// </summary>
			/// <param name="controlConstructor" type="Function">The pageable control constructor for which a page provider is registered.</param>
			/// <param name="providerConstructor" type="Function">The custom page provider constructor that needs to derive from Telerik.UI.Pagination.PageProvider.</param>
			var that = this,
                types = that._pageableTypes,
                providers = that._pageProviders;
			if (typeof controlConstructor !== FUNCTION) {
				throw new Telerik.Error("Telerik.UI.RadPagination.PageableControlIsInvalid", loc.pageableControlIsInvalid);
			}
			if (!(typeof providerConstructor === FUNCTION && providerConstructor.prototype instanceof PageProvider)) {
				throw new Telerik.Error("Telerik.UI.RadPagination.PageProviderIsInvalid", loc.pageProviderIsInvalid);
			}
			var index = types.indexOf(controlConstructor);
			if (index < 0) {
				index = types.length;
				types[index] = controlConstructor;
			}
			providers[index] = providerConstructor;
		},
		getPageProvider: function (controlConstructor) {
			/// <summary>
			/// Retrieves the page provider registered for the specified control constructor.
			/// </summary>
			/// <param name="controlConstructor" type="Function">The pageable control constructor for which a page provider is registered.</param>
			/// <returns type="Telerik.UI.Pagination.PageProvider"></returns>
			var that = this,
                types = that._pageableTypes,
                providers = that._pageProviders;
			if (typeof controlConstructor !== FUNCTION) {
				throw new Telerik.Error("Telerik.UI.RadPagination.PageableControlIsInvalid", loc.pageableControlIsInvalid);
			}
			return providers[types.indexOf(controlConstructor)];
		}
	});
	// Register supported providers.
	RadPagination.registerPageProvider(WinJS.UI.FlipView, FlipViewPageProvider);
	namespace("Telerik.UI", {
		RadPagination: RadPagination
	});
	namespace(nsName, {
		_ListView: _ListView,
		_ListViewItem: _ListViewItem,
		_PageIndexLabel: _PageIndexLabel,
		PageProvider: PageProvider,
		FlipViewPageProvider: FlipViewPageProvider
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var ui = Telerik.UI,
		define = WinJS.Class.define,
		derive = WinJS.Class.derive,
		mix = WinJS.Class.mix,
		createEventProperties = WinJS.Utilities.createEventProperties,
		namespace = WinJS.Namespace.define,
		setOptions = ui.setOptions,
		nsName = "Telerik.UI.RadialMenu",
		util = Telerik.Utilities,
		utilities = WinJS.Utilities,
		priv = util.setPrivate,
		getType = util.getType,
		getProperty = util.getPropertyValue,
		setProperty = util.setPropertyValue,
		Class = kendo.Class,
		deepExtend = kendo.deepExtend,
		dataviz = kendo.dataviz,
		renderTemplate = dataviz.renderTemplate,
		Point2D = dataviz.Point2D,
		ViewElement = dataviz.ViewElement,
        ElementAnimation = dataviz.ElementAnimation,
        Ring = dataviz.Ring,
		SVGView = dataviz.SVGView,
        interpolateValue = dataviz.interpolateValue,
        uniqueId = dataviz.uniqueId,
		IDPool = dataviz.IDPool,
        html = document.documentElement,
		pevent = Telerik.Utilities._pointerEvent,
		Configuration = Telerik.UI._Configuration,
		notPreviousValidator = util._validators.notPrevious,
		floatValidator = util._validators.floatValue,
		OBJECT = "object",
		ARRAY = "array",
		STRING = "string",
		FUNCTION = "function",
		NS = ".telerikRadialMenu",
		CLICK = "click",		
		FOCUSIN = "focusin",
		POINTERLEAVE = "onpointerleave" in document ? pevent("leave") : "mouseleave",
		POINTERMOVE = pevent("move"),
		POINTERDOWN = pevent("down"),
		POINTERUP = pevent("up"),
		POINTEROVER = pevent("over"),
		RADIUS = 132.5,
		STARTANGLE = -22.5,
		MAXITEMS = 8,
		MINCENTERCLICKABLEWIDTH = 70,
		DEGREE = Math.PI / 180,
		RADIAN = 180 / Math.PI,
		OUTERRIMRATIO = 0.17,				//thickness of outer expand sectors (from radius)
		OUTERRIMOUTLINERATIO = 0.017,		//thickness of outer rim's stroke (from radius)
		OUTERRIMCOLLAPSEDRATIO = 0.08,		//thickness of outer rim when there are no expand sectors (from radius) 
		HOVEROVERLAYRATIO = 0.06,			//thickness of hover overlay sector (from radius)
		SELECTIONOVERLAYRATIO = 0.034,		//thicknesss of selection overlay sector (from radius)
		ITEMRIMRATIO = 0.45,				//thickness of inner item sectors (from radius)
		EXPANDARROWRATIO = 0.10,			//height of expand arrow (from radius)
		HOVERARROWRATIO = 0.06,				//height of hover overlay arrow (from radius)
		HOVERARROWINSET = 0.020,			//insert of hover overlay arrow towards outer overlay arc (from radius)
		CENTERRATIO = 0.15,					//center circle ratio (from radius)
		CENTERRIMRATIO = 0.015,				//center circle stroke ratio (from radius)
		SECTORMARGINRATIO = 0.02,			//margin from the arc sides of the sectors (from radius)
		SECTOROFFSETRATIO = 0.01,			//margin from the line sides of the sectors (from radius)
		ITEMCONTENTPOSITIONRATIO = 0.65,	//specifies the center position of the text and icon relative to the sector center (from item radius - item inner radius)
		TEXTFONTRATIO = 0.08,				//font calculated dynamically as a percent of radius
		ICONFONTRATIO = 0.15,				//icon font calculated dynamically as a percent of radius
		ICONIMAGERATIO = 0.3,				//image icon size calculated dynamically as a percent of radius
		TOOLTIPOFFSETRATIO = 0.05,			//offset of tooltip as a percent of radius
		ANIMATIONDURATION = 167,
		EASING = "easeOutQuad",
		EXPANDARROWICON = "\uE0E4",
		BACKICON = "\uE112",
		AUTOSHOWHIDEDELAYONSELECT = 100,
		showEvent = {
			tap: CLICK,
			hover: POINTEROVER,
			focus: FOCUSIN,
			select: POINTERUP
		},
		hideEvent = {
			tap: POINTERDOWN,
			hover: POINTERDOWN,
			focus: POINTERDOWN,
			select: POINTERUP
		};
	//"easeOutQuad" easing in jQuery for menu animations
	$.easing.easeOutQuad = kendo.jQuery.easing.easeOutQuad = function (x, t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	}
	//override ViewElement.renderId to support class names and inline styles
	var originalRenderId = ViewElement.fn.renderId;
	ViewElement.fn.renderId = function () {
		var element = this,
			className = element.options.className,
			style = element.options.style,
			styleStr = "",
			output = originalRenderId.call(element);
		if (className) {
			output += " " + element.renderAttr("class", className);
		}
		if (style) {
			for (var key in style) {
				styleStr += key + ":" + style[key] + ";";
			}
			output += " " + element.renderAttr("style", styleStr);
		}
		return output;
	};
	//support for modifying text coordinates during animation
	dataviz.SVGText.fn.refresh = function (domElement) {
		var options = this.options;
		$(domElement).attr({
			"fill-opacity": options.fillOpacity,
			x: Math.round(options.x),
			y: Math.round(options.y + options.baseline)
		});
	}
	var SVGImage = ViewElement.extend({
		init: function (options) {
			var that = this;
			ViewElement.fn.init.call(that, options);
			that.template = renderTemplate(SVGImage.template);
		},
		options: {
			url: "",
			x: 0,
			y: 0,
			width: 0,
			height: 0
		},
		refresh: function (domElement) {
			var options = this.options;
			$(domElement).attr({				
				x: options.x - options.width / 2,
				y: options.y - options.height / 2,
				width: options.width,
				height: options.height,
				"xlink:href": options.url
			});
		},
		clone: function () {
			return new SVGImage(deepExtend({}, this.options));
		}
	});
	SVGImage.template = "<image #= d.renderId() # " +
		"#= d.renderDataAttributes() # " +
		"x='#= Math.round(d.options.x - d.options.width / 2) #' " +
		"y='#= Math.round(d.options.y - d.options.height / 2) #' " +
		"width='#= d.options.width #'" +
		"height='#= d.options.height #'" +
		"xlink:href='#= d.options.url #' />";
	SVGView.fn.createImage = function (options) {
		return this.decorate(
			new SVGImage(options)
		);
	}
	var SVGString = ViewElement.extend({
		init: function (options) {
			var that = this;
			ViewElement.fn.init.call(that, options);
			that.template = renderTemplate(SVGString.template);
		},
		options: {
			svg: "",
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			fillOpacity: 0,
			strokeOpacity: 0,
			color: ""
		},
		refresh: function (domElement) {
			var options = this.options,
				elem = $(domElement),
				color = options.color;
			elem.attr({
				"transform": "translate(" + Math.round(options.x - options.width / 2) + ", " + Math.round(options.y - options.height / 2) + ")"
			}).add("*", domElement).attr({
				"fill-opacity": options.fillOpacity,
				"stroke-opacity": options.strokeOpacity,
			});
			if (color) {
				elem.attr({
					"fill": color,
					"stroke": color
				});
			}
		},
	});
	SVGString.template = "<g #= d.renderId() # #= d.renderDataAttributes() # " +
		"transform='translate(#= Math.round(d.options.x - d.options.width / 2) #, #= Math.round(d.options.y - d.options.height / 2) #)' " +
		"fill-opacity='#= d.options.fillOpacity #' stroke-opacity='d.options.strokeOpacity'" +
		"> #= d.options.svg # </g>";
	SVGView.fn.createSVGString = function (options) {
		return this.decorate(
			new SVGString(options)
		);
	}
	SVGView.fn.playAnimations = function () {
		var view = this,
			transitions = view.options.transitions,
			deferreds = [];
		for (var i = 0; i < view.animations.length; i++) {
			if (transitions) {
				deferreds.push(view.animations[i].play());
			}
			else {
				view.animations[i].goTo(1);
			}
		}
		return view.animationDeferred = $.when.apply($, deferreds);
	}
	//return a new resolved promise
	function resprom() {
		return $.Deferred().resolve().promise();
	}
	var _ItemStyle = derive(Configuration, function (options) {
		/// <summary>
		/// For internal usage only. Describes the style properties of a menu item.
		/// </summary>
}, {
		/// <field type="String" defaultValue="">
		/// Gets or sets the item background color.
		/// </field>
		background: defineAutoUpdatingStyleProperty("background", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item text color.
		/// </field>
		color: defineAutoUpdatingStyleProperty("color", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item font.
		/// </field>
		font: defineAutoUpdatingStyleProperty("font", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item icon color when the icon is a font symbol.
		/// </field>
		iconColor: defineAutoUpdatingStyleProperty("iconColor", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the icon font when the icon is a font symbol.
		/// </field>
		iconFont: defineAutoUpdatingStyleProperty("iconFont", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item border color.
		/// </field>
		border: defineAutoUpdatingStyleProperty("border", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item hover color.
		/// </field>
		hoverColor: defineAutoUpdatingStyleProperty("hoverColor", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item selected color.
		/// </field>
		selectedColor: defineAutoUpdatingStyleProperty("selectedColor", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item disabled color.
		/// </field>
		disabledColor: defineAutoUpdatingStyleProperty("disabledColor", "")
	}, {
		createDefault: function (options) {
			/// <summary>
			/// Creates a new instance of Telerik.UI.RadialMenu._ItemStyle with default style settings.
			/// </summary>
			/// <param name="options" type="Object" optional="true">The instance options to override.</param>
			return new _ItemStyle(deepExtend({
				background: 'rgba(255, 255, 255, 0)',
				color: '#000',
				iconColor: '#000',
				border: '',
				hoverColor: '#114571',
				selectedColor: '#114571',
				disabledColor: '#999999'
			}, options));
		}
	});
	var _ExpandSectorStyle = derive(Configuration, function (options) {
		/// <summary>
		/// For internal usage only. Describes the style properties of an expand sector in a menu item.
		/// </summary>
}, {
		/// <field type="String" defaultValue="">
		/// Gets or sets the expand sector background color.
		/// </field>
		background: defineAutoUpdatingStyleProperty("background", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the expand sector border color.
		/// </field>
		border: defineAutoUpdatingStyleProperty("border", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the expand sector arrow color.
		/// </field>
		arrow: defineAutoUpdatingStyleProperty("arrow", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the expand sector hover color.
		/// </field>
		hoverColor: defineAutoUpdatingStyleProperty("hoverColor", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the expand arrow's hover color.
		/// </field>
		hoverArrow: defineAutoUpdatingStyleProperty("hoverArrow", "")
	}, {
		createDefault: function (options) {
			/// <summary>
			/// Creates a new instance of Telerik.UI.RadialMenu._ExpandSectorStyle with default style settings.
			/// </summary>
			/// <param name="options" type="Object" optional="true">The instance options to override.</param>
			return new _ExpandSectorStyle(deepExtend({
				background: '#006AC1',
				border: '#fff',
				arrow: '#fff',
				hoverColor: 'black',
				hoverArrow: '#fff'
			}, options));
		}
	});
	var _CenterItemStyle = derive(Configuration, function (options) {
		/// <summary>
		/// For internal usage only. Describes the style properties of a menu center item.
		/// </summary>
}, {
		/// <field type="String" defaultValue="">
		/// Gets or sets the center item background color.
		/// </field>
		background: defineAutoUpdatingStyleProperty("background", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the center item border color.
		/// </field>
		border: defineAutoUpdatingStyleProperty("border", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the center item icon color when using a font icon.
		/// </field>
		iconColor: defineAutoUpdatingStyleProperty("iconColor", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the center item icon font when using a font symbol for icon.
		/// </field>
		iconFont: defineAutoUpdatingStyleProperty("iconFont", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the center item hover color.
		/// </field>
		hoverColor: defineAutoUpdatingStyleProperty("hoverColor", "")
	}, {
		createDefault: function (options) {
			/// <summary>
			/// Creates a new instance of Telerik.UI.RadialMenu._CenterItemStyle with default style settings.
			/// </summary>
			/// <param name="options" type="Object" optional="true">The instance options to override.</param>
			return new _CenterItemStyle(deepExtend({
				background: "#FFF",
				border: '#000',
				iconColor: '#000',
				iconFont: "",
				hoverColor: '#D9D9D9'
			}, options));
		}
	});
	var ItemExpandSector = define(function (item) {
}, {
		render: function (view) {
},
		hover: function (enabled) {
},
		enabled: Configuration.defineProperty("enabled", true, notPreviousValidator, function (value) {
			this.enable(value);
		}),
		enable: function (enabled) {
},
		intersects: function (point) {
}
	});
	function updateOwnerMenu() {
		var item = this,
			menu;
		if (!(item instanceof MenuItem || item instanceof CenterItem)) {
			return;
		}
		menu = RadRadialMenu.instances.filter(function (menu) {
			return menu._initialized &&
				(item instanceof CenterItem ?
					menu.center === item :
					menu.getCurrentItems().indexOf(item) > -1);
		})[0];
		if (menu) {
			menu._render(true);
		}
	}
	//define a special type of property setter that will update the owner menu when required
	function defineAutoUpdatingProperty(key, defaultValue) {
		return Configuration.defineProperty(key, defaultValue, null, updateOwnerMenu);
	}
	//define a special type of property setter for item styles that will update the owne menu when required
	function defineAutoUpdatingStyleProperty(key, defaultValue) {
		return Configuration.defineProperty(key, defaultValue, null, function () {
			updateOwnerMenu.call(this.item);
		});
	}
	/// <summary>
	/// Represents a menu item in RadRadialMenu.
	/// </summary>
	var MenuItem = derive(Configuration, function (options) {
		/// <summary>
		/// Represents a menu item in RadRadialMenu.
		/// </summary>
		/// <param name="options" type="Object" optional="true">Optional. The initialization options for this instance.</param>
}, {
		/// <field type="String" nullable="true" defaultValue="null">
		/// Gets or sets the unique ID for this item.
		/// </field>
		id: null,
		/// <field type="String" defaultValue="">
		/// Gets or sets the item text.
		/// </field>
		text: defineAutoUpdatingProperty("text", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item icon.
		/// </field>
		icon: defineAutoUpdatingProperty("icon", ""),
		/// <field type="String" defaultValue="">
		/// Gets or sets the item tooltip.
		/// </field>
		tooltip: defineAutoUpdatingProperty("tooltip", ""),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether this item is selectable. Default is false.
		/// </field>
		selectable: Configuration.defineProperty("selectable", false),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether this item can be deselected by tapping. Default is true.
		/// </field>
		deselectable: Configuration.defineProperty("deselectable", true),
		/// <field type="String" defaultValue="">
		/// Gets or sets the name of the group this item belongs to. Items in one and the same group are exclusively selectable.
		/// This property requires the selectable property of the item to be true.
		/// </field>
		group: Configuration.defineProperty("group", ""),
		/// <field type="Number" defaultValue="-1">
		/// Gets or sets the index of the item in the visible view. This property affects the order of the items in the view.
		/// Default value is -1, indicating that items are shown in the order defined.
		/// </field>
		index: defineAutoUpdatingProperty("index", -1),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether the item will automatically collapse the radial menu when tapped. Default is false.
		/// </field>
		autoCollapse: Configuration.defineProperty("autoCollapse", false),
		/// <field type="Telerik.UI.RadialMenu.MenuItem" defaultValue="null" readOnly="true" hidden="true">
		/// Gets the parent menu item of the current item. This property is assigned programmatically and should not be modified by user.
		/// </field>
		parent: null,
		/// <field type="Telerik.UI.RadialMenu._ItemStyle" readOnly="true">
		/// Gets the style settings of the current item.
		/// </field>
		style: {get:function(){}, set:function(value){}},
		/// <field type="Telerik.UI.RadialMenu._ExpandSectorStyle" readOnly="true">
		/// Gets the style settings for the expand sector of this item.
		/// </field>
		expandSectorStyle: {get:function(){}, set:function(value){}},
		/// <field type="Array" elementType="Telerik.UI.RadialMenu.MenuItem">
		/// Gets or sets the child menu items of the current item.
		/// </field>
		items: {get:function(){}, set:function(value){}},
		render: function (view) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Renders the visual elements of the item onto an SVG view. This method should not be invoked by user code.
			/// </summary>
},
		hover: function (enabled) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Toggles the hover visual state of the item. This method should not be invoked by user code.
			/// </summary>
},
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets the selected state of the item. Default is false.
		/// </field>
		selected: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the enabled state of the item. Default is true.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		intersects: function (point) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. This method should not be invoked by user code.
			/// </summary>
}
	});
	mix(MenuItem, ui.Common.eventMixin, createEventProperties("select", "deselect", "action"));
	/// <summary>
	/// Represents a color picker menu item in RadRadialMenu.
	/// </summary>
	var ColorPickerItem = derive(MenuItem, function (options) {
		/// <summary>
		/// Represents a color picker menu item in RadRadialMenu.
		/// </summary>
		/// <param name="options" type="Object" optional="true">Optional. The initialization options for this instance.</param>
}, {
		/// <field type="Boolean" defaultValue="false">
		/// ColorPickerItem cannot be selected. This property always returns false.
		/// </field>
		selectable: {get:function(){}},
		/// <field type="Boolean" defaultValue="true">
		/// ColorPickerItem cannot be deselected. This property always returns false.
		/// </field>
		deselectable: {get:function(){}},
		/// <field type="Boolean" defaultValue="false">
		/// ColorPickerItem cannot be selected. This property always returns false.
		/// </field>
		selected: {get:function(){}},
		/// <field type="Array" elementType="Telerik.UI.RadialMenu.MenuItem">
		/// ColorPickerItem does not have child items. This property always returns empty array.
		/// </field>
		items: {get:function(){}},
		/// <field type="Telerik.UI.RadColorPicker">
		/// Gets the color picker instance associated with this menu item.
		/// </field>
		colorPicker: {get:function(){}, set:function(value){}},
		render: function (view) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Renders the visual elements of the item onto an SVG view. This method should not be invoked by user code.
			/// </summary>
},
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets the enabled state of the item. Default is true.
		/// </field>
		enabled: {get:function(){}, set:function(value){}},
		navigate: function (menu) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Navigates to the child view of this menu item. This method should not be invoked by user code
			/// </summary>
}
		}, {
		text: 'Color',
		icon: '<g class="t-colorpicker-icon"><path data-fill="#= d.baseColor #" fill="#= d.enabled ? d.baseColor : d.disabledColor #" stroke-opacity="#= d.strokeOpacity #" fill-opacity="#= d.fillOpacity #" d="m 23.979831,-4.6662987 c -1.333124,-1.3433651 -3.49339,-1.3433651 -4.825204,0 L 15.661238,-1.1495328 14.628295,-2.189387 11.778528,0.67944939 18.778416,7.7261775 21.628183,4.8586606 20.48382,3.7053198 23.97852,0.18855379 c 1.333125,-1.34204539 1.333125,-3.51544639 0.0013,-4.85485249 z"/><path data-fill="#= d.accentColor #" data-stroke="#= d.baseColor #" stroke="#= d.enabled ? d.baseColor : d.disabledColor #" stroke-width="1" fill="#= d.enabled ? d.accentColor : d.disabledColor #" stroke-opacity="#= d.strokeOpacity #" fill-opacity="#= d.fillOpacity #" d="M 14.487099,9.2637335 15.775302,7.985354 7.835205,15.883995 C 7.184667,16.652384 6.010869,17.307637 4.82293,17.04365 L 2.574331,18.571 0.651,16.704239 2.206635,14.427355 c -0.183848,-0.645824 0.05657,-1.772482 0.66468,-2.503159 L 5.318198,9.429062 11.133182,3.4840415 5.4903024,9.2544913"/></g>'
	});
	/// <summary>
	/// Represents a center menu item in RadRadialMenu.
	/// </summary>
	var CenterItem = derive(Configuration, function (options) {
		/// <summary>
		/// Represents a center menu item in RadRadialMenu.
		/// </summary>
		/// <param name="options" type="Object" optional="true">Optional. The initialization options for this instance.</param>
}, {
		/// <field type="String" defaultValue="">
		/// Gets or sets the item icon.
		/// </field>
		icon: defineAutoUpdatingProperty("icon", ""),
		/// <field type="Telerik.UI.RadialMenu._CenterItemStyle" readOnly="true">
		/// Gets or sets the style settings for the item.
		/// </field>
		style: {get:function(){}, set:function(value){}},
		render: function (view) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Renders the visual elements of the item onto an SVG view. This method should not be invoked by user code.
			/// </summary>
},
		hover: function (enabled) {
			/// <excludetoc />
			/// <summary>
			/// For internal use only. Toggles the hover visual state of the item. This method should not be invoked by user code.
			/// </summary>
}
	});
	var AnimationScenario = Class.extend({
		init: function (options) {
			var that = this;
			that.options = deepExtend({}, that.options, options);
		},
		prepare: function (animation) {
			var options = this.options,
				defaults = animation.constructor.fn.options;
			animation.options.easing = options.easing || defaults.easing;
			animation.options.delay = options.delay != null ? options.delay : defaults.delay;
			animation.options.duration = options.duration != null ? options.duration : defaults.duration;
		},
		setup: function (element) {
			var that = this,
				fields = that.options.fields,
				key, opts;
			for (key in fields) {
				opts = fields[key];
				setProperty(element, key, opts.start);
			}
		},
		step: function (element, pos) {
			var that = this,
				fields = that.options.fields,
				interpolate,
				key, opts, value;
			for (key in fields) {
				opts = fields[key];
				interpolate = opts.interpolate || interpolateValue;
				value = interpolate(opts.start, opts.end, pos);
				setProperty(element, key, value);
			}
		}
	});
	var AnimationBase = ElementAnimation.extend({
		init: function (element, options) {
			var that = this;
			that.options = deepExtend({}, that.options, options);
			that.element = element;
			that.scenarios = that.buildScenarios();
		},
		options: {
			easing: EASING,
			delay: 0,
			duration: ANIMATIONDURATION,
			current: 0
		},
		buildScenarios: function () {
			return [];
		},
		setScenario: function (index) {
			var that = this;
			that.options.current = index;
		},
		current: function () {
			var that = this,
				scenarios = that.scenarios || [],
				index = that.options.current;
			return scenarios[index];
		},
		setup: function () {
			var that = this,
				element = that.element,
				scenario = that.current();
			if (scenario) {
				that._stopped = false;
				scenario.prepare(that);
				scenario.setup(element);
			}
		},
		play: function () {
			var anim = this,
				deferred;
			if (!anim._stopped) {
				deferred = anim.deferred = $.Deferred();
			}
			ElementAnimation.fn.play.call(anim);
			return deferred;
		},
		step: function (pos) {
			var that = this,
				element = that.element,
				scenario = that.current();
			if (scenario) {
				scenario.step(element, pos);
			}
		},
		abort: function () {
			var that = this,
				deferred = that.deferred;
			ElementAnimation.fn.abort.call(that);
			that.goTo(1); //finish the animation
			if (deferred && deferred.state() !== "resolved") {
				deferred.resolve();
			}
		},
		goTo: function (pos) {
			var that = this,
				element = that.element,
				domElement = that.container.querySelector("#" + element.options.id),
				scenario = that.current();
			if (scenario) {
				if (!pos) {
					//go to starting frame
					scenario.setup(element);
				}
				else {
					//go to specified frame
					that.step(pos);
				}
			}
			element.refresh(domElement);
		}
	});
	var OuterCircleAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var element = this.element,
				start = element.options.startRadius,
				end = element.r;
			return [
				new AnimationScenario({
					fields: {
						r: {
							start: start,
							end: end
						}
					}
				}),
				new AnimationScenario({
					delay: ANIMATIONDURATION,
					fields: {
						r: {
							start: end,
							end: start
						}
					}
				}),
				new AnimationScenario({
					fields: {
						r: {
							start: end,
							end: end
						}
					}
				}),
				new AnimationScenario({
					fields: {
						r: {
							start: end,
							end: end
						}
					}
				})
			];
		}
	});
	var InnerCircleAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var element = this.element,
				start = element.options.startRadius,
				end = element.r,
				shrink = element.options.shrinkRadius;
			return [
				new AnimationScenario({
					fields: {
						r: {
							start: start,
							end: end
						}
					}
				}),
				new AnimationScenario({
					delay: ANIMATIONDURATION,
					fields: {
						r: {
							start: end,
							end: start
						}
					}
				}),
				new AnimationScenario({
					fields: {
						r: {
							start: shrink,
							end: end
						}
					}
				}),
				new AnimationScenario({
					delay: ANIMATIONDURATION / 3,
					fields: {
						r: {
							start: end,
							end: shrink
						}
					}
				})
			];
		}
	});
	var ExpandSectorAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var element = this.element,
				dims = element.options.dimensionOptions,
				shrinkRadius = getShrinkRadius(element.options.totalRadius),
				config = element.config;
			return [
				new AnimationScenario({
					delay: ANIMATIONDURATION - ANIMATIONDURATION / 3,
					duration: ANIMATIONDURATION / 3,
					fields: {
						"config.r": {
							start: dims.innerRadius,
							end: config.r
						},
						"config.ir": {
							start: dims.innerRadius - (dims.radius - dims.innerRadius),
							end: config.ir
						},
						"config.startAngle": {
							start: dims.startAngle - dims.angle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 0,
							end: 1
						},
						"options.strokeOpacity": {
							start: 0,
							end: 1
						}
					}
				}),
				new AnimationScenario({
					fields: {
						"config.r": {
							start: config.r,
							end: dims.innerRadius
						},
						"config.ir": {
							start: config.ir,
							end: dims.innerRadius - (dims.radius - dims.innerRadius)
						},
						"config.startAngle": {
							start: config.startAngle,
							end: dims.startAngle - dims.angle
						},
						"options.fillOpacity": {
							start: 1,
							end: 0,
						},
						"options.strokeOpacity": {
							start: 1,
							end: 0
						}
					}
				}),
				new AnimationScenario({
					fields: {
						"config.r": {
							start: shrinkRadius - (dims.radius - dims.innerRadius),
							end: config.r
						},
						"config.ir": {
							start: shrinkRadius - 2 * (dims.radius - dims.innerRadius),
							end: config.ir
						},
						"config.startAngle": {
							start: config.startAngle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 0,
							end: 1
						},
						"options.strokeOpacity": {
							start: 0,
							end: 1
						}
					}
				}),
				new AnimationScenario({
					delay: ANIMATIONDURATION * 0.7,
					duration: ANIMATIONDURATION,
					fields: {
						"config.r": {
							start: config.r,
							end: shrinkRadius - (dims.radius - dims.innerRadius)
						},
						"config.ir": {
							start: config.ir,
							end: shrinkRadius - 2 * (dims.radius - dims.innerRadius)
						},
						"config.startAngle": {
							start: config.startAngle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 1,
							end: 0
						},
						"options.strokeOpacity": {
							start: 1,
							end: 0
						}
					}
				})
			];
		}
	});
	var ExpandArrowAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var scenario1 = new AnimationScenario({
				delay: ANIMATIONDURATION,
				fields: {
					"options.fillOpacity": {
						start: 0,
						end: 1
					}
				}
			}),
				scenario2 = new AnimationScenario({
					duration: ANIMATIONDURATION / 3,
					fields: {
						"options.fillOpacity": {
							start: 1,
							end: 0
						}
					}
				});
			return [scenario1, scenario2, scenario1, scenario2];
		}
	});
	var ItemTextAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var options = this.element.options,
				increment = options.increment,
				scenario1 = new AnimationScenario({
					delay: ANIMATIONDURATION,
					fields: {
						"options.fillOpacity": {
							start: 0,
							end: 1
						},
						"options.strokeOpacity": {
							start: 0,
							end: 1
						}
					}
				}),
				scenario2 = new AnimationScenario({
					duration: ANIMATIONDURATION / 3,
					fields: {
						"options.fillOpacity": {
							start: 1,
							end: 0
						},
						"options.strokeOpacity": {
							start: 1,
							end: 0
						}
					}
				});
			if (increment) {
				scenario1.options.fields["options.y"] = {
					start: eval("options.y" + increment),
					end: options.y
				};
				scenario2.options.fields["options.y"] = {
					start: options.y,
					end: eval("options.y" + increment)
				};
			}
			return [scenario1, scenario2, scenario1, scenario2];
		}
	});
	var ItemImageAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var options = this.element.options,
				increment = options.increment,
				scenario1 = new AnimationScenario({
					delay: ANIMATIONDURATION,
					fields: {
						"options.width": {
							start: 0,
							end: options.width
						},
						"options.height": {
							start: 0,
							end: options.height
						},
						"options.x": {
							start: 0,
							end: options.x
						},
						"options.y": {
							start: 0,
							end: options.y
						},
					}
				}),
				scenario2 = new AnimationScenario({
					duration: ANIMATIONDURATION / 3,
					fields: {
						"options.width": {
							start: options.width,
							end: 0
						},
						"options.height": {
							start: options.height,
							end: 0
						},
						"options.x": {
							start: options.x,
							end: 0
						},
						"options.y": {
							start: options.y,
							end: 0
						}
					}
				});
			return [scenario1, scenario2, scenario1, scenario2];
		}
	});
	var ItemSectorAnimation = AnimationBase.extend({
		buildScenarios: function () {
			var element = this.element,
				config = element.config,
				dims = element.options.dimensionOptions;
			return [
				new AnimationScenario({
					delay: ANIMATIONDURATION / 3,
					duration: ANIMATIONDURATION - ANIMATIONDURATION / 3,
					fields: {
						"config.r": {
							start: dims.innerRadius,
							end: config.r
						},
						"config.startAngle": {
							start: dims.startAngle - dims.angle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 0,
							end: 1
						},
						"options.strokeOpacity": {
							start: 0,
							end: 1
						}
					}
				}),
				new AnimationScenario({
					fields: {
						"config.startAngle": {
							start: dims.startAngle,
							end: dims.startAngle - dims.angle
						},
						"options.fillOpacity": {
							start: 1,
							end: 0
						},
						"options.strokeOpacity": {
							start: 1,
							end: 0
						}
					}
				}),
				new AnimationScenario({
					delay: ANIMATIONDURATION / 2,
					duration: ANIMATIONDURATION,
					fields: {
						"config.r": {
							start: dims.radius - dims.collapsedRadius,
							end: config.r
						},
						"config.ir": {
							start: dims.innerRadius - dims.collapsedRadius,
							end: config.ir
						},
						"config.startAngle": {
							start: config.startAngle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 0,
							end: 1
						},
						"options.strokeOpacity": {
							start: 0,
							end: 1
						}
					}
				}),
				new AnimationScenario({
					delay: 0,
					fields: {
						"config.r": {
							start: config.r,
							end: dims.radius - dims.collapsedRadius
						},
						"config.ir": {
							start: config.ir,
							end: dims.innerRadius - dims.collapsedRadius
						},
						"config.startAngle": {
							start: config.startAngle,
							end: config.startAngle
						},
						"options.fillOpacity": {
							start: 1,
							end: 0
						},
						"options.strokeOpacity": {
							start: 1,
							end: 0
						}
					}
				})
			];
		}
	});
	var DefaultAnimationDecorator = Class.extend({
		init: function (view) {
			this.view = view;
		},
		decorate: function (element) {
			var that = this,
				view = that.view,
				animation = element.options.animation;
			if (animation && animation.fn instanceof AnimationBase) {
				view.animations.push(new animation(element, { current: view.options.scenario }));
			}
			return element;
		}
	});
	function getShrinkRadius(radius) {
		return radius - (radius * OUTERRIMRATIO) - (radius * CENTERRATIO);
	}
	var ItemView = define(function (options) {
}, {
		items: null,
		createSvgView: function () {
},
		deferred: {get:function(){}},
		render: function (container) {
},
		getElement: function (e) {
},
		pointerMove: function (e) {
},
		gestureMove: function (gesture) {
},
		gestureEnd: function (e) {
},
		hover: function (element) {
},
		select: function (item) {
},
		tooltip: function (element) {
},
		animating: {get:function(){}},
		playScenario: function (index) {
},
		goToScenario: function (index) {
},
		shrink: function () {
},
		toggle: function (expanded) {
},
		destroy: function () {
}
	});
	function renderOnChange() {
		if (this._initialized) {
			this._render(true);
		}
	}
	function showOnChange() {
		if (this._initialized && this.visible) {
			this.show();
		}
	}
	function isValidPosition(position) {
		return ["top", "bottom", "left", "right", "center", "top left", "top right", "bottom left", "bottom right"].indexOf(position) > -1;
	}
	function contains(parent, child) {
		return parent && child && (parent === child || child.parentNode === parent || (child.parentNode && parent.contains(child.parentNode)));
	}
	function getParentWithSelector(element, selector) {
		var all = document.querySelectorAll(selector),
			i, item;
		for (i = 0; i < all.length; i++) {
			item = all[i];
			if (item.contains(element)) {
				return item;
			}
		}
	}
	/// <summary>
	/// Displays a radial context menu.
	/// </summary>
	/// <icon src="radialmenu_html_12.png" width="12" height="12" />
	/// <icon src="radialmenu_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRadialMenu"></div>]]></htmlSnippet>
	/// <event name="action">Fires when a menu item is tapped.</event>
	/// <event name="select">Fires when a menu item is selected.</event>
	/// <event name="deselect">Fires when a menu item is deselected.</event>
	/// <event name="navigate">Fires when the user navigates to another menu view.</event>
	/// <event name="expand">Fires when the radial menu is expanded.</event>
	/// <event name="collapse">Fires when the radial menu is collapsed.</event>
	/// <event name="show">Fires when the radial menu is shown.</event>
	/// <event name="hide">Fires when the radial menu is hidden.</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadRadialMenu = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Initializes a new RadRadialMenu instance from the provided HTML element and options.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="HTMLElement" readonly="true">
		/// Gets the popup element that contains the radial menu elements.
		/// </field>
		popup: {get:function(){}},
		/// <field type="Number" defaultValue="-22.5">
		/// Gets or sets the start angle of the first radial sector in the menu.
		/// </field>
		startAngle: Configuration.defineProperty("startAngle", STARTANGLE, floatValidator, renderOnChange),
		/// <field type="Number" defaultValue="132.5">
		/// Gets or sets the radius of the radial menu.
		/// </field>
		radius: Configuration.defineProperty("radius", RADIUS, floatValidator, renderOnChange),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether the menu is visible.
		/// </field>
		visible: Configuration.defineProperty("visible", true, notPreviousValidator, function () {
			if (this._initialized) {
				this[this.visible ? "show" : "hide"]();
			}
		}),
		/// <field type="HTMLElement">
		/// Gets or sets the target HTML element or CSS selector for which the radial menu will be shown.
		/// If null, the menu popup is positioned at the control's element location.
		/// </field>
		target: Configuration.defineProperty("target", null, notPreviousValidator, function () {
			var that = this;
			if (that._initialized) {
				that._bindTrigger();
				if (that.visible) {
					that.show();
				}
			}
		}),
		/// <field type="String">
		/// Gets or sets the target element's trigger action that will show this menu. This property requires that
		/// a valid target is specified. Available options are "tap", "hover", "focus", "select" and "none". Default is "tap".
		/// </field>
		trigger: Configuration.defineProperty("trigger", "tap", function (value, prev) {
			var valid = ["none", "tap", "hover", "focus", "select"];
			if (valid.indexOf(value) > -1 && value !== prev) {
				return value;
			}
		}, function () {
			if (this._initialized) {
				this._bindTrigger();
			}
		}),
		/// <field type="String">
		/// Gets or sets the position of the radial menu relative to the target HTML element. This property requires 
		/// that a valid target is specified. Accepted values are "top", "bottom", "left", "right", "center",
		/// "top left", "top right", "bottom left" and "bottom right". Default value is "right".
		/// </field>
		position: Configuration.defineProperty("position", "right", function (value, prev) {
			if (isValidPosition(value) && value !== prev) {
				return value;
			}
		}, showOnChange),
		/// <field type="Number">
		/// Gets or sets the left offset of the radial menu in pixels relative to the target HTML element and specified position.
		/// This property requires that a valid target is specifies.
		/// </field>
		offsetLeft: Configuration.defineProperty("offsetLeft", 0, floatValidator, showOnChange),
		/// <field type="Number">
		/// Gets or sets the top offset of the radial menu in pixels relative to the target HTML element and specified position.
		/// This property requires that a valid target is specifies.
		/// </field>
		offsetTop: Configuration.defineProperty("offsetTop", 0, floatValidator, showOnChange),
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets a value indicating whether the menu is expanded.
		/// </field>
		expanded: Configuration.defineProperty("expanded", false, notPreviousValidator, function (value) {
			var that = this;
			if (that._initialized) {
				that.toggle(value);
			}
		}),
		/// <field type="Boolean" defaultValue="true">
		/// Gets or sets a value indicating whether the menu will automatically collapse when the user taps outside of its bounding circle.
		/// </field>
		autoCollapse: Configuration.defineProperty("autoCollapse", true),
		/// <field type="Boolean" defaultValue="true">
		/// Enables or disables menu transitions.
		/// </field>
		transitions: Configuration.defineProperty("transitions", true, null, function (value) {
			var that = this;
			if (that._initialized) {
				that._view.transitions = value;
				that._view.svgView.transitions = value;
			}
		}),
		/// <field type="String" defaultValue="#EAEAEA">
		/// Gets or sets the outer circle background color.
		/// </field>
		background: Configuration.defineProperty("background", "#EAEAEA", notPreviousValidator, renderOnChange),
		/// <field type="String" defaultValue="#212121">
		/// Gets or sets the outer circle border color.
		/// </field>
		border: Configuration.defineProperty("border", "#212121", notPreviousValidator, renderOnChange),
		/// <field type="String" defaultValue="#FFF">
		/// Gets or sets the inner circle background color.
		/// </field>
		innerBackground: Configuration.defineProperty("innerBackground", "#FFF", notPreviousValidator, renderOnChange),
		/// <field type="Telerik.UI.RadialMenu.CenterItem" readOnly="true">
		/// Gets or sets the center item.
		/// </field>
		center: {get:function(){}, set:function(value){}},
		/// <field type="Array" elementType="Telerik.UI.RadialMenu.MenuItem">
		/// Gets or sets all the items in the menu.
		/// </field>
		items: {get:function(){}, set:function(value){}},
		getCurrentItems: function () {
			/// <summary>
			/// Retrieves the current visible items in the menu.
			/// </summary>
},
		getAllItems: function () {
			/// <summary>
			/// Retrieves all items in the menu.
			/// </summary>
},
		getItem: function (id) {
			/// <summary>
			/// Finds an item by the specified id.
			/// </summary>
			/// <param name="id" type="String">The id of the item to find.</param>
},
		toggle: function (expanded) {
			/// <summary>
			/// Toggles between expanded and collapsed states in the menu.
			/// </summary>
			/// <param name="expanded" type="Boolean" optional="true">Optional. The expanded state that the menu will take.</param>
},
		navigate: function (item) {
			/// <summary>
			/// Navigates to the child items of a specified menu item.
			/// </summary>
			/// <param name="item" type="Telerik.UI.RadialMenu.MenuItem">The menu item instance whose child items to navigate to.</param>
},
		back: function (top) {
			/// <summary>
			/// Navigates back to a parent view.
			/// </summary>
			/// <param name="top" type="Boolean" optional="true">Optional. If true, navigates to the topmost item view. By default, navigates one level back.</param>
},
		show: function (target, position, offsetLeft, offsetTop) {
			/// <summary>
			/// Shows the menu, optionally relative to a target, at a position and offset.
			/// </summary>
			/// <param name="target" type="HTMLElement" optional="true">The target HTML element or CSS selector.</param>
			/// <param name="position" type="string" optional="true">
			/// The position relative to the target HTML element where to display the menu.
			/// Accepted values are "top", "bottom", "left", "right", "center", "top left", "top right", "bottom left" and "bottom right".
			/// </param>
			/// <param name="offsetLeft" type="Number" optional="true">The left offset relative to the specified target and position.</param>
			/// <param name="offsetTop" type="Number" optional="true">The top offset relative to the specified target and position.</param>
			/// <returns type="WinJS.Promise"></returns>
},
		hide: function () {
			/// <summary>
			/// Hides the menu. If the menu is expanded, collapses it first.
			/// </summary>
			/// <returns type="WinJS.Promise"></returns>
},
		refresh: function (immediate) {
			/// <summary>
			/// Refreshes the menu by redrawing the elements and triggering transitions.
			/// </summary>
			/// <param name="immediate" type="Boolean" optional="true">Optional. If true, refreshes the control immediately without animation.</param>
},
		}, {
		instances: [],
		getVisible: function () {
			/// <summary>
			/// Retrieves the visible instance of Telerik.UI.RadRadialMenu on page.
			/// </summary>
			/// <returns type="Telerik.UI.RadRadialMenu"></returns>
			var instances = RadRadialMenu.instances,
				i;
			for (i = 0; i < instances.length; i++) {
				if (instances[i].visible) {
					return instances[i];
				}
			}
			return null;
		}
	});
	mix(RadRadialMenu, createEventProperties("action", "select", "deselect", "navigate", "expand", "collapse", "show", "hide"));
	namespace("Telerik.UI", {
		RadRadialMenu: RadRadialMenu
	});
	namespace(nsName, {
		_ItemStyle: _ItemStyle,
		_ExpandSectorStyle: _ExpandSectorStyle,
		_CenterItemStyle: _CenterItemStyle,
		MenuItem: MenuItem,
		CenterItem: CenterItem,
		ColorPickerItem: ColorPickerItem
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        telerik = Telerik,
        ui = telerik.UI,
        util = telerik.Utilities,
        config = ui._ControlConfiguration,
        defineProperty = config.defineProperty,
        getMapping = config.getMapping,
		templateValidator = util._validators.stringOrUnifiedTemplate,
        NULL = null,
        FUNCTION = "function",
        DRAGHANDLESELECTOR = ".k-slider-track .k-draghandle",
        INCREASEARROWSELECTOR = ".k-icon.k-i-arrow-e",
        DECREASEARROWSELECTOR = ".k-icon.k-i-arrow-w",
        CONTAINERCSSCLASS = "t-slider",
        INTERACTIVECSSCLASS = "win-interactive";
    namespace("Telerik.UI.Slider", {
        _TooltipConfiguration: derive(config, function (owner, parentMapping, defaults, onchange) {
        	/// <summary>
            /// For internal usage only. Describes the properties of the slider tooltip.
        	/// </summary>
}, {
            /// <field type="Boolean" defaultValue="true">
            /// Gets or sets the enabled state of the slider tooltip.
            /// </field>
            enabled: defineProperty("enabled", true),
            /// <field type="String" defaultValue="{0}">
            /// Gets or sets the format of the slider tooltip. If a tooltip template is set,
            /// the value of this property will be ignored and the template will be used instead.
            /// </field>
            format: defineProperty("format", "{0}"),
            /// <field type="String">
            /// Gets or sets the template string that will be used for the content of the slider tooltip.
            /// A non-empty value for this property overrides the tooltip format when the tooltip is shown.
            /// </field>
            template: defineProperty("template", "")
        })
    });
        /// <excludetoc />
    var SliderBase = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// A base class for the RadRangeSlider and RadSlider controls.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
    	//when dragging, the slider tooltip gets behind the ticks tooltips. this code temporarily
		//removes any tick tooltips while dragging and restores them on pointer up.
        /// <field type="Boolean">
        /// Gets or sets the enabled state of the control.
        /// </field>
        enabled: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the delta with which the value changes when the user presses
        /// PageUp or PageDown (the drag handle must be focused).
        /// </field>
        largeStep: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the small step value of the slider. The slider value will change when
        /// the end user (1) clicks on the increase/decrease buttons, (2) presses the arrow keys
        /// (the drag handle must be focused), or (3) drags the drag handle.
        /// </field>
        smallStep: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the minimum value of the slider.
        /// </field>
        min: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the maximum value of the slider.
        /// </field>
        max: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the orientation of the slider. Allowed values are "horizontal" or "vertical".
        /// Default value is "horizontal".
        /// </field>
        /// <options>
        /// <option value="horizontal">horizontal</option>
        /// <option value="vertical">vertical</option>
        /// </options>
        orientation: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the location of the tick marks in the slider. The available options are
        /// "minorOutside", "minorMajorOutside", "inside" and "none". Default value is "minorMajorOutside".
        /// </field>
        /// <options>
        /// <option value="minorMajorOutside">minorMajorOutside</option>
        /// <option value="minorOutside">minorOutside</option>
        /// <option value="inside">inside</option>
        /// <option value="none">none</option>
        /// </options> 
        tickPlacement: {get:function(){}, set:function(value){}},
        /// <field type="Telerik.UI.Slider._TooltipConfiguration">
        /// Gets the configuration settings for the slider tooltip.
        /// </field>
        tooltip: {get:function(){}}
    });
    mix(SliderBase, utilities.createEventProperties("change", "slide"));
        /// <summary>
        /// A slider control for selecting values.
        /// </summary>
        /// <icon src="slider_html_12.png" width="12" height="12" />
        /// <icon src="slider_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadSlider"></div>]]></htmlSnippet>
        /// <event name="change" argsType="Telerik.UI.Slider.ChangeEventArgs">
		/// Fires when the value of the slider is changed.
		/// <param name="value" type="Number">The new slider value.</param>
		/// </event>
        /// <event name="slide" argsType="Telerik.UI.Slider.SlideEventArgs">
		/// Fires when the slide handle has moved.
		/// <param name="value" type="Number">A number representing the point that the user has just moved the slider handle to.</param>
		/// </event>
        /// <part name="slider" class="k-slider">The RadSlider widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadSlider = derive(SliderBase, function (element, options) {
        /// <summary>
        /// Creates a new RadSlider control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
    	/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
        /// <field type="Number">
        /// Gets or sets the value of the slider.
        /// </field>
        value: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets whether the increase and decrease buttons should be shown.
        /// </field>
        showButtons: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the increase button.
        /// </field>
        increaseButtonTooltip: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the decrease button.
        /// </field>
        decreaseButtonTooltip: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the drag handle.
        /// </field>
        dragHandleTooltip: {get:function(){}, set:function(value){}}
    });
        /// <summary>
        /// A slider control for selecting a range of values.
        /// </summary>
        /// <icon src="slider_html_12.png" width="12" height="12" />
        /// <icon src="slider_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRangeSlider"></div>]]></htmlSnippet>
        /// <event name="change" eventType="Telerik.UI.RangeSlider.ChangeEventArgs">
		/// Fires when the value of the slider is changed.
		/// <param name="value" type="Array">An array of two numeric values representing the two ends of the newly selected range.</param>
		/// </event>
        /// <event name="slide" eventType="Telerik.UI.RangeSlider.SlideEventArgs">
		/// Fires when a slide handle has moved.
		/// <param name="value" type="Array">An array of two numbers representing the two ends of the current range.</param>
		/// </event>
        /// <part name="rangeSlider" class="k-slider">The RadRangeSlider widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadRangeSlider = derive(SliderBase, function (element, options) {
        /// <summary>
        /// Creates a new RadRangeSlider control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
    	/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
        /// <field type="String">
        /// Gets or sets the tooltip of the left drag handle.
        /// </field>
        leftDragHandleTooltip: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the right drag handle.
        /// </field>
        rightDragHandleTooltip: {get:function(){}, set:function(value){}},
        /// <field type="Array" elementType="Number">
        /// Gets or sets the start and end selection values of the range slider as an array of 2 elements.
        /// </field>
        values: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the starting value of the current range selection.
        /// </field>
        selectionStart: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the end value of the current range selection.
        /// </field>
        selectionEnd: {get:function(){}, set:function(value){}}
    });
    kendo.ui.RangeSlider.prototype._setZIndex = function (type) {
        this.wrapper.find(".k-draghandle").each(function (index) {
            $(this).css("z-index", type == "firstHandle" ? 2 - index : 1 + index);
        });
    }
    namespace("Telerik.UI", {
        RadSlider: RadSlider,
        RadRangeSlider: RadRangeSlider
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
/// <reference path="/js/listbase.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		ui = Telerik.UI,
		util = Telerik.Utilities,
		NOOP = function () { };
	function defineTemplateProperty(name) {
		return {
			get: function () {
				var tmpl = this._widget.options[name];
				return tmpl && tmpl._originalTemplate ? tmpl._originalTemplate : tmpl;
			},
			set: function (value) {
				var that = this,
                    widget = that._widget,
                    current = widget.options[name],
                    wrapped = util.getTemplate(value, true);
				if (current && current._originalTemplate) {
					current = current._originalTemplate;
				}
				if (wrapped !== undefined && value !== current) {
					widget.options[name] = wrapped;
					widget._template();
					//enfore rebinding of the widget to the data
					that.dataSource = that.dataSource;
				}
			}
		}
	}
	/// <summary>
	/// A multiple token input providing text suggestions.
	/// </summary>
	/// <icon src="tokeninput_html_12.png" width="12" height="12" />
	/// <icon src="tokeninput_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadTokenInput"></span>]]></htmlSnippet>
	/// <event name="open">Fires when the drop-down list of RadTokenInput is shown.</event>
	/// <event name="close">Fires when the drop-down list of RadTokenInput is closed.</event>
	/// <event name="select" argsType="Telerik.UI.TokenInput.SelectEventArgs">
	/// Fires when an item is selected from the drop-down list.
	/// <param name="item" type="Object">The jQuery object which represents the selected item.</param>
	/// </event>
	/// <event name="change">Fires when the value of the RadTokenInput changes.</event>
	/// <event name="databinding">Fires when the control is about to databind.</event>
	/// <event name="databound">Fires immediately after the control is databound.</event>
	/// <part name="tokenInput" class="k-multiselect">The RadTokenInput widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var RadTokenInput = derive(ui.ListBase, function (element, options) {
		/// <summary>
		/// Creates a new RadTokenInput control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Array">
		/// Gets or sets the value of the control. Accepts both an array and a single value.
		/// </field>
		value: {get:function(){}, set:function(value){}},
		/// <excludetoc />
		template: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the template to be used for rendering the items in the list.
		/// </field>
		itemTemplate: defineTemplateProperty("itemTemplate"),
		/// <field type="String">
		/// Gets or sets the template to be used for rendering the selected tags.
		/// </field>
		tagTemplate: defineTemplateProperty("tagTemplate"),
		/// <field type="Boolean">
		/// Gets or sets a value indicating whether RadComboBox should automatically highlight the first shown item.
		/// </field>
		highlightFirst: {get:function(){}, set:function(value){}},
		/// <field type="String" defaultValue="none">
		/// Gets or sets the type of filtration to use when filtering the data items. Possible values include "startswith", "endswith", "contains", "eq"(equals), "neq"(does not equal). Default value is "none".
		/// </field>
		filter: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true">
		/// Gets or sets the minimum amount of characters that should be typed before RadComboBox queries the dataSource.
		/// </field>
		minLength: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the string that appears in the textbox when it has no value.
		/// </field>
		placeholder: {get:function(){}, set:function(value){}},
		/// <field type="Number" integer="true" defaultValue="null">
		/// Gets or sets the maximum number of selected items in the control.
		/// </field>
		maxSelectedItems: {get:function(){}, set:function(value){}},
		open: function () {
			/// <summary>
			/// Opens the drop-down list.
			/// </summary>
},
		toggle: function (toggle) {
			/// <summary>
			/// Toggles the drop-down list between its open and closed state.
			/// </summary>
			/// <param name="toggle" type="Boolean">Optional. Specifies whether to open or close the drop-down list.</param>
},
		dataItems: function () {
			/// <summary>
			/// Returns an array of data records corresponding to the selected items in the control.
			/// </summary>
			/// <returns type="Array"></returns>
}
	});
	namespace("Telerik.UI", {
		RadTokenInput: RadTokenInput
	});
	kendo.ui.MultiSelect.prototype.select = function (li) {
		var that = this,			
			idx = !isNaN(li) ? li : (li = $(li)).data("idx"),
			dataItem = that.dataSource.view()[idx];
		if (that._dataItems.indexOf(dataItem) > -1) {
			return;
		}
		that._select(li);
	}
})(this, jQuery);//if you change the name of this function, remember to update buildscripts as well
function showTrialMessage() {
    var sessionState = WinJS.Application.sessionState,
		magic = sessionState.telerikControlsInternal,
		title = "Telerik UI for Windows 8 Trial",
		url = "http://www.telerik.com/purchase/individual-windows-8.aspx?utm_source=trial&utm_medium=web&utm_campaign=Windows8",
		text = "To get access to the latest updates across <br /> the Windows 8 suite and Telerik's dedicated <br /> support please purchase a commercial license now.",
		imgSrc = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2' +
            'FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7FJREFUeNrEVklPFEEUrmqaQXFJ' +
            'cImIaIJIIuISwQ1RXNFEIyaaGOPJf+DvMVy8eTPRRA9IFIXgQlSQg+KOSgwwCo' +
            'oMMNMz7fe6v4IeZZhGMuElX151dVW9pd5SeiyeVIa0+pf0DB9gFliKs4uAQszF' +
            'wCcjtuWqEGSHFpo+Z4SqAtuaAJtQcyR7DmvXAMVAHvAVGALcSSe1CrxI+/P51E' +
            '2sTmnh2vsezM+zZL1KJFOyTtshrS3CxGXwjeJO4KocRkGXsLZqRlWnD3kFgU0Q' +
            'PiazMm2FsFTW7ROhPKcdeMd/e4DKEGdsBmo5lqBKhXF1KUQf4rgfuE+rlwNHGG' +
            'hyxzeUH2CefjBL3L0MOAbIddTD6h5YPeAkU7adxc3iyjrP1Uo5QCvvVugwsI7j' +
            'VkTzg5m0hjAx7jxjpA5Cb9p5ViKbq8uNi6DMa7DOKS/4bpb936lQJpI9Hzk+AJ' +
            'SpLHe82HOT9vJUXPgIGOe/o+I+eqYZ1g5nOgSulX8PGeVLwA/C6kIr4FIrvUao' +
            'amArP16CdXPtTmAH17wBnoeIE1nzguMaYJsRnAgWBVajSiojd/uBa0yELuW4B/' +
            'idTSqsnqCSxshyi5qfBC5oPwhKGaWdNF8SvoquF3oGROmZWkb3rIQAkwKznZ+S' +
            'Ed0Wq4zweuA4cI4L3gId2ldMBO8KzHdxX4kIjzteNcok1FzbFk51AL3G1S3AFy' +
            'qwCdgNcTEGRYyldS+wUgRqP5f7ubeBeZqJ1tIzokBUghTp5Fi8zwRmr9PFBcAJ' +
            'IAL0AfdoXYWnkK9clJrLvUukNsDqCKyzAtDM4RqcvZ4x1A6hfaZJmL74GWijBd' +
            'IMGrDhNvhTuqqEeSiufk9vVNNDtVj7g4Fm6o/DwlPP70+BOuAJdgIdpcVzqfYC' +
            'Zj/wGBgApCpdBFZj4Wnwa8Av4K7yrSnAnrOz9Akxrg3WRpHDGtw1uWua9whwi/' +
            'co93mKe7uYi2LVBlY0xfkuuj4TpLI9MXksQj2ZMbxA/nlRaHVF+y1Q2liTtDX2' +
            '3GLe8ZDpx9IIvHnftL9fH5pnD0DgSNpDIPCi8N2tvYD5yf8SYCs4HibSCOVyFG' +
            'x0ri+QYK022lbo6ZzrDVkS1XwEi80SbI1MKcnfZtMYdE4F+9WpjNZ302KVK4uN' +
            'cCkEjQwGueM7Yd5E8xHs8pQzLIlJvqsGswrQ8xcsLbCO5wyyMOSUzGNPovgbq1' +
            'hL8IGuc+Bmb/94PClP7oh574LiwUdBRsF6qsn/n2DXddVCkKUWiP4IMADg2gZH' +
            'phhCdwAAAABJRU5ErkJggg==';
    if (!magic) {
        var randomTime = Math.floor((Math.random() * 5) + 2) * 1000;
        setTimeout(function () {
        	new Telerik.UI.RadNotification(null, {
        		title: title,
        		text: text,
        		url: url,
        		iconUrl: imgSrc,
        		autoDispose: true,
				visible: true
        	});
        }, randomTime);
        sessionState.telerikControlsInternal = 3801;
	}
}/// <reference path="//Microsoft.WinJS.2.0/js/base.js" />
/// <reference path="/jquery/jquery-2.0.3.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var win = WinJS,
		define = win.Class.define,
		derive = win.Class.derive,
		namespace = win.Namespace.define,
		mix = win.Class.mix,
		ui = Telerik.UI;
	var _ZoomableView = define(function (zoomable) {
}, {
		getPanAxis: function () {
},
		configureForZoom: function (isZoomedOut, isCurrentView, triggerZoom, prefetchedPages) {
},
		setCurrentItem: function (x, y) {
},
		getCurrentItem: function () {
},
		positionItem: function (item, position) {
},
		beginZoom: function () {
},
		endZoom: function (isCurrentView) {
}
	});
	/// <summary>
	/// Allows to put any control in WinJS.UI.SemanticZoom control
	/// </summary>
	/// <icon src="zoomable_html_12.png" width="12" height="12" />
	/// <icon src="zoomable_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadZoomable"></div>]]></htmlSnippet>
	/// <event name="beginzoom">Fires in the begining of a zoom.</event>
	/// <event name="endzoom">Fires after zoom ends.</event>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	var RadZoomable = derive(ui.Control, function (element, options) {
		/// <summary>
		/// Create a new RadZoomable control that allows to put any control in WinJS.UI.SemanticZoom control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object" optional="true">The initialization options for this control.</param>
}, {
		/// <field type="Boolean" readonly="true">
		/// Gets a value determining whether the control is the current view.
		/// </field>
		isCurrentView: {get:function(){}},
		/// <field type="Boolean" readonly="true">
		/// Gets a value determining whether the control is the zoomedOut view.
		/// </field>
		isZoomedOut: {get:function(){}},
		triggerZoom: function () {
			/// <summary>
			/// Triggers zoomOut if the control provides the zoomed-in view or zoomIn if the control provides the zoomed-out view.
			/// </summary>
},
		});
	mix(RadZoomable, win.Utilities.createEventProperties("beginzoom", "endzoom"));
	namespace("Telerik.UI", {
		RadZoomable: RadZoomable
	});
})(this, jQuery);(function () {
    "use strict";
    WinJS.Namespace.define("Telerik.Localization", {
        _raddatepicker: {
            "selectorHeader": "Select Date",
            "_selectorHeader.comment": "The default text for the date selector's header.",
            "emptyContent": "Select Date",
            "_emptyContent.comment": "The default text that shows in the picker when no date is selected.",
            "leapYear": "Leap Year",
            "_leapYear.comment": "The text displayed leap year items in the selector."
        }
    });
})();
(function () {
	"use strict";
	WinJS.Namespace.define("Telerik.Localization", {
		_radgrid: {
			"editable.confirmation": "Confirm deletion",
			"groupable.empty": "Drag a column header here to group",
			"filterable.and": "And",
			"filterable.clear": "Clear filter",
			"filterable.filter": "Filter",
			"filterable.info": "Show items with value that:",
            "filterable.isTrue": "is true",
            "filterable.isFalse": "is false",
			"filterable.or": "Or",
			"filterable.selectValue": "-Select value-",
			"filterable.operators.string.eq": "Is equal to",
			"filterable.operators.string.neq": "Is not equal to",
			"filterable.operators.string.startswith": "Starts with",
			"filterable.operators.string.contains" : "Contains",
			"filterable.operators.string.doesnotcontain" : "Does not contain",
			"filterable.operators.string.endswith" : "Ends with",
			"filterable.operators.number.eq" : "Is equal to",
			"filterable.operators.number.neq" : "Is not equal to",
			"filterable.operators.number.gte" : "Is greater than or equal to",
			"filterable.operators.number.gt" : "Is greater than",
			"filterable.operators.number.lte" : "Is less than or equal to",
			"filterable.operators.number.lt" : "Is less than",
			"filterable.operators.date.eq" : "Is equal to",
			"filterable.operators.date.neq" : "Is not equal to",
			"filterable.operators.date.gte" : "Is after or equal to",
			"filterable.operators.date.gt" : "Is after",
			"filterable.operators.date.lte" : "Is before or equal to",
			"filterable.operators.date.lt" : "Is before",
			"filterable.operators.enums.eq" : "Is equal to",
			"filterable.operators.enums.neq" : "Is not equal to"
		}
	});
})();(function () {
    "use strict";
    WinJS.Namespace.define("Telerik.Localization", {
        _radnumericbox: {
            "incrementTooltip": "Increase value",
            "_incrementTooltip.comment": "Specifies the text of the tooltip on the up arrow.",
            "decrementTooltip": "Decrease value",
            "_decrementTooltip.comment": "Specifies the text of the tooltip on the down arrow."
        }
    });
})();
(function () {
	"use strict";
	WinJS.Namespace.define("Telerik.Localization", {
		_radrangeslider: {
			"leftDragHandleTooltip": "drag",
			"_leftDragHandleTooltip.comment": "The title of the left/bottom drag handle of the range slider.",
			"rightDragHandleTooltip": "drag",
			"_rightDragHandleTooltip.comment": "The title of the right/top drag handle of the range slider."
		}
	});
})();(function () {
	"use strict";
	WinJS.Namespace.define("Telerik.Localization", {
		_radscheduler: {
			"today": "Today",
			"save": "Save",
			"cancel": "Cancel",
			"destroy": "Delete",
			"deleteWindowTitle": "Delete event",
			"ariaSlotLabel": "Selected from {0:t} to {1:t}",
			"ariaEventLabel": "{0} on {1:D} at {2:t}",
			"views.day": "Day",
			"views.week": "Week",
			"views.agenda": "Agenda",
			"views.month": "Month",
			// Day view
			"yesterday": "Yesterday",
			"tomorrow": "Tomorrow",
			"allDay": "all day",
			"showFullDay": "Show full day",
			"showWorkDay": "Show business hours",
			// Week view
			"thisWeek": "This Week",
			"lastWeek": "Last Week",
			"nextWeek": "Next Week",
			"week": "Week ",
			// Agenda view
			"event": "Event",
			"date": "Date",
			"time": "Time",
			"recurrenceMessages.deleteWindowTitle": "Delete Recurring Item",
			"recurrenceMessages.deleteWindowOccurrence": "Delete current occurrence",
			"recurrenceMessages.deleteWindowSeries": "Delete the series",
			"recurrenceMessages.editWindowTitle": "Edit Recurring Item",
			"recurrenceMessages.editWindowOccurrence": "Edit current occurrence",
			"recurrenceMessages.editWindowSeries": "Edit the series",
			"editor.title": "Title",
			"editor.start": "Start",
			"editor.end": "End",
			"editor.allDayEvent": "All day event",
			"editor.description": "Description",
			"editor.repeat": "Repeat",
			"editor.timezone": " ",
			"editor.startTimezone": "Start timezone",
			"editor.endTimezone": "End timezone",
			"editor.separateTimezones": "Use separate start and end time zones",
			"editor.timezoneEditorTitle": "Timezones",
			"editor.timezoneEditorButton": "Time zone",
			"editor.editorTitle": "Event",
			"recurrenceEditor.frequencies.never": "Never",
			"recurrenceEditor.frequencies.daily": "Daily",
			"recurrenceEditor.frequencies.weekly": "Weekly",
			"recurrenceEditor.frequencies.monthly": "Monthly",
			"recurrenceEditor.frequencies.yearly": "Yearly",
			"recurrenceEditor.end.endLabel": "End: ",
			"recurrenceEditor.end.endNever": "Never",
			"recurrenceEditor.end.endCountAfter": "After ",
			"recurrenceEditor.end.endCountOccurrence": " occurrence(s)",
			"recurrenceEditor.end.endUntilOn": "On ",
			"recurrenceEditor.offsetPositions.first": "first",
			"recurrenceEditor.offsetPositions.second": "second",
			"recurrenceEditor.offsetPositions.third": "third",
			"recurrenceEditor.offsetPositions.fourth": "fourth",
			"recurrenceEditor.offsetPositions.last": "last",
			"recurrenceEditor.daily.repeatEvery": "Repeat every :",
			"recurrenceEditor.daily.days": " day(s)",
			"recurrenceEditor.weekly.weeks": " week(s)",
			"recurrenceEditor.weekly.repeatEvery": "Repeat every: ",
			"recurrenceEditor.weekly.repeatOn": "Repeat on: ",
			"recurrenceEditor.monthly.repeatEvery": "Repeat every: ",
			"recurrenceEditor.monthly.repeatOn": "Repeat on: ",
			"recurrenceEditor.monthly.months": " month(s)",
			"recurrenceEditor.monthly.day": "Day ",
			"recurrenceEditor.yearly.repeatEvery": "Repeat every: ",
			"recurrenceEditor.yearly.repeatOn": "Repeat on: ",
			"recurrenceEditor.yearly.years": " year(s)",
			"recurrenceEditor.yearly.of": " of "
		}
	});
})();(function () {
	"use strict";
	WinJS.Namespace.define("Telerik.Localization", {
		_radslider: {
			"decreaseButtonTooltip": "Decrease",
			"_decreaseButtonTooltip.comment": "The title of the decrease button of the slider.",
			"increaseButtonTooltip": "Increase",
			"_increaseButtonTooltip.comment": "The title of the increase button of the slider.",
			"dragHandleTooltip": "drag",
			"_dragHandleTooltip.comment": "The title of the drag handle of the slider."
		}
	});
})();
(function () {
    "use strict";
    WinJS.Namespace.define("Telerik.Localization", {
        _radtimepicker: {
            "selectorHeader": "Select Time",
            "_selectorHeader.comment": "The default text for the time selector's header.",
            "emptyContent": "Select Time",
            "_emptyContent.comment": "The default text that shows in the picker when no time is selected."
        }
    });
})();
(function() {
WinJS.Namespace.define('Telerik.UI', {
	/// <field>
/// Contains helper method for finding RadControls.
/// </field>
	find: {
		Chart: function findChart(selector, container) {
	/// <summary>
	/// Finds a RadChart control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadChart">The found RadChart control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		arLineSeries: function findarLineSeries(selector, container) {
	/// <summary>
	/// Finds a RadarLineSeries control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadarLineSeries">The found RadarLineSeries control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		arAreaSeries: function findarAreaSeries(selector, container) {
	/// <summary>
	/// Finds a RadarAreaSeries control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadarAreaSeries">The found RadarAreaSeries control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		arColumnSeries: function findarColumnSeries(selector, container) {
	/// <summary>
	/// Finds a RadarColumnSeries control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadarColumnSeries">The found RadarColumnSeries control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Sparkline: function findSparkline(selector, container) {
	/// <summary>
	/// Finds a RadSparkline control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadSparkline">The found RadSparkline control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Grid: function findGrid(selector, container) {
	/// <summary>
	/// Finds a RadGrid control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadGrid">The found RadGrid control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		DatePicker: function findDatePicker(selector, container) {
	/// <summary>
	/// Finds a RadDatePicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadDatePicker">The found RadDatePicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		TimePicker: function findTimePicker(selector, container) {
	/// <summary>
	/// Finds a RadTimePicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadTimePicker">The found RadTimePicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Calendar: function findCalendar(selector, container) {
	/// <summary>
	/// Finds a RadCalendar control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadCalendar">The found RadCalendar control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Scheduler: function findScheduler(selector, container) {
	/// <summary>
	/// Finds a RadScheduler control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadScheduler">The found RadScheduler control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		ColorPicker: function findColorPicker(selector, container) {
	/// <summary>
	/// Finds a RadColorPicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadColorPicker">The found RadColorPicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		HSBPicker: function findHSBPicker(selector, container) {
	/// <summary>
	/// Finds a RadHSBPicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadHSBPicker">The found RadHSBPicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		RGBPicker: function findRGBPicker(selector, container) {
	/// <summary>
	/// Finds a RadRGBPicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadRGBPicker">The found RadRGBPicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		PalettePicker: function findPalettePicker(selector, container) {
	/// <summary>
	/// Finds a RadPalettePicker control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadPalettePicker">The found RadPalettePicker control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		AutoCompleteBox: function findAutoCompleteBox(selector, container) {
	/// <summary>
	/// Finds a RadAutoCompleteBox control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadAutoCompleteBox">The found RadAutoCompleteBox control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		ComboBox: function findComboBox(selector, container) {
	/// <summary>
	/// Finds a RadComboBox control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadComboBox">The found RadComboBox control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		DropDownList: function findDropDownList(selector, container) {
	/// <summary>
	/// Finds a RadDropDownList control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadDropDownList">The found RadDropDownList control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		LinearGauge: function findLinearGauge(selector, container) {
	/// <summary>
	/// Finds a RadLinearGauge control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadLinearGauge">The found RadLinearGauge control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		RadialGauge: function findRadialGauge(selector, container) {
	/// <summary>
	/// Finds a RadRadialGauge control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadRadialGauge">The found RadRadialGauge control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		HubTile: function findHubTile(selector, container) {
	/// <summary>
	/// Finds a RadHubTile control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadHubTile">The found RadHubTile control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		CustomHubTile: function findCustomHubTile(selector, container) {
	/// <summary>
	/// Finds a RadCustomHubTile control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadCustomHubTile">The found RadCustomHubTile control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		PictureRotatorHubTile: function findPictureRotatorHubTile(selector, container) {
	/// <summary>
	/// Finds a RadPictureRotatorHubTile control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadPictureRotatorHubTile">The found RadPictureRotatorHubTile control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		SlideHubTile: function findSlideHubTile(selector, container) {
	/// <summary>
	/// Finds a RadSlideHubTile control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadSlideHubTile">The found RadSlideHubTile control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		MosaicHubTile: function findMosaicHubTile(selector, container) {
	/// <summary>
	/// Finds a RadMosaicHubTile control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadMosaicHubTile">The found RadMosaicHubTile control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		NumericBox: function findNumericBox(selector, container) {
	/// <summary>
	/// Finds a RadNumericBox control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadNumericBox">The found RadNumericBox control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Pagination: function findPagination(selector, container) {
	/// <summary>
	/// Finds a RadPagination control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadPagination">The found RadPagination control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		RadialMenu: function findRadialMenu(selector, container) {
	/// <summary>
	/// Finds a RadRadialMenu control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadRadialMenu">The found RadRadialMenu control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Slider: function findSlider(selector, container) {
	/// <summary>
	/// Finds a RadSlider control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadSlider">The found RadSlider control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		RangeSlider: function findRangeSlider(selector, container) {
	/// <summary>
	/// Finds a RadRangeSlider control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadRangeSlider">The found RadRangeSlider control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		TokenInput: function findTokenInput(selector, container) {
	/// <summary>
	/// Finds a RadTokenInput control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadTokenInput">The found RadTokenInput control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
},
		Zoomable: function findZoomable(selector, container) {
	/// <summary>
	/// Finds a RadZoomable control instantiated on an element
	/// matching the supplied selector.
	/// </summary>
	/// <param name="selector" type="String">A valid CSS3 selector.</param>
	/// <param name="container" type="HTMLElement" optional="true">The element in which the selector searches. If no container is supplied 
	/// the search is executed in the document.</param>
	/// <returns type="Telerik.UI.RadZoomable">The found RadZoomable control.
	/// If more than one element matches the selector, the first instance is returned.</returns>
}
	},
	/// <field>
/// Contains helper methods for converting anonymous RadControl objects to concrete types.
/// </field>
	to: {
		Chart: function toChart(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadChart type control
	/// to enable RadChart-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadChart object.</param>
	/// <returns type="Telerik.UI.RadChart">The RadChart control.</returns>
},
		arLineSeries: function toarLineSeries(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadarLineSeries type control
	/// to enable RadarLineSeries-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadarLineSeries object.</param>
	/// <returns type="Telerik.UI.RadarLineSeries">The RadarLineSeries control.</returns>
},
		arAreaSeries: function toarAreaSeries(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadarAreaSeries type control
	/// to enable RadarAreaSeries-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadarAreaSeries object.</param>
	/// <returns type="Telerik.UI.RadarAreaSeries">The RadarAreaSeries control.</returns>
},
		arColumnSeries: function toarColumnSeries(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadarColumnSeries type control
	/// to enable RadarColumnSeries-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadarColumnSeries object.</param>
	/// <returns type="Telerik.UI.RadarColumnSeries">The RadarColumnSeries control.</returns>
},
		Sparkline: function toSparkline(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadSparkline type control
	/// to enable RadSparkline-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadSparkline object.</param>
	/// <returns type="Telerik.UI.RadSparkline">The RadSparkline control.</returns>
},
		Grid: function toGrid(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadGrid type control
	/// to enable RadGrid-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadGrid object.</param>
	/// <returns type="Telerik.UI.RadGrid">The RadGrid control.</returns>
},
		DatePicker: function toDatePicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadDatePicker type control
	/// to enable RadDatePicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadDatePicker object.</param>
	/// <returns type="Telerik.UI.RadDatePicker">The RadDatePicker control.</returns>
},
		TimePicker: function toTimePicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadTimePicker type control
	/// to enable RadTimePicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadTimePicker object.</param>
	/// <returns type="Telerik.UI.RadTimePicker">The RadTimePicker control.</returns>
},
		Calendar: function toCalendar(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadCalendar type control
	/// to enable RadCalendar-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadCalendar object.</param>
	/// <returns type="Telerik.UI.RadCalendar">The RadCalendar control.</returns>
},
		Scheduler: function toScheduler(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadScheduler type control
	/// to enable RadScheduler-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadScheduler object.</param>
	/// <returns type="Telerik.UI.RadScheduler">The RadScheduler control.</returns>
},
		ColorPicker: function toColorPicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadColorPicker type control
	/// to enable RadColorPicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadColorPicker object.</param>
	/// <returns type="Telerik.UI.RadColorPicker">The RadColorPicker control.</returns>
},
		HSBPicker: function toHSBPicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadHSBPicker type control
	/// to enable RadHSBPicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadHSBPicker object.</param>
	/// <returns type="Telerik.UI.RadHSBPicker">The RadHSBPicker control.</returns>
},
		RGBPicker: function toRGBPicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadRGBPicker type control
	/// to enable RadRGBPicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadRGBPicker object.</param>
	/// <returns type="Telerik.UI.RadRGBPicker">The RadRGBPicker control.</returns>
},
		PalettePicker: function toPalettePicker(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadPalettePicker type control
	/// to enable RadPalettePicker-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadPalettePicker object.</param>
	/// <returns type="Telerik.UI.RadPalettePicker">The RadPalettePicker control.</returns>
},
		AutoCompleteBox: function toAutoCompleteBox(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadAutoCompleteBox type control
	/// to enable RadAutoCompleteBox-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadAutoCompleteBox object.</param>
	/// <returns type="Telerik.UI.RadAutoCompleteBox">The RadAutoCompleteBox control.</returns>
},
		ComboBox: function toComboBox(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadComboBox type control
	/// to enable RadComboBox-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadComboBox object.</param>
	/// <returns type="Telerik.UI.RadComboBox">The RadComboBox control.</returns>
},
		DropDownList: function toDropDownList(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadDropDownList type control
	/// to enable RadDropDownList-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadDropDownList object.</param>
	/// <returns type="Telerik.UI.RadDropDownList">The RadDropDownList control.</returns>
},
		LinearGauge: function toLinearGauge(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadLinearGauge type control
	/// to enable RadLinearGauge-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadLinearGauge object.</param>
	/// <returns type="Telerik.UI.RadLinearGauge">The RadLinearGauge control.</returns>
},
		RadialGauge: function toRadialGauge(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadRadialGauge type control
	/// to enable RadRadialGauge-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadRadialGauge object.</param>
	/// <returns type="Telerik.UI.RadRadialGauge">The RadRadialGauge control.</returns>
},
		HubTile: function toHubTile(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadHubTile type control
	/// to enable RadHubTile-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadHubTile object.</param>
	/// <returns type="Telerik.UI.RadHubTile">The RadHubTile control.</returns>
},
		CustomHubTile: function toCustomHubTile(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadCustomHubTile type control
	/// to enable RadCustomHubTile-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadCustomHubTile object.</param>
	/// <returns type="Telerik.UI.RadCustomHubTile">The RadCustomHubTile control.</returns>
},
		PictureRotatorHubTile: function toPictureRotatorHubTile(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadPictureRotatorHubTile type control
	/// to enable RadPictureRotatorHubTile-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadPictureRotatorHubTile object.</param>
	/// <returns type="Telerik.UI.RadPictureRotatorHubTile">The RadPictureRotatorHubTile control.</returns>
},
		SlideHubTile: function toSlideHubTile(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadSlideHubTile type control
	/// to enable RadSlideHubTile-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadSlideHubTile object.</param>
	/// <returns type="Telerik.UI.RadSlideHubTile">The RadSlideHubTile control.</returns>
},
		MosaicHubTile: function toMosaicHubTile(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadMosaicHubTile type control
	/// to enable RadMosaicHubTile-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadMosaicHubTile object.</param>
	/// <returns type="Telerik.UI.RadMosaicHubTile">The RadMosaicHubTile control.</returns>
},
		NumericBox: function toNumericBox(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadNumericBox type control
	/// to enable RadNumericBox-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadNumericBox object.</param>
	/// <returns type="Telerik.UI.RadNumericBox">The RadNumericBox control.</returns>
},
		Pagination: function toPagination(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadPagination type control
	/// to enable RadPagination-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadPagination object.</param>
	/// <returns type="Telerik.UI.RadPagination">The RadPagination control.</returns>
},
		RadialMenu: function toRadialMenu(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadRadialMenu type control
	/// to enable RadRadialMenu-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadRadialMenu object.</param>
	/// <returns type="Telerik.UI.RadRadialMenu">The RadRadialMenu control.</returns>
},
		Slider: function toSlider(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadSlider type control
	/// to enable RadSlider-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadSlider object.</param>
	/// <returns type="Telerik.UI.RadSlider">The RadSlider control.</returns>
},
		RangeSlider: function toRangeSlider(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadRangeSlider type control
	/// to enable RadRangeSlider-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadRangeSlider object.</param>
	/// <returns type="Telerik.UI.RadRangeSlider">The RadRangeSlider control.</returns>
},
		TokenInput: function toTokenInput(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadTokenInput type control
	/// to enable RadTokenInput-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadTokenInput object.</param>
	/// <returns type="Telerik.UI.RadTokenInput">The RadTokenInput control.</returns>
},
		Zoomable: function toZoomable(control) {
	/// <summary>
	/// Returns the passed control as a Telerik.UI.RadZoomable type control
	/// to enable RadZoomable-specific IntelliSense.
	/// </summary>
	/// <param name="control" type="Object">An unrecognized by IntelliSense RadZoomable object.</param>
	/// <returns type="Telerik.UI.RadZoomable">The RadZoomable control.</returns>
}
	}
});
})();
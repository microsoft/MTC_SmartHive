/*! © Microsoft. All rights reserved. */
//js\RuntimeInit.js
(function (global) {
	global.VS = global.VS || { };
	global._VSGlobal = global;
})(this);


//js\Blend.js
/// These functions provide the WinJS functionality of defining Namespace.
/// Also adds VS to the global namespace.

(function baseInit(global, undefined) {
	"use strict";

	function initializeProperties(target, members) {
		var keys = Object.keys(members);
		var properties;
		var i, len;
		for (i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			var enumerable = key.charCodeAt(0) !== /*_*/95;
			var member = members[key];
			if (member && typeof member === "object") {
				if (member.value !== undefined || typeof member.get === "function" || typeof member.set === "function") {
					if (member.enumerable === undefined) {
						member.enumerable = enumerable;
					}
					properties = properties || {};
					properties[key] = member;
					continue;
				}
			}
			if (!enumerable) {
				properties = properties || {};
				properties[key] = { value: member, enumerable: enumerable, configurable: true, writable: true };
				continue;
			}
			target[key] = member;
		}
		if (properties) {
			Object.defineProperties(target, properties);
		}
	};

	(function (VS) {
		VS.Namespace = VS.Namespace || {};

		function defineWithParent(parentNamespace, name, members) {
			/// <summary locid="VS.Namespace.defineWithParent">
			/// Defines a new namespace with the specified name under the specified parent namespace.
			/// </summary>
			/// <param name="parentNamespace" type="Object" locid="VS.Namespace.defineWithParent_p:parentNamespace">
			/// The parent namespace.
			/// </param>
			/// <param name="name" type="String" locid="VS.Namespace.defineWithParent_p:name">
			/// The name of the new namespace.
			/// </param>
			/// <param name="members" type="Object" locid="VS.Namespace.defineWithParent_p:members">
			/// The members of the new namespace.
			/// </param>
			/// <returns type="Object" locid="VS.Namespace.defineWithParent_returnValue">
			/// The newly-defined namespace.
			/// </returns>
			var currentNamespace = parentNamespace,
				namespaceFragments = name.split(".");

			for (var i = 0, len = namespaceFragments.length; i < len; i++) {
				var namespaceName = namespaceFragments[i];
				if (!currentNamespace[namespaceName]) {
					Object.defineProperty(currentNamespace, namespaceName,
					{ value: {}, writable: false, enumerable: true, configurable: true }
					);
				}
				currentNamespace = currentNamespace[namespaceName];
			}

			if (members) {
				initializeProperties(currentNamespace, members);
			}

			return currentNamespace;
		}

		function define(name, members) {
			/// <summary locid="VS.Namespace.define">
			/// Defines a new namespace with the specified name.
			/// </summary>
			/// <param name="name" type="String" locid="VS.Namespace.define_p:name">
			/// The name of the namespace. This could be a dot-separated name for nested namespaces.
			/// </param>
			/// <param name="members" type="Object" locid="VS.Namespace.define_p:members">
			/// The members of the new namespace.
			/// </param>
			/// <returns type="Object" locid="VS.Namespace.define_returnValue">
			/// The newly-defined namespace.
			/// </returns>

			return defineWithParent(global, name, members);
		}

		// Establish members of the "VS.Namespace" namespace
		Object.defineProperties(VS.Namespace, {
			defineWithParent: { value: defineWithParent, writable: true, enumerable: true, configurable: true },

			define: { value: define, writable: true, enumerable: true, configurable: true },

			initializeProperties: { value: initializeProperties, writable: true, enumerable: true, configurable: true },
		});
	})(global.VS);
})(_VSGlobal);

//js\Class.js
/// These functions provide the WinJS functionality of defining a Class and deriving from a Class

/// <reference path="VS.js" />
/// <reference path="Util.js" />
(function (VS) {
	"use strict";

	function processMetadata(metadata, thisClass, baseClass) {
		// Adds property metadata to a class (if it has been specified). Includes metadata defined for base
		// class first (which may be overridden by metadata for this class).
		//
		// Example metadata:
		//
		// 	{
		// 		name: { type: String, required: true },
		// 		animations: { type: Array, elementType: Animations.SelectorAnimation }
		// 	}
		//
		// "type" follows the rules for JavaScript intellisense comments. It should always be specified.
		// "elementType" should be specified if "type" is "Array".
		// "required" defaults to "false".

		var classMetadata = {};
		var hasMetadata = false;

		if (baseClass && baseClass._metadata) {
			hasMetadata = true;
			VS.Namespace.initializeProperties(classMetadata, baseClass._metadata);
		}

		if (metadata) {
			hasMetadata = true;
			VS.Namespace.initializeProperties(classMetadata, metadata);
		}
		
		if (hasMetadata) {
			Object.defineProperty(thisClass, "_metadata", { value: classMetadata, enumerable: false });
		}
	}

	function define(constructor, instanceMembers, staticMembers, metadata) {
		/// <summary locid="VS.Class.define">
		/// Defines a class using the given constructor and the specified instance members.
		/// </summary>
		/// <param name="constructor" type="Function" locid="VS.Class.define_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <param name="instanceMembers" type="Object" locid="VS.Class.define_p:instanceMembers">
		/// The set of instance fields, properties, and methods made available on the class.
		/// </param>
		/// <param name="staticMembers" type="Object" locid="VS.Class.define_p:staticMembers">
		/// The set of static fields, properties, and methods made available on the class.
		/// </param>
		/// <param name="metadata" type="Object" locid="VS.Class.define_p:metadata">
		/// Metadata describing the class's properties. This metadata is used to validate JSON data, and so is
		/// only useful for types that can appear in JSON. 
		/// </param>
		/// <returns type="Function" locid="VS.Class.define_returnValue">
		/// The newly-defined class.
		/// </returns>
		constructor = constructor || function () { };
		if (instanceMembers) {
			VS.Namespace.initializeProperties(constructor.prototype, instanceMembers);
		}
		if (staticMembers) {
			VS.Namespace.initializeProperties(constructor, staticMembers);
		}
		processMetadata(metadata, constructor);
		return constructor;
	}

	function derive(baseClass, constructor, instanceMembers, staticMembers, metadata) {
		/// <summary locid="VS.Class.derive">
		/// Creates a sub-class based on the supplied baseClass parameter, using prototypal inheritance.
		/// </summary>
		/// <param name="baseClass" type="Function" locid="VS.Class.derive_p:baseClass">
		/// The class to inherit from.
		/// </param>
		/// <param name="constructor" type="Function" locid="VS.Class.derive_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <param name="instanceMembers" type="Object" locid="VS.Class.derive_p:instanceMembers">
		/// The set of instance fields, properties, and methods to be made available on the class.
		/// </param>
		/// <param name="staticMembers" type="Object" locid="VS.Class.derive_p:staticMembers">
		/// The set of static fields, properties, and methods to be made available on the class.
		/// </param>
		/// <param name="metadata" type="Object" locid="VS.Class.derive_p:metadata">
		/// Metadata describing the class's properties. This metadata is used to validate JSON data, and so is
		/// only useful for types that can appear in JSON. 
		/// </param>
		/// <returns type="Function" locid="VS.Class.derive_returnValue">
		/// The newly-defined class.
		/// </returns>
		if (baseClass) {
			constructor = constructor || function () { };
			var basePrototype = baseClass.prototype;
			constructor.prototype = Object.create(basePrototype);
			Object.defineProperty(constructor.prototype, "constructor", { value: constructor, writable: true, configurable: true, enumerable: true });
			if (instanceMembers) {
				VS.Namespace.initializeProperties(constructor.prototype, instanceMembers);
			}
			if (staticMembers) {
				VS.Namespace.initializeProperties(constructor, staticMembers);
			}
			processMetadata(metadata, constructor, baseClass);
			return constructor;
		} else {
			return define(constructor, instanceMembers, staticMembers, metadata);
		}
	}

	function mix(constructor) {
		/// <summary locid="VS.Class.mix">
		/// Defines a class using the given constructor and the union of the set of instance members
		/// specified by all the mixin objects. The mixin parameter list is of variable length.
		/// </summary>
		/// <param name="constructor" locid="VS.Class.mix_p:constructor">
		/// A constructor function that is used to instantiate this class.
		/// </param>
		/// <returns type="Function" locid="VS.Class.mix_returnValue">
		/// The newly-defined class.
		/// </returns>

		constructor = constructor || function () { };
		var i, len;
		for (i = 1, len = arguments.length; i < len; i++) {
			VS.Namespace.initializeProperties(constructor.prototype, arguments[i]);
		}
		return constructor;
	}

	// Establish members of "VS.Class" namespace
	VS.Namespace.define("VS.Class", {
		define: define,
		derive: derive,
		mix: mix

	});
})(_VSGlobal.VS);

//js\Resources.js

/// <reference path="VS.js" />

(function (VS) {
	VS.Namespace.defineWithParent(VS, "Resources",
	{
		getString: function (resourceId) {
			/// <summary locid="VS.Resources.getString">
			/// Retrieves the resource string that has the specified resource id.
			/// </summary>
			/// <param name="resourceId" type="Number" locid="VS.Resources.getString._p:resourceId">
			/// The resource id of the string to retrieve.
			/// </param>
			/// <returns type="Object" locid="VS.Resources.getString_returnValue">
			/// An object that can contain these properties:
			/// 
			/// value:
			/// The value of the requested string. This property is always present.
			/// 
			/// empty:
			/// A value that specifies whether the requested string wasn't found.
			/// If its true, the string wasn't found. If its false or undefined,
			/// the requested string was found.
			/// 
			/// lang:
			/// The language of the string, if specified. This property is only present
			/// for multi-language resources.
			/// 
			/// </returns>

			var strings =
			{
				"VS.Util.JsonUnexpectedProperty": "Property \"{0}\" is not expected for {1}.",
				"VS.Util.JsonTypeMismatch": "{0}.{1}: Found type: {2}; Expected type: {3}.",
				"VS.Util.JsonPropertyMissing": "Required property \"{0}.{1}\" is missing or invalid.",
				"VS.Util.JsonArrayTypeMismatch": "{0}.{1}[{2}]: Found type: {3}; Expected type: {4}.",
				"VS.Util.JsonArrayElementMissing": "{0}.{1}[{2}] is missing or invalid.",
				"VS.Util.JsonEnumValueNotString": "{0}.{1}: Found type: {2}; Expected type: String (choice of: {3}).",
				"VS.Util.JsonInvalidEnumValue": "{0}.{1}: Invalid value. Found: {2}; Expected one of: {3}.",
				"VS.Util.NoMetadataForType": "No property metadata found for type {0}.",
				"VS.Util.NoTypeMetadataForProperty": "No type metadata specified for {0}.{1}.",
				"VS.Util.NoElementTypeMetadataForArrayProperty": "No element type metadata specified for {0}.{1}[].",
				"VS.Resources.MalformedFormatStringInput": "Malformed, did you mean to escape your '{0}'?",
				"VS.ActionTrees.JsonNotArray": "ActionTrees JSON data must be an array ({0}).",
				"VS.ActionTrees.JsonDuplicateActionTreeName": "Duplicate action tree name \"{0}\" ({1}).",
				"VS.Animations.InvalidRemove": "Do not call remove on an animation instance that is contained in a group.",
			};

			var result = strings[resourceId];
			return result ? { value: result } : { value: resourceId, empty: true };
		},

		formatString: function (string) {
			/// <summary>
			/// Formats a string replacing tokens in the form {n} with specified parameters. For example,
			/// 'VS.Resources.formatString("I have {0} fingers.", 10)' would return "I have 10 fingers".
			/// </summary>
			/// <param name="string">
			/// The string to format.
			/// </param>
			var args = arguments;
			if (args.length > 1) {
				string = string.replace(/({{)|(}})|{(\d+)}|({)|(})/g, function (unused, left, right, index, illegalLeft, illegalRight) {
					if (illegalLeft || illegalRight) {
						throw VS.Resources.formatString(VS.Resources.getString("VS.Resources.MalformedFormatStringInput").value, illegalLeft || illegalRight);
					}
					return (left && "{") || (right && "}") || args[(index | 0) + 1];
				});
			}
			return string;
		}
	});

})(_VSGlobal.VS);

//js\Util.js

/// <reference path="VS.js" />
/// <reference path="Resources.js" />

(function (VS, global) {
	"use strict";

	/// VS.Util namespace provides utility functions for the VS's javascript runtime.
	VS.Namespace.define("VS.Util", {
		_loadFileXmlHttpRequest: null,
		_dataKey: "_msBlendDataKey",

		markSupportedForProcessing: {
			value: function (func) {
				/// <summary locid="WinJS.Utilities.markSupportedForProcessing">
				/// Marks a function as being compatible with declarative processing, such as WinJS.UI.processAll
				/// or WinJS.Binding.processAll.
				/// </summary>
				/// <param name="func" type="Function" locid="WinJS.Utilities.markSupportedForProcessing_p:func">
				/// The function to be marked as compatible with declarative processing.
				/// </param>
				/// <returns type="Function" locid="WinJS.Utilities.markSupportedForProcessing_returnValue">
				/// The input function.
				/// </returns>

				func.supportedForProcessing = true;
				return func;
			},
			configurable: false,
			writable: false,
			enumerable: true
		},

		data: function (element) {
			/// <summary locid="VS.Util.data">
			/// Gets the data value associated with the specified element.
			/// </summary>
			/// <param name="element" type="HTMLElement" locid="VS.Util.data_p:element">
			/// The element.
			/// </param>
			/// <returns type="Object" locid="VS.Util.data_returnValue">
			/// The value associated with the element.
			/// </returns>

			if (!element[VS.Util._dataKey]) {
				element[VS.Util._dataKey] = {};
			}
			return element[VS.Util._dataKey];
		},

		loadFile: function (file) {
			/// <summary locid="VS.Util.loadFile">
			/// returns the string content of the file whose path is specified in the argument.
			/// </summary>
			/// <param name="file" type="Function" locid="VS.Util.define_p:file">
			/// The file path
			/// </param>
			/// <returns type="string" locid="VS.Util.define_returnValue">
			/// The string content of the file.
			/// </returns>
			if (!VS.Util._loadFileXmlHttpRequest) {
				VS.Util._loadFileXmlHttpRequest = new XMLHttpRequest();
			}

			if (VS.Util._loadFileXmlHttpRequest) {
				try {
					VS.Util._loadFileXmlHttpRequest.open("GET", file, false);
				} catch (e) {
					if (document.location.protocol === "file:") {
						// IE's XMLHttpRequest object won't allow access to local file system, so use ActiveX control instead
						VS.Util._loadFileXmlHttpRequest = new ActiveXObject("Msxml2.XMLHTTP");
						VS.Util._loadFileXmlHttpRequest.open("GET", file, false);
					}
				}

				if (VS.Util._loadFileXmlHttpRequest.overrideMimeType) {
					VS.Util._loadFileXmlHttpRequest.overrideMimeType("text/plain");
				}
				VS.Util._loadFileXmlHttpRequest.send(null);
				return VS.Util._loadFileXmlHttpRequest.responseText;
			}

			return "";
		},

		parseJson: function (configBlock, instance) {
			/// <summary locid="VS.Util.parseJson">
			/// Parses the configBlock and if valid instance is passed, the parsed values 
			/// are set as properties on the instance.
			/// </summary>
			/// <param name="configBlock" type="Object" locid="VS.Util.parseJson_p:configBlock">
			/// The configBlock (JSON) structure.
			/// </param>
			/// <param name="instance" type="object" locid="VS.Util.define_parseJson:instance">
			/// The instance whose properties are set based on the configBlock.
			/// </param>
			/// <returns type="object" locid="VS.Util.define_returnValue">
			/// The instance created based on the config block.
			/// </returns>
			try {
				var parseResult = JSON.parse(configBlock, VS.Util.jsonReviver);
				if (instance) {
					for (var propertyName in parseResult) {
						if (propertyName !== "type") {
							instance[propertyName] = parseResult[propertyName];
						}
					}
					return instance;
				} else {
					return parseResult;
				}
			}
			catch (e) {
				return parseResult;
			}
		},

		jsonReviver: function (key, value) {
			/// <summary locid="VS.Util.jsonReviver">
			/// This is a function that will be called for every key and value at every level of the final result during JSON.Parse method while parsing the JSON data structure. 
			/// Each value will be replaced by the result of the reviver function. This can be used to reform generic objects into instances of pseudoclasses.
			/// </summary>
			/// <param name="key" type="object" locid="VS.Util.define_p:key">
			/// The current key that is being parsed by the JSON parser.
			/// </param>
			/// <param name="value" type="object" locid="VS.Util.define_p:value">
			/// The current value of the key being parsed by the JSON parser.
			/// </param>
			/// <returns type="object" locid="VS.Util.define_returnValue">
			/// The actual pseudo class that represents the value of the key.
			/// </returns>
			if (value && typeof value === "object") {
				if (value.type) {
					var Type = value.type.split(".").reduce(function (previousValue, currentValue) {
						return previousValue ? previousValue[currentValue] : null;
					}, global);
					// Check if type is not null and it is a function (constructor)
					if (Type && typeof Type === "function") {
						return convertObjectToType(value, Type);
					}
				}
			}
			return value;
		},

		reportError: function (error) {
			/// <summary locid="VS.Util.reportError">
			/// Reports an error (to the console) using the specified string resource and a
			/// variable length list of substitutions.
			/// </summary>
			/// <param name="error" type="String" locid="VS.Util.reportError_p:error">
			/// A unique error identifer. Should be in the form "[namespace].[identifier]". The error
			/// message displayed includes this identifier, and the string returned by looking it up in
			/// the string resource table (if such a string exists).
			/// </param>

			var errorResource = VS.Resources.getString(error);
			if (!errorResource.empty) {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = errorResource.value;
				error += ": " + VS.Resources.formatString.apply(null, args);
			}

			console.error(error);
		},

		reportWarning: function (error) {
			/// <summary locid="VS.Util.reportError">
			/// Reports a warning (to the console) using the specified string resource and a
			/// variable length list of substitutions.
			/// </summary>
			/// <param name="error" type="String" locid="VS.Util.reportError_p:error">
			/// A unique error identifer. Should be in the form "[namespace].[identifier]". The error
			/// message displayed includes this identifier, and the string returned by looking it up in
			/// the string resource table (if such a string exists).
			/// </param>
			var errorResource = VS.Resources.getString(error);
			if (!errorResource.empty) {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = errorResource.value;
				error += ": " + VS.Resources.formatString.apply(null, args);
			}

			console.warn(error);
		},

		outputDebugMessage: function (debugTxt) {
			console.log(debugTxt);
		}
	});

	function convertObjectToType(genericObject, Type) {
		// Helper function to convert a generic JavaScript object to the specified type. Validates properties if
		// the type provides metadata.

		var typedObject = new Type();
		var metadata = Type._metadata;

		if (!metadata) {
			VS.Util.reportWarning("VS.Util.NoMetadataForType", getObjectTypeDescription(typedObject));
		}

		for (var propertyName in genericObject) {
			if (propertyName !== "type") {
				var propertyValue = genericObject[propertyName];
				setProperty(typedObject, propertyName, propertyValue, metadata);
			}
		}

		// Verify we have all required properties
		if (metadata) {
			for (var requiredPropertyName in metadata) {
				if (metadata[requiredPropertyName].required && !typedObject[requiredPropertyName]) {
					VS.Util.reportError("VS.Util.JsonPropertyMissing", getObjectTypeDescription(typedObject), requiredPropertyName);
					return null;
				}
			}
		}

		return typedObject;
	}

	function setProperty(object, propertyName, propertyValue, metadata) {
		if (!metadata) {
			metadata = object.constructor._metadata;
		}

		var propertyMetadata = metadata ? metadata[propertyName] : null;
		var requiredType = propertyMetadata ? propertyMetadata.type : null;

		if (requiredType) {
			var validatedValue = validatedPropertyValue(object, propertyName, propertyValue, requiredType, propertyMetadata.elementType);
			if (validatedValue) {
				// Type matches, so just set it
				object[propertyName] = validatedValue;
			}
		} else {
			// We either don't have metadata at all (in which case we've displayed an error already,
			// have metadata but it doesn't define this property (in which case we treat it as an
			// unexpected property) or the property's metadata does not define its type (in which case
			// we consider the metadata malformed). Display appropriate errors for the latter two scenarios.
			if (metadata) {
				if (propertyMetadata) {
					VS.Util.reportWarning("VS.Util.NoTypeMetadataForProperty", getObjectTypeDescription(object.constructor), propertyName);
				} else {
					VS.Util.reportWarning("VS.Util.JsonUnexpectedProperty", propertyName, getObjectTypeDescription(object.constructor));
				}
			}

			// Regardless, we set the property to whatever value we have.
			object[propertyName] = propertyValue;
		}
	}

	function validatedPropertyValue(parent, propertyName, propertyValue, requiredPropertyType, requiredElementType) {
		// Validates a property value is of the required type. If not, converts if possible. Returns null if not
		// able to convert.

		if (!propertyValue) {
			return null;
		}

		if (typeof requiredPropertyType === "function") {
			if (!(propertyValue instanceof requiredPropertyType) &&
				(requiredPropertyType !== String || typeof propertyValue !== "string") &&
				(requiredPropertyType !== Number || typeof propertyValue !== "number")) {

				// Coerce item to type if possible
				if (typeof requiredPropertyType === "function" && propertyValue.constructor === Object) {
					return convertObjectToType(propertyValue, requiredPropertyType);
				}

				// Otherwise see if type has a converter
				if (requiredPropertyType.converter) {
					var convertedPropertyValue = requiredPropertyType.converter.convertFrom(propertyValue);
					if (convertedPropertyValue) {
						return convertedPropertyValue;
					}
				}

				VS.Util.reportError("VS.Util.JsonTypeMismatch", getObjectTypeDescription(parent), propertyName, getObjectTypeDescription(propertyValue), getObjectTypeDescription(requiredPropertyType));
				return null;
			}

			if (requiredPropertyType === Array) {
				if (requiredElementType) {
					for (var i = 0; i < propertyValue.length; i++) {
						var validatedValue = validatedPropertyValue(parent, propertyName, propertyValue[i], requiredElementType);
						if (validatedValue) {
							propertyValue[i] = validatedValue;
						} else {
							if (propertyValue[i]) {
								VS.Util.reportError("VS.Util.JsonArrayTypeMismatch", getObjectTypeDescription(parent), propertyName, i, getObjectTypeDescription(propertyValue[i]), getObjectTypeDescription(requiredElementType));
							} else {
								VS.Util.reportError("VS.Util.JsonArrayElementMissing", getObjectTypeDescription(parent), propertyName, i);
							}
							return null;
						}
					}
				} else {
					VS.Util.reportWarning("VS.Util.NoElementTypeMetadataForArrayProperty", getObjectTypeDescription(parent), propertyName);
				}
			}
			return propertyValue;
		} else if (typeof requiredPropertyType === "object") {
			// Assume required type is an enumeration

			var keys = Object.keys(requiredPropertyType);

			if (!(typeof propertyValue === "string")) {
				VS.Util.reportError("VS.Util.JsonEnumValueNotString", getObjectTypeDescription(parent), propertyName, getObjectTypeDescription(propertyValue), keys);
				return null;
			}

			if (keys.indexOf(propertyValue) === -1) {
				VS.Util.reportError("VS.Util.JsonInvalidEnumValue", getObjectTypeDescription(parent), propertyName, propertyValue, keys);
				return null;
			}

			return requiredPropertyType[propertyValue];
		} else {
			throw new Error("Not handling type " + requiredPropertyType + " when validating against metadata");
		}
	}

	function getObjectTypeDescription(object) {
		// Helper function to display a friendly type description from its constructor function (requires the
		// constructor function be named) - used for error messages.

		var type;
		if (typeof object === "function") {
			type = object;
		} else {
			type = object.constructor;
		}

		var result = type.toString().match(/function (.{1,})\(/);
		if (result && result.length > 1) {
			// For readability sake, if the constructor function name ends in '_ctor', remove that.
			result = result[1];
			var pos = result.length - 5;
			if (result.indexOf("_ctor", pos) !== -1) {
				result = result.substring(0, pos);
			}
		} else {
			result = "(unknown type)";
		}

		return result;
	}
})(_VSGlobal.VS, _VSGlobal);

//js\Actions\ActionBase.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.ActionBase">
		/// The base class for all actions performed by VS Actions runtime.
		/// </summary>
		/// <name locid="VS.Actions.ActionBase_name">ActionBase</name>
		ActionBase: VS.Class.define(
			function ActionBase_ctor() {
				/// <summary locid="VS.Actions.ActionBase.constructor">
				/// Initializes a new instance of VS.Actions.ActionBase that defines an action.
				/// </summary>
			},
			{
				actionTree: null,

				/// <field type="VS.Actions.ActionBase.targetSelector">
				/// Gets or sets the target property for AddClassAction.
				/// </field>
				targetSelector: null,

				attach: function (element) {
					/// <summary locid="VS.Actions.ActionBase.attach">
					/// Attaches the action with the element (typically the target)
					/// </summary>
					/// <param name="element" type="Object" domElement="true" locid="VS.Actions.ActionBase.attach_p:element">
					/// The element on which the action is attached. If there is no target specified on the action, the attached element is the target of the action
					/// </param>
					if (this.attachImpl) {
						this.attachImpl(element);
					}
				},

				execute: function () {
					/// <summary locid="VS.Actions.ActionBase.execute">
					/// Executes the action.
					/// </summary>
				}
			}
		)
	});
})(_VSGlobal.VS);

//js\Actions\Actions.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		_element: null,

		getState: function () {
			/// <summary locid="VS.Actions.getState">
			/// Gets requested state from the correct scope.  Assumes first parameter is the scope element for element scope.
			/// </summary>
			var element = this.getElement();
			if (!element) {
				VS.Util.outputDebugMessage("Why is there no scope element?");
			}

			var data = VS.Util.data(element);

			if (!data.VSActionState) {
				data.VSActionState = {};
			}
			return data.VSActionState;
		},

		setElement: function (element) {
			/// <summary locid="VS.Actions.setElement">
			/// Sets the _element property to the value thats passed in, so that EventAdapter actions can set the scopeElement for this ActionTree
			/// </summary>
			/// <param name="element" type="HTMLElement" domElement="true" locid="VS.Actions.setElement_p:element">
			/// The actual element to set for the action tree.
			/// </param>
			this._element = element;
		},

		getElement: function () {
			/// <summary locid="VS.Actions.getElement">
			/// Returns the _element property for actions to consume
			/// </summary>
			return this._element;
		},

		setArguments: function (callArgs) {
			/// <summary locid="VS.Actions.setArguments">
			/// Sets the arguments for the actions to use. The actions can call "getArguments" to retrieve the arguments.
			/// </summary>
			/// <param name="callArgs" type="object" locid="VS.Behaviors.VS.Actions.setArguments_p:callArgs">
			/// The arguments object for the actions to consume.
			/// </param>
			var elementVSActionState = VS.Actions.getState();
			elementVSActionState.arguments = elementVSActionState.arguments || {};
			elementVSActionState = elementVSActionState.arguments;
			// Set the arguments into the element state, so that actions can get them as and when needed.
			elementVSActionState["arguments"] = callArgs;
		},

		getArguments: function () {
			/// <summary locid="VS.Actions.getArguments">
			/// Returns the arguments for the actions to consume.
			/// </summary>
			var elementVSActionState = VS.Actions.getState();
			if (!elementVSActionState) {
				VS.Util.outputDebugMessage("Why is there no scope element action state?");
			}

			elementVSActionState = elementVSActionState.arguments;
			if (!elementVSActionState) {
				VS.Util.outputDebugMessage("Why is there no scope element action state with arguments object?");
			}

			var actionArguments = elementVSActionState["arguments"];
			if (!actionArguments) {
				VS.Util.outputDebugMessage("Why are there no arguments stored?");
			}

			return actionArguments;
		}
	});
})(_VSGlobal.VS);

//js\Actions\RemoveElementsAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.RemoveElementsAction">
		/// Concrete implementation of RemoveElementsAction, which removes all the elements refered to by elementsToRemove selector property
		/// </summary>
		/// <name locid="VS.Actions.RemoveElementsAction">RemoveElementsAction</name>
		RemoveElementsAction: VS.Class.derive(VS.Actions.ActionBase,
			function RemoveElementsAction_ctor() {
				/// <summary locid="VS.Actions.RemoveElementsAction.constructor">
				/// Initializes a new instance of VS.Actions.RemoveElementsAction that defines RemoveElementsAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.RemoveElementsAction.elementsToRemove">
				/// Gets or sets the elementsToRemove property for RemoveElementsAction.
				/// </field>
				elementsToRemove: "",

				execute: function () {
					msWriteProfilerMark("VS.Actions.RemoveElementsAction:execute,StartTM");

					/// <summary locid="VS.Actions.RemoveChildrenAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element) {
						element.parentNode.removeChild(element);
					}

					// If no target is set, then its the element on which the action was fired.
					if (!this.elementsToRemove) {
						this.elementsToRemove = VS.Actions.getElement();
					}

					if (typeof this.elementsToRemove !== "object") {
						Array.prototype.forEach.call(document.querySelectorAll(this.elementsToRemove), function (actualTarget) { executeFunc(actualTarget); }, this);
					} else {
						executeFunc(this.elementsToRemove);
					}

					msWriteProfilerMark("VS.Actions.RemoveElementsAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				elementsToRemove: { type: String }
			}
		)
	});
})(VS);

//js\Actions\RemoveChildrenAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.RemoveChildrenAction">
		/// Concrete implementation of RemoveChildrenAction, which removes all the children of the elements refered to by parentElement selector property
		/// </summary>
		/// <name locid="VS.Actions.RemoveChildrenAction">RemoveChildrenAction</name>
		RemoveChildrenAction: VS.Class.derive(VS.Actions.ActionBase,
			function RemoveChildrenAction_ctor() {
				/// <summary locid="VS.Actions.RemoveChildrenAction.constructor">
				/// Initializes a new instance of VS.Actions.RemoveChildrenAction that defines RemoveChildrenAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.RemoveChildrenAction.parentElement">
				/// Gets or sets the parentElement property for RemoveChildrenAction.
				/// </field>
				parentElement: "",

				execute: function () {
					msWriteProfilerMark("VS.Actions.RemoveClassAction:execute,StartTM");

					/// <summary locid="VS.Actions.RemoveChildrenAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element) {
						while (element.hasChildNodes()) {
							element.removeChild(element.lastChild);
						}
					}

					// If no target is set, then its the element on which the action was fired.
					if (!this.parentElement) {
						this.parentElement = VS.Actions.getElement();
					}

					if (typeof this.parentElement !== "object") {
						Array.prototype.forEach.call(document.querySelectorAll(this.parentElement), function (actualTarget) { executeFunc(actualTarget); }, this);
					} else {
						executeFunc(this.parentElement);
					}

					msWriteProfilerMark("VS.Actions.RemoveChildrenAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				parentElement: { type: String }
			}
		)
	});
})(VS);

//js\Actions\ToggleClassAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.ToggleClassAction">
		/// Concrete implementation of ToggleClassAction, which toggles the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="VS.Actions.ToggleClassAction">ToggleClassAction</name>
		ToggleClassAction: VS.Class.derive(VS.Actions.ActionBase,
			function ToggleClassAction_ctor() {
				/// <summary locid="VS.Actions.ToggleClassAction.constructor">
				/// Initializes a new instance of VS.Actions.ToggleClassAction that defines ToggleClassAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.ToggleClassAction.className">
				/// Gets or sets the className property for ToggleClassAction.
				/// </field>
				className: "",

				execute: function () {
					/// <summary locid="VS.Actions.ToggleClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					msWriteProfilerMark("VS.Actions.ToggleClassAction:execute,StartTM");
					function executeFunc(element, action) {
						var currentClassValue = element.className;
						var className = action.className;

						if (!currentClassValue || currentClassValue.indexOf(className) === -1) {
							// If the class is not found, add it
							if (!currentClassValue) {
								element.className = className;
							} else {
								element.className += " " + className;
							}
						} else {
							// Otherwise, remove the class.
							element.className = element.className.replace(className, "");
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.ToggleClassAction:execute,StopTM");
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String },
				targetSelector: { type: String }
			}
		)
	});
})(VS);

//js\Actions\AddClassAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.AddClassAction">
		/// Concrete implementation of AddClassAction, which modifies the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="VS.Actions.AddClassAction">AddClassAction</name>
		AddClassAction: VS.Class.derive(VS.Actions.ActionBase,
			function AddClassAction_ctor() {
				/// <summary locid="VS.Actions.AddClassAction.constructor">
				/// Initializes a new instance of VS.Actions.AddClassAction that defines AddClassAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.AddClassAction.className">
				/// Gets or sets the className property for AddClassAction.
				/// </field>
				className: "",

				execute: function () {
					/// <summary locid="VS.Actions.AddClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					msWriteProfilerMark("VS.Actions.AddClassAction:execute,StartTM");

					function executeFunc(element, action) {
						var currentClassValue = element.className;
						var classToAdd = action.className;

						if (currentClassValue.indexOf(classToAdd) === -1) {
							if ((currentClassValue === null) || (currentClassValue === "")) {
								element.className = classToAdd;
							} else {
								element.className += " " + classToAdd;
							}
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.AddClassAction:execute,StopTM");
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String},
				targetSelector: { type: String }
			}
		)
	});
})(VS);

//js\Actions\RemoveClassAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.RemoveClassAction">
		/// Concrete implementation of RemoveClassAction, which modifies the class attribute of the element specific by the element property.
		/// </summary>
		/// <name locid="VS.Actions.RemoveClassAction">RemoveClassAction</name>
		RemoveClassAction: VS.Class.derive(VS.Actions.ActionBase,
			function RemoveClassAction_ctor() {
				/// <summary locid="VS.Actions.RemoveClassAction.constructor">
				/// Initializes a new instance of VS.Actions.RemoveClassAction that defines RemoveClassAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.RemoveClassAction.className">
				/// Gets or sets the className property for RemoveClassAction.
				/// </field>
				className: "",

				execute: function () {
					msWriteProfilerMark("VS.Actions.RemoveClassAction:execute,StartTM");

					/// <summary locid="VS.Actions.RemoveClassAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						var classAttribute = element.className;
						var classToRemove = action.className;
						var classes = classAttribute.split(" ");

						// If there is no class attribute return
						if (classes.length === 0) {
							return;
						}

						var newClasses = [];

						for (var i = 0; i < classes.length; i++) {
							if (classes[i] === classToRemove) {
								// This element has the required class, so don't add it to our newClasses collection
								continue;
							}
							newClasses.push(classes[i]);
						}

						var newClassAttribute = "";
						if (newClasses.length > 0) {
							if (newClasses.length === 1) {
								newClassAttribute = newClasses[0];
							} else {
								newClassAttribute = newClasses.join(" "); /* Join the array contents using the space as separator */
							}
						}

						element.className = newClassAttribute;
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.RemoveClassAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				className: { type: String},
				targetSelector: { type: String }
			}
		)
	});
})(VS);

//js\Actions\SetHTMLAttributeAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.SetHTMLAttributeAction">
		/// Concrete implementation of SetHTMLAttributeAction, which sets the attribute to the attribute value on elements refered to by targetSelector property.
		/// </summary>
		/// <name locid="VS.Actions.SetHTMLAttributeAction">SetHTMLAttributeAction</name>
		SetHTMLAttributeAction: VS.Class.derive(VS.Actions.ActionBase,
			function SetHTMLAttributeAction_ctor() {
				/// <summary locid="VS.Actions.SetHTMLAttributeAction.constructor">
				/// Initializes a new instance of VS.Actions.SetHTMLAttributeAction that defines SetHTMLAttributeAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.SetHTMLAttributeAction.targetSelector">
				/// Gets or sets the targetSelector property for SetHTMLAttributeAction.
				/// </field>
				targetSelector: "",

				/// <field type="VS.Actions.SetHTMLAttributeAction.attribute">
				/// Gets or sets the attribute property for SetHTMLAttributeAction.
				/// </field>
				attribute: "",

				/// <field type="VS.Actions.SetHTMLAttributeAction.attributeValue">
				/// Gets or sets the attributeValue property for SetHTMLAttributeAction.
				/// </field>
				attributeValue: "",

				execute: function () {
					msWriteProfilerMark("VS.Actions.SetHTMLAttributeAction:execute,StartTM");

					/// <summary locid="VS.Actions.SetHTMLAttributeAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						element.setAttribute(action.attribute, action.attributeValue);
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.SetHTMLAttributeAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				attribute: { type: String },
				attributeValue: { type: String }
			}
		)
	});
})(VS);

//js\Actions\SetStyleAction.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.SetStyleAction">
		/// Concrete implementation of SetStyleAction, which sets the styleProperty to the styleValue on elements refered to by targetSelector property.
		/// </summary>
		/// <name locid="VS.Actions.SetStyleAction">SetStyleAction</name>
		SetStyleAction: VS.Class.derive(VS.Actions.ActionBase,
			function SetStyleAction_ctor() {
				/// <summary locid="VS.Actions.SetStyleAction.constructor">
				/// Initializes a new instance of VS.Actions.SetStyleAction that defines SetStyleAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.SetStyleAction.targetSelector">
				/// Gets or sets the targetSelector property for SetStyleAction.
				/// </field>
				targetSelector: "",

				/// <field type="VS.Actions.SetStyleAction.styleProperty">
				/// Gets or sets the styleProperty property for SetStyleAction.
				/// </field>
				styleProperty: "",

				/// <field type="VS.Actions.SetStyleAction.styleValue">
				/// Gets or sets the styleValue property for SetStyleAction.
				/// </field>
				styleValue: "",

				execute: function () {
					msWriteProfilerMark("VS.Actions.SetStyleAction:execute,StartTM");

					/// <summary locid="VS.Actions.SetStyleAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						element.style[action.styleProperty] = action.styleValue;
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.SetStyleAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				styleProperty: { type: String },
				styleValue: { type: String }
			}
		)
	});
})(VS);

//js\Actions\LoadPageAction.js

(function (VS, global) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Actions", {
		/// <summary locid="VS.Actions.LoadPageAction">
		/// Concrete implementation of LoadPageAction, which loads the page and adds it to the element pointed by targetSelector property.
		/// </summary>
		/// <name locid="VS.Actions.LoadPageAction">LoadPageAction</name>
		LoadPageAction: VS.Class.derive(VS.Actions.ActionBase,
			function LoadPageAction_ctor() {
				/// <summary locid="VS.Actions.LoadPageAction.constructor">
				/// Initializes a new instance of VS.Actions.LoadPageAction that defines LoadPageAction.
				/// </summary>
			},
			{
				/// <field type="VS.Actions.LoadPageAction.targetSelector">
				/// Gets or sets the targetSelector property for LoadPageAction.
				/// </field>
				targetSelector: "",

				/// <field type="VS.Actions.LoadPageAction.page">
				/// Gets or sets the page property for LoadPageAction.
				/// </field>
				page: "",

				/// <field type="VS.Actions.LoadPageAction.pageLoaded">
				/// The list of actions to fire when the page is loaded.
				/// </field>
				pageLoaded: "",


				execute: function () {
					msWriteProfilerMark("VS.Actions.LoadPageAction:execute,StartTM");

					function clearChildren(element) {
						while (element.hasChildNodes()) {
							element.removeChild(element.lastChild);
						}
					}

					/// <summary locid="VS.Actions.LoadPageAction.execute">
					/// Executes the action when the action tree is triggered.
					/// </summary>
					function executeFunc(element, action) {
						clearChildren(element);
						var originalElement = element;
						var originalAction = action;

						var hasWinRT = !!global.Windows;
						if (hasWinRT) {
							WinJS.UI.Fragments.render(action.page, element).done(
								function () {
									// Call WinJS.UI.processAll to process the  behaviors for the newly loaded page.
									WinJS.UI.processAll(originalElement);

									// Set the element to the source of the event
									VS.Actions.setElement(originalElement);

									// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
									if (originalAction.pageLoaded) {
										originalAction.pageLoaded.forEach(function (pageLoadedAction) {
											pageLoadedAction.execute(originalAction);
										});
									}
								},
								function (error) {
									// Eat up the error
								}
							);
						}
					}
					if (this.targetSelector) {
						Array.prototype.forEach.call(document.querySelectorAll(this.targetSelector), function (actualTarget) { executeFunc(actualTarget, this); }, this);
					} else {
						executeFunc(VS.Actions.getElement(), this);
					}

					msWriteProfilerMark("VS.Actions.LoadPageAction:execute,StopTM");

				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				targetSelector: { type: String },
				page: { type: String },
				pageLoaded: { type: Array, elementType: VS.Actions.ActionBase }
			}
		)
	});
})(_VSGlobal.VS, _VSGlobal);

//js\ActionTree\ActionTree.js

(function (VS, global) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "ActionTree", {
		// Namespace singletons 
		currentActionTree: null,
		actionTrees: null,

		getNamespacedObject: function (name, defaultNs) {
			/// <summary locid="VS.ActionTree.getNamespacedObject">
			/// Gets an object deep in a namespace tree with a default if not in string.
			/// </summary>
			/// <param name="name" type="String" locid="VS.ActionTree.getNamespacedObject_p:name">
			/// The name of the function to find in the namespace.
			/// </param>
			/// <param name="defaultNs" type="String" locid="VS.ActionTree.getNamespacedObject_p:defaultNs">
			/// The name of the default namespace
			/// </param>
			/// <returns type="Object" locid="VS.ActionTree.getNamespacedObject_returnValue">
			/// A namespace object
			/// </returns>
			var ns = defaultNs || global;
			return ns[name];
		},

		setNamespacedObject: function (name, value, defaultNs) {
			/// <summary locid="VS.ActionTree.setNamespacedObject">
			/// Sets an object deep in a namespace tree with a with absolute or relative positioning and a default if not in string.
			/// </summary>
			/// <param name="name" type="String" locid="VS.ActionTree.setNamespacedObject_p:name">
			/// The name of the function to store in the namespace.
			/// </param>
			/// <param name="value" type="String" locid="VS.ActionTree.setNamespacedObject_p:value">
			/// The name of the function to store in the namespace
			/// </param>
			/// <param name="defaultNs" type="String" locid="VS.ActionTree.setNamespacedObject_p:defaultNs">
			/// The name of the default namespace
			/// </param>
			var ns = defaultNs || global;
			ns[name] = value;
		},

		registerActionTree: function (name, func) {
			/// <summary locid="VS.ActionTree.registerActionTree">
			/// Registers the name and the function in the global (window) namespace.
			/// </summary>
			/// <param name="name" type="String" locid="VS.ActionTree.registerActionTree_p:name">
			/// The name of the function (which is the root of the action tree).
			/// </param>
			/// <param name="func" type="Function" locid="VS.ActionTree.registerActionTree_p:func">
			/// The function object to register.
			/// </param>
			VS.ActionTree.setNamespacedObject(name, func);
		},

		createActionTreeFunction: function (actionRoot) {
			/// <summary locid="VS.ActionTree.createActionTreeFunction">
			/// Creats action tree root function for the input JSON object.
			/// </summary>
			/// <param name="actionRoot" type="Object" locid="VS.ActionTree.createActionTreeFunction_p:actionRoot">
			/// The root of the action tree.
			/// </param>
			/// <returns type="Function" locid="VS.ActionTree.createActionTreeFunction_returnValue">
			/// The newly-defined function for the root action tree.
			/// </returns>

			return VS.Util.markSupportedForProcessing(function () {
				return VS.ActionTree.executeAction(actionRoot, arguments);
			});
		},

		createAndRegisterActionTree: function (name, actionRoot) {
			/// <summary locid="VS.ActionTree.createAndRegisterActionTree">
			/// Creates action tree root function for the input JSON object and registers it in the global namespace.
			/// </summary>
			/// <param name="name" type="String" locid="VS.ActionTree.createAndRegisterActionTree_p:name">
			/// The root of the action tree.
			/// </param>
			/// <param name="actionRoot" type="Object" locid="VS.ActionTree.createAndRegisterActionTree_p:actionRoot">
			/// The root JSON object of the action tree.
			/// </param>
			this.registerActionTree(name, this.createActionTreeFunction(actionRoot));
		},

		executeAction: function (actionRoot, argSet) {
			/// <summary locid="VS.ActionTree.executeAction">
			/// Executes the action tree root function with the arguments passed in the argSet.
			/// </summary>
			/// <param name="actionRoot" type="Object" locid="VS.ActionTree.executeAction_p:actionRoot">
			/// The root of the action tree.
			/// </param>
			/// <param name="argSet" type="Object" locid="VS.ActionTree.createAndRegisterActionTree_p:argSet">
			/// The arguments for the root function of the action tree.
			/// </param>
			msWriteProfilerMark("VS.ActionTree:executeAction,StartTM");
			var callArgs = argSet;

			// If the passed in object is Action, call execute on it
			if (actionRoot instanceof VS.Actions.ActionBase) {
				// Set the root-actionTree for the action
				actionRoot.actionTree = this.currentActionTree;
				// Call execute on the action itself
				return actionRoot.execute.apply(actionRoot, callArgs);
			}

			this.currentActionTree = actionRoot;
			var actions = actionRoot.actions;

			// If the object is an array of actions, take each action object and call execute action.
			if (Array.isArray(actions)) {
				// Get the currentTarget from the "event" object passed as the 0th object in the arguments list.
				if (callArgs[0] instanceof Event) {
					// Set the element for all the actions, using the 'currentTarget' property of the 'Event' object
					var scopeElement = callArgs[0].currentTarget;
					VS.Actions.setElement(scopeElement);
					// Set the arguments for the actions to consume.
					VS.Actions.setArguments(callArgs);
				} 

				// Call individual actions.
				for (var actionIndex = 0, actionLength = actions.length; actionIndex < actionLength; actionIndex++) {
					// Set the root-actionTree for the action
					actions[actionIndex].actionTree = this.currentActionTree;
					VS.ActionTree.executeAction(actions[actionIndex], callArgs);
				}
			}
			msWriteProfilerMark("VS.ActionTree:executeAction,StopTM");
		}
	});
})(_VSGlobal.VS, _VSGlobal);

//js\Behaviors\BehaviorBase.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Behaviors", {
		/// <summary locid="VS.Behaviors.BehaviorBase">
		/// The base class for all behaviors.
		/// </summary>
		/// <name locid="VS.Behaviors.BehaviorBase_name">BehaviorBase</name>
		BehaviorBase: VS.Class.define(
			function BehaviorBase_ctor(configBlock, attachment) {
				/// <summary locid="VS.Behaviors.BehaviorBase.constructor">
				/// Initializes a new instance of VS.Behaviors.BehaviorBase that defines a behavior.
				/// </summary>
				/// <param name="configBlock" type="string" locid="VS.Behaviors.BehaviorBase.constructor_p:configBlock">
				/// Construct the object properties based on the config block.
				/// </param>
				/// <param name="attachment" type="object" locid="VS.Behaviors.BehaviorBase.constructor_p:attachment">
				/// Attachment of the behavior.
				/// </param>

				if (configBlock) {
					VS.Util.parseJson(configBlock, this);
				}
				if (attachment) {
					this.attach(attachment);
				}
			},
			{
				attach: function (element) {
					/// <summary locid="VS.Behaviors.BehaviorBase.attach">
					/// Attaches the action with the element (typically the source)
					/// </summary>
					/// <param name="element" type="object" domElement="true" locid="VS.Behaviors.BehaviorBase.attach_p:element">
					/// The element on which the behavior is attached.
					/// </param>
					VS.Behaviors.addBehaviorInstance(element, this);
					if (this._attachImpl) {
						this._attachImpl(element);
					}
				},

				detach: function (element) {
					/// <summary locid="VS.Behaviors.BehaviorBase.detach">
					/// Detaches the behavior
					/// </summary>
					if (element) {
						// Remove attachment from VS.Behaviors._behaviorInstances
						var behaviorInstances = VS.Behaviors.getBehaviorInstances(element);
						if (behaviorInstances) {
							var pos = behaviorInstances.indexOf(this);
							if (pos > -1) {
								behaviorInstances.splice(pos, 1);
							}
						}
					}
					if (this._detachImpl) {
						this._detachImpl();
					}
				},
			}
		)
	});
})(VS);

//js\Behaviors\SelectorSourcedBehavior.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Behaviors", {
		/// <summary locid="VS.Behaviors.SelectorSourcedBehavior">
		/// The base class for all behaviors with selectors.
		/// </summary>
		/// <name locid="VS.SelectorSourcedBehavior_name">SelectorSourcedBehavior</name>
		SelectorSourcedBehavior: VS.Class.derive(VS.Behaviors.BehaviorBase,
			function SelectorSourcedBehavior_ctor(configBlock, attachment) {
				/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.constructor">
				/// Initializes a new instance of VS.Behaviors.SelectorSourcedBehavior that defines a selector sourced behavior.
				/// </summary>
				/// <param name="configBlock" type="string" locid="VS.Behaviors.SelectorSourcedBehavior.constructor_p:configBlock">
				/// Construct the object properties based on the config block.
				/// </param>
				/// <param name="attachment" type="object" locid="VS.Behaviors.SelectorSourcedBehavior.constructor_p:attachment">
				/// Attachment of the behavior.
				/// </param>
				VS.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				_sourceSelector: "",
				sourceSelector: {
					get: function () {
						/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.sourceSelector.get">
						/// Returns the sourceSelector property on the SelectorSourcedBehaviorBase
						/// </summary>
						/// <returns type="string" locid="VS.Behaviors.SelectorSourcedBehavior.sourceSelector_returnValue">The value of the sourceSelector property.</returns>

						return this._sourceSelector;
					},
					set: function (value) {
						/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.sourceSelector">
						/// Sets the value of the sourceSelector property. This will find all the elements with the specified sourceSelector and apply the Behavior to these elements.
						/// </summary>
						/// <param name="value" type="string" locid="VS.Behaviors.SelectorSourcedBehavior.sourceSelector.set_p:value">
						/// The value of the sourceSelector property.
						/// </param>

						var that = this;

						if (value !== this._sourceSelector) {
							this._sourceSelector = value;
						}

						if (this._sources) {
							// Remove existing sources if any are present
							for (var source in this._sources) {
								that.removeSource(this._sources[source]);
							}
						}

						// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
						Array.prototype.forEach.call(document.querySelectorAll(value), function (element) {
							that.addSource(element);
						});
					}
				},

				addSource: function (source) {
					/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.addSource">
					///  Adds source to the given SelectorSourcedBehavior, this is the source of the behavior.
					/// </summary>
					/// <param name="source" type="Object" domElement="true" locid="VS.Behaviors.SelectorSourcedBehavior.addSource_p:source">
					/// The source for the behavior in the SelectorSourcedBehavior
					/// </param>


					// Allow sub-classes to wire up relevant listeners (or add classes, attributes etc) to element, should check if its defined before calling
					if (this._addSourceImpl) {
						this._addSourceImpl(source);
					}

					// Add to list of sources
					if (!this._sources) {
						this._sources = {};
					}

					// Use the uniqueID to uniquely identify each source in our collection
					this._sources[source.uniqueID] = source;
				},

				removeSource: function (source) {
					/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.removeSource">
					///  Removes the source of the given SelectorSourcedBehavior.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="VS.Behaviors.SelectorSourcedBehavior.removeSource_p:source">
					/// The source for the SelectorSourcedBehavior
					/// </param>


					// Allow sub-classes to disconnect event listeners (or remove classes, attributes etc) on element
					this._removeSourceImpl(source);

					// Remove from source list
					delete this._sources[source.id];
				},

				detach: function (element) {
					/// <summary locid="VS.Behaviors.SelectorSourcedBehavior.detach">
					///  Cleans up the SelectorSourcedBehavior by removing the sources, detaching it from the attached element and removing itself from the VS.Behaviors._behaviorInstances
					/// </summary>


					// Remove and cleanup all sources
					for (var source in this._sources) {
						this.removeSource(this._sources[source]);
					}

					if (element) {
						// Remove attachment from VS.Behaviors._behaviorInstances
						var behaviorInstances = VS.Behaviors.getBehaviorInstances(element);
						if (behaviorInstances) {
							var pos = behaviorInstances.indexOf(this);
							if (pos > -1) {
								behaviorInstances.splice(pos, 1);
							}
						}
					}

					// Allow sub-classes to clean up, should check if its defined before calling
					if (this._detachImpl) {
						this._detachImpl(element);
					}
				},
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				sourceSelector: { type: String }
			}
		)
	});
})(VS);

//js\Behaviors\TimerBehavior.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Behaviors", {
		/// <summary locid="VS.Behaviors.TimerBehavior">
		/// Concrete implementation of TimerBehavior, which listen for timer tick and fires actions if specified.
		/// </summary>
		/// <name locid="VS.Behaviors.TimerBehavior">TimerBehavior</name>
		TimerBehavior: VS.Class.derive(VS.Behaviors.BehaviorBase,
			function TimerBehavior_ctor(configBlock, attachment) {
				/// <summary locid="VS.Behaviors.TimerBehavior.constructor">
				/// Initializes a new instance of VS.Behaviors.TimerBehavior and fires actions when the timer ticks.
				/// </summary>
				this._timerIdPerAttachment = {};
				VS.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				_count: 0,
				_timerIdPerAttachment: null,
				totalTicks: 10,
				millisecondsPerTick: 1000,

				_attachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.TimerBehavior._attachImpl">
					/// Attaches the TimerBehavior with the element and sets source if there is no _sourceselector set
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.TimerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					// Attach all the actions to the attachment element, this will set the target on the actions if not already set.
					var that = this;

					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}

					if (!this._timerIdPerAttachment[attachment.uniqueID]) {
						this._timerIdPerAttachment[attachment.uniqueID] = window.setInterval(function () { tickHandler(that, attachment); }, this.millisecondsPerTick);
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.TimerBehavior._detachImpl">
					/// Detaches the TimerBehavior
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.TimerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					if (attachment) {
						this._clearTimerForAttachment(attachment.uniqueID);
						delete this._timerIdPerAttachment[attachment.uniqueID];
					} else {
						for (var uniqueId in this._timerIdPerAttachment) {
							this._clearTimerForAttachment(uniqueId);
						}
						this._timerIdPerAttachment = {};
					}
				},

				_clearTimerForAttachment: function (uniqueId) {
					var timerId = this._timerIdPerAttachment[uniqueId];
					window.clearInterval(timerId);
				},
				
				/// <field type="VS.Behaviors.TimerBehavior.triggeredActions">
				/// The list of actions to fire when timer ticks
				/// </field>
				triggeredActions: "",

				execute: function (attachment) {
					/// <summary locid="VS.Behaviors.TimerBehavior.execute">
					/// Executes the actions when timer ticks
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.TimerBehavior.execute_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					this.executeActions(attachment);
				},

				executeActions: function (attachment) {
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.TimerBehavior.executeActions_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					// Set attachment so that actions can use it.
					VS.Actions.setElement(attachment);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				totalTicks: { type: Number },
				millisecondsPerTick: { type: Number },
				triggeredActions: { type: Array, elementType: VS.Actions.ActionBase }
			}
		)
	});

	function  tickHandler (timerBehavior, attachment) {
		if (timerBehavior._count !== Number.POSITIVE_INFINITY) {
			if (timerBehavior._count < timerBehavior.totalTicks) {
				timerBehavior._count++;
				timerBehavior.execute(attachment);
			} else {
				timerBehavior._detachImpl(attachment);
			}
		} else { /* Always call the triggered action on tick if infinite */
			timerBehavior.execute(attachment);
		}
	}
})(VS);

//js\Behaviors\EventTriggerBehavior.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Behaviors", {
		/// <summary locid="VS.Behaviors.EventTriggerBehavior">
		/// Concrete implementation of EventTriggerBehavior, which listen for an event on the source element and fires actions if specified.
		/// </summary>
		/// <name locid="VS.Behaviors.EventTriggerBehavior">EventTriggerBehavior</name>
		EventTriggerBehavior: VS.Class.derive(VS.Behaviors.SelectorSourcedBehavior,
			function EventTriggerBehavior_ctor(configBlock, attachment) {
				/// <summary locid="VS.Behaviors.EventTriggerBehavior.constructor">
				/// Initializes a new instance of VS.Behaviors.EventTriggerBehavior that defines an event and fires actions when the event is triggered.
				/// </summary>

				VS.Behaviors.SelectorSourcedBehavior.call(this, configBlock, attachment);
			},
			{
				_eventListener: null,
				_attachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior._attachImpl">
					/// Attaches the EventTriggerBehavior with the element and sets source if there is no _sourceselector set
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.EventTriggerBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>


					// Attach all the actions to the attachment element, this will set the target on the actions if not already set.
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}

					// Add sources to the behavior. For EventTriggerBehavior, this will set the EventHandler for the event on the source specified.
					if (!this._sources) {
						this._addSourceImpl(attachment);
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior._detachImpl">
					/// Detaches a behavior from the attached element
					/// </summary>
					/// <param name="behavior" type="object" locid="VS.Behaviors.EventTriggerBehavior._detachImpl_p:attachment">
					/// The attached element for this behavior
					/// </param>

					if (!this._sources) {
						this._removeSourceImpl(attachment);
					}
				},

				_addSourceImpl: function (source) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior._addSourceImpl">
					/// attaches the EventTriggerBehavior with the element (typically the source)
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="VS.Behaviors.EventTriggerBehavior._addSourceImpl_p:source">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>


					var that = this;
					// If the event is "load" event, fire it now since we initialize our behaviors runtime on load (which has already fired)
					if (this.event) {
						if (this.event === "load") {
							// Simulate the arguments and pass it on to the action that we manually fire.
							that.execute(source, VS.Actions.getArguments());
						}
						that._eventListener = function (event) { that.execute(source, event); };
						source.addEventListener(this.event, that._eventListener, false);
					}
				},

				_removeSourceImpl: function (source) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior._removeSourceImpl">
					/// Removes the event listener for the source as its going away.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="VS.Behaviors.EventTriggerBehavior._addSourceImpl_p:source">
					/// The source of the behavior.
					/// </param>
					if (source) {
						source.removeEventListener(this.event, this._eventListener);
					}
				},

				_event: null,
				event: {
					get: function () {
						/// <summary locid="VS.Behaviors.EventTriggerBehavior.event.get">
						/// Returns the event property on the EventTriggerBehavior
						/// </summary>
						/// <returns type="Object" locid="VS.Behaviors.EventTriggerBehavior.event_returnValue">The value of the event property.</returns>
						return this._event;
					},
					set: function (value) {
						/// <summary locid="VS.Behaviors.EventTriggerBehavior.event.set">
						/// Sets the value of the event property.
						/// </summary>
						/// <param name="value" type="Object" locid="VS.Behaviors.EventTriggerBehavior.event.set_p:value">
						/// The value of the event property.
						/// </param>
						var that = this;

						if (value !== this._event) {

							// Remove the old handler
							if (this._event) {
								// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
								Array.prototype.forEach.call(document.querySelectorAll(this.sourceSelector), function (element) {
									that._removeSourceImpl(element);
								});
							}

							// Set the new handler
							this._event = value;

							// Fire CSS Selector and find anything under the whole document which matches the value and add it to the list of sources
							if (this.sourceSelector !== "") {
								Array.prototype.forEach.call(document.querySelectorAll(this.sourceSelector), function (element) {
									that._addSourceImpl(element);
								});
							}
						}
					}
				},

				/// <field type="VS.Behaviors.EventTriggerBehavior.triggeredActions">
				/// The list of actions to fire when the event is triggered
				/// </field>
				triggeredActions: "",

				execute: function (source, eventArgs) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior.execute">
					/// Executes the behavior when the trigger event is invoked. This calls all the actions in the actionlist.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="VS.Behaviors.EventTriggerBehavior.execute_p:source">
					/// The source on which the event is fired.
					/// </param>
					/// <param name="eventArgs" type="object" locid="VS.Behaviors.EventTriggerBehavior.execute_p:eventArgs">
					/// The event arguments passed to the action list for this behavior.
					/// </param>

					this.executeActions(source, eventArgs);
				},

				executeActions: function (source, callArgs) {
					/// <summary locid="VS.Behaviors.EventTriggerBehavior.triggerActions">
					/// Triggers all the actions defined on this event trigger behavior for the source that is passed in.
					/// </summary>
					/// <param name="source" type="object" domElement="true" locid="VS.Behaviors.EventTriggerBehavior.executeActions_p:source">
					/// The source for the event in the EventTriggerBehavior
					/// </param>
					/// <param name="callArgs" type="object" locid="VS.Behaviors.EventTriggerBehavior.executeActions_p:callArgs">
					/// The event arguments passed to the action list for this behavior.
					/// </param>


					// Set the element to the source of the event
					VS.Actions.setElement(source);

					// Set the arguments for the actions to consume
					VS.Actions.setArguments(callArgs);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				event: { type: String },
				triggeredActions: { type: Array, elementType: VS.Actions.ActionBase }
			}
		)
	});
})(VS);

//js\Behaviors\RequestAnimationFrameBehavior.js

(function (VS) {
	"use strict";

	VS.Namespace.defineWithParent(VS, "Behaviors", {
		/// <summary locid="VS.Behaviors.RequestAnimationFrameBehavior">
		/// Concrete implementation of RequestAnimationFrameBehavior, which listen for timer tick and fires actions if specified.
		/// </summary>
		/// <name locid="VS.Behaviors.RequestAnimationFrameBehavior">RequestAnimationFrameBehavior</name>
		RequestAnimationFrameBehavior: VS.Class.derive(VS.Behaviors.BehaviorBase,
			function RequestAnimationFrameBehavior_ctor(configBlock, attachment) {
				/// <summary locid="VS.Behaviors.RequestAnimationFrameBehavior.constructor">
				/// Initializes a new instance of VS.Behaviors.RequestAnimationFrameBehavior
				/// </summary>
				this._requestPerAttachment = {};
				VS.Behaviors.BehaviorBase.call(this, configBlock, attachment);
			},
			{
				/// <field type="VS.Behaviors.RequestAnimationFrameBehavior.triggeredActions">
				/// The list of actions to fire when the event is triggered
				/// </field>
				triggeredActions: "",
				_requestPerAttachment: null,

				_attachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.RequestAnimationFrameBehavior._attachImpl">
					/// Attaches the RequestAnimationFrameBehavior with the element
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.RequestAnimationFrameBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>

					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.attach(attachment);
						});
					}
					var that = this;
					if (!this._requestPerAttachment[attachment.uniqueID]) {
						this._requestPerAttachment[attachment.uniqueID] = window.requestAnimationFrame(function () { callBack(that, attachment); });
					}
				},

				_detachImpl: function (attachment) {
					/// <summary locid="VS.Behaviors.RequestAnimationFrameBehavior._detachImpl">
					/// Detaches the RequestAnimationFrameBehavior
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.RequestAnimationFrameBehavior._attachImpl_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					if (attachment) {
						this._cancelRequestsForAttachment(attachment.uniqueID);
						delete this._requestPerAttachment[attachment.uniqueID];
					} else {
						for (var uniqueId in this._requestPerAttachment) {
							this._cancelRequestsForAttachment(uniqueId);
						}
						this._requestPerAttachment = {};
					}
				},

				_cancelRequestsForAttachment: function (uniqueId) {
					var requestId = this._requestPerAttachment[uniqueId];
					window.cancelAnimationFrame(requestId);
				},

				execute: function (attachment) {
					/// <summary locid="VS.Behaviors.RequestAnimationFrameBehavior.execute">
					/// Executes the actions when timer ticks
					/// </summary>
					/// <param name="attachment" type="object" domElement="true" locid="VS.Behaviors.RequestAnimationFrameBehavior.execute_p:attachment">
					/// The element on which the behavior is attached. If there is no source specified on the behavior, the attached-element is the source of the behavior
					/// </param>
					this.executeActions(attachment);
				},

				executeActions: function (attachment) {
					// Set attachment so that actions can use it.
					VS.Actions.setElement(attachment);

					// Call execute on each action in the array and pass in the behavior, source, and a set of source specific variables
					if (this.triggeredActions) {
						this.triggeredActions.forEach(function (action) {
							action.execute(this);
						});
					}
				}
			},
			{ /* static members empty */ },
			{
				// Property Meta-data (for JSON parsing)
				triggeredActions: { type: Array, elementType: VS.Actions.ActionBase }
			}
		)
	});

	function callBack (requestAnimationFrameBehavior, attachment) {
		// Call the actions
		requestAnimationFrameBehavior.execute(attachment);

		// Cancel the request for the attached element.
		requestAnimationFrameBehavior._detachImpl(attachment);

		// Call the requestAnimationFrame at animation frame per second.
		requestAnimationFrameBehavior._requestPerAttachment[attachment.uniqueID] = window.requestAnimationFrame(function () { callBack(requestAnimationFrameBehavior, attachment); });
	}
})(VS);

//js\Behaviors\Behaviors.js
// ActionTree runtime for VS

/// <reference path="../VS.js" />
/// <reference path="../Util.js" />
(function (VS, global) {
	"use strict";
	var _behaviorInstances = {};
	var _elementsWithBehaviors = [];

	// Initialize the list of data-win-controls that we want to listen to.
	var dataWinControlInfo = [];
	dataWinControlInfo["WinJS.UI.ListView"] = { event: "loadingstatechanged", key: "loadingState", value: "complete" };
	dataWinControlInfo["WinJS.UI.Hub"] = { event: "loadingstatechanged", key: "loadingState", value: "complete" };
	dataWinControlInfo["WinJS.UI.FlipView"] = { event: "pagecompleted", key: null, value: null };
	dataWinControlInfo["WinJS.UI.Repeater"] = { event: "itemsloaded", key: null, value: null };

	// For a blank document, process all the behaviors, when the document is loaded.
	global.document.addEventListener("DOMContentLoaded", function () { processAllImpl(document); }, false);

	// This function will process the ActionTree and the [data-vs-interactivity] attribute
	function processActions() {
		/*hardcoded actionlist json file*/
		var actionListFileName = "js/actionList.json";
		try {
			var actionListDef = VS.Util.loadFile(actionListFileName);
			var actionTreeList = JSON.parse(actionListDef, VS.Util.jsonReviver);

			if (!actionTreeList) {
				return;
			}

			if (!Array.isArray(actionTreeList)) {
				VS.Util.reportError("VS.ActionTrees.JsonNotArray", actionListDef);
				return;
			}

			VS.ActionTree.actionTrees = VS.ActionTree.actionTrees || {};

			for (var i = 0; i < actionTreeList.length; i++) {
				var actionTree = actionTreeList[i];
				if (!actionTree) {
					continue;
				}

				// Note that metadata enforces presence of name property during JSON parsing (animation won't
				// be created if it doesn't have a name). When there are duplicates, later version overrides
				// earlier version.
				var actionTreeName = actionTree.name;
				// Add each actionTree to the dictionary with name as the key.
				VS.ActionTree.actionTrees[actionTreeName] = actionTree;
			}

			// For each action tree, create and register the name in the global namespace.
			for (var name in VS.ActionTree.actionTrees) {
				VS.ActionTree.createAndRegisterActionTree(name, VS.ActionTree.actionTrees[name]);
			}
		} catch (e) {
			// We don't require the actionList file to be present, so we don't generate an error here.
		}
	}

	// WinJs.UI.ProcessAll calls VS.Behaviors.processAll.
	var hasWinRT = !!global.Windows;
	if (hasWinRT) {
		var originalProcessAll = WinJS.UI.processAll;
		WinJS.UI.processAll = behaviorsProcessAll;
	}

	// This makes sure that the behaviors defined within the fragments are initialized before the fragment is loaded.
	function behaviorsProcessAll(rootElement) {
		var promise = originalProcessAll.call(this, rootElement);
		promise.then(
			function () { VS.Behaviors.processAll(rootElement); },
			null
		);

		return promise;
	}

	// Attaching behaviors and actions for the given element
	function attach(element) {
		msWriteProfilerMark("VS.Behaviors:attach,StartTM");
		var behaviorAttribute = element.getAttribute("data-vs-interactivity");
		if (behaviorAttribute) {
			if (VS.ActionTree.actionTrees) {
				var behaviors = VS.ActionTree.actionTrees[behaviorAttribute];
				if (!behaviors) {
					behaviors = VS.Util.parseJson(behaviorAttribute);
				}
				// If we get valid behaviors object, parse it.
				if (behaviors) {
					var behaviorCollection = behaviors.behaviors;
					for (var behaviorCollectionIndex = 0; behaviorCollectionIndex < behaviorCollection.length; behaviorCollectionIndex++) {
						var behavior = behaviorCollection[behaviorCollectionIndex];
						behavior.attach(element);
					}
					_elementsWithBehaviors.push(element);
				}
			}
		}
		msWriteProfilerMark("VS.Behaviors:attach,StopTM");
	}

	// Detach the existing behavior from the element
	function detach(currentElement) {
		if (_elementsWithBehaviors) {
			var pos = _elementsWithBehaviors.indexOf(currentElement);
			if (pos > -1) {
				var behaviorInstancesForElement = VS.Behaviors.getBehaviorInstances(currentElement);
				var behaviorInstancesForElementCopy = behaviorInstancesForElement.slice();
				if (behaviorInstancesForElementCopy) {
					behaviorInstancesForElementCopy.forEach(function (behavior) {
						behavior.detach(currentElement);
					});
				}
				_elementsWithBehaviors.splice(pos, 1);
			}
		}
	}

	// Actual process all implementation for Behaviors, this goes through the elements
	// having data-vs-interactivity attribute and calls create on each element, making sure that
	// for data-win-controls, we don't attach the behavior multiple times.
	function processAllBehaviorsForDataWinControlsImpl(rootElement) {
		msWriteProfilerMark("VS.Behaviors:processAll,StartTM");

		msWriteProfilerMark("VS.Behaviors:processActions,StartTM");
		// ProcessActions first, if any
		processActions();
		msWriteProfilerMark("VS.Behaviors:processActions,StopTM");

		// Process the [data-vs-interactivity] attribute.
		rootElement = rootElement || document;
		var selector = "[data-vs-interactivity]";

		// Find elements with the above attribute and attach associated behavior.
		Array.prototype.forEach.call(rootElement.querySelectorAll(selector), function (element) {
			var behaviorInstancesForElement = VS.Behaviors.getBehaviorInstances(element);
			if (!behaviorInstancesForElement) {
				// First detach the existing behavior
				detach(element);
				// Now attach the new behavior
				attach(element);
			}
		});

		msWriteProfilerMark("VS.Behaviors:processAll,StopTM");
	}

	// Actual process all implementation for Behaviors, this goes through the elements
	// having data-vs-interactivity attribute and calls create on each element.
	function processAllImpl(rootElement) {
		msWriteProfilerMark("VS.Behaviors:processAll,StartTM");

		msWriteProfilerMark("VS.Behaviors:processActions,StartTM");
		// ProcessActions first, if any
		processActions();
		msWriteProfilerMark("VS.Behaviors:processActions,StopTM");

		// Process the [data-vs-interactivity] attribute.
		rootElement = rootElement || document;
		var selector = "[data-vs-interactivity]";
		// Find elements with the above attribute and attach associated behavior.
		Array.prototype.forEach.call(rootElement.querySelectorAll(selector), function (element) {
			// First detach the existing behavior
			detach(element);
			// Now attach the new behavior
			attach(element);
		});

		// Handle all data-win-controls within this element.
		processDataWinControls(rootElement);

		msWriteProfilerMark("VS.Behaviors:processAll,StopTM");
	}

	function getDataWinControlInfo(element) {
		if (element) {
			var dataWinAttribute = element.getAttribute("data-win-control");
			if (dataWinAttribute) {
				dataWinAttribute = dataWinAttribute.trim();
				return dataWinControlInfo[dataWinAttribute];
			}
		}

		return null;
	}


	function processDataWinControls(rootElement) {
		rootElement = rootElement || global.document;

		Array.prototype.forEach.call(rootElement.querySelectorAll("[data-win-control]"), function (element) {
			var controlInfo = getDataWinControlInfo(element);
			if (controlInfo) {
				element.removeEventListener(controlInfo.event, processControlForBehaviors);
				element.addEventListener(controlInfo.event, processControlForBehaviors);
			}
		});
	}

	/// Given an element,
	///	1. If there is no completed event specified, look for all its children that have data-vs-interactivity specified.
	///	2. If there is an completed and value specified, check that the value is what we expect before data-vs-interactivity is processed.
	function processControlForBehaviors(event) {
		var element = event.currentTarget;
		var controlInfo = getDataWinControlInfo(element);
		if (controlInfo) {
			if (controlInfo.key === null || controlInfo.value === null) {
				VS.Behaviors.processAllBehaviorsForDataWinControls(element);
			} else if (element.winControl && element.winControl[controlInfo.key] === controlInfo.value) {
				VS.Behaviors.processAllBehaviorsForDataWinControls(element);
			}
		}
	}

	// Establish members of "VS.Behaviors" namespace
	VS.Namespace.defineWithParent(VS, "Behaviors", {
		processAll: function (rootElement) {
			/// <summary locid="VS.Behaviors.processAll">
			/// Applies declarative behavior binding to all elements, starting at the specified root element.
			/// </summary>
			/// <param name="rootElement" type="Object" domElement="true" locid="VS.Behaviors.processAll_p:rootElement">
			/// The element at which to start processing the data-vs-interactivity attribute
			/// If this parameter is not specified, the binding is applied to the entire document.
			/// </param>
			processAllImpl(rootElement);
		},

		processAllBehaviorsForDataWinControls: function (rootElement) {
			/// <summary locid="VS.Behaviors.processAllBehaviorsForDataWinControls">
			/// Applies declarative behavior binding to all elements, starting at the specified root element.
			/// </summary>
			/// <param name="rootElement" type="Object" domElement="true" locid="VS.Behaviors.processAll_p:rootElement">
			/// The element at which to start processing the data-vs-interactivity attribute
			/// If this parameter is not specified, the binding is applied to the entire document.
			/// </param>
			processAllBehaviorsForDataWinControlsImpl(rootElement);
		},

		getBehaviorInstances: function (element) {
			/// <summary locid="VS.Behaviors.getBehaviorInstances">
			/// returns an array of behaviorInstances attached to the given element.
			/// </summary>
			/// <param name="element" type="object" domElement="true" locid="VS.Behaviors.getBehaviorInstances_p:element">
			/// The element for which the behavior instances are obtained.
			/// </param>
			/// <returns type="Array" locid="VS.Behaviors.getBehaviorInstances_returnValue">The array of behavior instances attached to the element.</returns>

			if (_behaviorInstances && element) {
				return _behaviorInstances[element.uniqueID];
			}
		},

		addBehaviorInstance: function (element, behaviorInstance) {
			/// <summary locid="VS.Behaviors.addBehaviorInstance">
			/// sets the array of behavior instance to the element.
			/// </summary>
			/// <param name="element" type="object" domElement="true" locid="VS.Behaviors.addBehaviorInstance_p:element">
			/// The element for which the behavior instance is set.
			/// </param>
			/// <param name="behaviorInstance" type="object" locid="VS.Behaviors.addBehaviorInstance_p:behaviorInstance">
			/// The current behavior instance to be added for the given element
			/// </param>

			var currentBehaviors = VS.Behaviors.getBehaviorInstances(element) || (_behaviorInstances[element.uniqueID] = []);
			currentBehaviors.push(behaviorInstance);
		}
	});
})(_VSGlobal.VS, _VSGlobal);



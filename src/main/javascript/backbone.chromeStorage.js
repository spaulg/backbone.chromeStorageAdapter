
/*
 Copyright 2013 Simon Paulger <spaulger@codezen.co.uk>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';

    /**
     * Chrome Storage Backbone storage adapter
     *
     * @param keyNamespace storage namespace prefix
     * @param storageArea Storage area to use
     * @constructor
     */
    Backbone.ChromeStorage = function(keyNamespace, storageArea) {
        if (typeof keyNamespace == 'string' && keyNamespace != '') {
            this._keyNamespace = keyNamespace;
        } else {
            throw new TypeError('Invalid key namespace.');
        }

        // Apply storage area
        if (storageArea == 'local' || storageArea == null) {
            this._chromeStorage = chrome.storage.local;
        } else if (storageArea == 'sync') {
            this._chromeStorage = chrome.storage.sync;
        } else {
            throw new TypeError('Invalid storage area declaration.');
        }
    };

    /**
     * Enum for StorageArea type. Should be when declaring
     * the storage area when constructing the storage adapter
     */
    Backbone.ChromeStorage.StorageArea = {
        SYNC: 'sync',
        LOCAL: 'local'
    };

    Backbone.ChromeStorage.prototype = {
        _keyNamespace: null,
        _chromeStorage: null,
        _recordIndex: [],

        /**
         * Get the Chrome storage namespace pointer
         *
         * @returns {Object} Chrome storage namespace object
         * @private
         */
        _getChromeStorage: function()
        {
            return this._chromeStorage;
        },

        /**
         * Generate a unique UUID for use as a key
         *
         * @returns {string} Unique UUID
         * @private
         */
        _generateUuid: function()
        {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        /**
         * Add or update an existing key/value pair in storage
         *
         * @param model Model of data to update
         * @param options Storage options
         * @private
         */
        _updateModel: function(model, options)
        {
            function apiCallback() {
                // Notify callbacks if defined
                if (chrome.runtime.lastError == null && options.success != null) {
                    options.success(model);
                } else if (options.error != null) {
                    options.error(model);
                }
            }

            // Get or generate an Id
            var id = model.id || this._generateUuid();

            // Update record index with new id if not found
            if ($.inArray(id, this._recordIndex) == -1) {
                this._recordIndex.push(id);
            }

            // Update index if adding, and add/update record
            var data = [];
            data[this._keyNamespace] = this._recordIndex;
            data[id] = model.attributes;
            this._getChromeStorage().set(data, apiCallback);

            // Set id to model
            model.id = id;
        },

        /**
         * Remove the model from storage
         *
         * @param model Model of data to remove
         * @param options Storage options
         * @private
         */
        _deleteModel: function(model, options)
        {
            var callbackCount = 0;
            var success = true;
            var errors = [];

            function apiCallback() {
                callbackCount++;

                // Check if an error occurred
                if (chrome.runtime.lastError != null) {
                    success = false;
                    errors.push(chrome.runtime.lastError);
                }

                // Notify callbacks if defined
                if (callbackCount == 2 && success && options.success != null) {
                    // Success
                    options.success(model);
                } else if (callbackCount == 2 && !success && options.error != null) {
                    // Error
                    options.error(model, errors);
                }
            }

            // If the model has an id, attempt to remove it from storage
            if (model.id != null) {
                // Find record index position and remove
                var recordPosition = $.inArray(model.id, this._recordIndex);
                if (recordPosition != -1) {
                    this._recordIndex.splice(recordPosition, 1);
                }

                // Update record index with item removed in storage
                var data = [];
                data[this._keyNamespace] = this._recordIndex;
                this._getChromeStorage().set(data, apiCallback);

                // Remove item from storage
                this._getChromeStorage().remove([model.id], apiCallback);
            } else if (options.error != null) {
                // Nothing to remove, notify error callback if defined
                options.error('Model id is not defined');
            }
        },

        /**
         * Read model from storage
         *
         * @param model Model with id to read
         * @param options Storage options
         * @private
         */
        _readModel: function(model, options)
        {
            function apiCallback(items) {
                if (chrome.runtime.lastError == null) {
                    // Update all the model attributes with the items retrieved
                    model.set(items[model.id]);

                    // Notify callback if defined
                    if (options.success != null) {
                        options.success(model);
                    }
                } else if (options.error != null) {
                    options.error(model, chrome.runtime.lastError);
                }
            }

            // If the model has an id, attempt to retrieve it from storage
            if (model.id != null) {
                this._getChromeStorage().get([model.id], apiCallback);
            }
        },

        /**
         * Implement Backbone.sync function signature.
         *
         * @param method Sync method
         * @param model Backbone model or collection
         * @param options Options
         */
        sync: function(method, model, options) {
            switch (method) {
                case 'update':  return this._updateModel(model, options);
                case 'create':  return this._updateModel(model, options);
                case 'read':    return this._readModel(model, options);
                case 'delete':  return this._deleteModel(model, options);
            }

            throw new TypeError('Unknown method ' + method + ' in sync');
        }
    };
})();

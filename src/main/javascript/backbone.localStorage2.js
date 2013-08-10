
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
     * localStorage Backbone storage adapter
     *
     * @param keyNamespace storage namespace prefix
     * @constructor
     */
    Backbone.LocalStorage2 = function(keyNamespace) {
        this._keyNamespace = keyNamespace;
    };

    Backbone.LocalStorage2.prototype = {
        _keyNamespace: null,

        /**
         * Minimum storageProxy plugin interface requirement conforming
         * to Backbone.sync function signature.
         *
         * @param method Sync method
         * @param model Backbone model or collection
         * @param options Options
         */
        sync: function(method, model, options) {

        }
    };
})();
